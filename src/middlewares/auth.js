const jwt = require("jsonwebtoken");
const ResponseUtil = require("../utils/response");
const CONSTANTS = require("../config/constants");
const UserService = require("../services/UserService");

class AuthMiddleware {
  // Verify JWT token middleware
  static async verifyToken(req, res, next) {
    try {
      // Get token from header
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return ResponseUtil.error(res, "Access token is required", 401, [
          { field: "authorization", message: "Authorization header is required" }
        ]);
      }

      // Check Bearer format
      const tokenParts = authHeader.split(' ');
      if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return ResponseUtil.error(res, "Invalid token format", 401, [
          { field: "authorization", message: "Token must be in 'Bearer <token>' format" }
        ]);
      }

      const token = tokenParts[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user data from database
      const user = await UserService.getUserById(decoded.userId);
      
      if (!user) {
        return ResponseUtil.error(res, "User not found", 401, [
          { field: "token", message: "Invalid token - user not found" }
        ]);
      }

      // Check if user is still active
      if (!user.isActive) {
        return ResponseUtil.error(res, "Account is inactive", 403, [
          { field: "account", message: "Account has been deactivated" }
        ]);
      }
    
      

      // Attach user data to request
      req.user = {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        isActive: user.isActive
      };

      next();

    } catch (error) {
      console.error("💥 JWT verification error:", error);
      console.error("💥 Error name:", error.name);
      console.error("💥 Error message:", error.message);
      
      if (error.name === 'JsonWebTokenError') {
        return ResponseUtil.error(res, "Invalid token", 401, [
          { field: "token", message: "Token is invalid" }
        ]);
      }
      
      if (error.name === 'TokenExpiredError') {
        console.log("🚨 TokenExpiredError caught - returning 401");
        return ResponseUtil.error(res, "Token expired", 401, [
          { field: "token", message: "Token has expired" }
        ]);
      }

      return ResponseUtil.serverError(res, "Token verification failed", "auth");
    }
  }

  // Check if user has required role
  static requireRole(...allowedRoles) {
    return (req, res, next) => {
      try {
        // Make sure user is authenticated first
        if (!req.user) {
          return ResponseUtil.error(res, "Authentication required", 401, [
            { field: "authentication", message: "Please login first" }
          ]);
        }

        // Check if user role is allowed
        if (!allowedRoles.includes(req.user.role)) {
          return ResponseUtil.error(res, "Insufficient permissions", 403, [
            { field: "permission", message: `Access denied. Required role: ${allowedRoles.join(' or ')}` }
          ]);
        }

        next();

      } catch (error) {
        console.error("💥 Role check error:", error);
        return ResponseUtil.serverError(res, "Permission check failed", "auth");
      }
    };
  }

  // Check if user is admin
  static requireAdmin(req, res, next) {
    return AuthMiddleware.requireRole(CONSTANTS.USER.ROLES.ADMIN, CONSTANTS.USER.ROLES.SUPER_ADMIN)(req, res, next);
  }

  // Check if user is super admin
  static requireSuperAdmin(req, res, next) {
    return AuthMiddleware.requireRole(CONSTANTS.USER.ROLES.SUPER_ADMIN)(req, res, next);
  }

  // Optional authentication - attach user if token exists but don't require it
  static async optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        // No token provided, continue without user
        req.user = null;
        return next();
      }

      const tokenParts = authHeader.split(' ');
      if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        // Invalid format, continue without user
        req.user = null;
        return next();
      }

      const token = tokenParts[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await UserService.getUserById(decoded.userId);
      if (user && user.isActive) {
        req.user = {
          userId: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          isActive: user.isActive
        };
      } else {
        req.user = null;
      }

      next();

    } catch (error) {
      // If token verification fails, continue without user
      req.user = null;
      next();
    }
  }
}

module.exports = AuthMiddleware; 