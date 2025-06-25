const UserService = require("../services/UserService");
const ValidationService = require("../services/ValidationService");
const OTPService = require("../services/OTPService");
const EmailService = require("../services/EmailService");
const ResponseUtil = require("../utils/response");
const CONSTANTS = require("../config/constants");

class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      console.log("📝 Register request received:", { ...req.body, password: "***" });
      
      // Validate input data
      const validation = ValidationService.validateRegistrationData(req.body);
      if (!validation.isValid) {
        console.log("❌ Validation failed:", validation.errors);
        return ResponseUtil.validationError(res, validation.errors);
      }

      // Sanitize input data
      const sanitizedData = ValidationService.sanitizeUserData(req.body);
      const { username, fullname, email, password } = sanitizedData;

      // Check for existing email
      const emailExists = await UserService.emailExists(email);
      if (emailExists) {
        console.log("❌ Email already exists:", email);
        return ResponseUtil.conflict(res, CONSTANTS.MESSAGES.ERROR.EMAIL_EXISTS, "email");
      }

      // Check for existing username
      const usernameExists = await UserService.usernameExists(username);
      if (usernameExists) {
        console.log("❌ Username already exists:", username);
        return ResponseUtil.conflict(res, CONSTANTS.MESSAGES.ERROR.USERNAME_EXISTS, "username");
      }

      // Create user
      console.log("🔄 Creating user account...");
      const newUser = await UserService.createUser({ username, fullname, email, password });
      console.log("✅ User created successfully:", newUser._id);

      // Generate and send OTP
      console.log("📧 Generating OTP for email verification...");
      const otpResult = await OTPService.createOTP(email, CONSTANTS.OTP.TYPES.EMAIL_VERIFICATION);
      
      if (!otpResult.success) {
        console.error("💥 Failed to create OTP:", otpResult.error);
        return ResponseUtil.serverError(res, "Failed to generate verification code", "otp");
      }

      // Send OTP email
      const emailResult = await EmailService.sendOTPEmail(email, otpResult.otpCode, fullname);
      
      // Prepare response data
      const responseData = {
        user: {
          _id: newUser._id,
          username: newUser.username,
          fullname: newUser.fullname,
          email: newUser.email,
          emailVerified: newUser.emailVerified,
          isActive: newUser.isActive,
          role: newUser.role,
          createdAt: newUser.createdAt
        },
        verification: {
          emailSent: emailResult.success,
          otpExpiry: `${CONSTANTS.OTP.EXPIRY_MINUTES} minutes`,
          maxAttempts: CONSTANTS.OTP.MAX_ATTEMPTS,
          nextStep: emailResult.success 
            ? "Please check your email and verify using the OTP code"
            : "Registration successful but email sending failed. Please request OTP resend."
        }
      };

      if (!emailResult.success) {
        console.error("💥 Failed to send OTP email:", emailResult.error);
        responseData.emailError = emailResult.message;
      } else {
        console.log("✅ OTP email sent successfully");
      }

      return ResponseUtil.success(res, responseData, CONSTANTS.MESSAGES.SUCCESS.REGISTRATION, 201);

    } catch (error) {
      return this.handleRegistrationError(res, error);
    }
  }

  // Verify email with OTP
  static async verifyEmail(req, res) {
    try {
      console.log("🔐 Email verification request received");
      
      // Validate input data
      const validation = ValidationService.validateEmailVerification(req.body);
      if (!validation.isValid) {
        console.log("❌ Validation failed:", validation.errors);
        return ResponseUtil.validationError(res, validation.errors);
      }

      const { email, otp } = req.body;
      const normalizedEmail = email.trim().toLowerCase();

      // Check if user exists
      const user = await UserService.findByEmail(normalizedEmail);
      if (!user) {
        console.log("❌ User not found:", normalizedEmail);
        return ResponseUtil.notFound(res, CONSTANTS.MESSAGES.ERROR.USER_NOT_FOUND, "email");
      }

      // Check if email already verified
      if (user.emailVerified) {
        console.log("❌ Email already verified:", normalizedEmail);
        return ResponseUtil.error(res, CONSTANTS.MESSAGES.ERROR.EMAIL_ALREADY_VERIFIED, 400, [
          { field: "email", message: CONSTANTS.MESSAGES.ERROR.EMAIL_ALREADY_VERIFIED }
        ]);
      }

      // Verify OTP
      const otpResult = await OTPService.verifyOTP(normalizedEmail, otp.trim(), CONSTANTS.OTP.TYPES.EMAIL_VERIFICATION);
      
      if (!otpResult.success) {
        console.log("❌ OTP verification failed:", otpResult.message);
        return ResponseUtil.error(res, otpResult.message, 400, [
          { field: otpResult.field || "otp", message: otpResult.message }
        ]);
      }

      // Update user email verification status
      user.emailVerified = true;
      await user.save();
      console.log("✅ Email verified successfully for user:", user._id);

      // Send welcome email (non-blocking)
      EmailService.sendWelcomeEmail(normalizedEmail, user.fullname)
        .then(result => {
          if (result.success) {
            console.log("✅ Welcome email sent successfully");
          } else {
            console.log("⚠️ Welcome email failed:", result.message);
          }
        })
        .catch(error => {
          console.log("⚠️ Welcome email error:", error.message);
        });

      // Success response
      const responseData = {
        user: {
          _id: user._id,
          username: user.username,
          fullname: user.fullname,
          email: user.email,
          emailVerified: user.emailVerified,
          isActive: user.isActive,
          role: user.role
        },
        verification: {
          status: "completed",
          verifiedAt: new Date().toISOString(),
          welcomeEmailSent: true
        }
      };

      return ResponseUtil.success(res, responseData, CONSTANTS.MESSAGES.SUCCESS.EMAIL_VERIFIED, 200);

    } catch (error) {
      console.error("💥 Email verification error:", error);
      return ResponseUtil.serverError(res, `Email verification failed: ${error.message}`, "verification");
    }
  }

  // Resend OTP
  static async resendOTP(req, res) {
    try {
      console.log("🔄 OTP resend request received");
      
      // Validate input data
      const validation = ValidationService.validateResendOTP(req.body);
      if (!validation.isValid) {
        console.log("❌ Validation failed:", validation.errors);
        return ResponseUtil.validationError(res, validation.errors);
      }

      const { email } = req.body;
      const normalizedEmail = email.trim().toLowerCase();

      // Check if user exists
      const user = await UserService.findByEmail(normalizedEmail);
      if (!user) {
        console.log("❌ User not found:", normalizedEmail);
        return ResponseUtil.notFound(res, CONSTANTS.MESSAGES.ERROR.USER_NOT_FOUND, "email");
      }

      // Check if email already verified
      if (user.emailVerified) {
        console.log("❌ Email already verified:", normalizedEmail);
        return ResponseUtil.error(res, CONSTANTS.MESSAGES.ERROR.EMAIL_ALREADY_VERIFIED, 400, [
          { field: "email", message: CONSTANTS.MESSAGES.ERROR.EMAIL_ALREADY_VERIFIED }
        ]);
      }

      // Generate new OTP
      const otpResult = await OTPService.createOTP(normalizedEmail, CONSTANTS.OTP.TYPES.EMAIL_VERIFICATION);
      
      if (!otpResult.success) {
        console.error("💥 Failed to create OTP:", otpResult.error);
        return ResponseUtil.serverError(res, "Failed to generate verification code", "otp");
      }

      // Send OTP email
      const emailResult = await EmailService.resendOTPEmail(normalizedEmail, otpResult.otpCode, user.fullname);
      
      if (!emailResult.success) {
        console.error("💥 Failed to resend OTP email:", emailResult.error);
        return ResponseUtil.serverError(res, CONSTANTS.MESSAGES.ERROR.EMAIL_SEND_FAILED, "email");
      }

      console.log("✅ OTP resent successfully");

      const responseData = {
        email: normalizedEmail,
        verification: {
          otpExpiry: `${CONSTANTS.OTP.EXPIRY_MINUTES} minutes`,
          maxAttempts: CONSTANTS.OTP.MAX_ATTEMPTS,
          resentAt: new Date().toISOString()
        }
      };

      return ResponseUtil.success(res, responseData, CONSTANTS.MESSAGES.SUCCESS.OTP_RESENT, 200);

    } catch (error) {
      console.error("💥 Resend OTP error:", error);
      return ResponseUtil.serverError(res, `Failed to resend OTP: ${error.message}`, "resend");
    }
  }

  // Handle registration errors (private method)
  static handleRegistrationError(res, error) {
    console.error("💥 Registration error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      console.log("🔍 Mongoose validation error:", error.errors);
      const validationErrors = [];
      
      Object.keys(error.errors).forEach(key => {
        validationErrors.push({
          field: key,
          message: error.errors[key].message
        });
      });
      
      return ResponseUtil.validationError(res, validationErrors);
    }

    // Handle duplicate key error (unique constraint)
    if (error.code === 11000) {
      console.log("🔍 Duplicate key error:", error.keyPattern);
      const field = Object.keys(error.keyPattern)[0];
      const message = field === 'email' 
        ? CONSTANTS.MESSAGES.ERROR.EMAIL_EXISTS 
        : CONSTANTS.MESSAGES.ERROR.USERNAME_EXISTS;
      return ResponseUtil.conflict(res, message, field);
    }

    // Handle any other errors
    console.error("💥 Unhandled registration error:", error);
    return ResponseUtil.serverError(res, `${CONSTANTS.MESSAGES.ERROR.REGISTRATION_FAILED}: ${error.message}`, "registration");
  }
}

module.exports = AuthController; 