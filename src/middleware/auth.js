const { verifyToken } = require('../config/jwt');
const { unauthorizedResponse, forbiddenResponse } = require('../utils/responseUtils');
const database = require('../config/database');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return unauthorizedResponse(res, 'Access token required');
        }

        // Verify the token
        const decoded = verifyToken(token);
        
        // Get user from User model to ensure user still exists
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return unauthorizedResponse(res, 'User not found');
        }

        // Attach user and token info to request
        req.user = user;
        req.token = {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role,
            exp: decoded.exp
        };
        
        next();
    } catch (error) {
        // Provide more specific error messages
        if (error.message === 'Token expired') {
            console.error('Token expired error:', error);
            return unauthorizedResponse(res, 'Token expired');
        } else if (error.message === 'Invalid token' || error.name === 'JsonWebTokenError') {
            console.error('Invalid token error:', error);
            return unauthorizedResponse(res, 'Invalid token');
        } else if (error.name === 'NotBeforeError') {
            console.error('Token not active error:', error);
            return unauthorizedResponse(res, 'Token not active');
        } else {
            console.error('Authentication error:', error);
            return unauthorizedResponse(res, 'Authentication failed');
        }
    }
};

const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return unauthorizedResponse(res, 'Authentication required');
        }

        if (!roles.includes(req.user.role)) {
            return forbiddenResponse(res, 'Insufficient permissions');
        }

        next();
    };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = verifyToken(token);
            const user = await User.findById(decoded.userId);
            
            if (user) {
                req.user = user;
                req.token = {
                    userId: decoded.userId,
                    username: decoded.username,
                    role: decoded.role,
                    exp: decoded.exp
                };
            }
        }

        next();
    } catch (error) {
        // Continue without authentication if token is invalid
        console.error('Optional auth error:', error);
        next();
    }
};

// Middleware to check if token is about to expire (within 5 minutes)
const checkTokenExpiry = (req, res, next) => {
    if (req.token && req.token.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = req.token.exp - currentTime;
        
        // If token expires within 5 minutes (300 seconds), add a flag
        if (timeUntilExpiry < 300) {
            res.set('X-Token-Expiring-Soon', 'true');
            res.set('X-Token-Expiry-Time', req.token.exp.toString());
        }
    }
    
    next();
};

module.exports = {
    authenticateToken,
    authorizeRole,
    optionalAuth,
    checkTokenExpiry
};