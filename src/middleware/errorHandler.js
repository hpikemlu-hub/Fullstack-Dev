const { errorResponse } = require('../utils/responseUtils');

const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error
    let error = { ...err };
    error.message = err.message;

    // SQLite constraint error
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        const message = 'Resource already exists';
        error = { message, statusCode: 409 };
    }

    // SQLite foreign key constraint error
    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        const message = 'Referenced resource does not exist';
        error = { message, statusCode: 400 };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = { message, statusCode: 401 };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = { message, statusCode: 401 };
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        const message = 'Validation failed';
        error = { message, statusCode: 400, details: err.details };
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : undefined,
        timestamp: new Date().toISOString()
    });
};

const notFound = (req, res, next) => {
    const error = new Error(`Not found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    errorHandler,
    notFound,
    asyncHandler
};