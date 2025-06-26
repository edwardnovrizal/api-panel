const PasswordResetService = require("../services/PasswordResetService");
const UserService = require("../services/UserService");
const ResponseUtil = require("../utils/response");
const PasswordValidation = require("../validations/PasswordValidation");
const bcrypt = require("bcryptjs");

class PasswordController {
  // Forgot password - request password reset
  static async forgotPassword(req, res) {
    try {
      // Sanitize input
      const sanitizedData = PasswordValidation.sanitizePasswordData(req.body);
      
      // Validate input
      const validation = PasswordValidation.validateForgotPassword(sanitizedData);
      if (!validation.isValid) {
        return ResponseUtil.error(res, "Validation failed", 400, validation.errors);
      }

      // Request password reset
      const result = await PasswordResetService.requestPasswordReset(sanitizedData.email);
      
      return ResponseUtil.success(res, "Password reset instructions sent to your email", result);
    } catch (error) {
      console.error("Forgot password error:", error);
      
      // Always return success for security (don't reveal if email exists)
      return ResponseUtil.success(res, "If your email is registered, you will receive password reset instructions");
    }
  }

  // Verify reset token (optional endpoint to check token validity)
  static async verifyResetToken(req, res) {
    try {
      const { token } = req.params;
      
      // Validate token format
      const validation = PasswordValidation.validateResetToken(token);
      if (!validation.isValid) {
        return ResponseUtil.error(res, "Invalid reset token", 400, validation.errors);
      }

      // Verify token
      const result = await PasswordResetService.verifyResetToken(token);
      
      return ResponseUtil.success(res, "Reset token is valid", result);
    } catch (error) {
      console.error("Verify reset token error:", error);
      
      if (error.message.includes("Invalid") || error.message.includes("expired")) {
        return ResponseUtil.error(res, error.message, 400, [
          { field: "token", message: error.message }
        ]);
      }
      
      return ResponseUtil.error(res, "Token verification failed", 500, [
        { field: "server", message: "An error occurred during token verification" }
      ]);
    }
  }

  // Reset password with token
  static async resetPassword(req, res) {
    try {
      // Sanitize input
      const sanitizedData = PasswordValidation.sanitizePasswordData(req.body);
      
      // Validate input
      const validation = PasswordValidation.validateResetPassword(sanitizedData);
      if (!validation.isValid) {
        return ResponseUtil.error(res, "Validation failed", 400, validation.errors);
      }

      // Reset password
      const result = await PasswordResetService.resetPassword(
        sanitizedData.token, 
        sanitizedData.newPassword
      );
      
      return ResponseUtil.success(res, "Password reset successfully", result);
    } catch (error) {
      console.error("Reset password error:", error);
      
      if (error.message.includes("Invalid") || error.message.includes("expired")) {
        return ResponseUtil.error(res, error.message, 400, [
          { field: "token", message: error.message }
        ]);
      }
      
      return ResponseUtil.error(res, "Password reset failed", 500, [
        { field: "server", message: "An error occurred during password reset" }
      ]);
    }
  }

  // Change password for authenticated users
  static async changePassword(req, res) {
    try {
      // Sanitize input
      const sanitizedData = PasswordValidation.sanitizePasswordData(req.body);
      
      // Validate input
      const validation = PasswordValidation.validateChangePassword(sanitizedData);
      if (!validation.isValid) {
        return ResponseUtil.error(res, "Validation failed", 400, validation.errors);
      }

      // Get user with password
      const user = await UserService.findByUsernameWithPassword(req.user.username);
      if (!user) {
        return ResponseUtil.error(res, "User not found", 404, [
          { field: "user", message: "User not found" }
        ]);
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        sanitizedData.currentPassword, 
        user.password
      );
      
      if (!isCurrentPasswordValid) {
        return ResponseUtil.error(res, "Current password is incorrect", 400, [
          { field: "currentPassword", message: "Current password is incorrect" }
        ]);
      }

      // Update password
      await UserService.changePassword(user._id, sanitizedData.newPassword);
      
      const result = {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email
        },
        changedAt: new Date().toISOString()
      };

      return ResponseUtil.success(res, "Password changed successfully", result);
    } catch (error) {
      console.error("Change password error:", error);
      
      return ResponseUtil.error(res, "Password change failed", 500, [
        { field: "server", message: "An error occurred during password change" }
      ]);
    }
  }
}

module.exports = PasswordController; 