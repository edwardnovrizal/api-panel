const express = require('express');
const router = express.Router();

// Import routes modules
const basicRoutes = require('./basic');
const authRoutes = require('./auth');

// Use routes
router.use('/', basicRoutes);
router.use('/auth', authRoutes);

module.exports = router; 