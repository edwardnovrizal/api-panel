require('dotenv').config();
const express = require('express');
const { connectDatabase } = require('./src/config/database');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware dasar
app.use(express.json());

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
            console.log(`📍 URL: http://localhost:${PORT}`);
            console.log(`🏥 Health: http://localhost:${PORT}/health`);
            console.log(`🧪 Test DB: http://localhost:${PORT}/test-db`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
