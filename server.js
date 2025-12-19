require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import configurations and middleware
const database = require('./src/config/database');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const SeedData = require('./src/utils/seedData');
const User = require('./src/models/User');

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
const corsOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://hpsb.online',
    'https://www.hpsb.online'
];

// Add CORS_ORIGIN from environment if provided
if (process.env.CORS_ORIGIN) {
    corsOrigins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
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

// 404 handler for API routes
app.use('/api/*', notFound);

// SPA fallback route - catch all non-API routes and serve index.html
app.get('*', (req, res, next) => {
    // Skip if this is an API route (should be handled by the 404 handler above)
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

// 404 handler for non-API routes
app.use(notFound);

// Error handler
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const initializeWithRetry = async () => {
        try {
            // Initialize database
            console.log('Initializing database...');
            await database.initialize();
            
            // Verify database connection
            console.log('Verifying database connection...');
            await database.verifyConnection();
            console.log('Database connection verified successfully');
            
            return true;
        } catch (error) {
            console.error(`Database initialization failed (attempt ${retryCount + 1}/${maxRetries}):`, error.message);
            retryCount++;
            
            if (retryCount < maxRetries) {
                console.log(`Retrying in 2 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return initializeWithRetry();
            } else {
                console.error('Max retries reached. Database initialization failed.');
                throw error;
            }
        }
    };
    
    try {
        // Initialize database with retry logic
        await initializeWithRetry();
        
        // Check if admin user exists, create if not
        console.log('Checking for admin user...');
        let adminUser = null;
        let adminCreationAttempts = 0;
        const maxAdminCreationAttempts = 3;
        
        while (adminCreationAttempts < maxAdminCreationAttempts) {
            try {
                adminUser = await User.findByUsername('admin');
                if (!adminUser) {
                    console.log(`Admin user not found, creating admin user (attempt ${adminCreationAttempts + 1}/${maxAdminCreationAttempts})...`);
                    
                    // Use the enhanced admin user creation method
                    adminUser = await User.createAdminUser();
                    console.log('✅ Admin user created successfully:', {
                        id: adminUser.id,
                        username: adminUser.username,
                        nama: adminUser.nama,
                        role: adminUser.role
                    });
                } else {
                    console.log('✅ Admin user already exists:', {
                        id: adminUser.id,
                        username: adminUser.username,
                        nama: adminUser.nama,
                        role: adminUser.role
                    });
                    break;
                }
            } catch (error) {
                console.error(`Error checking/creating admin user (attempt ${adminCreationAttempts + 1}/${maxAdminCreationAttempts}):`, error.message);
                adminCreationAttempts++;
                
                if (adminCreationAttempts < maxAdminCreationAttempts) {
                    console.log('Retrying admin user creation in 2 seconds...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    console.error('Max admin creation attempts reached. Continuing with server startup...');
                    // Don't exit, just log the error and continue
                    console.log('⚠️ Server will start but admin user may not be available');
                }
            }
        }

        // Start server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV}`);
            console.log(`Database path: ${database.dbPath}`);
            console.log(`API Documentation: http://localhost:${PORT}/api/docs`);
            
            // Log admin user status
            if (adminUser) {
                console.log('✅ Admin user is available for login');
            } else {
                console.log('⚠️ Admin user may not be available. Use reset_admin_prod.js to create it manually.');
            }
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