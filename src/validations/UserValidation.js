const CONSTANTS = require("../config/constants");

class UserValidation {
  // Validate user profile update
  static validateProfileUpdate(data) {
    const errors = [];
    const { fullname, email } = data;

    // Full name validation (optional but if provided must be valid)
    if (fullname !== undefined) {
      if (fullname === null || fullname === "") {
        errors.push({ field: "fullname", message: "Full name cannot be empty" });
      } else {
        const fullnameErrors = this.validateFullname(fullname);
        if (fullnameErrors.length > 0) {
          errors.push(...fullnameErrors);
        }
      }
    }

    // Email validation (optional but if provided must be valid)
    if (email !== undefined) {
      if (email === null || email === "") {
        errors.push({ field: "email", message: "Email cannot be empty" });
      } else {
        const emailErrors = this.validateEmail(email);
        if (emailErrors.length > 0) {
          errors.push(...emailErrors);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Validate refresh token data
  static validateRefreshToken(data) {
    const errors = [];
    const { refreshToken } = data;

    if (!refreshToken) {
      errors.push({ field: "refreshToken", message: "Refresh token is required" });
    } else if (typeof refreshToken !== 'string' || refreshToken.trim().length === 0) {
      errors.push({ field: "refreshToken", message: "Invalid refresh token format" });
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Validate user query parameters
  static validateUserQuery(query) {
    const errors = [];
    const { page, limit, search, status, role } = query;

    // Page validation
    if (page !== undefined) {
      const pageNum = parseInt(page);
      if (isNaN(pageNum) || pageNum < 1) {
        errors.push({ field: "page", message: "Page must be a positive number" });
      }
    }

    // Limit validation
    if (limit !== undefined) {
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        errors.push({ field: "limit", message: "Limit must be between 1 and 100" });
      }
    }

    // Search validation
    if (search !== undefined && typeof search !== 'string') {
      errors.push({ field: "search", message: "Search must be a string" });
    }

    // Status validation
    if (status !== undefined) {
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(status)) {
        errors.push({ field: "status", message: "Status must be either 'active' or 'inactive'" });
      }
    }

    // Role validation
    if (role !== undefined) {
      const validRoles = ['user', 'admin', 'super_admin'];
      if (!validRoles.includes(role)) {
        errors.push({ field: "role", message: "Role must be 'user', 'admin', or 'super_admin'" });
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Validate user ID parameter
  static validateUserId(userId) {
    const errors = [];

    if (!userId) {
      errors.push({ field: "userId", message: "User ID is required" });
    } else if (typeof userId !== 'string' || userId.trim().length === 0) {
      errors.push({ field: "userId", message: "Invalid user ID format" });
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
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

  // Sanitize user data
  static sanitizeUserData(data) {
    const sanitized = {};

    if (data.fullname !== undefined) {
      sanitized.fullname = data.fullname ? data.fullname.trim() : "";
    }

    if (data.email !== undefined) {
      sanitized.email = data.email ? data.email.trim().toLowerCase() : "";
    }

    if (data.refreshToken !== undefined) {
      sanitized.refreshToken = data.refreshToken ? data.refreshToken.trim() : "";
    }

    return sanitized;
  }

  // Sanitize query parameters
  static sanitizeQueryParams(query) {
    const sanitized = {};

    if (query.page !== undefined) {
      sanitized.page = parseInt(query.page) || 1;
    }

    if (query.limit !== undefined) {
      sanitized.limit = parseInt(query.limit) || 10;
    }

    if (query.search !== undefined) {
      sanitized.search = query.search.trim();
    }

    if (query.status !== undefined) {
      sanitized.status = query.status.toLowerCase();
    }

    if (query.role !== undefined) {
      sanitized.role = query.role.toLowerCase();
    }

    return sanitized;
  }
}

module.exports = UserValidation; 