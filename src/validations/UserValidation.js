const BaseValidation = require("./BaseValidation");

class UserValidation extends BaseValidation {
  // Validate profile update
  static validateProfileUpdate(data) {
    const cleanData = this.cleanData(data);
    const validations = [];

    // Only validate fields that are provided
    if (cleanData.fullname !== undefined) {
      validations.push(this.validateFullname(cleanData.fullname));
    }

    if (cleanData.email !== undefined) {
      validations.push(this.validateEmail(cleanData.email));
    }

    return this.runValidations(validations);
  }
}

module.exports = UserValidation; 