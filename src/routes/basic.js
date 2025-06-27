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

// Development only endpoints
if (process.env.NODE_ENV !== "production") {
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

  // Debug refresh token endpoint
  router.post("/debug-token", async (req, res) => {
    try {
      const RefreshTokenService = require("../services/RefreshTokenService");
      
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        // Try to get from cookies
        const cookieToken = req.cookies.refreshToken;
        if (!cookieToken) {
          return ResponseUtil.error(res, "No refresh token provided", 400, [
            { field: "refreshToken", message: "Provide token in body or cookie" }
          ]);
        }
        
        const debugInfo = await RefreshTokenService.debugTokenStatus(cookieToken);
        return ResponseUtil.success(res, "Token debug info (from cookie)", debugInfo);
      }
      
      const debugInfo = await RefreshTokenService.debugTokenStatus(refreshToken);
      return ResponseUtil.success(res, "Token debug info", debugInfo);

    } catch (error) {
      return ResponseUtil.serverError(res, "Debug failed", "debug");
    }
  });

  // Debug cookies endpoint
  router.get("/debug-cookies", (req, res) => {
    try {
      const cookies = req.cookies;
      const headers = req.headers;
      
      return ResponseUtil.success(res, "Cookie debug info", {
        cookies: cookies,
        cookieHeader: headers.cookie,
        userAgent: headers['user-agent'],
        path: req.path,
        originalUrl: req.originalUrl,
        baseUrl: req.baseUrl,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return ResponseUtil.serverError(res, "Cookie debug failed", "debug");
    }
  });

  // Debug refresh token flow endpoint
  router.post("/debug-refresh-flow", async (req, res) => {
    try {
      const RefreshTokenService = require("../services/RefreshTokenService");
      
      // Get token from cookie
      const refreshToken = req.cookies.refreshToken;
      
      if (!refreshToken) {
        return ResponseUtil.error(res, "No refresh token in cookie", 400, [
          { field: "refreshToken", message: "Login first to get refresh token" }
        ]);
      }
      
      console.log("🔍 Debug refresh flow - Token:", refreshToken.substring(0, 10) + "...");
      
      // Step 1: Debug token status
      const debugInfo = await RefreshTokenService.debugTokenStatus(refreshToken);
      console.log("🔍 Token debug info:", debugInfo);
      
      // Step 2: Try refresh
      const refreshResult = await RefreshTokenService.refreshAccessToken(refreshToken);
      console.log("🔍 Refresh result:", refreshResult.success ? "SUCCESS" : "FAILED");
      
      return ResponseUtil.success(res, "Refresh flow debug complete", {
        tokenDebug: debugInfo,
        refreshResult: {
          success: refreshResult.success,
          message: refreshResult.message,
          code: refreshResult.code,
          hasAccessToken: !!refreshResult.accessToken
        }
      });
      
    } catch (error) {
      console.error("💥 Debug refresh flow error:", error);
      return ResponseUtil.serverError(res, "Debug refresh flow failed", "debug");
    }
  });

  // Force cleanup expired tokens endpoint
  router.post("/cleanup-tokens", async (req, res) => {
    try {
      const RefreshTokenService = require("../services/RefreshTokenService");
      
      const result = await RefreshTokenService.cleanupExpiredTokens();
      
      return ResponseUtil.success(res, "Token cleanup completed", {
        deletedCount: result?.deletedCount || 0,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      return ResponseUtil.serverError(res, "Token cleanup failed", "cleanup");
    }
  });
}

module.exports = router;
