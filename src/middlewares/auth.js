const jwt = require("jsonwebtoken");
const ResponseUtil = require("../utils/response");
const CONSTANTS = require("../config/constants");
const UserService = require("../services/UserService");
const RefreshTokenService = require("../services/RefreshTokenService");

class AuthMiddleware {
  // Verify JWT token middleware with automatic refresh
  static async verifyTokenWithRefresh(req, res, next) {
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

      try {
        // Try to verify current token
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

      } catch (tokenError) {
        // If token is expired, try to refresh automatically
        if (tokenError.name === 'TokenExpiredError') {
          console.log('🔄 Access token expired, attempting automatic refresh...');
          
          const refreshToken = req.cookies.refreshToken;
          
          if (!refreshToken) {
            return ResponseUtil.error(res, "Session expired", 401, [
              { field: "token", message: "Please login again" }
            ]);
          }

          // Try to refresh token
          const refreshResult = await RefreshTokenService.refreshAccessToken(refreshToken);
          
          if (!refreshResult.success) {
            // Clear invalid refresh token cookie
            res.clearCookie('refreshToken', { path: '/api/auth' });
            
            return ResponseUtil.error(res, "Session expired", 401, [
              { field: "token", message: "Please login again" }
            ]);
          }

          // Update refresh token cookie if a new one was generated
          if (refreshResult.refreshToken && refreshResult.refreshToken.token !== refreshToken) {
            res.cookie('refreshToken', refreshResult.refreshToken.token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              maxAge: 7 * 24 * 60 * 60 * 1000,
              path: '/api/auth'
            });
          }

          // Set new access token in response header for frontend to update
          res.setHeader('X-New-Access-Token', refreshResult.accessToken);

          // Attach user data to request
          req.user = {
            userId: refreshResult.user._id,
            username: refreshResult.user.username,
            email: refreshResult.user.email,
            role: refreshResult.user.role,
            emailVerified: refreshResult.user.emailVerified || true,
            isActive: true
          };

          console.log('✅ Token refreshed automatically');
          next();

        } else {
          // Other JWT errors
          if (tokenError.name === 'JsonWebTokenError') {
            return ResponseUtil.error(res, "Invalid token", 401, [
              { field: "token", message: "Token is invalid" }
            ]);
          }

          return ResponseUtil.serverError(res, "Token verification failed", "auth");
        }
      }

    } catch (error) {
      console.error("💥 JWT verification error:", error);
      return ResponseUtil.serverError(res, "Token verification failed", "auth");
    }
  }

  // Original verify token middleware (without auto refresh)
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
      
      if (error.name === 'JsonWebTokenError') {
        return ResponseUtil.error(res, "Invalid token", 401, [
          { field: "token", message: "Token is invalid" }
        ]);
      }
      
      if (error.name === 'TokenExpiredError') {
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