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

  return ResponseUtil.success(res, {
    service: "API Panel Admin - Basic Version",
    status: "running",
    database: dbStatus,
    timestamp: new Date().toISOString()
  }, "Service is running");
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

  return ResponseUtil.success(res, {
    status: "OK",
    service: "API Panel Admin",
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }, "Health check successful");
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
    
    return ResponseUtil.success(res, {
      insertedId: result.insertedId,
      timestamp: new Date().toISOString()
    }, "Database test successful");

  } catch (error) {
    return ResponseUtil.serverError(res, "Database test failed");
  }
});

// Test email service endpoint
router.get("/test-email", async (req, res) => {
  try {
    const emailTest = await EmailService.testConnection();
    
    if (emailTest.success) {
      return ResponseUtil.success(res, {
        emailService: "connected",
        timestamp: new Date().toISOString()
      }, "Email service test successful");
    } else {
      return ResponseUtil.serverError(res, emailTest.message, "email");
    }

  } catch (error) {
    return ResponseUtil.serverError(res, "Email service test failed", "email");
  }
});

module.exports = router;
