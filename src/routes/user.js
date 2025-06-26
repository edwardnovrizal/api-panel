const express = require("express");
const router = express.Router();
const AuthMiddleware = require("../middlewares/auth");
const AuthController = require("../controllers/AuthController");
const UserController = require("../controllers/UserController");
const PasswordController = require("../controllers/PasswordController");

// User profile routes (protected with auto-refresh)
router.get("/profile", AuthMiddleware.verifyTokenWithRefresh, UserController.getProfile);
router.put("/profile", AuthMiddleware.verifyTokenWithRefresh, UserController.updateProfile);

// Change password (authenticated users with auto-refresh)
router.post("/change-password", AuthMiddleware.verifyTokenWithRefresh, PasswordController.changePassword);

// Session management routes (authenticated users with auto-refresh)
router.post("/logout-all", AuthMiddleware.verifyTokenWithRefresh, AuthController.logoutAll);

module.exports = router; 