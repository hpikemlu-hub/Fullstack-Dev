const User = require('../models/User');
const { generateToken } = require('../config/jwt');
const { successResponse, errorResponse, unauthorizedResponse } = require('../utils/responseUtils');

class AuthController {
    static async login(req, res) {
        try {
            const { username, password } = req.body;

            // Validate input
            if (!username || !password) {
                return unauthorizedResponse(res, 'Username and password are required');
            }

            // Authenticate user
            const user = await User.authenticate(username, password);

            if (!user) {
                return unauthorizedResponse(res, 'Invalid username or password');
            }

            // Generate JWT token with longer expiration for production
            const token = generateToken({
                userId: user.id,
                username: user.username,
                role: user.role
            });

            // Return user data without password and token
            const { password: _, ...userData } = user;

            // Add token expiration info to response
            const tokenPayload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            const expiresIn = tokenPayload.exp - Math.floor(Date.now() / 1000);

            return successResponse(res, {
                user: userData,
                token,
                expiresIn
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

            // Return user data without password
            const { password: _, ...userData } = user;

            return successResponse(res, userData, 'User retrieved successfully');

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

            // Add token expiration info to response
            const tokenPayload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            const expiresIn = tokenPayload.exp - Math.floor(Date.now() / 1000);

            return successResponse(res, {
                user,
                token,
                expiresIn
            }, 'Token refreshed successfully');

        } catch (error) {
            console.error('Token refresh error:', error);
            return errorResponse(res, 'Token refresh failed', 500, error.message);
        }
    }
}

module.exports = AuthController;