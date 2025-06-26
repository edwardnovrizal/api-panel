const express = require("express");
const router = express.Router();
const { getDatabase } = require("../config/database");
const ResponseUtil = require("../utils/response");
const EmailService = require("../services/EmailService");

// Root endpoint
router.get("/", (req, res) => {
  let dbStatus;
  try {
    getDatabase();
    dbStatus = "connected";
  } catch (error) {
    dbStatus = "disconnected";
  }

  return ResponseUtil.success(res, "Service is running", {
    service: "API Panel Admin - Basic Version",
    status: "running",
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
router.get("/health", (req, res) => {
  let dbStatus;
  try {
    getDatabase();
    dbStatus = "connected";
  } catch (error) {
    dbStatus = "disconnected";
  }

  return ResponseUtil.success(res, "Health check successful", {
    status: "OK",
    service: "API Panel Admin",
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test database endpoint
router.get("/test-db", async (req, res) => {
  try {
    const db = getDatabase();
    
    // Test insert data sederhana
    const result = await db.collection("test").insertOne({
      message: "Hello from API Panel!",
      timestamp: new Date(),
      test_id: Math.random().toString(36).substring(7)
    });
    
    return ResponseUtil.success(res, "Database test successful", {
      insertedId: result.insertedId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return ResponseUtil.serverError(res, "Database test failed");
  }
});

// Test email service endpoint
router.get("/test-email", async (req, res) => {
  try {
    const emailTest = await EmailService.testConnection();
    
    if (emailTest.success) {
      return ResponseUtil.success(res, "Email service test successful", {
        emailService: "connected",
        timestamp: new Date().toISOString()
      });
    } else {
      return ResponseUtil.serverError(res, emailTest.message, "email");
    }

  } catch (error) {
    return ResponseUtil.serverError(res, "Email service test failed", "email");
  }
});



module.exports = router;
