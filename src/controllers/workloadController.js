const Workload = require('../models/Workload');
const { successResponse, errorResponse, notFoundResponse, forbiddenResponse } = require('../utils/responseUtils');

class WorkloadController {
    static async getWorkloads(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;

            // Build filters
            const filters = {};
            
            // Non-admin users can only see their own workloads
            if (req.user.role !== 'Admin') {
                filters.user_id = req.user.id;
            } else if (req.query.user_id) {
                filters.user_id = req.query.user_id;
            }
            
            if (req.query.status) {
                filters.status = req.query.status;
            }
            
            if (req.query.type) {
                filters.type = req.query.type;
            }
            
            if (req.query.search) {
                filters.search = req.query.search;
            }

            const workloads = await Workload.findAll(limit, offset, filters);
            const total = await Workload.count(filters);

            return successResponse(res, {
                workloads,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }, 'Workloads retrieved successfully');

        } catch (error) {
            console.error('Get workloads error:', error);
            return errorResponse(res, 'Failed to get workloads', 500, error.message);
        }
    }

    static async getWorkloadById(req, res) {
        try {
            const { id } = req.params;
            const workload = await Workload.findById(id);

            if (!workload) {
                return notFoundResponse(res, 'Workload not found');
            }

            // Check permissions: non-admin users can only access their own workloads
            if (req.user.role !== 'Admin' && workload.user_id !== req.user.id) {
                return forbiddenResponse(res, 'You can only access your own workloads');
            }

            return successResponse(res, workload, 'Workload retrieved successfully');

        } catch (error) {
            console.error('Get workload error:', error);
            return errorResponse(res, 'Failed to get workload', 500, error.message);
        }
    }

    static async createWorkload(req, res) {
        try {
            const workloadData = req.body;

            // Non-admin users can only create workloads for themselves
            if (req.user.role !== 'Admin') {
                workloadData.user_id = req.user.id;
            } else if (!workloadData.user_id) {
                // Admin must specify user_id or it defaults to themselves
                workloadData.user_id = req.user.id;
            }

            const workload = await Workload.create(workloadData);

            return successResponse(res, workload, 'Workload created successfully', 201);

        } catch (error) {
            console.error('Create workload error:', error);
            return errorResponse(res, 'Failed to create workload', 500, error.message);
        }
    }

    static async updateWorkload(req, res) {
        try {
            const { id } = req.params;
            const workloadData = req.body;

            // Check if workload exists
            const existingWorkload = await Workload.findById(id);
            if (!existingWorkload) {
                return notFoundResponse(res, 'Workload not found');
            }

            // Check permissions: non-admin users can only update their own workloads
            if (req.user.role !== 'Admin' && existingWorkload.user_id !== req.user.id) {
                return forbiddenResponse(res, 'You can only update your own workloads');
            }

            // Non-admin users cannot change the user_id
            if (req.user.role !== 'Admin') {
                delete workloadData.user_id;
            }

            const workload = await Workload.update(id, workloadData);

            return successResponse(res, workload, 'Workload updated successfully');

        } catch (error) {
            console.error('Update workload error:', error);
            return errorResponse(res, 'Failed to update workload', 500, error.message);
        }
    }

    static async deleteWorkload(req, res) {
        try {
            const { id } = req.params;

            // Check if workload exists
            const existingWorkload = await Workload.findById(id);
            if (!existingWorkload) {
                return notFoundResponse(res, 'Workload not found');
            }

            // Check permissions: non-admin users can only delete their own workloads
            if (req.user.role !== 'Admin' && existingWorkload.user_id !== req.user.id) {
                return forbiddenResponse(res, 'You can only delete your own workloads');
            }

            const deleted = await Workload.delete(id);

            if (!deleted) {
                return errorResponse(res, 'Failed to delete workload', 500);
            }

            return successResponse(res, null, 'Workload deleted successfully');

        } catch (error) {
            console.error('Delete workload error:', error);
            return errorResponse(res, 'Failed to delete workload', 500, error.message);
        }
    }

    static async getWorkloadOptions(req, res) {
        try {
            const options = await Workload.getWorkloadOptions();

            return successResponse(res, options, 'Workload options retrieved successfully');

        } catch (error) {
            console.error('Get workload options error:', error);
            return errorResponse(res, 'Failed to get workload options', 500, error.message);
        }
    }

    static async getWorkloadStatistics(req, res) {
        try {
            // Non-admin users can only see their own statistics
            const userId = req.user.role !== 'Admin' ? req.user.id : req.query.user_id;

            const statistics = await Workload.getStatistics(userId);

            return successResponse(res, statistics, 'Workload statistics retrieved successfully');

        } catch (error) {
            console.error('Get workload statistics error:', error);
            return errorResponse(res, 'Failed to get workload statistics', 500, error.message);
        }
    }

    static async getMyWorkloads(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;

            // Build filters for current user
            const filters = {
                user_id: req.user.id
            };
            
            if (req.query.status) {
                filters.status = req.query.status;
            }
            
            if (req.query.type) {
                filters.type = req.query.type;
            }
            
            if (req.query.search) {
                filters.search = req.query.search;
            }

            const workloads = await Workload.findAll(limit, offset, filters);
            const total = await Workload.count(filters);

            return successResponse(res, {
                workloads,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }, 'My workloads retrieved successfully');

        } catch (error) {
            console.error('Get my workloads error:', error);
            return errorResponse(res, 'Failed to get my workloads', 500, error.message);
        }
    }
}

module.exports = WorkloadController;