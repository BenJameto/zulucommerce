const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');

// Obtener carrito de un usuario
router.get('/:userId', cartController.getCart);

// Agregar producto al carrito
router.post('/', cartController.addProductToCart);

// Eliminar producto del carrito
router.delete('/:userId/:productId', cartController.removeProductFromCart);

// Vaciar carrito
router.delete('/clear/:userId', cartController.clearCart);

module.exports = router;
