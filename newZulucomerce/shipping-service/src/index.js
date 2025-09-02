const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3007;

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
    service: 'Shipping Service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    service: 'ZuluCommerce Shipping Service',
    version: '1.0.0',
    description: 'Servicio de gestión de envíos y logística',
    endpoints: {
      health: '/health',
      info: '/api/info',
      calculateShipping: 'POST /api/shipping/calculate',
      createShipment: 'POST /api/shipping/create',
      getShipment: 'GET /api/shipping/:id',
      trackShipment: 'GET /api/shipping/track/:id',
      updateStatus: 'PUT /api/shipping/:id/status',
      getRates: 'GET /api/shipping/rates',
      getShipments: 'GET /api/shipping'
    }
  });
});

// Inicializar base de datos
async function initDatabase() {
  try {
    const client = await pool.connect();
    
    // Crear tabla de envíos
    await client.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id SERIAL PRIMARY KEY,
        shipment_id UUID DEFAULT gen_random_uuid() UNIQUE,
        order_id UUID NOT NULL,
        user_id UUID NOT NULL,
        carrier VARCHAR(50) NOT NULL,
        service_type VARCHAR(50) NOT NULL,
        tracking_number VARCHAR(100),
        status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'in_transit', 'delivered', 'failed', 'returned')),
        origin_address JSONB NOT NULL,
        destination_address JSONB NOT NULL,
        package_details JSONB NOT NULL,
        shipping_cost DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        estimated_delivery_date DATE,
        actual_delivery_date DATE,
        carrier_response JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de tarifas de envío
    await client.query(`
      CREATE TABLE IF NOT EXISTS shipping_rates (
        id SERIAL PRIMARY KEY,
        rate_id UUID DEFAULT gen_random_uuid() UNIQUE,
        carrier VARCHAR(50) NOT NULL,
        service_type VARCHAR(50) NOT NULL,
        origin_country VARCHAR(3) NOT NULL,
        destination_country VARCHAR(3) NOT NULL,
        weight_min DECIMAL(8,2),
        weight_max DECIMAL(8,2),
        base_rate DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        delivery_days_min INTEGER,
        delivery_days_max INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de tracking events
    await client.query(`
      CREATE TABLE IF NOT EXISTS tracking_events (
        id SERIAL PRIMARY KEY,
        event_id UUID DEFAULT gen_random_uuid() UNIQUE,
        shipment_id UUID REFERENCES shipments(shipment_id),
        event_type VARCHAR(50) NOT NULL,
        event_description TEXT,
        location VARCHAR(255),
        timestamp TIMESTAMP NOT NULL,
        carrier_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear índices para mejorar rendimiento
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_shipments_order_id 
      ON shipments(order_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_shipments_user_id 
      ON shipments(user_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_shipments_status 
      ON shipments(status)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number 
      ON shipments(tracking_number)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment_id 
      ON tracking_events(shipment_id)
    `);

    // Insertar tarifas de ejemplo
    await client.query(`
      INSERT INTO shipping_rates (carrier, service_type, origin_country, destination_country, weight_min, weight_max, base_rate, delivery_days_min, delivery_days_max) 
      VALUES 
        ('fedex', 'ground', 'US', 'US', 0, 70, 8.99, 1, 5),
        ('fedex', 'express', 'US', 'US', 0, 70, 15.99, 1, 2),
        ('ups', 'ground', 'US', 'US', 0, 70, 9.99, 1, 5),
        ('ups', 'next_day', 'US', 'US', 0, 70, 25.99, 1, 1),
        ('usps', 'priority', 'US', 'US', 0, 70, 7.99, 1, 3),
        ('usps', 'first_class', 'US', 'US', 0, 13, 4.99, 1, 7)
      ON CONFLICT DO NOTHING
    `);

    client.release();
    console.log('✅ Base de datos de envíos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos de envíos:', error);
  }
}

// Función para simular cálculo de tarifas de envío
async function calculateShippingRates(origin, destination, packageDetails) {
  try {
    // Simular llamada a API de carrier
    const weight = packageDetails.weight || 1;
    const length = packageDetails.length || 10;
    const width = packageDetails.width || 10;
    const height = packageDetails.height || 10;

    // Obtener tarifas de la base de datos
    const result = await pool.query(`
      SELECT * FROM shipping_rates 
      WHERE origin_country = $1 
      AND destination_country = $2 
      AND weight_min <= $3 
      AND weight_max >= $3 
      AND is_active = true
      ORDER BY base_rate ASC
    `, [origin.country, destination.country, weight]);

    const rates = result.rows.map(rate => ({
      carrier: rate.carrier,
      service_type: rate.service_type,
      cost: parseFloat(rate.base_rate),
      currency: rate.currency,
      estimated_days: {
        min: rate.delivery_days_min,
        max: rate.delivery_days_max
      },
      rate_id: rate.rate_id
    }));

    return {
      success: true,
      rates: rates,
      origin: origin,
      destination: destination,
      package: packageDetails
    };
  } catch (error) {
    console.error('Error calculando tarifas:', error);
    return {
      success: false,
      error: 'Error calculando tarifas de envío'
    };
  }
}

// Función para simular creación de envío
async function createShipmentWithCarrier(shipmentData) {
  try {
    // Simular llamada a API de carrier
    const trackingNumber = `TRK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    return {
      success: true,
      tracking_number: trackingNumber,
      carrier_response: {
        id: `ship_${Date.now()}`,
        tracking_number: trackingNumber,
        status: 'processing',
        estimated_delivery: moment().add(3, 'days').format('YYYY-MM-DD')
      }
    };
  } catch (error) {
    console.error('Error creando envío con carrier:', error);
    return {
      success: false,
      error: 'Error creando envío con carrier'
    };
  }
}

// Calcular tarifas de envío
app.post('/api/shipping/calculate', [
  body('origin').isObject().withMessage('origin debe ser un objeto'),
  body('origin.street').isString().notEmpty().withMessage('origin.street es requerido'),
  body('origin.city').isString().notEmpty().withMessage('origin.city es requerido'),
  body('origin.state').isString().notEmpty().withMessage('origin.state es requerido'),
  body('origin.country').isString().isLength({ min: 2, max: 3 }).withMessage('origin.country debe ser un código de país válido'),
  body('origin.zip_code').isString().notEmpty().withMessage('origin.zip_code es requerido'),
  body('destination').isObject().withMessage('destination debe ser un objeto'),
  body('destination.street').isString().notEmpty().withMessage('destination.street es requerido'),
  body('destination.city').isString().notEmpty().withMessage('destination.city es requerido'),
  body('destination.state').isString().notEmpty().withMessage('destination.state es requerido'),
  body('destination.country').isString().isLength({ min: 2, max: 3 }).withMessage('destination.country debe ser un código de país válido'),
  body('destination.zip_code').isString().notEmpty().withMessage('destination.zip_code es requerido'),
  body('package').isObject().withMessage('package debe ser un objeto'),
  body('package.weight').isFloat({ min: 0.1 }).withMessage('package.weight debe ser mayor a 0'),
  body('package.length').optional().isFloat({ min: 0.1 }),
  body('package.width').optional().isFloat({ min: 0.1 }),
  body('package.height').optional().isFloat({ min: 0.1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Error de validación', details: errors.array() });
    }

    const { origin, destination, package } = req.body;

    const result = await calculateShippingRates(origin, destination, package);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result);

  } catch (error) {
    console.error('Error calculando envío:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear envío
app.post('/api/shipping/create', [
  body('order_id').isUUID().withMessage('order_id debe ser un UUID válido'),
  body('user_id').isUUID().withMessage('user_id debe ser un UUID válido'),
  body('carrier').isString().notEmpty().withMessage('carrier es requerido'),
  body('service_type').isString().notEmpty().withMessage('service_type es requerido'),
  body('origin_address').isObject().withMessage('origin_address debe ser un objeto'),
  body('destination_address').isObject().withMessage('destination_address debe ser un objeto'),
  body('package_details').isObject().withMessage('package_details debe ser un objeto'),
  body('shipping_cost').isFloat({ min: 0 }).withMessage('shipping_cost debe ser mayor o igual a 0')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Error de validación', details: errors.array() });
    }

    const {
      order_id,
      user_id,
      carrier,
      service_type,
      origin_address,
      destination_address,
      package_details,
      shipping_cost,
      currency = 'USD'
    } = req.body;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Crear envío con carrier
      const carrierResult = await createShipmentWithCarrier({
        carrier,
        service_type,
        origin_address,
        destination_address,
        package_details
      });

      if (!carrierResult.success) {
        return res.status(500).json({ error: carrierResult.error });
      }

      // Calcular fecha estimada de entrega
      const estimatedDelivery = moment().add(3, 'days').format('YYYY-MM-DD');

      // Crear envío en base de datos
      const shipmentResult = await client.query(`
        INSERT INTO shipments (
          order_id, user_id, carrier, service_type, tracking_number,
          origin_address, destination_address, package_details,
          shipping_cost, currency, estimated_delivery_date, carrier_response
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        order_id,
        user_id,
        carrier,
        service_type,
        carrierResult.tracking_number,
        JSON.stringify(origin_address),
        JSON.stringify(destination_address),
        JSON.stringify(package_details),
        shipping_cost,
        currency,
        estimatedDelivery,
        JSON.stringify(carrierResult.carrier_response)
      ]);

      // Crear evento de tracking inicial
      await client.query(`
        INSERT INTO tracking_events (
          shipment_id, event_type, event_description, location, timestamp
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [
        shipmentResult.rows[0].shipment_id,
        'created',
        'Envío creado',
        origin_address.city + ', ' + origin_address.state,
        new Date()
      ]);

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        shipment: shipmentResult.rows[0],
        message: 'Envío creado exitosamente'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error creando envío:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener tarifas disponibles - MUST BE BEFORE /api/shipping/:id
app.get('/api/shipping/rates', [
  query('origin_country').isString().isLength({ min: 2, max: 3 }).withMessage('origin_country debe ser un código de país válido'),
  query('destination_country').isString().isLength({ min: 2, max: 3 }).withMessage('destination_country debe ser un código de país válido'),
  query('weight').optional().isFloat({ min: 0.1 }).withMessage('weight debe ser mayor a 0')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Error de validación', details: errors.array() });
    }

    const { origin_country, destination_country, weight = 1 } = req.query;

    const result = await pool.query(`
      SELECT * FROM shipping_rates 
      WHERE origin_country = $1 
      AND destination_country = $2 
      AND weight_min <= $3 
      AND weight_max >= $3 
      AND is_active = true
      ORDER BY base_rate ASC
    `, [origin_country, destination_country, weight]);

    res.json({
      rates: result.rows,
      origin_country,
      destination_country,
      weight: parseFloat(weight)
    });

  } catch (error) {
    console.error('Error obteniendo tarifas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener envío por ID
app.get('/api/shipping/:id', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Error de validación', details: errors.array() });
    }

    const { id } = req.params;

    const result = await pool.query(`
      SELECT * FROM shipments WHERE shipment_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Envío no encontrado' });
    }

    res.json({ shipment: result.rows[0] });

  } catch (error) {
    console.error('Error obteniendo envío:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Tracking de envío
app.get('/api/shipping/track/:id', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Error de validación', details: errors.array() });
    }

    const { id } = req.params;

    // Obtener envío
    const shipmentResult = await pool.query(`
      SELECT * FROM shipments WHERE shipment_id = $1
    `, [id]);

    if (shipmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Envío no encontrado' });
    }

    // Obtener eventos de tracking
    const eventsResult = await pool.query(`
      SELECT * FROM tracking_events 
      WHERE shipment_id = $1 
      ORDER BY timestamp DESC
    `, [id]);

    res.json({
      shipment: shipmentResult.rows[0],
      tracking_events: eventsResult.rows
    });

  } catch (error) {
    console.error('Error obteniendo tracking:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar estado de envío
app.put('/api/shipping/:id/status', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido'),
  body('status').isIn(['pending', 'processing', 'shipped', 'in_transit', 'delivered', 'failed', 'returned']).withMessage('status debe ser un valor válido'),
  body('event_description').optional().isString(),
  body('location').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Error de validación', details: errors.array() });
    }

    const { id } = req.params;
    const { status, event_description, location } = req.body;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Actualizar estado del envío
      const updateResult = await client.query(`
        UPDATE shipments 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE shipment_id = $2
        RETURNING *
      `, [status, id]);

      if (updateResult.rows.length === 0) {
        return res.status(404).json({ error: 'Envío no encontrado' });
      }

      // Crear evento de tracking
      await client.query(`
        INSERT INTO tracking_events (
          shipment_id, event_type, event_description, location, timestamp
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [
        id,
        status,
        event_description || `Estado actualizado a: ${status}`,
        location,
        new Date()
      ]);

      await client.query('COMMIT');

      res.json({
        success: true,
        shipment: updateResult.rows[0],
        message: 'Estado actualizado exitosamente'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener envíos del usuario
app.get('/api/shipping', [
  query('user_id').optional().isUUID(),
  query('order_id').optional().isUUID(),
  query('status').optional().isIn(['pending', 'processing', 'shipped', 'in_transit', 'delivered', 'failed', 'returned']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Error de validación', details: errors.array() });
    }

    const { user_id, order_id, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let sqlQuery = `
      SELECT * FROM shipments WHERE 1=1
    `;
    let params = [];
    let paramCount = 0;

    if (user_id) {
      paramCount++;
      sqlQuery += ` AND user_id = $${paramCount}`;
      params.push(user_id);
    }

    if (order_id) {
      paramCount++;
      sqlQuery += ` AND order_id = $${paramCount}`;
      params.push(order_id);
    }

    if (status) {
      paramCount++;
      sqlQuery += ` AND status = $${paramCount}`;
      params.push(status);
    }

    sqlQuery += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(sqlQuery, params);

    // Contar total para paginación
    let countQuery = `
      SELECT COUNT(*) FROM shipments WHERE 1=1
    `;
    let countParams = [];
    let countParamCount = 0;

    if (user_id) {
      countParamCount++;
      countQuery += ` AND user_id = $${countParamCount}`;
      countParams.push(user_id);
    }

    if (order_id) {
      countParamCount++;
      countQuery += ` AND order_id = $${countParamCount}`;
      countParams.push(order_id);
    }

    if (status) {
      countParamCount++;
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalShipments = parseInt(countResult.rows[0].count);

    res.json({
      shipments: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalShipments,
        pages: Math.ceil(totalShipments / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo envíos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Inicializar base de datos al arrancar
initDatabase();

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚚 Shipping Service iniciado en puerto', PORT);
  console.log('📊 Health check: http://localhost:' + PORT + '/health');
  console.log('ℹ️  Info: http://localhost:' + PORT + '/api/info');
}); 