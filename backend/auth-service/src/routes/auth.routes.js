const express = require('express');
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Validaciones
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email válido requerido'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
  body('firstName').notEmpty().trim().withMessage('Nombre requerido'),
  body('lastName').notEmpty().trim().withMessage('Apellido requerido')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email válido requerido'),
  body('password').notEmpty().withMessage('Contraseña requerida')
];

// Rutas públicas
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Rutas protegidas
router.get('/me', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.post('/logout', authenticateToken, authController.logout);
router.post('/change-password', authenticateToken, authController.changePassword);

// Ruta de verificación de token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user,
    message: 'Token válido' 
  });
});

module.exports = router;


