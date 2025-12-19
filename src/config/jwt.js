const jwt = require('jsonwebtoken');

// Ensure JWT_SECRET is set in production
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Add warning if using default secret in production
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'your_default_secret_change_in_production') {
    console.warn('WARNING: Using default JWT secret in production! Please set JWT_SECRET environment variable.');
}

const generateToken = (payload) => {
    // Add issued at and not before claims for better security
    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
        ...payload,
        iat: now,
        nbf: now
    };
    
    return jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        algorithm: 'HS256'
    });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expired');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        } else {
            throw new Error('Token verification failed');
        }
    }
};

module.exports = {
    generateToken,
    verifyToken,
    JWT_SECRET,
    JWT_EXPIRES_IN
};