const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');
const { body, validationResult, param } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Configuración de la base de datos
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres-service',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'zulucommerce',
  user: process.env.DB_USER || 'zulucommerce',
  password: process.env.DB_PASSWORD || 'zulucommerce123',
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: {
    error: 'Too many requests',
    message: 'Demasiadas solicitudes, inténtalo más tarde'
  }
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Product Service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    service: 'ZuluCommerce Product Service',
    version: '1.0.0',
    description: 'Servicio de gestión de productos y catálogo',
    endpoints: {
      health: '/health',
      info: '/api/info',
      products: 'GET/POST /api/products',
      product: 'GET/PUT/DELETE /api/products/:id',
      categories: 'GET/POST /api/categories',
      category: 'GET/PUT/DELETE /api/categories/:id',
      search: 'GET /api/products/search?q=query'
    }
  });
});

// Inicializar base de datos
async function initDatabase() {
  try {
    const client = await pool.connect();
    
    // Crear tabla de categorías
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de productos
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        product_id UUID DEFAULT gen_random_uuid() UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
        stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
        category_id INTEGER REFERENCES categories(id),
        sku VARCHAR(100) UNIQUE,
        image_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear índices
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    `);

    // Insertar categorías de ejemplo si no existen
    const categories = [
      { name: 'Electrónicos', description: 'Productos electrónicos y tecnología' },
      { name: 'Ropa', description: 'Ropa y accesorios' },
      { name: 'Hogar', description: 'Productos para el hogar' },
      { name: 'Deportes', description: 'Artículos deportivos' }
    ];

    for (const category of categories) {
      await client.query(
        'INSERT INTO categories (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [category.name, category.description]
      );
    }

    // Insertar productos de ejemplo si no existen
    const products = [
      {
        name: 'Smartphone Galaxy S23',
        description: 'Smartphone Samsung Galaxy S23 128GB',
        price: 899.99,
        stock_quantity: 50,
        category_id: 1,
        sku: 'SAMS23-128'
      },
      {
        name: 'Camiseta Básica',
        description: 'Camiseta de algodón 100%',
        price: 19.99,
        stock_quantity: 200,
        category_id: 2,
        sku: 'CAM-BAS-001'
      },
      {
        name: 'Lámpara de Mesa LED',
        description: 'Lámpara de mesa con luz LED ajustable',
        price: 45.50,
        stock_quantity: 75,
        category_id: 3,
        sku: 'LAM-LED-001'
      }
    ];

    for (const product of products) {
      await client.query(
        'INSERT INTO products (name, description, price, stock_quantity, category_id, sku) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (sku) DO NOTHING',
        [product.name, product.description, product.price, product.stock_quantity, product.category_id, product.sku]
      );
    }

    client.release();
    console.log('✅ Base de datos de productos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos de productos:', error);
  }
}

// Middleware de validación
const validateProduct = [
  body('name').notEmpty().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim(),
  body('price').isFloat({ min: 0 }),
  body('stock_quantity').isInt({ min: 0 }),
  body('category_id').optional().isInt({ min: 1 }),
  body('sku').optional().trim().isLength({ min: 1, max: 100 })
];

const validateCategory = [
  body('name').notEmpty().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim()
];

// Endpoint para obtener todos los productos
app.get('/api/products', async (req, res) => {
  try {
    const { page = 1, limit = 10, category_id, active } = req.query;
    const offset = (page - 1) * limit;
    
    // Manejar el parámetro active correctamente
    const isActive = active === undefined ? true : active === 'true';
    
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_active = $1
    `;
    let params = [isActive];
    let paramCount = 1;

    if (category_id) {
      paramCount++;
      query += ` AND p.category_id = $${paramCount}`;
      params.push(category_id);
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);
    
    // Obtener total de productos para paginación
    let countQuery = 'SELECT COUNT(*) FROM products WHERE is_active = $1';
    let countParams = [isActive];
    
    if (category_id) {
      countQuery += ' AND category_id = $2';
      countParams.push(category_id);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalProducts = parseInt(countResult.rows[0].count);

    res.json({
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalProducts,
        pages: Math.ceil(totalProducts / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error interno del servidor'
    });
  }
});

// Endpoint para obtener un producto por ID
app.get('/api/products/:id', [
  param('id').isUUID().withMessage('ID de producto inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Error de validación',
        details: errors.array()
      });
    }

    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.product_id = $1 AND p.is_active = true
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'Producto no encontrado'
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error interno del servidor'
    });
  }
});

