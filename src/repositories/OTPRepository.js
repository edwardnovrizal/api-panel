const OTP = require("../models/OTP");

class OTPRepository {
  // Create new OTP
  static async create(otpData) {
    const otp = new OTP(otpData);
    return await otp.save();
  }

  // Find OTP by email and type
  static async findByEmailAndType(email, type) {
    return await OTP.findOne({ 
      email: email.toLowerCase(),
      type: type,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });
  }

  // Find OTP by email, code, and type
  static async findByEmailCodeAndType(email, otpCode, type) {
    return await OTP.findOne({
      email: email.toLowerCase(),
      otp: otpCode,
      type: type,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });
  }

  // Mark OTP as used
  static async markAsUsed(otpId) {
    return await OTP.findByIdAndUpdate(
      otpId,
      { 
        isUsed: true,
        usedAt: new Date()
      },
      { new: true }
    );
  }

  // Delete OTP by ID
  static async deleteById(otpId) {
    return await OTP.findByIdAndDelete(otpId);
  }

  // Delete all OTPs for email and type
  static async deleteByEmailAndType(email, type) {
    return await OTP.deleteMany({
      email: email.toLowerCase(),
      type: type,
      isUsed: false
    });
  }

  // Count attempts for email and type within time period
  static async countAttempts(email, type, timeWindow = 60) {
    const timeThreshold = new Date(Date.now() - timeWindow * 60 * 1000);
    
    return await OTP.countDocuments({
      email: email.toLowerCase(),
      type: type,
      createdAt: { $gte: timeThreshold }
    });
  }

  // Find expired OTPs
  static async findExpired() {
    return await OTP.find({
      expiresAt: { $lt: new Date() }
    });
  }

  // Cleanup expired OTPs
  static async cleanupExpired() {
    return await OTP.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { isUsed: true, usedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Remove used OTPs older than 24 hours
      ]
    });
  }

  // Get OTP statistics
  static async getOTPStats() {
    const stats = await OTP.aggregate([
      {
        $group: {
          _id: '$type',
          totalOTPs: { $sum: 1 },
          usedOTPs: {
            $sum: { $cond: [{ $eq: ['$isUsed', true] }, 1, 0] }
          },
          expiredOTPs: {
            $sum: { $cond: [{ $lt: ['$expiresAt', new Date()] }, 1, 0] }
          },
          activeOTPs: {
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

    return stats;
  }

  // Find OTPs by date range
  static async findByDateRange(startDate, endDate) {
    return await OTP.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ createdAt: -1 });
  }

  // Bulk delete OTPs
  static async bulkDelete(filter) {
    return await OTP.deleteMany(filter);
  }
}

module.exports = OTPRepository; 