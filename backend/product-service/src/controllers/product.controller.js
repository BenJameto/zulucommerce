const { validationResult } = require('express-validator');
const { pool } = require('../db/connection');

// Obtener todos los productos
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, sort = 'created_at', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_active = true
    `;
    const queryParams = [];

    if (category) {
      query += ` AND c.slug = $${queryParams.length + 1}`;
      queryParams.push(category);
    }

    query += ` ORDER BY p.${sort} ${order} LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Obtener total de productos
    let countQuery = 'SELECT COUNT(*) FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = true';
    if (category) {
      countQuery += ' AND c.slug = $1';
    }
    const countResult = await pool.query(countQuery, category ? [category] : []);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener productos destacados
const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const result = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.is_active = true AND p.is_featured = true 
       ORDER BY p.created_at DESC 
       LIMIT $1`,
      [limit]
    );

    res.json({ products: result.rows });

  } catch (error) {
    console.error('Error al obtener productos destacados:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Buscar productos
const searchProducts = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({ error: 'Término de búsqueda requerido' });
    }

    const result = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.is_active = true 
       AND (p.name ILIKE $1 OR p.description ILIKE $1 OR p.sku ILIKE $1)
       ORDER BY p.created_at DESC 
       LIMIT $2 OFFSET $3`,
      [`%${q}%`, limit, offset]
    );

    res.json({ products: result.rows });

  } catch (error) {
    console.error('Error al buscar productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener producto por ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = $1 AND p.is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ product: result.rows[0] });

  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener variantes de producto
const getProductVariants = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM product_variants WHERE product_id = $1 AND is_active = true ORDER BY created_at',
      [id]
    );

    res.json({ variants: result.rows });

  } catch (error) {
    console.error('Error al obtener variantes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener reseñas de producto
const getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT * FROM product_reviews 
       WHERE product_id = $1 AND is_approved = true 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    res.json({ reviews: result.rows });

  } catch (error) {
    console.error('Error al obtener reseñas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear producto
const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      price,
      sku,
      categoryId,
      brand,
      weight,
      dimensions,
      images,
      attributes,
      stockQuantity,
      lowStockThreshold
    } = req.body;

    const result = await pool.query(
      `INSERT INTO products (
        name, description, price, sku, category_id, brand, weight, 
        dimensions, images, attributes, stock_quantity, low_stock_threshold
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [name, description, price, sku, categoryId, brand, weight, 
       dimensions, images, attributes, stockQuantity, lowStockThreshold]
    );

    res.status(201).json({
      message: 'Producto creado exitosamente',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear producto:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'El SKU ya existe' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar producto
const updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateFields = req.body;

    // Construir query dinámicamente
    const setClause = Object.keys(updateFields)
      .map((key, index) => `${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${index + 2}`)
      .join(', ');

    const query = `UPDATE products SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;
    const values = [id, ...Object.values(updateFields)];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({
      message: 'Producto actualizado exitosamente',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar producto
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE products SET is_active = false WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado exitosamente' });

  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener todas las categorías
const getAllCategories = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categories WHERE is_active = true ORDER BY name'
    );

    res.json({ categories: result.rows });

  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener categoría por ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM categories WHERE id = $1 AND is_active = true',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json({ category: result.rows[0] });

  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener productos por categoría
const getProductsByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.category_id = $1 AND p.is_active = true 
       ORDER BY p.created_at DESC 
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    res.json({ products: result.rows });

  } catch (error) {
    console.error('Error al obtener productos por categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear categoría
const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, slug, parentId } = req.body;

    const result = await pool.query(
      'INSERT INTO categories (name, description, slug, parent_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, slug, parentId]
    );

    res.status(201).json({
      message: 'Categoría creada exitosamente',
      category: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear categoría:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'El slug ya existe' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar categoría
const updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, slug, parentId } = req.body;

    const result = await pool.query(
      'UPDATE categories SET name = $1, description = $2, slug = $3, parent_id = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, description, slug, parentId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json({
      message: 'Categoría actualizada exitosamente',
      category: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar categoría
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE categories SET is_active = false WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json({ message: 'Categoría eliminada exitosamente' });

  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear reseña de producto
const createProductReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user?.userId || 'anonymous'; // En un sistema real, esto vendría del token

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating debe estar entre 1 y 5' });
    }

    const result = await pool.query(
      'INSERT INTO product_reviews (product_id, user_id, rating, title, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, userId, rating, title, comment]
    );

    res.status(201).json({
      message: 'Reseña creada exitosamente',
      review: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear reseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getAllProducts,
  getFeaturedProducts,
  searchProducts,
  getProductById,
  getProductVariants,
  getProductReviews,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllCategories,
  getCategoryById,
  getProductsByCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  createProductReview
};
