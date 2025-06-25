const CONSTANTS = require("../config/constants");

class ValidationService {
  // Validate registration data
  static validateRegistrationData(data) {
    const errors = [];
    const { username, fullname, email, password } = data;

    // Required field validation
    if (!username) {
      errors.push({ field: "username", message: "Username is required" });
    }
    if (!fullname) {
      errors.push({ field: "fullname", message: "Full name is required" });
    }
    if (!email) {
      errors.push({ field: "email", message: "Email is required" });
    }
    if (!password) {
      errors.push({ field: "password", message: "Password is required" });
    }

    // If required fields missing, return early
    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Username validation
    const usernameErrors = this.validateUsername(username);
    if (usernameErrors.length > 0) {
      errors.push(...usernameErrors);
    }

    // Full name validation
    const fullnameErrors = this.validateFullname(fullname);
    if (fullnameErrors.length > 0) {
      errors.push(...fullnameErrors);
    }

    // Email validation
    const emailErrors = this.validateEmail(email);
    if (emailErrors.length > 0) {
      errors.push(...emailErrors);
    }

    // Password validation
    const passwordErrors = this.validatePassword(password);
    if (passwordErrors.length > 0) {
      errors.push(...passwordErrors);
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Username validation
  static validateUsername(username) {
    const errors = [];
    
    if (!username || typeof username !== 'string') {
      return [{ field: "username", message: "Username is required" }];
    }

    const trimmedUsername = username.trim();
    
    if (trimmedUsername.length < CONSTANTS.USER.USERNAME.MIN_LENGTH) {
      errors.push({ 
        field: "username", 
        message: `Username must be at least ${CONSTANTS.USER.USERNAME.MIN_LENGTH} characters long` 
      });
    }

    if (trimmedUsername.length > CONSTANTS.USER.USERNAME.MAX_LENGTH) {
      errors.push({ 
        field: "username", 
        message: `Username must not exceed ${CONSTANTS.USER.USERNAME.MAX_LENGTH} characters` 
      });
    }

    if (!CONSTANTS.USER.USERNAME.PATTERN.test(trimmedUsername)) {
      errors.push({ 
        field: "username", 
        message: "Username can only contain letters, numbers, and underscores" 
      });
    }

    return errors;
  }

  // Full name validation
  static validateFullname(fullname) {
    const errors = [];
    
    if (!fullname || typeof fullname !== 'string') {
      return [{ field: "fullname", message: "Full name is required" }];
    }

    const trimmedFullname = fullname.trim();
    
    if (trimmedFullname.length < CONSTANTS.USER.FULLNAME.MIN_LENGTH) {
      errors.push({ 
        field: "fullname", 
        message: `Full name must be at least ${CONSTANTS.USER.FULLNAME.MIN_LENGTH} characters long` 
      });
    }

    if (trimmedFullname.length > CONSTANTS.USER.FULLNAME.MAX_LENGTH) {
      errors.push({ 
        field: "fullname", 
        message: `Full name must not exceed ${CONSTANTS.USER.FULLNAME.MAX_LENGTH} characters` 
      });
    }

    return errors;
  }

  // Email validation
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

  // Password validation
  static validatePassword(password) {
    const errors = [];
    
    if (!password || typeof password !== 'string') {
      return [{ field: "password", message: "Password is required" }];
    }

    if (password.length < CONSTANTS.USER.PASSWORD.MIN_LENGTH) {
      errors.push({ 
        field: "password", 
        message: `Password must be at least ${CONSTANTS.USER.PASSWORD.MIN_LENGTH} characters long` 
      });
    }

    // Additional password strength validation bisa ditambahkan disini
    // contoh: uppercase, lowercase, numbers, special characters

    return errors;
  }

  // Validate email verification data
  static validateEmailVerification(data) {
    const errors = [];
    const { email, otp } = data;

    if (!email) {
      errors.push({ field: "email", message: "Email is required" });
    } else {
      const emailErrors = this.validateEmail(email);
      if (emailErrors.length > 0) {
        errors.push(...emailErrors);
      }
    }

    if (!otp) {
      errors.push({ field: "otp", message: "OTP code is required" });
    } else if (typeof otp !== 'string' || otp.trim().length !== CONSTANTS.OTP.LENGTH) {
      errors.push({ 
        field: "otp", 
        message: `OTP code must be ${CONSTANTS.OTP.LENGTH} digits` 
      });
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Validate resend OTP data
  static validateResendOTP(data) {
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

  // Sanitize user input
  static sanitizeUserData(data) {
    const { username, fullname, email, password } = data;
    
    return {
      username: username ? username.trim() : '',
      fullname: fullname ? fullname.trim() : '',
      email: email ? email.trim().toLowerCase() : '',
      password: password || ''
    };
  }
}

module.exports = ValidationService; 