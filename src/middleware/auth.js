const { verifyToken } = require('../config/jwt');
const { unauthorizedResponse, forbiddenResponse } = require('../utils/responseUtils');
const database = require('../config/database');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return unauthorizedResponse(res, 'Access token required');
        }

        const decoded = verifyToken(token);
        
        // Get user from database to ensure user still exists
        const user = await database.get('SELECT id, username, nama, role FROM users WHERE id = ?', [decoded.userId]);
        
        if (!user) {
            return unauthorizedResponse(res, 'User not found');
        }

        req.user = user;
        next();
    } catch (error) {
        return unauthorizedResponse(res, 'Invalid or expired token');
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
            const user = await database.get('SELECT id, username, nama, role FROM users WHERE id = ?', [decoded.userId]);
            
            if (user) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Continue without authentication if token is invalid
        next();
    }
};

module.exports = {
    authenticateToken,
    authorizeRole,
    optionalAuth
};