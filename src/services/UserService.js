const UserRepository = require("../repositories/UserRepository");
const ModelHelpers = require("../utils/modelHelpers");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const CONSTANTS = require("../config/constants");
const OTPService = require("./OTPService");
const EmailService = require("./EmailService");
const RefreshTokenService = require("./RefreshTokenService");

class UserService {
  // Find user by email
  static async findByEmail(email) {
    return await UserRepository.findByEmail(email);
  }

  // Find user by username
  static async findByUsername(username) {
    return await UserRepository.findByUsername(username);
  }

  // Find user by email with password (untuk login)
  static async findByEmailWithPassword(email) {
    return await UserRepository.findByEmailWithPassword(email);
  }

  // Find user by username with password (untuk login)
  static async findByUsernameWithPassword(username) {
    return await UserRepository.findByUsernameWithPassword(username);
  }

  // Authenticate user login
  static async authenticateUser(username, password) {
    try {
      // Find user with password
      const user = await this.findByUsernameWithPassword(username);
      if (!user) {
        return { success: false, message: CONSTANTS.MESSAGES.ERROR.INVALID_CREDENTIALS };
      }

      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { success: false, message: CONSTANTS.MESSAGES.ERROR.INVALID_CREDENTIALS };
      }

      // Check if email is verified - return specific message
      if (!user.emailVerified) {
        return {
          success: false,
          message: CONSTANTS.MESSAGES.ERROR.EMAIL_NOT_VERIFIED,
          code: "EMAIL_NOT_VERIFIED",
        };
      }

      // Check if account is active - return specific message
      if (!user.isActive) {
        return {
          success: false,
          message: CONSTANTS.MESSAGES.ERROR.ACCOUNT_INACTIVE,
          code: "ACCOUNT_INACTIVE",
        };
      }

      // Return user data without password
      const userWithoutPassword = {
        _id: user._id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return {
        success: true,
        user: userWithoutPassword,
      };
    } catch (error) {
      console.error("💥 Authentication error:", error);
      return {
        success: false,
        message: CONSTANTS.MESSAGES.ERROR.INVALID_CREDENTIALS,
      };
    }
  }

  // Check if email exists
  static async emailExists(email) {
    return await UserRepository.emailExists(email);
  }

  // Check if username exists
  static async usernameExists(username) {
    return await UserRepository.usernameExists(username);
  }

  // Create new user
  static async createUser(userData) {
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, CONSTANTS.USER.PASSWORD.SALT_ROUNDS);

    // Prepare user data
    const userToCreate = {
      username: userData.username.trim(),
      fullname: userData.fullname.trim(),
      email: ModelHelpers.normalizeEmail(userData.email),
      password: hashedPassword,
      role: userData.role || CONSTANTS.USER.DEFAULT_ROLE,
    };

