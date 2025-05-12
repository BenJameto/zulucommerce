const express = require('express');
const router = express.Router();

// Carrito en memoria (simulación)
let cart = [];

// Función para calcular la cantidad total
const getTotalQuantity = () => {
  return cart.reduce((total, item) => total + item.quantity, 0);
};

// Obtener todos los productos del carrito
router.get('/', (req, res) => {
  res.json({
    cart,
    totalQuantity: getTotalQuantity()
  });
});

// Agregar un producto al carrito
router.post('/', (req, res) => {
  const { id, name, price, quantity, image } = req.body;

  if (!id || !name || !price || !quantity) {
    return res.status(400).json({ message: 'Faltan datos del producto' });
  }

  const existingItem = cart.find(item => item.id === id);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ id, name, price, quantity, image });
  }

  res.status(201).json({
    message: 'Producto agregado al carrito',
    cart,
    totalQuantity: getTotalQuantity()
  });
});

// Eliminar un producto del carrito
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const index = cart.findIndex(item => item.id == id);

  if (index === -1) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }

  cart.splice(index, 1);

  res.json({
    message: 'Producto eliminado del carrito',
    cart,
    totalQuantity: getTotalQuantity()
  });
});

module.exports = router;
