const User = require('../models/User');
const { generateToken } = require('../config/jwt');
const { successResponse, errorResponse, unauthorizedResponse } = require('../utils/responseUtils');

class AuthController {
    static async login(req, res) {
        try {
            const { username, password } = req.body;
            console.log(`Login attempt for user: ${username}`);
            console.log(`Password provided: ${password ? 'Yes' : 'No'}`);

            // Validate input
            if (!username || !password) {
                console.error('Login validation failed: Username and password are required');
                return unauthorizedResponse(res, 'Username and password are required');
            }

            // Check if user exists in database before authentication
            const existingUser = await User.findByUsername(username);
            console.log(`User found in database: ${existingUser ? 'Yes' : 'No'}`);
            if (existingUser) {
                console.log(`User details: ID=${existingUser.id}, Username=${existingUser.username}, Role=${existingUser.role}`);
                console.log(`Password hash exists: ${existingUser.password ? 'Yes' : 'No'}`);
            }

            // Authenticate user
            const user = await User.authenticate(username, password);

            if (!user) {
                console.error(`Login failed: Invalid credentials for user ${username}`);
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

            console.log(`Login successful for user: ${username}`);
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
            console.log(`Logout request for user: ${req.user ? req.user.username : 'unknown'}`);
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
            console.log(`Get current user request for user: ${req.user ? req.user.username : 'unknown'}`);
            // User is already attached to request by auth middleware
            const user = await User.findById(req.user.id);

            if (!user) {
                console.error(`Get current user failed: User not found with ID ${req.user.id}`);
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
            console.log(`Token refresh request for user: ${user.username}`);

            // Generate new token
            const token = generateToken({
                userId: user.id,
                username: user.username,
                role: user.role
            });

            // Add token expiration info to response
            const tokenPayload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            const expiresIn = tokenPayload.exp - Math.floor(Date.now() / 1000);

            console.log(`Token refreshed successfully for user: ${user.username}`);
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