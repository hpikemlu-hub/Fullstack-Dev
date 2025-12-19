const express = require('express');
const router = express.Router();

// Health check endpoint for Docker
router.get('/', async (req, res) => {
  try {
    // Check database connection
    const database = require('../config/database');
    
    // Use the verifyConnection method to test database
    await database.verifyConnection();
    
    // Additional check - try to query users table
    await database.get('SELECT COUNT(*) as count FROM users');
    
    res.status(200).json({
      status: 'OK',
      message: 'Workload Management API is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'connected',
        path: database.dbPath
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;