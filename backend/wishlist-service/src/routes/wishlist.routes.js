const express = require('express');
const router = express.Router();

// Base temporal: lista de deseos en memoria
let wishlist = [];

// Obtener todos los ítems de la wishlist
router.get('/', (req, res) => {
  res.json(wishlist);
});

// Agregar un nuevo ítem a la wishlist
router.post('/', (req, res) => {
  const { userId, productId } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ error: 'userId y productId son requeridos' });
  }

  const newItem = {
    id: wishlist.length + 1,
    userId,
    productId,
  };

  wishlist.push(newItem);

  res.status(201).json(newItem);
});

// Eliminar un ítem por ID
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  wishlist = wishlist.filter(item => item.id !== id);
  res.status(204).send();
});

module.exports = router;
