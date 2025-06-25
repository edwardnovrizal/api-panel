// Global utility functions untuk models

class ModelHelpers {
  // Transform email ke lowercase
  static normalizeEmail(email) {
    return email ? email.toLowerCase().trim() : email;
  }

  // Remove sensitive fields dari object
  static excludeFields(obj, fieldsToExclude = ['password']) {
    const sanitized = { ...obj };
    fieldsToExclude.forEach(field => {
      delete sanitized[field];
    });
    return sanitized;
  }

  // Validate email format
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate username format
  static isValidUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  // Generate random string
  static generateRandomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Common pagination helper
  static getPaginationOptions(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return {
      skip: skip,
      limit: parseInt(limit)
    };
  }

  // Common search query builder
  static buildSearchQuery(searchTerm, fields = []) {
    if (!searchTerm || !fields.length) return {};
    
    return {
      $or: fields.map(field => ({
        [field]: { $regex: searchTerm, $options: 'i' }
      }))
    };
  }
}

module.exports = ModelHelpers; 