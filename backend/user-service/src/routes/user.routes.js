const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { validateUser, validateUpdateUser, validateChangePassword } = require('../middleware/validation.middleware');

// Rutas públicas
router.get('/stats', userController.getUserStats);
router.post('/', validateUser, userController.createUser);

// Rutas protegidas (requieren autenticación)
router.get('/', authenticateToken, userController.getAllUsers);
router.get('/profile', authenticateToken, userController.getUserProfile);
router.get('/:id', authenticateToken, userController.getUserById);
router.put('/profile', authenticateToken, validateUpdateUser, userController.updateProfile);
router.put('/:id', authenticateToken, validateUpdateUser, userController.updateUser);
router.put('/change-password', authenticateToken, validateChangePassword, userController.changePassword);
router.delete('/:id', authenticateToken, userController.deleteUser);

module.exports = router; 