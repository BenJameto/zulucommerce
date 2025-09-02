const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');
const { body, param, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

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
    service: 'Cart Service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    service: 'ZuluCommerce Cart Service',
    version: '1.0.0',
    description: 'Servicio de gestión de carritos de compras',
    endpoints: {
      health: '/health',
      info: '/api/info',
      cart: 'GET/POST /api/cart',
      cartById: 'GET/PUT/DELETE /api/cart/:id',
      addProduct: 'POST /api/cart/:id/add',
      removeProduct: 'POST /api/cart/:id/remove',
      clearCart: 'POST /api/cart/:id/clear'
    }
  });
});

// Inicializar base de datos
async function initDatabase() {
  try {
    const client = await pool.connect();
    // Crear tabla de carritos
    await client.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id SERIAL PRIMARY KEY,
        cart_id UUID DEFAULT gen_random_uuid() UNIQUE,
        user_id UUID,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Crear tabla de productos en el carrito
    await client.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        cart_id UUID REFERENCES carts(cart_id) ON DELETE CASCADE,
        product_id UUID NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    client.release();
    console.log('✅ Base de datos de carritos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos de carritos:', error);
  }
}

// Middleware de validación
const validateCart = [
  body('user_id').optional().isUUID().withMessage('user_id debe ser UUID'),
];

const validateCartItem = [
  body('product_id').isUUID().withMessage('product_id debe ser UUID'),
  body('quantity').isInt({ min: 1 }).withMessage('quantity debe ser mayor a 0'),
];

// Obtener todos los carritos
app.get('/api/cart', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM carts ORDER BY created_at DESC');
    res.json({ carts: result.rows });
  } catch (error) {
    console.error('Error obteniendo carritos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener carrito por ID
app.get('/api/cart/:id', [param('id').isUUID()], async (req, res) => {
  try {
    const { id } = req.params;
    const cartResult = await pool.query('SELECT * FROM carts WHERE cart_id = $1', [id]);
    if (cartResult.rows.length === 0) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }
    const itemsResult = await pool.query('SELECT * FROM cart_items WHERE cart_id = $1', [id]);
    res.json({ cart: cartResult.rows[0], items: itemsResult.rows });
  } catch (error) {
    console.error('Error obteniendo carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear un nuevo carrito
app.post('/api/cart', validateCart, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Error de validación', details: errors.array() });
    }
    const { user_id } = req.body;
    const result = await pool.query(
      'INSERT INTO carts (user_id) VALUES ($1) RETURNING *',
      [user_id || null]
    );
    res.status(201).json({ message: 'Carrito creado', cart: result.rows[0] });
  } catch (error) {
    console.error('Error creando carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Agregar producto al carrito
app.post('/api/cart/:id/add', [param('id').isUUID(), ...validateCartItem], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Error de validación', details: errors.array() });
    }
    const { id } = req.params;
    const { product_id, quantity } = req.body;
    // Verificar que el carrito exista
    const cartResult = await pool.query('SELECT * FROM carts WHERE cart_id = $1', [id]);
    if (cartResult.rows.length === 0) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }
    // Verificar si el producto ya está en el carrito
    const itemResult = await pool.query(
      'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [id, product_id]
    );
    if (itemResult.rows.length > 0) {
      // Si ya existe, actualizar la cantidad
      await pool.query(
        'UPDATE cart_items SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE cart_id = $2 AND product_id = $3',
        [quantity, id, product_id]
      );
    } else {
      // Si no existe, agregar nuevo item
      await pool.query(
        'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)',
        [id, product_id, quantity]
      );
    }
    res.json({ message: 'Producto agregado al carrito' });
  } catch (error) {
    console.error('Error agregando producto al carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Remover producto del carrito
app.post('/api/cart/:id/remove', [param('id').isUUID(), body('product_id').isUUID()], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Error de validación', details: errors.array() });
    }
    const { id } = req.params;
    const { product_id } = req.body;
    await pool.query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [id, product_id]);
    res.json({ message: 'Producto removido del carrito' });
  } catch (error) {
    console.error('Error removiendo producto del carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Vaciar carrito
app.post('/api/cart/:id/clear', [param('id').isUUID()], async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [id]);
    res.json({ message: 'Carrito vaciado' });
  } catch (error) {
    console.error('Error vaciando carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar carrito
app.delete('/api/cart/:id', [param('id').isUUID()], async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM carts WHERE cart_id = $1', [id]);
    res.json({ message: 'Carrito eliminado' });
  } catch (error) {
    console.error('Error eliminando carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
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
  console.error('Cart Service Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Error interno del servidor'
  });
});

// Inicializar base de datos y arrancar servidor
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🛒 Cart Service iniciado en puerto ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`ℹ️  Info: http://localhost:${PORT}/api/info`);
  });
});

module.exports = app; 