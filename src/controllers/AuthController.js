const UserService = require("../services/UserService");
const OTPService = require("../services/OTPService");
const RefreshTokenService = require("../services/RefreshTokenService");
const ResponseUtil = require("../utils/response");
const AuthValidation = require("../validations/AuthValidation");

class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      // Check if request body exists
      if (!req.body) {
        return ResponseUtil.error(res, "Request body is required", 400, [
          { field: "body", message: "Request body is required" }
        ]);
      }

      // Validate input
      const validation = AuthValidation.validateRegistration(req.body);
      if (!validation.isValid) {
        return ResponseUtil.error(res, "Validation failed", 400, validation.errors);
      }

      // Clean and register user
      const cleanData = AuthValidation.cleanData(req.body);
      const result = await UserService.registerUser(cleanData);
      
      return ResponseUtil.success(res, "Registration successful. Please check your email to verify your account.", result);
    } catch (error) {
      console.error("Registration error:", error);
      
      if (error.message.includes("already exists")) {
        return ResponseUtil.error(res, error.message, 409, [
          { field: error.message.includes("username") ? "username" : "email", message: error.message }
        ]);
      }
      
      return ResponseUtil.error(res, "Registration failed", 500, [
        { field: "server", message: "An error occurred during registration" }
      ]);
    }
  }

  // Verify email with OTP
  static async verifyEmail(req, res) {
    try {
      // Check if request body exists
      if (!req.body) {
        return ResponseUtil.error(res, "Request body is required", 400, [
          { field: "body", message: "Request body is required" }
        ]);
      }

      // Validate input
      const validation = AuthValidation.validateEmailVerification(req.body);
      if (!validation.isValid) {
        return ResponseUtil.error(res, "Validation failed", 400, validation.errors);
      }

      // Clean and verify email
      const cleanData = AuthValidation.cleanData(req.body);
      const result = await UserService.verifyEmail(cleanData.email, cleanData.otp);
      
      return ResponseUtil.success(res, "Email verified successfully", result);
    } catch (error) {
      console.error("Email verification error:", error);
      
      if (error.message.includes("Invalid") || error.message.includes("expired")) {
        return ResponseUtil.error(res, error.message, 400, [
          { field: "otp", message: error.message }
        ]);
      }
      
      return ResponseUtil.error(res, "Email verification failed", 500, [
        { field: "server", message: "An error occurred during email verification" }
      ]);
    }
  }

  // Resend OTP
  static async resendOTP(req, res) {
    try {
      // Check if request body exists
      if (!req.body) {
        return ResponseUtil.error(res, "Request body is required", 400, [
          { field: "body", message: "Request body is required" }
        ]);
      }

      // Validate input
      const validation = AuthValidation.validateResendOTP(req.body);
      if (!validation.isValid) {
        return ResponseUtil.error(res, "Validation failed", 400, validation.errors);
      }

      // Clean and resend OTP
      const cleanData = AuthValidation.cleanData(req.body);
      await UserService.resendOTP(cleanData.email);
      
      return ResponseUtil.success(res, "OTP sent successfully");
    } catch (error) {
      console.error("Resend OTP error:", error);
      
      if (error.message.includes("not found") || error.message.includes("already verified")) {
        return ResponseUtil.error(res, error.message, 400, [
          { field: "email", message: error.message }
        ]);
      }
      
      return ResponseUtil.error(res, "Failed to send OTP", 500, [
        { field: "server", message: "An error occurred while sending OTP" }
      ]);
    }
  }

  // User login
  static async login(req, res) {
    try {
      // Check if request body exists
      if (!req.body) {
        return ResponseUtil.error(res, "Request body is required", 400, [
          { field: "body", message: "Request body is required" }
        ]);
      }

      // Validate input
      const validation = AuthValidation.validateLogin(req.body);
      if (!validation.isValid) {
        return ResponseUtil.error(res, "Invalid credentials", 401, validation.errors);
      }

      // Get device info
      const userAgent = req.headers['user-agent'] || '';
      const deviceInfo = AuthController.parseDeviceInfo(userAgent);

      // Clean and login user
      const cleanData = AuthValidation.cleanData(req.body);
      const result = await UserService.loginUser({
        username: cleanData.username,
        password: cleanData.password,
        deviceInfo
      });

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,          // Tidak bisa diakses JavaScript
        secure: process.env.NODE_ENV === 'production', // HTTPS only di production
        sameSite: 'strict',      // CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        path: '/v1/api/auth'     // Match actual route path
      });

      // Remove refresh token from response (karena sudah di cookies)
      const responseData = {
        accessToken: result.tokens.accessToken,
        tokenType: result.tokens.tokenType,
        expiresIn: result.tokens.expiresIn,
        user: result.user,
        loginInfo: result.loginInfo
        // refreshToken tidak dikirim ke frontend
      };
      
      return ResponseUtil.success(res, "Login successful", responseData);
    } catch (error) {
      console.error("Login error:", error);
      
      // Handle specific error cases
      if (error.message === "Invalid credentials") {
        return ResponseUtil.error(res, "Invalid credentials", 401, [
          { field: "credentials", message: "Invalid credentials" }
        ]);
      }
      
      if (error.message === "Please verify your email address first") {
        return ResponseUtil.error(res, "Please verify your email address first", 403, [
          { field: "email", message: "Please verify your email address first" }
        ]);
      }
      
      if (error.message === "Account is inactive. Please contact administrator") {
        return ResponseUtil.error(res, "Account is inactive. Please contact administrator", 403, [
          { field: "account", message: "Account is inactive. Please contact administrator" }
        ]);
      }
      
      return ResponseUtil.error(res, "Login failed", 500, [
        { field: "server", message: "An error occurred during login" }
      ]);
    }
  }

  // Refresh access token
  static async refreshToken(req, res) {
    try {
      // Get refresh token from httpOnly cookie instead of request body
      const refreshToken = req.cookies.refreshToken;
      
      if (!refreshToken) {
        return ResponseUtil.error(res, "Refresh token is required", 401, [
          { field: "refreshToken", message: "No refresh token found. Please login again." }
        ]);
      }

      // Refresh token
      const result = await RefreshTokenService.refreshAccessToken(refreshToken);
      
      if (!result.success) {
        // Clear invalid refresh token cookie
        res.clearCookie('refreshToken', { path: '/v1/api/auth' });
        
        // Handle specific error codes
        let statusCode = 401;
        let errorMessage = result.message;
        
        switch (result.code) {
          case 'TOKEN_EXPIRED':
            errorMessage = "Your session has expired. Please login again.";
            break;
          case 'TOKEN_REVOKED':
            errorMessage = "Your session has been terminated. Please login again.";
            break;
          case 'USER_INACTIVE':
            statusCode = 403;
            errorMessage = "Your account has been deactivated. Please contact administrator.";
            break;
          case 'EMAIL_NOT_VERIFIED':
            statusCode = 403;
            errorMessage = "Please verify your email address to continue.";
            break;
          case 'USER_NOT_FOUND':
            errorMessage = "User account not found. Please login again.";
            break;
          case 'INVALID_FORMAT':
            errorMessage = "Invalid session format. Please login again.";
            break;
          case 'INTERNAL_ERROR':
            statusCode = 500;
            errorMessage = "Internal server error. Please try again.";
            break;
          default:
            errorMessage = result.message || "Session validation failed. Please login again.";
        }
        
        return ResponseUtil.error(res, errorMessage, statusCode, [
          { field: "refreshToken", message: errorMessage }
        ]);
      }

      // Update refresh token cookie if a new one was generated
      if (result.refreshToken && result.refreshToken.token !== refreshToken) {
        res.cookie('refreshToken', result.refreshToken.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/v1/api/auth'
        });
      }

      // Remove refresh token from response (karena sudah di cookies)
      const responseData = {
        accessToken: result.accessToken,
        tokenType: result.tokenType,
        expiresIn: result.expiresIn,
        user: result.user
        // refreshToken tidak dikirim ke frontend
      };
      
      return ResponseUtil.success(res, "Token refreshed successfully", responseData);
    } catch (error) {
      console.error("Refresh token error:", error);
      
      // Clear potentially invalid cookie
      res.clearCookie('refreshToken', { path: '/v1/api/auth' });
      
      return ResponseUtil.error(res, "Token refresh failed", 500, [
        { field: "refreshToken", message: "Internal server error. Please login again." }
      ]);
    }
  }

  // Logout user
  static async logout(req, res) {
    try {
      // Get refresh token from cookie
      const refreshToken = req.cookies.refreshToken;
      
      if (refreshToken) {
        await RefreshTokenService.revokeRefreshToken(refreshToken);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken', { path: '/v1/api/auth' });
      
      return ResponseUtil.success(res, "Logout successful");
    } catch (error) {
      console.error("Logout error:", error);
      
      // Always clear cookie and return success for logout
      res.clearCookie('refreshToken', { path: '/v1/api/auth' });
      return ResponseUtil.success(res, "Logout successful");
    }
  }

  // Logout from all devices
  static async logoutAll(req, res) {
    try {
      const userId = req.user.userId;
      
      await RefreshTokenService.revokeAllUserTokens(userId);
      
      return ResponseUtil.success(res, "Logged out from all devices successfully");
    } catch (error) {
      console.error("Logout all error:", error);
      return ResponseUtil.error(res, "Logout failed", 500, [
        { field: "server", message: "An error occurred during logout" }
      ]);
    }
  }

  // Helper method to parse device info
  static parseDeviceInfo(userAgent) {
    const deviceInfo = {
      userAgent: userAgent,
      deviceType: 'desktop', // default
      browser: 'unknown',
      os: 'unknown'
    };

    // Simple device detection
    if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      if (/iPad/i.test(userAgent)) {
        deviceInfo.deviceType = 'tablet';
      } else {
        deviceInfo.deviceType = 'mobile';
      }
    }

    // Simple browser detection
    if (userAgent.includes('Chrome')) {
      deviceInfo.browser = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      deviceInfo.browser = 'Firefox';
    } else if (userAgent.includes('Safari')) {
      deviceInfo.browser = 'Safari';
    } else if (userAgent.includes('Edge')) {
      deviceInfo.browser = 'Edge';
    }

    // Simple OS detection
    if (userAgent.includes('Windows')) {
      deviceInfo.os = 'Windows';
    } else if (userAgent.includes('Mac')) {
      deviceInfo.os = 'macOS';
    } else if (userAgent.includes('Linux')) {
      deviceInfo.os = 'Linux';
    } else if (userAgent.includes('Android')) {
      deviceInfo.os = 'Android';
    } else if (userAgent.includes('iOS')) {
      deviceInfo.os = 'iOS';
    }

    return deviceInfo;
  }
}

module.exports = AuthController; 