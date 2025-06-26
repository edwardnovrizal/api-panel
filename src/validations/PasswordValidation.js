const CONSTANTS = require("../config/constants");

class PasswordValidation {
  // Validate forgot password request
  static validateForgotPassword(data) {
    const errors = [];
    const { email } = data;

    if (!email) {
      errors.push({ field: "email", message: "Email is required" });
    } else {
      const emailErrors = this.validateEmail(email);
      if (emailErrors.length > 0) {
        errors.push(...emailErrors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Validate reset password with token
  static validateResetPassword(data) {
    const errors = [];
    const { token, newPassword, confirmPassword } = data;

    // Token validation
    if (!token) {
      errors.push({ field: "token", message: "Reset token is required" });
    } else if (typeof token !== 'string' || token.trim().length === 0) {
      errors.push({ field: "token", message: "Invalid reset token" });
    }

    // New password validation
    if (!newPassword) {
      errors.push({ field: "newPassword", message: "New password is required" });
    } else {
      const passwordErrors = this.validatePassword(newPassword, "newPassword");
      if (passwordErrors.length > 0) {
        errors.push(...passwordErrors);
      }
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.push({ field: "confirmPassword", message: "Password confirmation is required" });
    } else if (newPassword && newPassword !== confirmPassword) {
      errors.push({ field: "confirmPassword", message: "Passwords do not match" });
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Validate change password for logged-in user
  static validateChangePassword(data) {
    const errors = [];
    const { currentPassword, newPassword, confirmPassword } = data;

    // Current password validation
    if (!currentPassword) {
      errors.push({ field: "currentPassword", message: "Current password is required" });
    } else if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
      errors.push({ field: "currentPassword", message: "Current password is required" });
    }

    // New password validation
    if (!newPassword) {
      errors.push({ field: "newPassword", message: "New password is required" });
    } else {
      const passwordErrors = this.validatePassword(newPassword, "newPassword");
      if (passwordErrors.length > 0) {
        errors.push(...passwordErrors);
      }
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.push({ field: "confirmPassword", message: "Password confirmation is required" });
    } else if (newPassword && newPassword !== confirmPassword) {
      errors.push({ field: "confirmPassword", message: "Passwords do not match" });
    }

    // Check if new password is different from current
    if (currentPassword && newPassword && currentPassword === newPassword) {
      errors.push({ field: "newPassword", message: "New password must be different from current password" });
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Validate reset token format
  static validateResetToken(token) {
    const errors = [];

    if (!token) {
      errors.push({ field: "token", message: "Reset token is required" });
    } else if (typeof token !== 'string') {
      errors.push({ field: "token", message: "Invalid reset token format" });
    } else if (token.trim().length === 0) {
      errors.push({ field: "token", message: "Reset token cannot be empty" });
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Password strength validation
  static validatePassword(password, fieldName = "password") {
    const errors = [];
    
    if (!password || typeof password !== 'string') {
      return [{ field: fieldName, message: "Password is required" }];
    }

    if (password.length < CONSTANTS.USER.PASSWORD.MIN_LENGTH) {
      errors.push({ 
        field: fieldName, 
        message: `Password must be at least ${CONSTANTS.USER.PASSWORD.MIN_LENGTH} characters long` 
      });
    }

    if (password.length > CONSTANTS.USER.PASSWORD.MAX_LENGTH) {
      errors.push({ 
        field: fieldName, 
        message: `Password must not exceed ${CONSTANTS.USER.PASSWORD.MAX_LENGTH} characters` 
      });
    }

    // Optional: Add more password strength rules
    // if (!/(?=.*[a-z])/.test(password)) {
    //   errors.push({ 
    //     field: fieldName, 
    //     message: "Password must contain at least one lowercase letter" 
    //   });
    // }

    // if (!/(?=.*[A-Z])/.test(password)) {
    //   errors.push({ 
    //     field: fieldName, 
    //     message: "Password must contain at least one uppercase letter" 
    //   });
    // }

    // if (!/(?=.*\d)/.test(password)) {
    //   errors.push({ 
    //     field: fieldName, 
    //     message: "Password must contain at least one number" 
    //   });
    // }

    return errors;
  }

  // Email validation (reused from AuthValidation)
  static validateEmail(email) {
    const errors = [];
    
    if (!email || typeof email !== 'string') {
      return [{ field: "email", message: "Email is required" }];
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(trimmedEmail)) {
      errors.push({ 
        field: "email", 
        message: "Please enter a valid email address" 
      });
    }

    return errors;
  }

  // Sanitize password data
  static sanitizePasswordData(data) {
    return {
      email: data.email ? data.email.trim().toLowerCase() : "",
      token: data.token ? data.token.trim() : "",
      currentPassword: data.currentPassword || "",
      newPassword: data.newPassword || "",
      confirmPassword: data.confirmPassword || ""
    };
  }
}

module.exports = PasswordValidation; 