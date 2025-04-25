const express = require('express');
const router = express.Router();
const { getProducts, addProduct } = require('../controllers/product.controller');

// GET all products
router.get('/', getProducts);

// POST new product
router.post('/', addProduct);

module.exports = router;
