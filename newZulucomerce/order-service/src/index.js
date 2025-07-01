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
const PORT = process.env.PORT || 3004;

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
    service: 'Order Service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    service: 'ZuluCommerce Order Service',
    version: '1.0.0',
    description: 'Servicio de gestión de pedidos',
    endpoints: {
      health: '/health',
      info: '/api/info',
      orders: 'GET/POST /api/orders',
      orderById: 'GET/PUT/DELETE /api/orders/:id',
      updateStatus: 'PUT /api/orders/:id/status',
      userOrders: 'GET /api/orders/user/:userId'
    }
  });
});

// Inicializar base de datos
async function initDatabase() {
  try {
    const client = await pool.connect();
    
    // Crear tabla de pedidos
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_id UUID DEFAULT gen_random_uuid() UNIQUE,
        user_id UUID NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
        total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
        shipping_address TEXT NOT NULL,
        billing_address TEXT NOT NULL,
        payment_method VARCHAR(50),
        payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de items del pedido
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
        product_id UUID NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
        total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de historial de estados
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_status_history (
        id SERIAL PRIMARY KEY,
        order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    client.release();
    console.log('✅ Base de datos de pedidos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos de pedidos:', error);
  }
}

// Middleware de validación
const validateOrder = [
  body('user_id').isUUID().withMessage('user_id debe ser UUID'),
  body('total_amount').isFloat({ min: 0 }).withMessage('total_amount debe ser mayor a 0'),
  body('shipping_address').notEmpty().withMessage('shipping_address es requerido'),
  body('billing_address').notEmpty().withMessage('billing_address es requerido'),
  body('payment_method').optional().isString(),
  body('items').isArray({ min: 1 }).withMessage('items debe ser un array con al menos un elemento'),
  body('items.*.product_id').isUUID().withMessage('product_id debe ser UUID'),
  body('items.*.product_name').notEmpty().withMessage('product_name es requerido'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('quantity debe ser mayor a 0'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('unit_price debe ser mayor a 0')
];

// Obtener todos los pedidos
app.get('/api/orders', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, user_id } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM orders WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (user_id) {
      paramCount++;
      query += ` AND user_id = $${paramCount}`;
      params.push(user_id);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);
    
    // Obtener total de pedidos para paginación
    let countQuery = 'SELECT COUNT(*) FROM orders WHERE 1=1';
    let countParams = [];
    let countParamCount = 0;

    if (status) {
      countParamCount++;
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
    }

    if (user_id) {
      countParamCount++;
      countQuery += ` AND user_id = $${countParamCount}`;
      countParams.push(user_id);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalOrders = parseInt(countResult.rows[0].count);

    res.json({
      orders: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalOrders,
        pages: Math.ceil(totalOrders / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener pedido por ID
app.get('/api/orders/:id', [param('id').isUUID()], async (req, res) => {
  try {
    const { id } = req.params;
    
    const orderResult = await pool.query('SELECT * FROM orders WHERE order_id = $1', [id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const itemsResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
    const historyResult = await pool.query('SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at DESC', [id]);

    res.json({
      order: orderResult.rows[0],
      items: itemsResult.rows,
      status_history: historyResult.rows
    });

  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear un nuevo pedido
app.post('/api/orders', validateOrder, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Error de validación', details: errors.array() });
    }

    const { user_id, total_amount, shipping_address, billing_address, payment_method, items } = req.body;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Crear el pedido
      const orderResult = await client.query(`
        INSERT INTO orders (user_id, total_amount, shipping_address, billing_address, payment_method)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [user_id, total_amount, shipping_address, billing_address, payment_method]);

      const order = orderResult.rows[0];

      // Insertar items del pedido
      for (const item of items) {
        await client.query(`
          INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [order.order_id, item.product_id, item.product_name, item.quantity, item.unit_price, item.total_price]);
      }

      // Insertar estado inicial en el historial
      await client.query(`
        INSERT INTO order_status_history (order_id, status, notes)
        VALUES ($1, $2, $3)
      `, [order.order_id, 'pending', 'Pedido creado']);

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Pedido creado exitosamente',
        order: order
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error creando pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar estado del pedido
app.put('/api/orders/:id/status', [
  param('id').isUUID(),
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Error de validación', details: errors.array() });
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verificar que el pedido existe
      const orderResult = await client.query('SELECT * FROM orders WHERE order_id = $1', [id]);
      if (orderResult.rows.length === 0) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      // Actualizar estado del pedido
      await client.query(`
        UPDATE orders 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE order_id = $2
      `, [status, id]);

      // Agregar al historial
      await client.query(`
        INSERT INTO order_status_history (order_id, status, notes)
        VALUES ($1, $2, $3)
      `, [id, status, notes || `Estado actualizado a ${status}`]);

      await client.query('COMMIT');

      res.json({ message: 'Estado del pedido actualizado' });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error actualizando estado del pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener pedidos de un usuario
app.get('/api/orders/user/:userId', [param('userId').isUUID()], async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(`
      SELECT * FROM orders 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `, [userId, parseInt(limit), offset]);

    const countResult = await pool.query('SELECT COUNT(*) FROM orders WHERE user_id = $1', [userId]);
    const totalOrders = parseInt(countResult.rows[0].count);

    res.json({
      orders: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalOrders,
        pages: Math.ceil(totalOrders / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo pedidos del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar pedido (soft delete)
app.delete('/api/orders/:id', [param('id').isUUID()], async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM orders WHERE order_id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({ message: 'Pedido eliminado' });

  } catch (error) {
    console.error('Error eliminando pedido:', error);
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
  console.error('Order Service Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Error interno del servidor'
  });
});

// Inicializar base de datos y arrancar servidor
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`📦 Order Service iniciado en puerto ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`ℹ️  Info: http://localhost:${PORT}/api/info`);
  });
});

module.exports = app; 