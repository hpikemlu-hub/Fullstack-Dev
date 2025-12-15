const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Login route
router.post('/login', validateLogin, asyncHandler(AuthController.login));

// Logout route
router.post('/logout', authenticateToken, asyncHandler(AuthController.logout));

// Get current user
router.get('/user', authenticateToken, asyncHandler(AuthController.getCurrentUser));

// Refresh token
router.post('/refresh', authenticateToken, asyncHandler(AuthController.refreshToken));

module.exports = router;