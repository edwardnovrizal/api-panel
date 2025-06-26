const ResetToken = require("../models/ResetToken");
const crypto = require("crypto");

class ResetTokenRepository {
  // Generate secure reset token
  static generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Create new reset token
  static async create(email, expiryMinutes = 15) {
    const token = this.generateToken();
    const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000);

    const resetToken = new ResetToken({
      email: email.toLowerCase(),
      token: token,
      expiresAt: expiryDate
    });

    return await resetToken.save();
  }

  // Find valid reset token
  static async findValidToken(token) {
    return await ResetToken.findOne({
      token: token,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });
  }

  // Find reset token by token string
  static async findByToken(token) {
    return await ResetToken.findOne({ token: token });
  }

  // Find reset tokens by email
  static async findByEmail(email) {
    return await ResetToken.find({ 
      email: email.toLowerCase() 
    }).sort({ createdAt: -1 });
  }

  // Mark token as used
  static async markAsUsed(tokenId) {
    return await ResetToken.findByIdAndUpdate(
      tokenId,
      { 
        isUsed: true,
        usedAt: new Date()
      },
      { new: true }
    );
  }

  // Delete token by ID
  static async deleteById(tokenId) {
    return await ResetToken.findByIdAndDelete(tokenId);
  }

  // Delete all tokens for email
  static async deleteByEmail(email) {
    return await ResetToken.deleteMany({
      email: email.toLowerCase()
    });
  }

  // Count active tokens for email
  static async countActiveTokensByEmail(email) {
    return await ResetToken.countDocuments({
      email: email.toLowerCase(),
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });
  }

  // Find expired tokens
  static async findExpired() {
    return await ResetToken.find({
      expiresAt: { $lt: new Date() }
    });
  }

  // Cleanup expired tokens
  static async cleanupExpired() {
    return await ResetToken.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { isUsed: true, usedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Remove used tokens older than 24 hours
      ]
    });
  }

  // Get reset token statistics
  static async getResetTokenStats() {
    const stats = await ResetToken.aggregate([
      {
        $group: {
          _id: null,
          totalTokens: { $sum: 1 },
          usedTokens: {
            $sum: { $cond: [{ $eq: ['$isUsed', true] }, 1, 0] }
          },
          expiredTokens: {
            $sum: { $cond: [{ $lt: ['$expiresAt', new Date()] }, 1, 0] }
          },
          activeTokens: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isUsed', false] },
                    { $gt: ['$expiresAt', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    return stats[0] || {
      totalTokens: 0,
      usedTokens: 0,
      expiredTokens: 0,
      activeTokens: 0
    };
  }

  // Find tokens by date range
  static async findByDateRange(startDate, endDate) {
    return await ResetToken.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ createdAt: -1 });
  }

  // Find tokens expiring soon (within minutes)
  static async findExpiringSoon(minutes = 5) {
    const expiryThreshold = new Date(Date.now() + minutes * 60 * 1000);
    
    return await ResetToken.find({
      isUsed: false,
      expiresAt: { 
        $gt: new Date(),
        $lt: expiryThreshold
      }
    });
  }

  // Bulk operations
  static async bulkMarkAsUsed(tokenIds) {
    return await ResetToken.updateMany(
      { _id: { $in: tokenIds } },
      { 
        isUsed: true,
        usedAt: new Date()
      }
    );
  }

  static async bulkDelete(filter) {
    return await ResetToken.deleteMany(filter);
  }
}

module.exports = ResetTokenRepository; 