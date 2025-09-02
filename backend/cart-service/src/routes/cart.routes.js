const express = require('express');
const { body, validationResult } = require('express-validator');
const cartController = require('../controllers/cart.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Validaciones
const addItemValidation = [
  body('productId').notEmpty().withMessage('ID del producto requerido'),
  body('quantity').isInt({ min: 1 }).withMessage('Cantidad debe ser un número positivo')
];

const updateItemValidation = [
  body('quantity').isInt({ min: 1 }).withMessage('Cantidad debe ser un número positivo')
];

// Rutas del carrito
router.get('/', authenticateToken, cartController.getCart);
router.post('/items', authenticateToken, addItemValidation, cartController.addItem);
router.put('/items/:productId', authenticateToken, updateItemValidation, cartController.updateItem);
router.delete('/items/:productId', authenticateToken, cartController.removeItem);
router.delete('/', authenticateToken, cartController.clearCart);
router.post('/checkout', authenticateToken, cartController.checkout);

module.exports = router; 