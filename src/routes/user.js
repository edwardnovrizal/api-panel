const express = require("express");
const router = express.Router();
const AuthMiddleware = require("../middlewares/auth");
const AuthController = require("../controllers/AuthController");
const UserController = require("../controllers/UserController");
const PasswordController = require("../controllers/PasswordController");

// User profile routes (protected - manual refresh required)
router.get("/profile", AuthMiddleware.verifyToken, UserController.getProfile);
router.put("/profile", AuthMiddleware.verifyToken, UserController.updateProfile);

// Change password (authenticated users - manual refresh required)
router.post("/change-password", AuthMiddleware.verifyToken, PasswordController.changePassword);

// Session management routes (authenticated users - manual refresh required)
router.post("/logout-all", AuthMiddleware.verifyToken, AuthController.logoutAll);

module.exports = router; 