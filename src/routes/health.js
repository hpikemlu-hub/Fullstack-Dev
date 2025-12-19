const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Health check endpoint for Docker
router.get('/', async (req, res) => {
  try {
    // Check database connection
    const database = require('../config/database');
    
    // Use the verifyConnection method to test database
    await database.verifyConnection();
    
    // Additional check - try to query users table
    const userCount = await database.get('SELECT COUNT(*) as count FROM users');
    
    // Check if admin user exists
    let adminUser = null;
    let adminUserExists = false;
    try {
      adminUser = await User.findByUsername('admin');
      adminUserExists = !!adminUser;
    } catch (error) {
      console.error('Error checking admin user:', error.message);
    }
    
    // Determine overall health status
    let healthStatus = 'OK';
    let healthMessage = 'Workload Management API is running';
    
    if (!adminUserExists) {
      healthStatus = 'WARNING';
      healthMessage = 'API is running but admin user is missing';
    }
    
    const response = {
      status: healthStatus,
      message: healthMessage,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: {
        status: 'connected',
        path: database.dbPath,
        userCount: userCount.count,
        adminUserExists: adminUserExists
      }
    };
    
    // Set appropriate status code based on health
    const statusCode = healthStatus === 'OK' ? 200 : 503;
    res.status(statusCode).json(response);
    
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      error: error.message
    });
  }
});

module.exports = router;