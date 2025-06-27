require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectDatabase } = require('./src/config/database');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration for cookies
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Frontend URL
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-New-Access-Token'] // Expose token refresh header
}));

// Middleware dasar
app.use(express.json());
app.use(cookieParser()); // Add cookie parser middleware

// Use routes
app.use('/v1/api', routes);

// Start server
async function startServer() {
    try {
        // Connect to database
        await connectDatabase();
        
        // Start Express server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 URL: http://localhost:${PORT}/v1/api`);
            console.log(`🏥 Health: http://localhost:${PORT}/v1/api/health`);
            
            // Development only URLs
            if (process.env.NODE_ENV !== "production") {
                console.log(`🧪 Test DB: http://localhost:${PORT}/v1/api/test-db`);
                console.log(`📧 Test Email: http://localhost:${PORT}/v1/api/test-email`);
                console.log(`🔍 Debug Token: POST http://localhost:${PORT}/v1/api/debug-token`);
                console.log(`🍪 Debug Cookies: GET http://localhost:${PORT}/v1/api/debug-cookies`);
            }
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
