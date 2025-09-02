const express = require('express');
const { body, query, validationResult } = require('express-validator');
const productController = require('../controllers/product.controller');

const router = express.Router();

// Validaciones
const productValidation = [
  body('name').notEmpty().trim().withMessage('Nombre del producto requerido'),
  body('description').optional().trim(),
  body('price').isFloat({ min: 0 }).withMessage('Precio debe ser un número positivo'),
  body('sku').notEmpty().trim().withMessage('SKU requerido'),
  body('categoryId').optional().isUUID().withMessage('ID de categoría inválido')
];

const categoryValidation = [
  body('name').notEmpty().trim().withMessage('Nombre de categoría requerido'),
  body('slug').notEmpty().trim().withMessage('Slug requerido'),
  body('description').optional().trim()
];

// Rutas de productos
router.get('/', productController.getAllProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/search', productController.searchProducts);
router.get('/:id', productController.getProductById);
router.get('/:id/variants', productController.getProductVariants);
router.get('/:id/reviews', productController.getProductReviews);

// Rutas de categorías
router.get('/categories', productController.getAllCategories);
router.get('/categories/:id', productController.getCategoryById);
router.get('/categories/:id/products', productController.getProductsByCategory);

// Rutas protegidas (requieren autenticación)
router.post('/', productValidation, productController.createProduct);
router.put('/:id', productValidation, productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

router.post('/categories', categoryValidation, productController.createCategory);
router.put('/categories/:id', categoryValidation, productController.updateCategory);
router.delete('/categories/:id', productController.deleteCategory);

router.post('/:id/reviews', productController.createProductReview);

module.exports = router;
