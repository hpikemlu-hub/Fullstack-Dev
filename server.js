require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import configurations and middleware
const database = require('./src/config/database');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

// Import routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const workloadRoutes = require('./src/routes/workload');
const healthRoutes = require('./src/routes/health');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        process.env.CORS_ORIGIN
    ].filter(Boolean),
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// API Health check endpoint (for Docker)
app.use('/api/health', healthRoutes);

// Favicon endpoint to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// Vite.svg endpoint to prevent 404 errors (for backward compatibility)
app.get('/vite.svg', (req, res) => {
    // Redirect to favicon.ico to ensure consistent behavior
    res.redirect(302, '/favicon.ico');
});

// Serve static files from frontend, but exclude vite.svg
app.use((req, res, next) => {
    if (req.path === '/vite.svg') {
        return next(); // Skip static middleware for vite.svg
    }
    return express.static('frontend/dist')(req, res, next);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workload', workloadRoutes);

// Root endpoint - serve frontend index.html
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: 'frontend/dist' });
});

// API info endpoint
app.get('/api', (req, res) => {
    res.json({
        message: 'Workload Management API',
        version: '1.0.0',
        documentation: '/api/docs',
        health: '/health'
    });
});

// SPA fallback route - catch all non-API routes and serve index.html
app.get('*', (req, res, next) => {
    // Skip if this is an API route
    if (req.path.startsWith('/api/')) {
        return next();
    }
    
    // Skip if this is a static file request (has file extension)
    if (req.path.includes('.')) {
        return next();
    }
    
    // Serve index.html for all other routes (SPA routing)
    res.sendFile('index.html', { root: 'frontend/dist' });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
    try {
        // Initialize database
        console.log('Initializing database...');
        await database.initialize();
        
        // Verify database connection
        console.log('Verifying database connection...');
        await database.verifyConnection();
        console.log('Database connection verified successfully');

        // Start server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV}`);
            console.log(`Database path: ${database.dbPath}`);
            console.log(`API Documentation: http://localhost:${PORT}/api/docs`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        console.error('Error details:', error.stack);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await database.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await database.close();
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;