// Endpoint para crear un producto
app.post('/api/products', validateProduct, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Error de validación',
        details: errors.array()
      });
    }

    const { name, description, price, stock_quantity, category_id, sku } = req.body;

    // Verificar si el SKU ya existe
    if (sku) {
      const existingProduct = await pool.query(
        'SELECT id FROM products WHERE sku = $1',
        [sku]
      );

      if (existingProduct.rows.length > 0) {
        return res.status(409).json({
          error: 'SKU already exists',
          message: 'El SKU ya existe'
        });
      }
    }

    // Crear producto
    const result = await pool.query(`
      INSERT INTO products (name, description, price, stock_quantity, category_id, sku)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, description, price, stock_quantity, category_id, sku]);

    res.status(201).json({
      message: 'Product created successfully',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error interno del servidor'
    });
  }
});

// Endpoint para actualizar un producto
app.put('/api/products/:id', [
  param('id').isUUID().withMessage('ID de producto inválido'),
  ...validateProduct
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Error de validación',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { name, description, price, stock_quantity, category_id, sku } = req.body;

    // Verificar si el producto existe
    const existingProduct = await pool.query(
      'SELECT id FROM products WHERE product_id = $1',
      [id]
    );

    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'Producto no encontrado'
      });
    }

    // Verificar si el SKU ya existe (si se está actualizando)
    if (sku) {
      const skuCheck = await pool.query(
        'SELECT id FROM products WHERE sku = $1 AND product_id != $2',
        [sku, id]
      );

      if (skuCheck.rows.length > 0) {
        return res.status(409).json({
          error: 'SKU already exists',
          message: 'El SKU ya existe'
        });
      }
    }

    // Actualizar producto
    const result = await pool.query(`
      UPDATE products 
      SET name = $1, description = $2, price = $3, stock_quantity = $4, 
          category_id = $5, sku = $6, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = $7
      RETURNING *
    `, [name, description, price, stock_quantity, category_id, sku, id]);

    res.json({
      message: 'Product updated successfully',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error interno del servidor'
    });
  }
});

// Endpoint para eliminar un producto (soft delete)
app.delete('/api/products/:id', [
  param('id').isUUID().withMessage('ID de producto inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Error de validación',
        details: errors.array()
      });
    }

    const { id } = req.params;

    const result = await pool.query(`
      UPDATE products 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = $1
      RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'Producto no encontrado'
      });
    }

    res.json({
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error interno del servidor'
    });
  }
});

// Endpoint para buscar productos
app.get('/api/products/search', async (req, res) => {
  try {
    const { q, category_id, min_price, max_price } = req.query;
    
    if (!q) {
      return res.status(400).json({
        error: 'Search query required',
        message: 'Se requiere un término de búsqueda'
      });
    }

    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_active = true AND (
        p.name ILIKE $1 OR p.description ILIKE $1 OR p.sku ILIKE $1
      )
    `;
    let params = [`%${q}%`];
    let paramCount = 1;

    if (category_id) {
      paramCount++;
      query += ` AND p.category_id = $${paramCount}`;
      params.push(category_id);
    }

    if (min_price) {
      paramCount++;
      query += ` AND p.price >= $${paramCount}`;
      params.push(parseFloat(min_price));
    }

    if (max_price) {
      paramCount++;
      query += ` AND p.price <= $${paramCount}`;
      params.push(parseFloat(max_price));
    }

    query += ' ORDER BY p.name';

    const result = await pool.query(query, params);

    res.json({
      query: q,
      products: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error buscando productos:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error interno del servidor'
    });
  }
});

// Endpoint para obtener todas las categorías
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
      WHERE c.is_active = true
      GROUP BY c.id
      ORDER BY c.name
    `);

    res.json(result.rows);

  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error interno del servidor'
    });
  }
});

// Endpoint para crear una categoría
app.post('/api/categories', validateCategory, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Error de validación',
        details: errors.array()
      });
    }

    const { name, description } = req.body;

    // Verificar si la categoría ya existe
    const existingCategory = await pool.query(
      'SELECT id FROM categories WHERE name = $1',
      [name]
    );

    if (existingCategory.rows.length > 0) {
      return res.status(409).json({
        error: 'Category already exists',
        message: 'La categoría ya existe'
      });
    }

    // Crear categoría
    const result = await pool.query(`
      INSERT INTO categories (name, description)
      VALUES ($1, $2)
      RETURNING *
    `, [name, description]);

    res.status(201).json({
      message: 'Category created successfully',
      category: result.rows[0]
    });

  } catch (error) {
    console.error('Error creando categoría:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error interno del servidor'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'El endpoint solicitado no existe'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Product Service Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Error interno del servidor'
  });
});

// Inicializar base de datos y arrancar servidor
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🛍️  Product Service iniciado en puerto ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`ℹ️  Info: http://localhost:${PORT}/api/info`);
  });
});

module.exports = app; 