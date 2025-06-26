// Application Constants
const APP_CONSTANTS = {
  // OTP Configuration
  OTP: {
    LENGTH: 6,
    EXPIRY_MINUTES: 10,
    MAX_ATTEMPTS: 3,
    TYPES: {
      EMAIL_VERIFICATION: "email_verification",
      PASSWORD_RESET: "password_reset"
    },
    RESET_PASSWORD_EXPIRY_MINUTES: 15
  },

  // User Configuration
  USER: {
    ROLES: {
      USER: "user",
      ADMIN: "admin", 
      SUPER_ADMIN: "super_admin"
    },
    DEFAULT_ROLE: "user",
    USERNAME: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 20,
      PATTERN: /^[a-zA-Z0-9_]+$/
    },
    FULLNAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 100
    },
    PASSWORD: {
      MIN_LENGTH: 6,
      SALT_ROUNDS: 10
    }
  },

  // Email Configuration
  EMAIL: {
    TEMPLATES: {
      OTP_VERIFICATION: "otp_verification",
      WELCOME: "welcome",
      PASSWORD_RESET: "password_reset"
    },
    FROM_NAME: "API Panel Admin",
    SUBJECTS: {
      OTP_VERIFICATION: "Email Verification - API Panel",
      WELCOME: "Welcome to API Panel - Account Verified!",
      PASSWORD_RESET: "Password Reset - API Panel"
    }
  },

  // JWT Configuration
  JWT: {
    EXPIRES_IN: "24h",
    ALGORITHM: "HS256"
  },

  // Response Messages
  MESSAGES: {
    SUCCESS: {
      REGISTRATION: "User registered successfully. Please verify your email.",
      EMAIL_VERIFIED: "Email verification successful",
      OTP_SENT: "OTP sent successfully",
      OTP_RESENT: "OTP resent successfully",
      LOGIN: "Login successful",
      PASSWORD_RESET_SENT: "Password reset instructions sent to your email",
      PASSWORD_RESET: "Password reset successful"
    },
    ERROR: {
      VALIDATION_FAILED: "Validation failed",
      EMAIL_EXISTS: "Email already registered",
      USERNAME_EXISTS: "Username already taken",
      USER_NOT_FOUND: "User not found",
      EMAIL_ALREADY_VERIFIED: "Email already verified",
      INVALID_OTP: "Invalid or expired OTP",
      MAX_ATTEMPTS_EXCEEDED: "Maximum verification attempts exceeded",
      EMAIL_SEND_FAILED: "Failed to send email",
      REGISTRATION_FAILED: "Registration failed",
      INVALID_CREDENTIALS: "Invalid credentials",
      EMAIL_NOT_VERIFIED: "Please verify your email address first",
      ACCOUNT_INACTIVE: "Account is inactive. Please contact administrator",
      INVALID_TOKEN: "Invalid or expired token",
      INVALID_RESET_TOKEN: "Invalid or expired reset token",
      PASSWORD_RESET_FAILED: "Password reset failed"
    }
  }
};

module.exports = APP_CONSTANTS; 