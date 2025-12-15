const express = require('express');
const UserController = require('../controllers/userController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { validateUser } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all users (admin only)
router.get('/', authorizeRole(['Admin']), asyncHandler(UserController.getUsers));

// Get user by ID (admin only or own profile)
router.get('/:id', asyncHandler(UserController.getUserById));

// Create user (admin only)
router.post('/', authorizeRole(['Admin']), validateUser, asyncHandler(UserController.createUser));

// Update user (admin only or own profile)
router.put('/:id', authenticateToken, validateUser, asyncHandler(UserController.updateUser));

// Delete user (admin only)
router.delete('/:id', authorizeRole(['Admin']), asyncHandler(UserController.deleteUser));

// Get current user profile
router.get('/profile/me', asyncHandler(UserController.getProfile));

// Update current user profile
router.put('/profile/me', validateUser, asyncHandler(UserController.updateProfile));

module.exports = router;