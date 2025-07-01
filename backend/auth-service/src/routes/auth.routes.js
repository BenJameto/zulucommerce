const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Ruta para registro de usuarios
router.post('/register', authController.register);

// Ruta para inicio de sesión
router.post('/login', authController.login);

// Ruta para verificar token
router.get('/verify', authController.verifyToken);

// Ruta para logout
router.post('/logout', authController.logout);

module.exports = router;


