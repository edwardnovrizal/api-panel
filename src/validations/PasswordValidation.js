const BaseValidation = require("./BaseValidation");

class PasswordValidation extends BaseValidation {
  // Validate forgot password request
  static validateForgotPassword(data) {
    const cleanData = this.cleanData(data);
    
    const validations = [
      this.validateEmail(cleanData.email)
    ];

    return this.runValidations(validations);
  }

  // Validate reset password with token
  static validateResetPassword(data) {
    const cleanData = this.cleanData(data);
    
    const validations = [
      this.validateToken(cleanData.token),
      this.validatePassword(cleanData.newPassword, "newPassword"),
      this.validatePasswordConfirmation(cleanData.newPassword, cleanData.confirmPassword)
    ];

    return this.runValidations(validations);
  }

  // Validate change password for logged-in user
  static validateChangePassword(data) {
    const cleanData = this.cleanData(data);
    
    const validations = [
      this.validateRequired(cleanData.currentPassword, "currentPassword"),
      this.validatePassword(cleanData.newPassword, "newPassword"),
      this.validatePasswordConfirmation(cleanData.newPassword, cleanData.confirmPassword),
      this.validatePasswordDifferent(cleanData.currentPassword, cleanData.newPassword)
    ];

    return this.runValidations(validations);
  }

  // Validate password confirmation
  static validatePasswordConfirmation(password, confirmPassword) {
    if (!confirmPassword) {
      return this.createError("confirmPassword", "Password confirmation is required");
    }

    if (password && password !== confirmPassword) {
      return this.createError("confirmPassword", "Passwords do not match");
    }

    return null;
  }

  // Validate that new password is different from current
  static validatePasswordDifferent(currentPassword, newPassword) {
    if (currentPassword && newPassword && currentPassword === newPassword) {
      return this.createError("newPassword", "New password must be different from current password");
    }

    return null;
  }
}

module.exports = PasswordValidation; 