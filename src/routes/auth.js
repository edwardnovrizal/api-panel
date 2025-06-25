const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");

// Authentication routes
router.post("/register", AuthController.register);
router.post("/verify-email", AuthController.verifyEmail);
router.post("/resend-otp", AuthController.resendOTP);

module.exports = router; 