const User = require('../models/User');
const { successResponse, errorResponse, notFoundResponse, forbiddenResponse } = require('../utils/responseUtils');

class UserController {
    static async getUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;

            const users = await User.findAll(limit, offset);
            const total = await User.count();

            return successResponse(res, {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }, 'Users retrieved successfully');

        } catch (error) {
            console.error('Get users error:', error);
            return errorResponse(res, 'Failed to get users', 500, error.message);
        }
    }

    static async getUserById(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findById(id);

            if (!user) {
                return notFoundResponse(res, 'User not found');
            }

            return successResponse(res, user, 'User retrieved successfully');

        } catch (error) {
            console.error('Get user error:', error);
            return errorResponse(res, 'Failed to get user', 500, error.message);
        }
    }

    static async createUser(req, res) {
        try {
            const userData = req.body;

            // Check if user is trying to create admin role (only admins can do this)
            if (userData.role === 'Admin' && req.user.role !== 'Admin') {
                return forbiddenResponse(res, 'Only admins can create admin users');
            }

            const user = await User.create(userData);

            return successResponse(res, user, 'User created successfully', 201);

        } catch (error) {
            console.error('Create user error:', error);
            
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return errorResponse(res, 'Username already exists', 409);
            }

            return errorResponse(res, 'Failed to create user', 500, error.message);
        }
    }

    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const userData = req.body;

            // Check if user exists
            const existingUser = await User.findById(id);
            if (!existingUser) {
                return notFoundResponse(res, 'User not found');
            }

            // Check permissions: users can only update their own profile, admins can update anyone
            if (req.user.role !== 'Admin' && req.user.id !== parseInt(id)) {
                return forbiddenResponse(res, 'You can only update your own profile');
            }

            // Non-admin users cannot change their role
            if (userData.role && req.user.role !== 'Admin') {
                delete userData.role;
            }

            // Non-admin users cannot change other users' data
            if (req.user.role !== 'Admin') {
                const allowedFields = ['nama', 'nip', 'golongan', 'jabatan'];
                const filteredData = {};
                
                Object.keys(userData).forEach(key => {
                    if (allowedFields.includes(key)) {
                        filteredData[key] = userData[key];
                    }
                });
                
                userData = filteredData;
            }

            const user = await User.update(id, userData);

            return successResponse(res, user, 'User updated successfully');

        } catch (error) {
            console.error('Update user error:', error);
            
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return errorResponse(res, 'Username already exists', 409);
            }

            return errorResponse(res, 'Failed to update user', 500, error.message);
        }
    }

    static async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const { force } = req.query; // Allow force delete option
            
            // Check if user exists
            const existingUser = await User.findById(id);
            if (!existingUser) {
                return notFoundResponse(res, 'User not found');
            }
            
            // Check permissions: only admins can delete users
            if (req.user.role !== 'Admin') {
                return forbiddenResponse(res, 'Only admins can delete users');
            }
            
            // Prevent self-deletion
            if (req.user.id === parseInt(id)) {
                return forbiddenResponse(res, 'You cannot delete your own account');
            }
            
            const deleted = await User.delete(id, force === 'true');
            
            if (!deleted) {
                return errorResponse(res, 'Failed to delete user', 500);
            }
            
            return successResponse(res, null, 'User deleted successfully');
            
        } catch (error) {
            console.error('Delete user error:', error);
            
            if (error.message === 'Cannot delete user with existing workloads') {
                return errorResponse(res, 'Cannot delete user with existing workloads. Use ?force=true to override.', 400);
            }
            
            return errorResponse(res, 'Failed to delete user', 500, error.message);
        }
    }

    static async getProfile(req, res) {
        try {
            const user = await User.findById(req.user.id);

            if (!user) {
                return notFoundResponse(res, 'User not found');
            }

            return successResponse(res, user, 'Profile retrieved successfully');

        } catch (error) {
            console.error('Get profile error:', error);
            return errorResponse(res, 'Failed to get profile', 500, error.message);
        }
    }

    static async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const userData = req.body;

            // Users can only update certain fields in their profile
            const allowedFields = ['nama', 'nip', 'golongan', 'jabatan'];
            const filteredData = {};
            
            Object.keys(userData).forEach(key => {
                if (allowedFields.includes(key)) {
                    filteredData[key] = userData[key];
                }
            });

            const user = await User.update(userId, filteredData);

            return successResponse(res, user, 'Profile updated successfully');

        } catch (error) {
            console.error('Update profile error:', error);
            return errorResponse(res, 'Failed to update profile', 500, error.message);
        }
    }
}

module.exports = UserController;