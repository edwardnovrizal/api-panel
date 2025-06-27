const jwt = require("jsonwebtoken");
const RefreshTokenRepository = require("../repositories/RefreshTokenRepository");
const UserRepository = require("../repositories/UserRepository");
const CONSTANTS = require("../config/constants");

class RefreshTokenService {
  // Generate refresh token for user
  static async generateRefreshToken(userId, deviceInfo = {}, revokeExisting = true) {
    try {
      // Revoke existing active tokens for this user (single session mode)
      if (revokeExisting) {
        console.log(`🔄 Revoking existing tokens for user: ${userId}`);
        await RefreshTokenRepository.revokeAllUserTokens(userId, 'system');
      }

      // Create new refresh token
      const refreshToken = await RefreshTokenRepository.createToken(userId, deviceInfo);
      console.log(`✅ New refresh token generated for user: ${userId}`);

      return {
        success: true,
        refreshToken: refreshToken.token,
        expiresAt: refreshToken.expiresAt,
        tokenId: refreshToken._id
      };

    } catch (error) {
      console.error("💥 Generate refresh token error:", error);
      return {
        success: false,
        message: "Failed to generate refresh token",
        error: error.message
      };
    }
  }

  // Generate new access token using refresh token
  static async refreshAccessToken(refreshTokenString) {
    try {
      // Validate input
      if (!refreshTokenString || typeof refreshTokenString !== 'string') {
        return {
          success: false,
          message: "Invalid refresh token format",
          code: 'INVALID_FORMAT'
        };
      }

      // Find refresh token in database
      const refreshToken = await RefreshTokenRepository.findValidToken(refreshTokenString);
      
      if (!refreshToken) {
        // Check if token exists at all (could be expired or revoked)
        const existingToken = await RefreshTokenRepository.findByToken(refreshTokenString);
        
        if (existingToken) {
          if (!existingToken.isActive) {
            return {
              success: false,
              message: "Refresh token has been revoked",
              code: 'TOKEN_REVOKED'
            };
          }
          
          if (existingToken.expiresAt < new Date()) {
            return {
              success: false,
              message: "Refresh token has expired",
              code: 'TOKEN_EXPIRED'
            };
          }
        }
        
        return {
          success: false,
          message: "Invalid or expired refresh token",
          code: 'INVALID_REFRESH_TOKEN'
        };
      }

      // Check if user exists and is populated
      if (!refreshToken.userId) {
        return {
          success: false,
          message: "User associated with token not found",
          code: 'USER_NOT_FOUND'
        };
      }

      // Check if user is still active
      if (!refreshToken.userId.isActive) {
        // Revoke token if user is inactive
        await RefreshTokenRepository.revokeToken(refreshTokenString, 'system');
        return {
          success: false,
          message: "User account is inactive",
          code: 'USER_INACTIVE'
        };
      }

      // Check if user email is verified
      if (!refreshToken.userId.emailVerified) {
        return {
          success: false,
          message: "Email verification required",
          code: 'EMAIL_NOT_VERIFIED'
        };
      }

      // Update last used timestamp
      await refreshToken.updateLastUsed();

      // Generate new access token
      const tokenPayload = {
        userId: refreshToken.userId._id,
        username: refreshToken.userId.username,
        email: refreshToken.userId.email,
        role: refreshToken.userId.role
      };

      const accessToken = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET,
        {
          expiresIn: CONSTANTS.JWT.EXPIRES_IN,
          algorithm: CONSTANTS.JWT.ALGORITHM
        }
      );

      return {
        success: true,
        accessToken: accessToken,
        tokenType: "Bearer",
        expiresIn: CONSTANTS.JWT.EXPIRES_IN,
        user: {
          _id: refreshToken.userId._id,
          username: refreshToken.userId.username,
          email: refreshToken.userId.email,
          role: refreshToken.userId.role,
          emailVerified: refreshToken.userId.emailVerified,
          isActive: refreshToken.userId.isActive
        },
        refreshToken: {
          token: refreshToken.token,
          expiresAt: refreshToken.expiresAt,
          lastUsed: refreshToken.lastUsed
        }
      };

    } catch (error) {
      console.error("💥 Refresh access token error:", error);
      return {
        success: false,
        message: "Failed to refresh access token",
        code: 'INTERNAL_ERROR',
        error: error.message
      };
    }
  }

  // Revoke refresh token
  static async revokeRefreshToken(refreshTokenString, revokedBy = 'user') {
    try {
      const result = await RefreshTokenRepository.revokeToken(refreshTokenString, revokedBy);
      
      if (!result) {
        return {
          success: false,
          message: "Refresh token not found"
        };
      }

      return {
        success: true,
        message: "Refresh token revoked successfully",
        revokedAt: result.revokedAt,
        revokedBy: result.revokedBy
      };

    } catch (error) {
      console.error("💥 Revoke refresh token error:", error);
      return {
        success: false,
        message: "Failed to revoke refresh token",
        error: error.message
      };
    }
  }

  // Revoke all user refresh tokens (logout from all devices)
  static async revokeAllUserTokens(userId, revokedBy = 'user') {
    try {
      const result = await RefreshTokenRepository.revokeAllUserTokens(userId, revokedBy);
      
      return {
        success: true,
        message: "All refresh tokens revoked successfully",
        revokedCount: result.modifiedCount,
        revokedBy: revokedBy
      };

    } catch (error) {
      console.error("💥 Revoke all user tokens error:", error);
      return {
        success: false,
        message: "Failed to revoke user tokens",
        error: error.message
      };
    }
  }

  // Get user active sessions
  static async getUserActiveSessions(userId) {
    try {
      const tokens = await RefreshTokenRepository.getUserActiveTokens(userId);
      
      const sessions = tokens.map(token => ({
        tokenId: token._id,
        deviceInfo: token.deviceInfo,
        createdAt: token.createdAt,
        lastUsed: token.lastUsed,
        expiresAt: token.expiresAt,
        isCurrentDevice: false // This should be determined by comparing with current request
      }));

      return {
        success: true,
        sessions: sessions,
        totalSessions: sessions.length
      };

    } catch (error) {
      console.error("💥 Get user active sessions error:", error);
      return {
        success: false,
        message: "Failed to get user sessions",
        error: error.message
      };
    }
  }

  // Revoke specific session
  static async revokeSession(userId, tokenId, revokedBy = 'user') {
    try {
      const refreshToken = await RefreshTokenRepository.findByToken(tokenId);

      if (!refreshToken || refreshToken.userId.toString() !== userId || !refreshToken.isActive) {
        return {
          success: false,
          message: "Session not found"
        };
      }

      await refreshToken.revoke(revokedBy);

      return {
        success: true,
        message: "Session revoked successfully",
        sessionId: tokenId
      };

    } catch (error) {
      console.error("💥 Revoke session error:", error);
      return {
        success: false,
        message: "Failed to revoke session",
        error: error.message
      };
    }
  }

  // Cleanup expired tokens (utility method)
  static async cleanupExpiredTokens() {
    try {
      const result = await RefreshTokenRepository.cleanupExpired();
      console.log(`🧹 Cleaned up ${result.deletedCount} expired refresh tokens`);
      return result;
    } catch (error) {
      console.error("💥 Cleanup expired tokens error:", error);
      return null;
    }
  }

  // Debug token status (for development/troubleshooting)
  static async debugTokenStatus(refreshTokenString) {
    try {
      if (!refreshTokenString) {
        return { error: "No token provided" };
      }

      // Find token (including inactive/expired)
      const token = await RefreshTokenRepository.findByToken(refreshTokenString);
      
      if (!token) {
        return { error: "Token not found in database" };
      }

      const now = new Date();
      const status = {
        exists: true,
        isActive: token.isActive,
        isExpired: token.expiresAt < now,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
        lastUsed: token.lastUsed,
        revokedAt: token.revokedAt,
        revokedBy: token.revokedBy,
        deviceInfo: token.deviceInfo,
        timeUntilExpiry: token.expiresAt > now ? Math.floor((token.expiresAt - now) / 1000 / 60) + ' minutes' : 'expired'
      };

      // Check user status if token is linked
      if (token.userId) {
        const user = await RefreshTokenRepository.findValidToken(refreshTokenString);
        status.userExists = !!user;
        
        if (user && user.userId) {
          status.userActive = user.userId.isActive;
          status.userEmailVerified = user.userId.emailVerified;
          status.username = user.userId.username;
          status.userEmail = user.userId.email;
        }
      }

      return status;
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get device info from request
  static getDeviceInfo(req) {
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
    
    // Simple device type detection
    let deviceType = 'desktop';
    if (userAgent.includes('Mobile')) {
      deviceType = 'mobile';
    } else if (userAgent.includes('Tablet')) {
      deviceType = 'tablet';
    }

    return {
      userAgent: userAgent,
      ipAddress: ipAddress,
      deviceType: deviceType
    };
  }
}

module.exports = RefreshTokenService; 