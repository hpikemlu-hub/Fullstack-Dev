const express = require('express');
const WorkloadController = require('../controllers/workloadController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { validateWorkload } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all workloads (with filters)
router.get('/', asyncHandler(WorkloadController.getWorkloads));

// Get workload options (dropdown values)
router.get('/options', asyncHandler(WorkloadController.getWorkloadOptions));

// Get workload statistics
router.get('/statistics', asyncHandler(WorkloadController.getWorkloadStatistics));

// Get my workloads (current user's workloads)
router.get('/my', asyncHandler(WorkloadController.getMyWorkloads));

// Get workload by ID
router.get('/:id', asyncHandler(WorkloadController.getWorkloadById));

// Create workload
router.post('/', validateWorkload, asyncHandler(WorkloadController.createWorkload));

// Update workload
router.put('/:id', validateWorkload, asyncHandler(WorkloadController.updateWorkload));

// Delete workload
router.delete('/:id', asyncHandler(WorkloadController.deleteWorkload));

module.exports = router;