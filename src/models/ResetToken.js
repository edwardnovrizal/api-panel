const mongoose = require("mongoose");
const CONSTANTS = require("../config/constants");

// Reset Token Schema definition
const resetTokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"]
  },
  token: {
    type: String,
    required: [true, "Reset token is required"],
    unique: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: [true, "Expiry date is required"],
    index: { expireAfterSeconds: 0 } // MongoDB TTL index - auto delete expired documents
  },
  used: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  usedAt: {
    type: Date
  }
}, {
  versionKey: false // Removes __v field
});

// Indexes
resetTokenSchema.index({ email: 1, createdAt: -1 }); // For finding user's recent tokens
resetTokenSchema.index({ used: 1 }); // For filtering unused tokens

// Static methods
resetTokenSchema.statics.findValidToken = function(token) {
  return this.findOne({ 
    token: token,
    used: false,
    expiresAt: { $gt: new Date() }
  });
};

resetTokenSchema.statics.markAsUsed = function(token) {
  return this.findOneAndUpdate(
    { token: token },
    { 
      used: true, 
      usedAt: new Date() 
    },
    { new: true }
  );
};

resetTokenSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { used: true }
    ]
  });
};

// Create and export the model
const ResetToken = mongoose.model("ResetToken", resetTokenSchema);

module.exports = ResetToken; 