// This service is deprecated. Use specific validation classes instead:
// - AuthValidation for authentication-related validations
// - PasswordValidation for password-related validations  
// - UserValidation for user-related validations

const AuthValidation = require("../validations/AuthValidation");
const PasswordValidation = require("../validations/PasswordValidation");
const UserValidation = require("../validations/UserValidation");

class ValidationService {
  // Backward compatibility methods - delegate to new validation classes
  static validateRegistrationData(data) {
    return AuthValidation.validateRegistrationData(data);
  }

  static validateLoginData(data) {
    return AuthValidation.validateLoginData(data);
  }

  static validateEmailVerification(data) {
    return AuthValidation.validateEmailVerification(data);
  }

  static validateResendOTP(data) {
    return AuthValidation.validateResendOTP(data);
  }

  static validateForgotPassword(data) {
    return PasswordValidation.validateForgotPassword(data);
  }

  static validateResetPassword(data) {
    return PasswordValidation.validateResetPassword(data);
  }

  static validateChangePassword(data) {
    return PasswordValidation.validateChangePassword(data);
  }

  static validateUsername(username) {
    return AuthValidation.validateUsername(username);
  }

  static validateFullname(fullname) {
    return AuthValidation.validateFullname(fullname);
  }

  static validateEmail(email) {
    return AuthValidation.validateEmail(email);
  }

  static validatePassword(password) {
    return AuthValidation.validatePassword(password);
  }

  static sanitizeUserData(data) {
    return AuthValidation.sanitizeUserData(data);
  }
}

module.exports = ValidationService; 