// Health Check Endpoints for Node.js Application
// To be integrated into your Express/Next.js app

const express = require('express');
const router = express.Router();

// Basic health check
router.get('/health', async (req, res) => {
  try {
    const healthcheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      build_hash: process.env.BUILD_HASH || 'unknown',
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };

    res.status(200).json(healthcheck);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      message: 'Service Unavailable',
      error: error.message,
      timestamp: Date.now()
    });
  }
});

// Detailed readiness check
router.get('/ready', async (req, res) => {
  try {
    const checks = {};
    let isReady = true;

    // Database connectivity check
    try {
      // Replace with your actual database check
      // await db.raw('SELECT 1');
      checks.database = { status: 'ok', message: 'Connected' };
    } catch (error) {
      checks.database = { status: 'error', message: error.message };
      isReady = false;
    }

    // External service checks
    try {
      // Add checks for external APIs, Redis, etc.
      checks.external_services = { status: 'ok', message: 'All services accessible' };
    } catch (error) {
      checks.external_services = { status: 'error', message: error.message };
      isReady = false;
    }

    // Memory check
    const memUsage = process.memoryUsage();
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    if (memUsagePercent > 90) {
      checks.memory = { status: 'warning', usage: memUsagePercent };
      isReady = false;
    } else {
      checks.memory = { status: 'ok', usage: memUsagePercent };
    }

    const response = {
      status: isReady ? 'ready' : 'not_ready',
      checks,
      timestamp: Date.now()
    };

    res.status(isReady ? 200 : 503).json(response);
  } catch (error) {
    console.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not_ready',
      error: error.message,
      timestamp: Date.now()
    });
  }
});

// Liveness check
router.get('/live', (req, res) => {
  try {
    const uptime = process.uptime();
    
    // Consider the application dead if uptime is suspiciously low
    if (uptime < 10) {
      return res.status(503).json({
        status: 'not_live',
        message: 'Application recently restarted',
        uptime,
        timestamp: Date.now()
      });
    }

    res.status(200).json({
      status: 'live',
      uptime,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Liveness check failed:', error);
    res.status(503).json({
      status: 'not_live',
      error: error.message,
      timestamp: Date.now()
    });
  }
});

// Metrics endpoint for Prometheus
router.get('/metrics', (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const metrics = `
# HELP nodejs_memory_heap_used_bytes Node.js heap memory usage
# TYPE nodejs_memory_heap_used_bytes gauge
nodejs_memory_heap_used_bytes ${memUsage.heapUsed}

# HELP nodejs_memory_heap_total_bytes Node.js heap memory total
# TYPE nodejs_memory_heap_total_bytes gauge
nodejs_memory_heap_total_bytes ${memUsage.heapTotal}

# HELP nodejs_memory_external_bytes Node.js external memory usage
# TYPE nodejs_memory_external_bytes gauge
nodejs_memory_external_bytes ${memUsage.external}

# HELP nodejs_process_uptime_seconds Node.js process uptime
# TYPE nodejs_process_uptime_seconds counter
nodejs_process_uptime_seconds ${process.uptime()}

# HELP nodejs_cpu_user_seconds Node.js user CPU time
# TYPE nodejs_cpu_user_seconds counter
nodejs_cpu_user_seconds ${cpuUsage.user / 1000000}

# HELP nodejs_cpu_system_seconds Node.js system CPU time
# TYPE nodejs_cpu_system_seconds counter
nodejs_cpu_system_seconds ${cpuUsage.system / 1000000}
    `.trim();

    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    console.error('Metrics generation failed:', error);
    res.status(500).send('# Error generating metrics');
  }
});

module.exports = router;

// Usage example:
// const healthRoutes = require('./health-checks');
// app.use('/api', healthRoutes);