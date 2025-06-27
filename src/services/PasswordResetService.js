const ResetTokenRepository = require("../repositories/ResetTokenRepository");
const UserService = require("./UserService");
const EmailService = require("./EmailService");
const CONSTANTS = require("../config/constants");

class PasswordResetService {
  // Generate reset token and send email
  static async requestPasswordReset(email) {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      
      // Check if user exists
      const user = await UserService.findByEmail(normalizedEmail);
      if (!user) {
        // Don't reveal if email exists or not for security
        return {
          success: true,
          message: CONSTANTS.MESSAGES.SUCCESS.PASSWORD_RESET_SENT,
          emailSent: false
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: true,
          message: CONSTANTS.MESSAGES.SUCCESS.PASSWORD_RESET_SENT,
          emailSent: false
        };
      }

      // Create reset token
      const tokenDoc = await ResetTokenRepository.create(
        normalizedEmail, 
        CONSTANTS.OTP.RESET_PASSWORD_EXPIRY_MINUTES
      );
      
      const resetToken = tokenDoc.token;

      // Send reset email
      const emailResult = await EmailService.sendPasswordResetEmail(
        normalizedEmail, 
        resetToken, 
        user.fullname
      );

      return {
        success: true,
        message: CONSTANTS.MESSAGES.SUCCESS.PASSWORD_RESET_SENT,
        emailSent: emailResult.success,
        expiresIn: `${CONSTANTS.OTP.RESET_PASSWORD_EXPIRY_MINUTES} minutes`,
        ...(emailResult.success ? {} : { emailError: emailResult.message })
      };

    } catch (error) {
      console.error("💥 Password reset request error:", error);
      return {
        success: false,
        message: CONSTANTS.MESSAGES.ERROR.PASSWORD_RESET_FAILED,
        error: error.message
      };
    }
  }

  // Verify reset token and update password
  static async resetPassword(token, newPassword) {
    try {
      // Find valid reset token
      const resetTokenDoc = await ResetTokenRepository.findValidToken(token);
      
      if (!resetTokenDoc) {
        return {
          success: false,
          message: CONSTANTS.MESSAGES.ERROR.INVALID_RESET_TOKEN
        };
      }

      // Find user by email
      const user = await UserService.findByEmail(resetTokenDoc.email);
      if (!user) {
        return {
          success: false,
          message: CONSTANTS.MESSAGES.ERROR.USER_NOT_FOUND
        };
      }

      // Check if user is still active
      if (!user.isActive) {
        return {
          success: false,
          message: CONSTANTS.MESSAGES.ERROR.ACCOUNT_INACTIVE
        };
      }

      // Update user password
      await UserService.changePassword(user._id, newPassword);

      // Mark token as used
      await ResetTokenRepository.markAsUsed(resetTokenDoc._id);

      // Send confirmation email (non-blocking)
      EmailService.sendPasswordResetConfirmationEmail(user.email, user.fullname)
        .catch(() => {
          // Email notification failure should not affect the main operation
        });

      return {
        success: true,
        message: CONSTANTS.MESSAGES.SUCCESS.PASSWORD_RESET,
        user: {
          email: user.email,
          username: user.username,
          resetAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error("💥 Password reset error:", error);
      return {
        success: false,
        message: CONSTANTS.MESSAGES.ERROR.PASSWORD_RESET_FAILED,
        error: error.message
      };
    }
  }

  // Verify if reset token is valid (without using it)
  static async verifyResetToken(token) {
    try {
      const resetTokenDoc = await ResetTokenRepository.findValidToken(token);
      
      if (!resetTokenDoc) {
        return {
          success: false,
          message: CONSTANTS.MESSAGES.ERROR.INVALID_RESET_TOKEN
        };
      }

      return {
        success: true,
        message: "Reset token is valid",
        email: resetTokenDoc.email,
        expiresAt: resetTokenDoc.expiresAt
      };

    } catch (error) {
      console.error("💥 Verify reset token error:", error);
      return {
        success: false,
        message: CONSTANTS.MESSAGES.ERROR.INVALID_RESET_TOKEN,
        error: error.message
      };
    }
  }

  // Cleanup expired tokens (utility method)
  static async cleanupExpiredTokens() {
    try {
      const result = await ResetTokenRepository.cleanupExpired();
      console.log(`🧹 Cleaned up ${result.deletedCount} expired reset tokens`);
      return result;
    } catch (error) {
      console.error("💥 Cleanup expired tokens error:", error);
      return null;
    }
  }
}

module.exports = PasswordResetService; 