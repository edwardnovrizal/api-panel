const User = require("../models/User");
const ModelHelpers = require("../utils/modelHelpers");
const bcrypt = require("bcryptjs");
const CONSTANTS = require("../config/constants");

class UserService {
  // Find user by email
  static async findByEmail(email) {
    const normalizedEmail = ModelHelpers.normalizeEmail(email);
    return await User.findOne({ email: normalizedEmail });
  }

  // Find user by username
  static async findByUsername(username) {
    return await User.findOne({ username: username });
  }

  // Find user by email with password (untuk login)
  static async findByEmailWithPassword(email) {
    const normalizedEmail = ModelHelpers.normalizeEmail(email);
    return await User.findOne({ email: normalizedEmail }).select("+password");
  }

  // Check if email exists
  static async emailExists(email) {
    const user = await this.findByEmail(email);
    return user !== null;
  }

  // Check if username exists
  static async usernameExists(username) {
    const user = await this.findByUsername(username);
    return user !== null;
  }

  // Create new user
  static async createUser(userData) {
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, CONSTANTS.USER.PASSWORD.SALT_ROUNDS);

    // Prepare user data
    const userToCreate = {
      username: userData.username.trim(),
      fullname: userData.fullname.trim(),
      email: ModelHelpers.normalizeEmail(userData.email),
      password: hashedPassword,
      role: userData.role || CONSTANTS.USER.DEFAULT_ROLE
    };

    const newUser = new User(userToCreate);
    return await newUser.save();
  }

  // Get user by ID (without password)
  static async getUserById(userId) {
    return await User.findById(userId);
  }

  // Update user
  static async updateUser(userId, updateData) {
    // Remove sensitive fields dari update
    const sanitizedData = ModelHelpers.excludeFields(updateData, ['password', '_id']);
    
    if (sanitizedData.email) {
      sanitizedData.email = ModelHelpers.normalizeEmail(sanitizedData.email);
    }

    return await User.findByIdAndUpdate(
      userId, 
      { ...sanitizedData, updatedAt: new Date() }, 
      { new: true, runValidators: true }
    );
  }

  // Change password
  static async changePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, CONSTANTS.USER.PASSWORD.SALT_ROUNDS);
    
    return await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword, updatedAt: new Date() },
      { new: true }
    );
  }

  // Get users with pagination and search
  static async getUsers(options = {}) {
    const { page = 1, limit = 10, search = "" } = options;
    const paginationOptions = ModelHelpers.getPaginationOptions(page, limit);
    
    // Build search query
    let query = {};
    if (search) {
      query = ModelHelpers.buildSearchQuery(search, ["username", "fullname", "email"]);
    }

    const users = await User.find(query)
      .skip(paginationOptions.skip)
      .limit(paginationOptions.limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Activate/Deactivate user
  static async toggleUserStatus(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.isActive = !user.isActive;
    user.updatedAt = new Date();
    return await user.save();
  }
}

module.exports = UserService; 