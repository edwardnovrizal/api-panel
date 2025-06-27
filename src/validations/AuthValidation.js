const BaseValidation = require("./BaseValidation");

class AuthValidation extends BaseValidation {
  // Validate user registration
  static validateRegistration(data) {
    const cleanData = this.cleanData(data);
    
    const validations = [
      this.validateUsername(cleanData.username),
      this.validateFullname(cleanData.fullname),
      this.validateEmail(cleanData.email),
      this.validatePassword(cleanData.password)
    ];

    return this.runValidations(validations);
  }

  // Validate user login
  static validateLogin(data) {
    const cleanData = this.cleanData(data);
    
    // For security, we use generic error messages for login
    const errors = [];
    
    if (!cleanData.username || !cleanData.password) {
      errors.push(this.createError("credentials", "Invalid credentials"));
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Validate email verification
  static validateEmailVerification(data) {
    const cleanData = this.cleanData(data);
    
    const validations = [
      this.validateEmail(cleanData.email),
      this.validateOTP(cleanData.otp)
    ];

    return this.runValidations(validations);
  }

  // Validate resend OTP
  static validateResendOTP(data) {
    const cleanData = this.cleanData(data);
    
    const validations = [
      this.validateEmail(cleanData.email)
    ];

    return this.runValidations(validations);
  }
}

module.exports = AuthValidation; 