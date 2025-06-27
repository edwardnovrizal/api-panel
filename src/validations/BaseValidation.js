const CONSTANTS = require("../config/constants");

class BaseValidation {
  // Helper method untuk membuat error object
  static createError(field, message) {
    return { field, message };
  }

  // Clean dan normalize input data
  static cleanData(data) {
    if (!data || typeof data !== 'object') {
      return {};
    }

    const cleaned = {};
    
    // Process each field
    Object.keys(data).forEach(key => {
      const value = data[key];
      
      if (typeof value === 'string') {
        // Trim whitespace
        cleaned[key] = value.trim();
        
        // Normalize email
        if (key === 'email' && cleaned[key]) {
          cleaned[key] = cleaned[key].toLowerCase();
        }
      } else {
        cleaned[key] = value;
      }
    });

    return cleaned;
  }

  // Required field validation
  static validateRequired(value, fieldName) {
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      return this.createError(fieldName, `${fieldName} is required`);
    }
    return null;
  }

  // Email validation
  static validateEmail(email) {
    if (!email) {
      return this.createError("email", "Email is required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return this.createError("email", "Please enter a valid email address");
    }

    return null;
  }

  // Username validation
  static validateUsername(username) {
    if (!username) {
      return this.createError("username", "Username is required");
    }

    if (username.length < CONSTANTS.USER.USERNAME.MIN_LENGTH) {
      return this.createError("username", `Username must be at least ${CONSTANTS.USER.USERNAME.MIN_LENGTH} characters`);
    }

    if (username.length > CONSTANTS.USER.USERNAME.MAX_LENGTH) {
      return this.createError("username", `Username cannot exceed ${CONSTANTS.USER.USERNAME.MAX_LENGTH} characters`);
    }

    if (!CONSTANTS.USER.USERNAME.PATTERN.test(username)) {
      return this.createError("username", "Username can only contain letters, numbers, and underscores");
    }

    return null;
  }

  // Password validation
  static validatePassword(password, fieldName = "password") {
    if (!password) {
      return this.createError(fieldName, `${fieldName} is required`);
    }

    if (password.length < CONSTANTS.USER.PASSWORD.MIN_LENGTH) {
      return this.createError(fieldName, `Password must be at least ${CONSTANTS.USER.PASSWORD.MIN_LENGTH} characters`);
    }

    return null;
  }

  // Full name validation
  static validateFullname(fullname) {
    if (!fullname) {
      return this.createError("fullname", "Full name is required");
    }

    if (fullname.length < CONSTANTS.USER.FULLNAME.MIN_LENGTH) {
      return this.createError("fullname", `Full name must be at least ${CONSTANTS.USER.FULLNAME.MIN_LENGTH} characters`);
    }

    if (fullname.length > CONSTANTS.USER.FULLNAME.MAX_LENGTH) {
      return this.createError("fullname", `Full name cannot exceed ${CONSTANTS.USER.FULLNAME.MAX_LENGTH} characters`);
    }

    return null;
  }

  // OTP validation
  static validateOTP(otp) {
    if (!otp) {
      return this.createError("otp", "OTP code is required");
    }

    if (otp.length !== CONSTANTS.OTP.LENGTH) {
      return this.createError("otp", `OTP code must be ${CONSTANTS.OTP.LENGTH} digits`);
    }

    if (!/^\d+$/.test(otp)) {
      return this.createError("otp", "OTP code must contain only numbers");
    }

    return null;
  }

  // Token validation
  static validateToken(token, fieldName = "token") {
    if (!token) {
      return this.createError(fieldName, `${fieldName} is required`);
    }

    if (typeof token !== 'string' || token.length === 0) {
      return this.createError(fieldName, `Invalid ${fieldName} format`);
    }

    return null;
  }

  // Helper method untuk menjalankan multiple validations
  static runValidations(validations) {
    const errors = [];
    
    validations.forEach(validation => {
      if (validation) {
        errors.push(validation);
      }
    });

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

module.exports = BaseValidation; 