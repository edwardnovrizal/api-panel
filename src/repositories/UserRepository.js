const User = require("../models/User");
const ModelHelpers = require("../utils/modelHelpers");

class UserRepository {
  // Find user by email
  static async findByEmail(email) {
    const normalizedEmail = ModelHelpers.normalizeEmail(email);
    return await User.findOne({ email: normalizedEmail });
  }

  // Find user by username
  static async findByUsername(username) {
    return await User.findOne({ username: username });
  }

  // Find user by email with password (untuk authentication)
  static async findByEmailWithPassword(email) {
    const normalizedEmail = ModelHelpers.normalizeEmail(email);
    return await User.findOne({ email: normalizedEmail }).select("+password");
  }

  // Find user by username with password (untuk authentication)
  static async findByUsernameWithPassword(username) {
    return await User.findOne({ username: username }).select("+password");
  }

  // Find user by ID
  static async findById(userId) {
    return await User.findById(userId);
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
  static async create(userData) {
    const newUser = new User(userData);
    return await newUser.save();
  }

  // Update user by ID
  static async updateById(userId, updateData) {
    return await User.findByIdAndUpdate(
      userId, 
      { ...updateData, updatedAt: new Date() }, 
      { new: true, runValidators: true }
    );
  }

  // Delete user by ID
  static async deleteById(userId) {
    return await User.findByIdAndDelete(userId);
  }

  // Get users with pagination and search
  static async findWithPagination(options = {}) {
    const { page = 1, limit = 10, search = "", filters = {} } = options;
    const paginationOptions = ModelHelpers.getPaginationOptions(page, limit);
    
    // Build search query
    let query = { ...filters };
    if (search) {
      query = {
        ...query,
        ...ModelHelpers.buildSearchQuery(search, ["username", "fullname", "email"])
      };
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

  // Find users by role
  static async findByRole(role) {
    return await User.find({ role: role, isActive: true });
  }

  // Find active users
  static async findActive() {
    return await User.find({ isActive: true });
  }

  // Find inactive users
  static async findInactive() {
    return await User.find({ isActive: false });
  }

  // Count users by role
  static async countByRole(role) {
    return await User.countDocuments({ role: role });
  }

  // Count total users
  static async countTotal() {
    return await User.countDocuments();
  }

  // Count active users
  static async countActive() {
    return await User.countDocuments({ isActive: true });
  }

  // Find users created within date range
  static async findByDateRange(startDate, endDate) {
    return await User.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ createdAt: -1 });
  }

  // Bulk operations
  static async bulkUpdate(filter, updateData) {
    return await User.updateMany(filter, updateData);
  }

  static async bulkDelete(filter) {
    return await User.deleteMany(filter);
  }
}

module.exports = UserRepository; 