const express = require('express');
const router = express.Router();
const {
  getCart,
  addProductToCart,
  removeProductFromCart,
  clearCart
} = require('../controllers/cart.controller');

// Obtener todos los productos del carrito
router.get('/', getCart);

// Agregar un producto al carrito
router.post('/', addProductToCart);

// Eliminar un producto del carrito
router.delete('/:id', removeProductFromCart);

// Vaciar todo el carrito
router.delete('/clear', clearCart);

module.exports = router;
