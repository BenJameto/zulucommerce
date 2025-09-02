const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, query, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { Pool } = require('pg');
const redis = require('redis');
const cron = require('node-cron');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3009;

// Configuración de base de datos PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres-service',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'zulucommerce',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Configuración de Redis para cache
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://redis-service:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect().catch(console.error);

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requests por ventana
  message: 'Demasiadas requests desde esta IP'
});
app.use(limiter);

// Inicializar base de datos
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    // Tabla de inventario principal
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL,
        sku VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        current_stock INTEGER DEFAULT 0,
        reserved_stock INTEGER DEFAULT 0,
        available_stock INTEGER DEFAULT 0,
        min_stock_level INTEGER DEFAULT 10,
        max_stock_level INTEGER DEFAULT 1000,
        unit_cost DECIMAL(10,2),
        unit_price DECIMAL(10,2),
        supplier_id UUID,
        warehouse_location VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Tabla de movimientos de inventario
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id UUID NOT NULL REFERENCES inventory_items(id),
        movement_type VARCHAR(50) NOT NULL,
        quantity INTEGER NOT NULL,
        previous_stock INTEGER NOT NULL,
        new_stock INTEGER NOT NULL,
        reference_id UUID,
        reference_type VARCHAR(50),
        notes TEXT,
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Tabla de reservas de inventario
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_reservations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id UUID NOT NULL REFERENCES inventory_items(id),
        order_id UUID,
        user_id UUID,
        quantity INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Tabla de alertas de inventario
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id UUID NOT NULL REFERENCES inventory_items(id),
        alert_type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        severity VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'active',
        resolved_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Tabla de proveedores
    await client.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        address TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Índices para optimizar consultas
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_inventory_items_product_id ON inventory_items(product_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items(sku);
      CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);
      CREATE INDEX IF NOT EXISTS idx_inventory_movements_item_id ON inventory_movements(item_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type);
      CREATE INDEX IF NOT EXISTS idx_inventory_reservations_item_id ON inventory_reservations(item_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_reservations_status ON inventory_reservations(status);
      CREATE INDEX IF NOT EXISTS idx_inventory_alerts_item_id ON inventory_alerts(item_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_alerts_status ON inventory_alerts(status);
    `);

    client.release();
    console.log('✅ Base de datos de inventario inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  }
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a PostgreSQL
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    // Verificar conexión a Redis
    await redisClient.ping();

    res.json({
      status: 'OK',
      service: 'Inventory Service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      redis: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'Inventory Service',
      error: error.message
    });
  }
});

// Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    service: 'Inventory Service',
    version: '1.0.0',
    description: 'Microservicio de inventario para ZuluCommerce',
    endpoints: {
      health: '/health',
      items: 'GET /api/inventory/items',
      item: 'GET /api/inventory/items/:id',
      create: 'POST /api/inventory/items',
      update: 'PUT /api/inventory/items/:id',
      stock: 'PUT /api/inventory/items/:id/stock',
      reserve: 'POST /api/inventory/reservations',
      movements: 'GET /api/inventory/movements',
      alerts: 'GET /api/inventory/alerts',
      suppliers: 'GET /api/inventory/suppliers',
      low_stock: 'GET /api/inventory/low-stock',
      sync: 'POST /api/inventory/sync'
    }
  });
});

// Get all inventory items
app.get('/api/inventory/items', [
  query('category').optional().isString().withMessage('Category debe ser un string'),
  query('status').optional().isIn(['active', 'inactive', 'discontinued']).withMessage('Status debe ser active, inactive o discontinued'),
  query('low_stock').optional().isBoolean().withMessage('Low stock debe ser un boolean'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit debe ser entre 1 y 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset debe ser un número positivo')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      category,
      status,
      low_stock,
      limit = 50,
      offset = 0
    } = req.query;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (category) {
      whereConditions.push(`category = $${paramIndex++}`);
      params.push(category);
    }

    if (status) {
      whereConditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (low_stock === 'true') {
      whereConditions.push(`current_stock <= min_stock_level`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        id, product_id, sku, name, description, category,
        current_stock, reserved_stock, available_stock,
        min_stock_level, max_stock_level, unit_cost, unit_price,
        supplier_id, warehouse_location, status, created_at, updated_at
      FROM inventory_items
      ${whereClause}
      ORDER BY name
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, [...params, limit, offset]);

    const countResult = await client.query(`
      SELECT COUNT(*) as total
      FROM inventory_items
      ${whereClause}
    `, params);

    client.release();

    res.json({
      items: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: result.rows.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting inventory items:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get inventory item by ID
app.get('/api/inventory/items/:id', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        id, product_id, sku, name, description, category,
        current_stock, reserved_stock, available_stock,
        min_stock_level, max_stock_level, unit_cost, unit_price,
        supplier_id, warehouse_location, status, created_at, updated_at
      FROM inventory_items
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Item de inventario no encontrado' });
    }

    // Obtener movimientos recientes
    const movementsResult = await client.query(`
      SELECT id, movement_type, quantity, previous_stock, new_stock, reference_type, notes, created_at
      FROM inventory_movements
      WHERE item_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [id]);

    // Obtener reservas activas
    const reservationsResult = await client.query(`
      SELECT id, order_id, user_id, quantity, status, expires_at, created_at
      FROM inventory_reservations
      WHERE item_id = $1 AND status = 'pending'
      ORDER BY created_at DESC
    `, [id]);

    client.release();

    res.json({
      item: result.rows[0],
      recent_movements: movementsResult.rows,
      active_reservations: reservationsResult.rows
    });
  } catch (error) {
    console.error('Error getting inventory item:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Create inventory item
app.post('/api/inventory/items', [
  body('product_id').isUUID().withMessage('Product ID debe ser un UUID válido'),
  body('sku').isString().notEmpty().withMessage('SKU es requerido'),
  body('name').isString().notEmpty().withMessage('Name es requerido'),
  body('description').optional().isString().withMessage('Description debe ser un string'),
  body('category').optional().isString().withMessage('Category debe ser un string'),
  body('current_stock').optional().isInt({ min: 0 }).withMessage('Current stock debe ser un número positivo'),
  body('min_stock_level').optional().isInt({ min: 0 }).withMessage('Min stock level debe ser un número positivo'),
  body('max_stock_level').optional().isInt({ min: 0 }).withMessage('Max stock level debe ser un número positivo'),
  body('unit_cost').optional().isFloat({ min: 0 }).withMessage('Unit cost debe ser un número positivo'),
  body('unit_price').optional().isFloat({ min: 0 }).withMessage('Unit price debe ser un número positivo'),
  body('supplier_id').optional().isUUID().withMessage('Supplier ID debe ser un UUID válido'),
  body('warehouse_location').optional().isString().withMessage('Warehouse location debe ser un string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      product_id,
      sku,
      name,
      description,
      category,
      current_stock = 0,
      min_stock_level = 10,
      max_stock_level = 1000,
      unit_cost,
      unit_price,
      supplier_id,
      warehouse_location
    } = req.body;

    const client = await pool.connect();

    // Verificar si el SKU ya existe
    const existingSku = await client.query(`
      SELECT id FROM inventory_items WHERE sku = $1
    `, [sku]);

    if (existingSku.rows.length > 0) {
      client.release();
      return res.status(409).json({ error: 'SKU ya existe' });
    }

    // Crear el item de inventario
    const result = await client.query(`
      INSERT INTO inventory_items (
        product_id, sku, name, description, category,
        current_stock, available_stock, min_stock_level, max_stock_level,
        unit_cost, unit_price, supplier_id, warehouse_location
      )
      VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, created_at
    `, [product_id, sku, name, description, category, current_stock, min_stock_level, max_stock_level, unit_cost, unit_price, supplier_id, warehouse_location]);

    // Registrar el movimiento inicial
    if (current_stock > 0) {
      await client.query(`
        INSERT INTO inventory_movements (
          item_id, movement_type, quantity, previous_stock, new_stock, reference_type, notes
        )
        VALUES ($1, 'initial_stock', $2, 0, $2, 'system', 'Stock inicial')
      `, [result.rows[0].id, current_stock]);
    }

    client.release();

    res.status(201).json({
      success: true,
      item_id: result.rows[0].id,
      created_at: result.rows[0].created_at
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Update inventory item
app.put('/api/inventory/items/:id', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido'),
  body('name').optional().isString().notEmpty().withMessage('Name no puede estar vacío'),
  body('description').optional().isString().withMessage('Description debe ser un string'),
  body('category').optional().isString().withMessage('Category debe ser un string'),
  body('min_stock_level').optional().isInt({ min: 0 }).withMessage('Min stock level debe ser un número positivo'),
  body('max_stock_level').optional().isInt({ min: 0 }).withMessage('Max stock level debe ser un número positivo'),
  body('unit_cost').optional().isFloat({ min: 0 }).withMessage('Unit cost debe ser un número positivo'),
  body('unit_price').optional().isFloat({ min: 0 }).withMessage('Unit price debe ser un número positivo'),
  body('supplier_id').optional().isUUID().withMessage('Supplier ID debe ser un UUID válido'),
  body('warehouse_location').optional().isString().withMessage('Warehouse location debe ser un string'),
  body('status').optional().isIn(['active', 'inactive', 'discontinued']).withMessage('Status debe ser active, inactive o discontinued')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateFields = req.body;

    const client = await pool.connect();

    // Verificar si el item existe
    const existingItem = await client.query(`
      SELECT id FROM inventory_items WHERE id = $1
    `, [id]);

    if (existingItem.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Item de inventario no encontrado' });
    }

    // Construir query de actualización dinámicamente
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updateFields).forEach(key => {
      if (key !== 'id') {
        setClause.push(`${key} = $${paramIndex++}`);
        values.push(updateFields[key]);
      }
    });

    setClause.push(`updated_at = NOW()`);
    values.push(id);

    const result = await client.query(`
      UPDATE inventory_items
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, updated_at
    `, values);

    client.release();

    res.json({
      success: true,
      item_id: result.rows[0].id,
      updated_at: result.rows[0].updated_at
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Update stock level
app.put('/api/inventory/items/:id/stock', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido'),
  body('quantity').isInt().withMessage('Quantity debe ser un número entero'),
  body('movement_type').isIn(['add', 'subtract', 'set']).withMessage('Movement type debe ser add, subtract o set'),
  body('reference_id').optional().isUUID().withMessage('Reference ID debe ser un UUID válido'),
  body('reference_type').optional().isString().withMessage('Reference type debe ser un string'),
  body('notes').optional().isString().withMessage('Notes debe ser un string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      quantity,
      movement_type,
      reference_id,
      reference_type,
      notes
    } = req.body;

    const client = await pool.connect();

    // Obtener stock actual
    const currentStock = await client.query(`
      SELECT current_stock, reserved_stock, available_stock, min_stock_level
      FROM inventory_items
      WHERE id = $1
    `, [id]);

    if (currentStock.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Item de inventario no encontrado' });
    }

    const { current_stock, reserved_stock, min_stock_level } = currentStock.rows[0];
    let newStock;

    // Calcular nuevo stock
    switch (movement_type) {
      case 'add':
        newStock = current_stock + quantity;
        break;
      case 'subtract':
        newStock = current_stock - quantity;
        if (newStock < 0) {
          client.release();
          return res.status(400).json({ error: 'Stock insuficiente' });
        }
        break;
      case 'set':
        newStock = quantity;
        break;
    }

    // Actualizar stock
    await client.query(`
      UPDATE inventory_items
      SET 
        current_stock = $1,
        available_stock = $1 - reserved_stock,
        updated_at = NOW()
      WHERE id = $2
    `, [newStock, id]);

    // Registrar movimiento
    await client.query(`
      INSERT INTO inventory_movements (
        item_id, movement_type, quantity, previous_stock, new_stock, reference_id, reference_type, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [id, movement_type, quantity, current_stock, newStock, reference_id, reference_type, notes]);

    // Verificar si se debe crear alerta de stock bajo
    if (newStock <= min_stock_level) {
      await client.query(`
        INSERT INTO inventory_alerts (item_id, alert_type, message, severity)
        VALUES ($1, 'low_stock', $2, 'high')
      `, [id, `Stock bajo: ${newStock} unidades disponibles`]);
    }

    client.release();

    res.json({
      success: true,
      previous_stock: current_stock,
      new_stock: newStock,
      available_stock: newStock - reserved_stock
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Create reservation
app.post('/api/inventory/reservations', [
  body('item_id').isUUID().withMessage('Item ID debe ser un UUID válido'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity debe ser un número positivo'),
  body('order_id').optional().isUUID().withMessage('Order ID debe ser un UUID válido'),
  body('user_id').optional().isUUID().withMessage('User ID debe ser un UUID válido'),
  body('expires_at').optional().isISO8601().withMessage('Expires at debe ser una fecha válida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      item_id,
      quantity,
      order_id,
      user_id,
      expires_at
    } = req.body;

    const client = await pool.connect();

    // Verificar stock disponible
    const stockCheck = await client.query(`
      SELECT available_stock FROM inventory_items WHERE id = $1
    `, [item_id]);

    if (stockCheck.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Item de inventario no encontrado' });
    }

    const { available_stock } = stockCheck.rows[0];
    if (available_stock < quantity) {
      client.release();
      return res.status(400).json({ 
        error: 'Stock insuficiente',
        available: available_stock,
        requested: quantity
      });
    }

    // Crear reserva
    const result = await client.query(`
      INSERT INTO inventory_reservations (
        item_id, order_id, user_id, quantity, expires_at
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `, [item_id, order_id, user_id, quantity, expires_at]);

    // Actualizar stock reservado
    await client.query(`
      UPDATE inventory_items
      SET 
        reserved_stock = reserved_stock + $1,
        available_stock = current_stock - (reserved_stock + $1),
        updated_at = NOW()
      WHERE id = $2
    `, [quantity, item_id]);

    client.release();

    res.status(201).json({
      success: true,
      reservation_id: result.rows[0].id,
      created_at: result.rows[0].created_at
    });
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get inventory movements
app.get('/api/inventory/movements', [
  query('item_id').optional().isUUID().withMessage('Item ID debe ser un UUID válido'),
  query('movement_type').optional().isString().withMessage('Movement type debe ser un string'),
  query('start_date').optional().isISO8601().withMessage('Start date debe ser una fecha válida'),
  query('end_date').optional().isISO8601().withMessage('End date debe ser una fecha válida'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit debe ser entre 1 y 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset debe ser un número positivo')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      item_id,
      movement_type,
      start_date,
      end_date,
      limit = 50,
      offset = 0
    } = req.query;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (item_id) {
      whereConditions.push(`item_id = $${paramIndex++}`);
      params.push(item_id);
    }

    if (movement_type) {
      whereConditions.push(`movement_type = $${paramIndex++}`);
      params.push(movement_type);
    }

    if (start_date) {
      whereConditions.push(`created_at >= $${paramIndex++}`);
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push(`created_at <= $${paramIndex++}`);
      params.push(end_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        m.id, m.item_id, i.name as item_name, i.sku,
        m.movement_type, m.quantity, m.previous_stock, m.new_stock,
        m.reference_id, m.reference_type, m.notes, m.created_at
      FROM inventory_movements m
      JOIN inventory_items i ON m.item_id = i.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, [...params, limit, offset]);

    client.release();

    res.json({
      movements: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: result.rows.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting movements:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get inventory alerts
app.get('/api/inventory/alerts', [
  query('status').optional().isIn(['active', 'resolved']).withMessage('Status debe ser active o resolved'),
  query('severity').optional().isIn(['low', 'medium', 'high']).withMessage('Severity debe ser low, medium o high'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit debe ser entre 1 y 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset debe ser un número positivo')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      status,
      severity,
      limit = 50,
      offset = 0
    } = req.query;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (status) {
      whereConditions.push(`a.status = $${paramIndex++}`);
      params.push(status);
    }

    if (severity) {
      whereConditions.push(`a.severity = $${paramIndex++}`);
      params.push(severity);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        a.id, a.item_id, i.name as item_name, i.sku,
        a.alert_type, a.message, a.severity, a.status,
        a.resolved_at, a.created_at
      FROM inventory_alerts a
      JOIN inventory_items i ON a.item_id = i.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, [...params, limit, offset]);

    client.release();

    res.json({
      alerts: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: result.rows.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get low stock items
app.get('/api/inventory/low-stock', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit debe ser entre 1 y 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { limit = 20 } = req.query;

    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        id, product_id, sku, name, category,
        current_stock, min_stock_level, max_stock_level,
        unit_cost, unit_price, supplier_id, warehouse_location
      FROM inventory_items
      WHERE current_stock <= min_stock_level AND status = 'active'
      ORDER BY (min_stock_level - current_stock) DESC
      LIMIT $1
    `, [limit]);

    client.release();

    res.json({
      low_stock_items: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error getting low stock items:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Sync inventory with external systems
app.post('/api/inventory/sync', [
  body('source').isString().notEmpty().withMessage('Source es requerido'),
  body('items').isArray().withMessage('Items debe ser un array'),
  body('items.*.product_id').isUUID().withMessage('Product ID debe ser un UUID válido'),
  body('items.*.sku').isString().notEmpty().withMessage('SKU es requerido'),
  body('items.*.quantity').isInt({ min: 0 }).withMessage('Quantity debe ser un número positivo')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { source, items } = req.body;

    const client = await pool.connect();
    const results = [];

    for (const item of items) {
      try {
        // Buscar item por SKU
        const existingItem = await client.query(`
          SELECT id, current_stock FROM inventory_items WHERE sku = $1
        `, [item.sku]);

        if (existingItem.rows.length > 0) {
          // Actualizar stock existente
          const { id, current_stock } = existingItem.rows[0];
          const newStock = item.quantity;

          await client.query(`
            UPDATE inventory_items
            SET 
              current_stock = $1,
              available_stock = $1 - reserved_stock,
              updated_at = NOW()
            WHERE id = $2
          `, [newStock, id]);

          // Registrar movimiento
          await client.query(`
            INSERT INTO inventory_movements (
              item_id, movement_type, quantity, previous_stock, new_stock, reference_type, notes
            )
            VALUES ($1, 'sync', $2, $3, $4, 'system', $5)
          `, [id, Math.abs(newStock - current_stock), current_stock, newStock, `Sync from ${source}`]);

          results.push({
            sku: item.sku,
            status: 'updated',
            previous_stock: current_stock,
            new_stock: newStock
          });
        } else {
          results.push({
            sku: item.sku,
            status: 'not_found',
            error: 'SKU no encontrado en inventario'
          });
        }
      } catch (error) {
        results.push({
          sku: item.sku,
          status: 'error',
          error: error.message
        });
      }
    }

    client.release();

    res.json({
      success: true,
      source,
      synced_items: results.length,
      results
    });
  } catch (error) {
    console.error('Error syncing inventory:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Tarea programada para limpiar reservas expiradas (cada hora)
cron.schedule('0 * * * *', async () => {
  try {
    console.log('🧹 Limpiando reservas expiradas...');
    const client = await pool.connect();
    
    // Obtener reservas expiradas
    const expiredReservations = await client.query(`
      SELECT id, item_id, quantity
      FROM inventory_reservations
      WHERE status = 'pending' AND expires_at < NOW()
    `);

    for (const reservation of expiredReservations.rows) {
      // Liberar stock reservado
      await client.query(`
        UPDATE inventory_items
        SET 
          reserved_stock = reserved_stock - $1,
          available_stock = current_stock - (reserved_stock - $1),
          updated_at = NOW()
        WHERE id = $2
      `, [reservation.quantity, reservation.item_id]);

      // Marcar reserva como expirada
      await client.query(`
        UPDATE inventory_reservations
        SET status = 'expired', updated_at = NOW()
        WHERE id = $1
      `, [reservation.id]);
    }

    client.release();
    console.log(`✅ ${expiredReservations.rows.length} reservas expiradas limpiadas`);
  } catch (error) {
    console.error('❌ Error limpiando reservas expiradas:', error);
  }
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    service: 'Inventory Service',
    available_endpoints: [
      'GET /health',
      'GET /api/info',
      'GET /api/inventory/items',
      'GET /api/inventory/items/:id',
      'POST /api/inventory/items',
      'PUT /api/inventory/items/:id',
      'PUT /api/inventory/items/:id/stock',
      'POST /api/inventory/reservations',
      'GET /api/inventory/movements',
      'GET /api/inventory/alerts',
      'GET /api/inventory/low-stock',
      'POST /api/inventory/sync'
    ]
  });
});

// Inicializar y arrancar servidor
async function startServer() {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Inventory Service ejecutándose en puerto ${PORT}`);
    console.log(`📦 Health check: http://localhost:${PORT}/health`);
    console.log(`📋 Info: http://localhost:${PORT}/api/info`);
  });
}

startServer().catch(console.error);

// Manejo graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  await pool.end();
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  await pool.end();
  await redisClient.quit();
  process.exit(0);
}); 