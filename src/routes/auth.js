const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const PasswordController = require("../controllers/PasswordController");

// Authentication routes
router.post("/register", AuthController.register);
router.post("/verify-email", AuthController.verifyEmail);
router.post("/resend-otp", AuthController.resendOTP);
router.post("/login", AuthController.login);

// Password reset routes
router.post("/forgot-password", PasswordController.forgotPassword);
router.get("/verify-reset-token/:token", PasswordController.verifyResetToken);
router.post("/reset-password", PasswordController.resetPassword);

// Token management routes
router.post("/refresh-token", AuthController.refreshToken);
router.post("/logout", AuthController.logout);

module.exports = router; 