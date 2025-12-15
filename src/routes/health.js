const express = require('express');
const router = express.Router();

// Health check endpoint for Docker
router.get('/', async (req, res) => {
  try {
    // Check database connection
    const db = require('../config/database');
    
    // Simple database query to check connection
    await new Promise((resolve, reject) => {
      db.get('SELECT 1', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    res.status(200).json({
      status: 'OK',
      message: 'Workload Management API is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;