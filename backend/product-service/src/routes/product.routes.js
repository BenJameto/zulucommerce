const express = require('express');
const router = express.Router();
const { getProducts, addProduct, getProductById } = require('../controllers/product.controller');

// GET all products
router.get('/', getProducts);

// POST new product
router.post('/', addProduct);

// GET producto por ID
router.get('/:id', getProductById);

module.exports = router;
