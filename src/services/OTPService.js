const OTP = require("../models/OTP");
const CONSTANTS = require("../config/constants");

class OTPService {
  // Generate OTP code
  static generateOTPCode() {
    const min = Math.pow(10, CONSTANTS.OTP.LENGTH - 1);
    const max = Math.pow(10, CONSTANTS.OTP.LENGTH) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  // Create and save OTP
  static async createOTP(email, type = CONSTANTS.OTP.TYPES.EMAIL_VERIFICATION) {
    try {
      // Delete existing unused OTPs for this email and type
      await OTP.deleteMany({ 
        email: email.toLowerCase(), 
        type: type, 
        isUsed: false 
      });

      const otpCode = this.generateOTPCode();
      const expiresAt = new Date(Date.now() + CONSTANTS.OTP.EXPIRY_MINUTES * 60 * 1000);

      const newOTP = new OTP({
        email: email.toLowerCase(),
        otp: otpCode,
        type: type,
        expiresAt: expiresAt
      });

      await newOTP.save();
      
      console.log(`🔐 OTP created for ${email}: ${otpCode} (expires in ${CONSTANTS.OTP.EXPIRY_MINUTES} minutes)`);
      
      return {
        success: true,
        otpCode: otpCode,
        expiresAt: expiresAt,
        expiryMinutes: CONSTANTS.OTP.EXPIRY_MINUTES
      };

    } catch (error) {
      console.error("💥 Failed to create OTP:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify OTP code
  static async verifyOTP(email, otpCode, type = CONSTANTS.OTP.TYPES.EMAIL_VERIFICATION) {
    try {
      const otpRecord = await OTP.findOne({
        email: email.toLowerCase(),
        otp: otpCode.toString(),
        type: type,
        isUsed: false,
        expiresAt: { $gt: new Date() }
      });

      if (!otpRecord) {
        console.log(`❌ Invalid OTP attempt for ${email}: ${otpCode}`);
        return { 
          success: false, 
          message: CONSTANTS.MESSAGES.ERROR.INVALID_OTP,
          field: "otp"
        };
      }

      // Increment attempts
      otpRecord.attempts += 1;
      
      // Check max attempts
      if (otpRecord.attempts > CONSTANTS.OTP.MAX_ATTEMPTS) {
        otpRecord.isUsed = true;
        await otpRecord.save();
        
        console.log(`❌ Max attempts exceeded for ${email}`);
        return { 
          success: false, 
          message: CONSTANTS.MESSAGES.ERROR.MAX_ATTEMPTS_EXCEEDED,
          field: "otp"
        };
      }

      // Mark as used
      otpRecord.isUsed = true;
      await otpRecord.save();

      console.log(`✅ OTP verified successfully for ${email}`);
      return { 
        success: true, 
        message: "OTP verified successfully" 
      };

    } catch (error) {
      console.error("💥 OTP verification error:", error);
      return {
        success: false,
        message: "OTP verification failed",
        error: error.message
      };
    }
  }

  // Check if valid OTP exists
  static async hasValidOTP(email, type = CONSTANTS.OTP.TYPES.EMAIL_VERIFICATION) {
    try {
      const otpRecord = await OTP.findOne({
        email: email.toLowerCase(),
        type: type,
        isUsed: false,
        expiresAt: { $gt: new Date() }
      });

      return otpRecord !== null;
    } catch (error) {
      console.error("💥 Error checking valid OTP:", error);
      return false;
    }
  }

  // Get OTP info (for debugging/admin purposes)
  static async getOTPInfo(email, type = CONSTANTS.OTP.TYPES.EMAIL_VERIFICATION) {
    try {
      const otpRecord = await OTP.findOne({
        email: email.toLowerCase(),
        type: type,
        isUsed: false,
        expiresAt: { $gt: new Date() }
      }).select('otp attempts expiresAt createdAt');

      if (!otpRecord) {
        return { exists: false };
      }

      const timeLeft = Math.max(0, Math.floor((otpRecord.expiresAt - new Date()) / 1000 / 60));
      
      return {
        exists: true,
        attempts: otpRecord.attempts,
        maxAttempts: CONSTANTS.OTP.MAX_ATTEMPTS,
        timeLeftMinutes: timeLeft,
        createdAt: otpRecord.createdAt,
        expiresAt: otpRecord.expiresAt
      };
    } catch (error) {
      console.error("💥 Error getting OTP info:", error);
      return { exists: false, error: error.message };
    }
  }

  // Clean expired OTPs (maintenance function)
  static async cleanupExpiredOTPs() {
    try {
      const result = await OTP.deleteMany({
        expiresAt: { $lt: new Date() }
      });

      console.log(`🧹 Cleaned up ${result.deletedCount} expired OTPs`);
      return {
        success: true,
        deletedCount: result.deletedCount
      };
    } catch (error) {
      console.error("💥 Error cleaning up OTPs:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Invalidate all OTPs for user (useful for security)
  static async invalidateUserOTPs(email, type = null) {
    try {
      const query = { 
        email: email.toLowerCase(),
        isUsed: false 
      };

      if (type) {
        query.type = type;
      }

      const result = await OTP.updateMany(query, { isUsed: true });

      console.log(`🔒 Invalidated ${result.modifiedCount} OTPs for ${email}`);
      return {
        success: true,
        invalidatedCount: result.modifiedCount
      };
    } catch (error) {
      console.error("💥 Error invalidating OTPs:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = OTPService; 