const UserService = require("../services/UserService");
const ResponseUtil = require("../utils/response");
const UserValidation = require("../validations/UserValidation");

class UserController {
  // Get user profile
  static async getProfile(req, res) {
    try {
      const userId = req.user.userId;

      
      // Get user profile
      const user = await UserService.findById(userId);
      if (!user) {
        return ResponseUtil.error(res, "User not found", 404, [
          { field: "user", message: "User not found" }
        ]);
      }

      const profile = {
        _id: user._id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      return ResponseUtil.success(res, "Profile retrieved successfully", profile);
    } catch (error) {
      console.error("Get profile error:", error);
      
      return ResponseUtil.error(res, "Failed to retrieve profile", 500, [
        { field: "server", message: "An error occurred while retrieving profile" }
      ]);
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      
      // Sanitize input
      const sanitizedData = UserValidation.sanitizeUserData(req.body);
      
      // Validate input
      const validation = UserValidation.validateProfileUpdate(sanitizedData);
      if (!validation.isValid) {
        return ResponseUtil.error(res, "Validation failed", 400, validation.errors);
      }

      // Update profile
      const updatedUser = await UserService.updateProfile(userId, sanitizedData);
      
      const profile = {
        _id: updatedUser._id,
        username: updatedUser.username,
        fullname: updatedUser.fullname,
        email: updatedUser.email,
        emailVerified: updatedUser.emailVerified,
        isActive: updatedUser.isActive,
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt
      };

      return ResponseUtil.success(res, "Profile updated successfully", profile);
    } catch (error) {
      console.error("Update profile error:", error);
      
      if (error.message.includes("already exists")) {
        return ResponseUtil.error(res, error.message, 409, [
          { field: "email", message: error.message }
        ]);
      }
      
      return ResponseUtil.error(res, "Failed to update profile", 500, [
        { field: "server", message: "An error occurred while updating profile" }
      ]);
    }
  }
}

module.exports = UserController; 