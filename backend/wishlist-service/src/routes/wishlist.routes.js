const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist.controller');

// Obtener lista de deseos de un usuario
router.get('/:userId', wishlistController.getWishlist);

// Agregar producto a la lista de deseos
router.post('/', wishlistController.addToWishlist);

// Eliminar producto de la lista de deseos
router.delete('/:userId/:productId', wishlistController.removeFromWishlist);

module.exports = router;
 