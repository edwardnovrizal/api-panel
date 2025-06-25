const mongoose = require("mongoose");
const CONSTANTS = require("../config/constants");

// OTP Schema untuk email verification
const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: [true, "OTP code is required"],
    length: CONSTANTS.OTP.LENGTH
  },
  type: {
    type: String,
    enum: {
      values: Object.values(CONSTANTS.OTP.TYPES),
      message: `Type must be one of: ${Object.values(CONSTANTS.OTP.TYPES).join(', ')}`
    },
    required: [true, "OTP type is required"]
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: [CONSTANTS.OTP.MAX_ATTEMPTS, `Maximum ${CONSTANTS.OTP.MAX_ATTEMPTS} verification attempts allowed`]
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index - auto delete after expiry
  }
}, {
  timestamps: true,
  versionKey: false
});

// Index untuk performance
otpSchema.index({ email: 1, type: 1 });
otpSchema.index({ otp: 1 });

// Basic static methods (complex logic moved to OTPService)
otpSchema.statics.findValidOTP = function(email, type = CONSTANTS.OTP.TYPES.EMAIL_VERIFICATION) {
  return this.findOne({
    email: email.toLowerCase(),
    type: type,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });
};

const OTP = mongoose.model("OTP", otpSchema);

module.exports = OTP; 