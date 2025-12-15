const { validationResult } = require('express-validator');
const { validationErrorResponse } = require('../utils/responseUtils');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(error => ({
            field: error.path,
            message: error.msg,
            value: error.value
        }));
        
        return validationErrorResponse(res, formattedErrors);
    }
    
    next();
};

const validateLogin = [
    require('express-validator').body('username')
        .notEmpty()
        .withMessage('Username is required')
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters long'),
    
    require('express-validator').body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    
    handleValidationErrors
];

const validateUser = [
    require('express-validator').body('username')
        .notEmpty()
        .withMessage('Username is required')
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters long')
        .matches(/^[a-zA-Z0-9_.]+$/)
        .withMessage('Username can only contain letters, numbers, underscores, and dots'),
    
    require('express-validator').body('password')
        .optional()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    
    require('express-validator').body('nama')
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2 })
        .withMessage('Name must be at least 2 characters long'),
    
    require('express-validator').body('nip')
        .optional()
        .isLength({ min: 0, max: 18 })
        .withMessage('NIP must be maximum 18 characters long'),
    
    require('express-validator').body('golongan')
        .optional()
        .custom((value) => {
            // Allow empty string or undefined
            if (!value || value === '') {
                return true;
            }
            // Check if it's one of the valid values
            const validValues = ['I/a', 'I/b', 'I/c', 'I/d', 'II/a', 'II/b', 'II/c', 'II/d', 'III/a', 'III/b', 'III/c', 'III/d', 'IV/a', 'IV/b', 'IV/c', 'IV/d'];
            if (!validValues.includes(value)) {
                throw new Error('Invalid golongan. Must be one of: ' + validValues.join(', '));
            }
            return true;
        }),
    
    require('express-validator').body('jabatan')
        .optional()
        .isLength({ min: 0, max: 100 })
        .withMessage('Jabatan must be between 0 and 100 characters long'),
    
    require('express-validator').body('role')
        .optional()
        .isIn(['Admin', 'User'])
        .withMessage('Role must be either Admin or User'),
    
    handleValidationErrors
];

const validateWorkload = [
    require('express-validator').body('nama')
        .notEmpty()
        .withMessage('Workload name is required')
        .isLength({ min: 2 })
        .withMessage('Workload name must be at least 2 characters long'),
    
    require('express-validator').body('type')
        .optional()
        .isIn(['Rutin', 'Proyek', 'Tambahan', 'Lainnya'])
        .withMessage('Type must be Rutin, Proyek, Tambahan, or Lainnya'),
    
    require('express-validator').body('deskripsi')
        .optional()
        .isLength({ min: 10 })
        .withMessage('Description must be at least 10 characters long'),
    
    require('express-validator').body('status')
        .optional()
        .isIn(['New', 'In Progress', 'Completed', 'Cancelled'])
        .withMessage('Status must be New, In Progress, Completed, or Cancelled'),
    
    require('express-validator').body('tgl_diterima')
        .optional()
        .isISO8601()
        .withMessage('Date must be a valid date (YYYY-MM-DD)'),
    
    require('express-validator').body('fungsi')
        .optional()
        .isLength({ min: 2 })
        .withMessage('Fungsi must be at least 2 characters long'),
    
    handleValidationErrors
];

module.exports = {
    validateLogin,
    validateUser,
    validateWorkload,
    handleValidationErrors
};