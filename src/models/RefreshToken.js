const mongoose = require("mongoose");

// Refresh Token Schema definition
const refreshTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "User ID is required"],
    index: true
  },
  token: {
    type: String,
    required: [true, "Refresh token is required"],
    unique: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: [true, "Expiry date is required"],
    index: { expireAfterSeconds: 0 } // MongoDB TTL index - auto delete expired documents
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    deviceType: String // mobile, desktop, tablet, etc.
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  revokedAt: {
    type: Date
  },
  revokedBy: {
    type: String, // 'user', 'admin', 'system', 'expired'
    enum: ['user', 'admin', 'system', 'expired']
  }
}, {
  versionKey: false // Removes __v field
});

// Database indexes
refreshTokenSchema.index({ userId: 1, isActive: 1 }); // For finding active tokens by user
refreshTokenSchema.index({ createdAt: -1 }); // For sorting by creation date
refreshTokenSchema.index({ lastUsed: -1 }); // For finding recently used tokens

// Instance methods (business logic yang terkait erat dengan document instance)
refreshTokenSchema.methods.updateLastUsed = function() {
  this.lastUsed = new Date();
  return this.save();
};

refreshTokenSchema.methods.revoke = function(revokedBy = 'user') {
  this.isActive = false;
  this.revokedAt = new Date();
  this.revokedBy = revokedBy;
  return this.save();
};

refreshTokenSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

refreshTokenSchema.methods.isValid = function() {
  return this.isActive && !this.isExpired();
};

// Create and export the model
const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

module.exports = RefreshToken; 