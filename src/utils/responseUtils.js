const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
};

const errorResponse = (res, message = 'Internal Server Error', statusCode = 500, error = null) => {
    return res.status(statusCode).json({
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? error : undefined,
        timestamp: new Date().toISOString()
    });
};

const validationErrorResponse = (res, errors) => {
    return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors,
        timestamp: new Date().toISOString()
    });
};

const notFoundResponse = (res, message = 'Resource not found') => {
    return res.status(404).json({
        success: false,
        message,
        timestamp: new Date().toISOString()
    });
};

const unauthorizedResponse = (res, message = 'Unauthorized') => {
    return res.status(401).json({
        success: false,
        message,
        timestamp: new Date().toISOString()
    });
};

const forbiddenResponse = (res, message = 'Forbidden') => {
    return res.status(403).json({
        success: false,
        message,
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    successResponse,
    errorResponse,
    validationErrorResponse,
    notFoundResponse,
    unauthorizedResponse,
    forbiddenResponse
};