    return await UserRepository.create(userToCreate);
  }

  // Get user by ID (without password)
  static async getUserById(userId) {
    return await UserRepository.findById(userId);
  }

  // Update user
  static async updateUser(userId, updateData) {
    // Remove sensitive fields dari update
    const sanitizedData = ModelHelpers.excludeFields(updateData, ["password", "_id"]);

    if (sanitizedData.email) {
      sanitizedData.email = ModelHelpers.normalizeEmail(sanitizedData.email);
    }

    return await UserRepository.updateById(userId, sanitizedData);
  }

  // Change password
  static async changePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, CONSTANTS.USER.PASSWORD.SALT_ROUNDS);

    return await UserRepository.updateById(userId, { password: hashedPassword });
  }

  // Get users with pagination and search
  static async getUsers(options = {}) {
    return await UserRepository.findWithPagination(options);
  }

  // Activate/Deactivate user
  static async toggleUserStatus(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const newStatus = !user.isActive;
    return await UserRepository.updateById(userId, { isActive: newStatus });
  }

  // Register user with email verification
  static async registerUser(userData) {
    const { username, fullname, email, password } = userData;

    // Check for existing email
    const emailExists = await this.emailExists(email);
    if (emailExists) {
      throw new Error("Email already exists");
    }

    // Check for existing username
    const usernameExists = await this.usernameExists(username);
    if (usernameExists) {
      throw new Error("Username already exists");
    }

    // Create user
    const newUser = await this.createUser({ username, fullname, email, password });

    // Generate and send OTP
    const otpResult = await OTPService.createOTP(email, CONSTANTS.OTP.TYPES.EMAIL_VERIFICATION);

    if (!otpResult.success) {
      throw new Error("Failed to generate verification code");
    }

    // Send OTP email
    const emailResult = await EmailService.sendOTPEmail(email, otpResult.otpCode, fullname);

    return {
      user: {
        _id: newUser._id,
        username: newUser.username,
        fullname: newUser.fullname,
        email: newUser.email,
        emailVerified: newUser.emailVerified,
        isActive: newUser.isActive,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
      verification: {
        emailSent: emailResult.success,
        otpExpiry: `${CONSTANTS.OTP.EXPIRY_MINUTES} minutes`,
        maxAttempts: CONSTANTS.OTP.MAX_ATTEMPTS,
      },
    };
  }

  // Verify email with OTP
  static async verifyEmail(email, otp) {
    const normalizedEmail = ModelHelpers.normalizeEmail(email);

    // Check if user exists
    const user = await this.findByEmail(normalizedEmail);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if email already verified
    if (user.emailVerified) {
      throw new Error("Email already verified");
    }

    // Verify OTP
    const otpResult = await OTPService.verifyOTP(normalizedEmail, otp.trim(), CONSTANTS.OTP.TYPES.EMAIL_VERIFICATION);

    if (!otpResult.success) {
      throw new Error(otpResult.message);
    }

    // Update user email verification status
    user.emailVerified = true;
    await user.save();

    // Send welcome email (non-blocking)
    EmailService.sendWelcomeEmail(normalizedEmail, user.fullname).catch(() => {
      // Email notification failure should not affect registration
    });

    return {
      user: {
        _id: user._id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
        role: user.role,
      },
      verification: {
        status: "completed",
        verifiedAt: new Date().toISOString(),
      },
    };
  }

  // Resend OTP
  static async resendOTP(email) {
    const normalizedEmail = ModelHelpers.normalizeEmail(email);

    // Check if user exists
    const user = await this.findByEmail(normalizedEmail);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if email already verified
    if (user.emailVerified) {
      throw new Error("Email already verified");
    }

    // Generate new OTP
    const otpResult = await OTPService.createOTP(normalizedEmail, CONSTANTS.OTP.TYPES.EMAIL_VERIFICATION);

    if (!otpResult.success) {
      throw new Error("Failed to generate verification code");
    }

    // Send OTP email
    const emailResult = await EmailService.resendOTPEmail(normalizedEmail, otpResult.otpCode, user.fullname);

    if (!emailResult.success) {
      throw new Error("Failed to send verification email");
    }

    return {
      email: normalizedEmail,
      verification: {
        otpExpiry: `${CONSTANTS.OTP.EXPIRY_MINUTES} minutes`,
        maxAttempts: CONSTANTS.OTP.MAX_ATTEMPTS,
        resentAt: new Date().toISOString(),
      },
    };
  }

  // Login user
  static async loginUser({ username, password, deviceInfo }) {
    const trimmedUsername = username.trim();

    // Authenticate user
    const authResult = await this.authenticateUser(trimmedUsername, password);

    if (!authResult.success) {
      // Handle different error types
      if (authResult.code === "EMAIL_NOT_VERIFIED") {
        throw new Error("Please verify your email address first");
      }

      if (authResult.code === "ACCOUNT_INACTIVE") {
        throw new Error("Account is inactive. Please contact administrator");
      }

      // Invalid credentials (username/password wrong)
      throw new Error("Invalid credentials");
    }

    // Generate JWT token
    const tokenPayload = {
      userId: authResult.user._id,
      username: authResult.user.username,
      email: authResult.user.email,
      role: authResult.user.role,
    };

    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: CONSTANTS.JWT.EXPIRES_IN,
      algorithm: CONSTANTS.JWT.ALGORITHM,
    });

    // Generate refresh token
    const refreshTokenResult = await RefreshTokenService.generateRefreshToken(authResult.user._id, deviceInfo);

    return {
      user: authResult.user,
      tokens: {
        accessToken: accessToken,
        refreshToken: refreshTokenResult.success ? refreshTokenResult.refreshToken : null,
        tokenType: "Bearer",
        expiresIn: CONSTANTS.JWT.EXPIRES_IN,
        refreshExpiresAt: refreshTokenResult.success ? refreshTokenResult.expiresAt : null,
      },
      loginInfo: {
        loginAt: new Date().toISOString(),
        deviceType: deviceInfo.deviceType,
      },
    };
  }

  // Find user by ID
  static async findById(userId) {
    return await UserRepository.findById(userId);
  }

  // Update user profile
  static async updateProfile(userId, updateData) {
    // Check if email is being updated and already exists
    if (updateData.email) {
      const normalizedEmail = ModelHelpers.normalizeEmail(updateData.email);
      const existingUser = await UserRepository.findByEmail(normalizedEmail);

      if (existingUser && existingUser._id.toString() !== userId) {
        throw new Error("Email already exists");
      }

      updateData.email = normalizedEmail;
    }

    // Remove sensitive fields from update
    const sanitizedData = ModelHelpers.excludeFields(updateData, ["password", "_id", "username"]);

    return await UserRepository.updateById(userId, sanitizedData);
  }
}

module.exports = UserService;
