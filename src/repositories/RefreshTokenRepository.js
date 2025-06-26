const RefreshToken = require("../models/RefreshToken");
const crypto = require("crypto");

class RefreshTokenRepository {
  // Generate secure token
  static generateToken() {
    return crypto.randomBytes(40).toString('hex');
  }

  // Find valid token with user data
  static async findValidToken(token) {
    return await RefreshToken.findOne({ 
      token: token,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).populate('userId', 'username email role isActive emailVerified');
  }

  // Create new refresh token
  static async createToken(userId, deviceInfo = {}, expiryDays = 30) {
    const token = this.generateToken();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    const refreshToken = new RefreshToken({
      userId: userId,
      token: token,
      expiresAt: expiryDate,
      deviceInfo: deviceInfo
    });

    return await refreshToken.save();
  }

  // Find token by token string
  static async findByToken(token) {
    return await RefreshToken.findOne({ token: token });
  }

  // Revoke single token
  static async revokeToken(token, revokedBy = 'user') {
    return await RefreshToken.findOneAndUpdate(
      { token: token },
      { 
        isActive: false,
        revokedAt: new Date(),
        revokedBy: revokedBy
      },
      { new: true }
    );
  }

  // Revoke all user tokens
  static async revokeAllUserTokens(userId, revokedBy = 'user') {
    return await RefreshToken.updateMany(
      { userId: userId, isActive: true },
      { 
        isActive: false,
        revokedAt: new Date(),
        revokedBy: revokedBy
      }
    );
  }

  // Get user's active tokens
  static async getUserActiveTokens(userId) {
    return await RefreshToken.find({
      userId: userId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).sort({ lastUsed: -1 });
  }

  // Get user's all tokens (active and inactive)
  static async getUserAllTokens(userId) {
    return await RefreshToken.find({ userId: userId })
      .sort({ createdAt: -1 });
  }

  // Cleanup expired tokens
  static async cleanupExpired() {
    return await RefreshToken.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { isActive: false, revokedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // Remove revoked tokens older than 7 days
      ]
    });
  }

  // Count active tokens by user
  static async countActiveTokensByUser(userId) {
    return await RefreshToken.countDocuments({
      userId: userId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
  }

  // Find tokens by device type
  static async findByDeviceType(userId, deviceType) {
    return await RefreshToken.find({
      userId: userId,
      'deviceInfo.deviceType': deviceType,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).sort({ lastUsed: -1 });
  }

  // Get token statistics
  static async getTokenStats() {
    const stats = await RefreshToken.aggregate([
      {
        $group: {
          _id: null,
          totalTokens: { $sum: 1 },
          activeTokens: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$isActive', true] },
                    { $gt: ['$expiresAt', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          },
          expiredTokens: {
            $sum: {
              $cond: [{ $lt: ['$expiresAt', new Date()] }, 1, 0]
            }
          },
          revokedTokens: {
            $sum: {
              $cond: [{ $eq: ['$isActive', false] }, 1, 0]
            }
          }
        }
      }
    ]);

    return stats[0] || {
      totalTokens: 0,
      activeTokens: 0,
      expiredTokens: 0,
      revokedTokens: 0
    };
  }

  // Find tokens expiring soon (within hours)
  static async findExpiringSoon(hours = 24) {
    const expiryThreshold = new Date(Date.now() + hours * 60 * 60 * 1000);
    
    return await RefreshToken.find({
      isActive: true,
      expiresAt: { 
        $gt: new Date(),
        $lt: expiryThreshold
      }
    }).populate('userId', 'username email');
  }

  // Bulk revoke tokens
  static async bulkRevokeTokens(tokenIds, revokedBy = 'admin') {
    return await RefreshToken.updateMany(
      { _id: { $in: tokenIds } },
      {
        isActive: false,
        revokedAt: new Date(),
        revokedBy: revokedBy
      }
    );
  }
}

module.exports = RefreshTokenRepository; 