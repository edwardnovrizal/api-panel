const mongoose = require("mongoose");
const ModelHelpers = require("../utils/modelHelpers");
const CONSTANTS = require("../config/constants");

// User Schema definition
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
    minlength: [CONSTANTS.USER.USERNAME.MIN_LENGTH, `Username must be at least ${CONSTANTS.USER.USERNAME.MIN_LENGTH} characters long`],
    maxlength: [CONSTANTS.USER.USERNAME.MAX_LENGTH, `Username must not exceed ${CONSTANTS.USER.USERNAME.MAX_LENGTH} characters`],
    match: [CONSTANTS.USER.USERNAME.PATTERN, "Username can only contain letters, numbers, and underscores"],
    lowercase: false
  },
  fullname: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
    minlength: [CONSTANTS.USER.FULLNAME.MIN_LENGTH, `Full name must be at least ${CONSTANTS.USER.FULLNAME.MIN_LENGTH} characters long`],
    maxlength: [CONSTANTS.USER.FULLNAME.MAX_LENGTH, `Full name must not exceed ${CONSTANTS.USER.FULLNAME.MAX_LENGTH} characters`]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"]
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [CONSTANTS.USER.PASSWORD.MIN_LENGTH, `Password must be at least ${CONSTANTS.USER.PASSWORD.MIN_LENGTH} characters long`],
    select: false // By default, password won't be included in queries
  },
  role: {
    type: String,
    enum: {
      values: Object.values(CONSTANTS.USER.ROLES),
      message: `Role must be one of: ${Object.values(CONSTANTS.USER.ROLES).join(', ')}`
    },
    default: CONSTANTS.USER.DEFAULT_ROLE
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false // User harus verify email dulu
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  versionKey: false // Removes __v field
});

// Database indexes
userSchema.index({ createdAt: -1 }); // Index untuk sorting by creation date
userSchema.index({ role: 1 }); // Index untuk filtering by role
userSchema.index({ isActive: 1 }); // Index untuk filtering by status

// Instance method untuk clean JSON output (essential untuk security)
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  // Remove password field dari JSON output
  delete user.password;
  return user;
};

// Instance method untuk checking permissions (business logic yang terkait erat dengan model)
userSchema.methods.hasRole = function(role) {
  return this.role === role;
};

userSchema.methods.isAdmin = function() {
  return this.role === CONSTANTS.USER.ROLES.ADMIN || this.role === CONSTANTS.USER.ROLES.SUPER_ADMIN;
};

userSchema.methods.isSuperAdmin = function() {
  return this.role === CONSTANTS.USER.ROLES.SUPER_ADMIN;
};

// Pre-save middleware untuk data transformation (harus di model)
userSchema.pre("save", function(next) {
  // Ensure email is lowercase (extra safety)
  if (this.email) {
    this.email = ModelHelpers.normalizeEmail(this.email);
  }
  next();
});

// Create and export the model
const User = mongoose.model("User", userSchema);

module.exports = User; 