const User = require('../models/User');
const { generateToken } = require('../config/jwt');
const { successResponse, errorResponse, unauthorizedResponse } = require('../utils/responseUtils');

class AuthController {
    static async login(req, res) {
        try {
            const { username, password } = req.body;

            // Authenticate user
            const user = await User.authenticate(username, password);

            if (!user) {
                return unauthorizedResponse(res, 'Invalid username or password');
            }

            // Generate JWT token
            const token = generateToken({
                userId: user.id,
                username: user.username,
                role: user.role
            });

            // Return user data without password and token
            const { password: _, ...userData } = user;

            return successResponse(res, {
                user: userData,
                token
            }, 'Login successful');

        } catch (error) {
            console.error('Login error:', error);
            return errorResponse(res, 'Login failed', 500, error.message);
        }
    }

    static async logout(req, res) {
        try {
            // In a stateless JWT implementation, logout is typically handled on the client side
            // by removing the token from storage. Here we just return a success response.
            return successResponse(res, null, 'Logout successful');

        } catch (error) {
            console.error('Logout error:', error);
            return errorResponse(res, 'Logout failed', 500, error.message);
        }
    }

    static async getCurrentUser(req, res) {
        try {
            // User is already attached to request by auth middleware
            const user = await User.findById(req.user.id);

            if (!user) {
                return unauthorizedResponse(res, 'User not found');
            }

            return successResponse(res, user, 'User retrieved successfully');

        } catch (error) {
            console.error('Get current user error:', error);
            return errorResponse(res, 'Failed to get user', 500, error.message);
        }
    }

    static async refreshToken(req, res) {
        try {
            // User is already authenticated via middleware
            const user = req.user;

            // Generate new token
            const token = generateToken({
                userId: user.id,
                username: user.username,
                role: user.role
            });

            return successResponse(res, {
                user,
                token
            }, 'Token refreshed successfully');

        } catch (error) {
            console.error('Token refresh error:', error);
            return errorResponse(res, 'Token refresh failed', 500, error.message);
        }
    }
}

module.exports = AuthController;