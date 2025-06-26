class ResponseUtil {
  // Success response
  static success(res, message = "Operation successful", data = null, code = 200) {
    return res.status(code).json({
      success: true,
      code: code,
      message: message,
      data: data
    });
  }

  // Base error response - SEMUA error HARUS punya field 'error' sebagai array
  static error(res, message = "Operation failed", code = 400, errors = null) {
    const response = {
      success: false,
      code: code,
      message: message,
      error: []
    };

    // Jika errors adalah array, gunakan langsung
    if (Array.isArray(errors)) {
      response.error = errors;
    } 
    // Jika errors adalah string, convert ke array format
    else if (errors) {
      response.error = [{ field: "general", message: errors }];
    }
    // Jika tidak ada errors, buat dari message
    else {
      response.error = [{ field: "general", message: message }];
    }

    return res.status(code).json(response);
  }

  // Validation error response (sudah dalam format array)
  static validationError(res, errors, message = "Validation failed") {
    return this.error(res, message, 400, errors);
  }

  // Not found error
  static notFound(res, message = "Resource not found", field = "resource") {
    const errors = [{ field: field, message: message }];
    return this.error(res, message, 404, errors);
  }

  // Unauthorized error
  static unauthorized(res, message = "Unauthorized access", field = "auth") {
    const errors = [{ field: field, message: message }];
    return this.error(res, message, 401, errors);
  }

  // Forbidden error
  static forbidden(res, message = "Access forbidden", field = "permission") {
    const errors = [{ field: field, message: message }];
    return this.error(res, message, 403, errors);
  }

  // Conflict error (untuk duplicate data)
  static conflict(res, message = "Resource already exists", field = "duplicate") {
    const errors = [{ field: field, message: message }];
    return this.error(res, message, 409, errors);
  }

  // Internal server error
  static serverError(res, message = "Internal server error", field = "server") {
    const errors = [{ field: field, message: message }];
    return this.error(res, message, 500, errors);
  }
}

module.exports = ResponseUtil; 