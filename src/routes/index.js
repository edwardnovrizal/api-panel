const express = require('express');
const router = express.Router();

// Import routes modules
const basicRoutes = require('./basic');
const authRoutes = require('./auth');
const userRoutes = require('./user');

// Use routes
router.use('/', basicRoutes);
router.use('/auth', authRoutes);
router.use('/user', userRoutes);

module.exports = router; 