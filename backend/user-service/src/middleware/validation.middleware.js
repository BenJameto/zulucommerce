const { body, validationResult } = require('express-validator');

// Validación para crear usuario
const validateUser = [
    body('email')
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail(),
    body('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username debe tener entre 3 y 30 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username solo puede contener letras, números y guiones bajos'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Contraseña debe tener al menos 6 caracteres'),
    body('first_name')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Nombre debe tener entre 2 y 50 caracteres'),
    body('last_name')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Apellido debe tener entre 2 y 50 caracteres'),
    body('phone')
        .optional()
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Número de teléfono inválido'),
    body('date_of_birth')
        .optional()
        .isISO8601()
        .withMessage('Fecha de nacimiento inválida'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Datos de entrada inválidos',
                details: errors.array() 
            });
        }
        next();
    }
];

// Validación para actualizar usuario
const validateUpdateUser = [
    body('first_name')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Nombre debe tener entre 2 y 50 caracteres'),
    body('last_name')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Apellido debe tener entre 2 y 50 caracteres'),
    body('phone')
        .optional()
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Número de teléfono inválido'),
    body('date_of_birth')
        .optional()
        .isISO8601()
        .withMessage('Fecha de nacimiento inválida'),
    body('address')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Dirección no puede exceder 500 caracteres'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Datos de entrada inválidos',
                details: errors.array() 
            });
        }
        next();
    }
];

// Validación para cambiar contraseña
const validateChangePassword = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Contraseña actual es requerida'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('Nueva contraseña debe tener al menos 6 caracteres'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Datos de entrada inválidos',
                details: errors.array() 
            });
        }
        next();
    }
];

module.exports = {
    validateUser,
    validateUpdateUser,
    validateChangePassword
}; 