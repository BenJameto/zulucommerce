const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const moment = require('moment');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3006;

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

// Rate limiting más estricto para pagos
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // máximo 50 requests por ventana (más restrictivo para pagos)
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
    service: 'Payment Service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    service: 'ZuluCommerce Payment Service',
    version: '1.0.0',
    description: 'Servicio de procesamiento de pagos',
    endpoints: {
      health: '/health',
      info: '/api/info',
      processPayment: 'POST /api/payments/process',
      getPayment: 'GET /api/payments/:id',
      getPayments: 'GET /api/payments',
      refundPayment: 'POST /api/payments/:id/refund',
      paymentMethods: 'GET/POST /api/payment-methods',
      transactions: 'GET /api/transactions'
    }
  });
});

// Inicializar base de datos
async function initDatabase() {
  try {
    const client = await pool.connect();
    
    // Crear tabla de métodos de pago
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id SERIAL PRIMARY KEY,
        payment_method_id UUID DEFAULT gen_random_uuid() UNIQUE,
        user_id UUID NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('credit_card', 'debit_card', 'paypal', 'bank_transfer')),
        provider VARCHAR(50) NOT NULL,
        last_four VARCHAR(4),
        expiry_month INTEGER CHECK (expiry_month >= 1 AND expiry_month <= 12),
        expiry_year INTEGER CHECK (expiry_year >= 2020),
        is_default BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        encrypted_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de transacciones
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        transaction_id UUID DEFAULT gen_random_uuid() UNIQUE,
        order_id UUID NOT NULL,
        user_id UUID NOT NULL,
        payment_method_id UUID REFERENCES payment_methods(payment_method_id),
        amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
        currency VARCHAR(3) DEFAULT 'USD',
        status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
        payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('payment', 'refund', 'chargeback')),
        gateway_response JSONB,
        gateway_transaction_id VARCHAR(255),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de reembolsos
    await client.query(`
      CREATE TABLE IF NOT EXISTS refunds (
        id SERIAL PRIMARY KEY,
        refund_id UUID DEFAULT gen_random_uuid() UNIQUE,
        transaction_id UUID REFERENCES transactions(transaction_id),
        amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
        reason VARCHAR(100),
        status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
        gateway_refund_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de configuración de gateways
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_gateways (
        id SERIAL PRIMARY KEY,
        gateway_name VARCHAR(50) NOT NULL UNIQUE,
        is_active BOOLEAN DEFAULT true,
        config JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear índices para mejorar rendimiento
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id 
      ON transactions(user_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_order_id 
      ON transactions(order_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_status 
      ON transactions(status)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id 
      ON payment_methods(user_id)
    `);

    // Insertar configuración inicial de gateways
    await client.query(`
      INSERT INTO payment_gateways (gateway_name, config) 
      VALUES 
        ('stripe', '{"api_key": "sk_test_...", "webhook_secret": "whsec_..."}'),
        ('paypal', '{"client_id": "test_client_id", "client_secret": "test_secret"}')
      ON CONFLICT (gateway_name) DO NOTHING
    `);

    client.release();
    console.log('✅ Base de datos de pagos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos de pagos:', error);
  }
}

// Función para encriptar datos sensibles
function encryptData(data) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Función para desencriptar datos
function decryptData(encryptedData) {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Error desencriptando datos:', error);
    return null;
  }
}

// Simular procesamiento de pago con Stripe
async function processStripePayment(paymentData) {
  // En un entorno real, aquí se usaría la API real de Stripe
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.1; // 90% de éxito
      if (success) {
        resolve({
          success: true,
          transaction_id: `txn_${uuidv4().replace(/-/g, '')}`,
          status: 'completed',
          gateway_response: {
            id: `txn_${uuidv4().replace(/-/g, '')}`,
            amount: paymentData.amount,
            currency: paymentData.currency,
            status: 'succeeded'
          }
        });
      } else {
        resolve({
          success: false,
          error: 'Payment failed',
          gateway_response: {
            error: {
              type: 'card_error',
              message: 'Your card was declined'
            }
          }
        });
      }
    }, 1000); // Simular delay de procesamiento
  });
}

// Procesar pago
app.post('/api/payments/process', [
  body('order_id').isUUID().withMessage('order_id debe ser UUID'),
  body('user_id').isUUID().withMessage('user_id debe ser UUID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('amount debe ser mayor a 0'),
  body('currency').optional().isLength({ min: 3, max: 3 }),
  body('payment_method_id').optional().isUUID(),
  body('payment_data').isObject().withMessage('payment_data es requerido'),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Error de validación', details: errors.array() });
    }

    const {
      order_id,
      user_id,
      amount,
      currency = 'USD',
      payment_method_id,
      payment_data,
      description
    } = req.body;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verificar si existe un método de pago
      let paymentMethod = null;
      if (payment_method_id) {
        const methodResult = await client.query(`
          SELECT * FROM payment_methods 
          WHERE payment_method_id = $1 AND user_id = $2 AND is_active = true
        `, [payment_method_id, user_id]);
        
        if (methodResult.rows.length === 0) {
          return res.status(404).json({ error: 'Método de pago no encontrado' });
        }
        paymentMethod = methodResult.rows[0];
      }

      // Procesar pago con gateway
      const paymentResult = await processStripePayment({
        amount,
        currency,
        payment_data,
        payment_method: paymentMethod
      });

      // Crear transacción
      const transactionResult = await client.query(`
        INSERT INTO transactions (
          order_id, user_id, payment_method_id, amount, currency, 
          status, payment_type, gateway_response, gateway_transaction_id, description
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        order_id,
        user_id,
        payment_method_id,
        amount,
        currency,
        paymentResult.success ? 'completed' : 'failed',
        'payment',
        JSON.stringify(paymentResult.gateway_response),
        paymentResult.success ? paymentResult.gateway_response.id : null,
        description
      ]);

      await client.query('COMMIT');

      res.status(201).json({
        success: paymentResult.success,
        transaction: transactionResult.rows[0],
        message: paymentResult.success ? 'Pago procesado exitosamente' : 'Error procesando pago'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error procesando pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener transacción por ID
app.get('/api/payments/:id', [param('id').isUUID()], async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT t.*, pm.type as payment_method_type, pm.provider
      FROM transactions t
      LEFT JOIN payment_methods pm ON t.payment_method_id = pm.payment_method_id
      WHERE t.transaction_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    res.json({ transaction: result.rows[0] });

  } catch (error) {
    console.error('Error obteniendo transacción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener transacciones del usuario
app.get('/api/payments', [
  query('user_id').optional().isUUID(),
  query('order_id').optional().isUUID(),
  query('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled']),
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
      SELECT t.*, pm.type as payment_method_type, pm.provider
      FROM transactions t
      LEFT JOIN payment_methods pm ON t.payment_method_id = pm.payment_method_id
      WHERE 1=1
    `;
    let params = [];
    let paramCount = 0;

    if (user_id) {
      paramCount++;
      sqlQuery += ` AND t.user_id = $${paramCount}`;
      params.push(user_id);
    }

    if (order_id) {
      paramCount++;
      sqlQuery += ` AND t.order_id = $${paramCount}`;
      params.push(order_id);
    }

    if (status) {
      paramCount++;
      sqlQuery += ` AND t.status = $${paramCount}`;
      params.push(status);
    }

    sqlQuery += ` ORDER BY t.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(sqlQuery, params);

    // Contar total para paginación
    let countQuery = `
      SELECT COUNT(*) FROM transactions t
      WHERE 1=1
    `;
    let countParams = [];
    let countParamCount = 0;

    if (user_id) {
      countParamCount++;
      countQuery += ` AND t.user_id = $${countParamCount}`;
      countParams.push(user_id);
    }

    if (order_id) {
      countParamCount++;
      countQuery += ` AND t.order_id = $${countParamCount}`;
      countParams.push(order_id);
    }

    if (status) {
      countParamCount++;
      countQuery += ` AND t.status = $${countParamCount}`;
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalTransactions = parseInt(countResult.rows[0].count);

    res.json({
      transactions: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalTransactions,
        pages: Math.ceil(totalTransactions / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo transacciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Procesar reembolso
app.post('/api/payments/:id/refund', [
  param('id').isUUID(),
  body('amount').isFloat({ min: 0.01 }).withMessage('amount debe ser mayor a 0'),
  body('reason').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Error de validación', details: errors.array() });
    }

    const { id } = req.params;
    const { amount, reason } = req.body;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verificar que la transacción existe y puede ser reembolsada
      const transactionResult = await client.query(`
        SELECT * FROM transactions 
        WHERE transaction_id = $1 AND status = 'completed'
      `, [id]);

      if (transactionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Transacción no encontrada o no puede ser reembolsada' });
      }

      const transaction = transactionResult.rows[0];

      if (amount > transaction.amount) {
        return res.status(400).json({ error: 'El monto del reembolso no puede ser mayor al monto original' });
      }

      // Simular procesamiento de reembolso
      const refundResult = await processStripePayment({
        amount,
        currency: transaction.currency,
        payment_data: { type: 'refund' }
      });

      // Crear transacción de reembolso
      const refundTransactionResult = await client.query(`
        INSERT INTO transactions (
          order_id, user_id, payment_method_id, amount, currency,
          status, payment_type, gateway_response, gateway_transaction_id, description
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        transaction.order_id,
        transaction.user_id,
        transaction.payment_method_id,
        amount,
        transaction.currency,
        refundResult.success ? 'completed' : 'failed',
        'refund',
        JSON.stringify(refundResult.gateway_response),
        refundResult.success ? refundResult.gateway_response.id : null,
        `Reembolso: ${reason || 'Sin motivo especificado'}`
      ]);

      // Actualizar transacción original si es reembolso completo
      if (amount === transaction.amount) {
        await client.query(`
          UPDATE transactions 
          SET status = 'refunded', updated_at = CURRENT_TIMESTAMP
          WHERE transaction_id = $1
        `, [id]);
      }

      // Crear registro de reembolso
      await client.query(`
        INSERT INTO refunds (
          transaction_id, amount, reason, status, gateway_refund_id
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [
        transaction.transaction_id,
        amount,
        reason,
        refundResult.success ? 'completed' : 'failed',
        refundResult.success ? refundResult.gateway_response.id : null
      ]);

      await client.query('COMMIT');

      res.json({
        success: refundResult.success,
        refund: refundTransactionResult.rows[0],
        message: refundResult.success ? 'Reembolso procesado exitosamente' : 'Error procesando reembolso'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error procesando reembolso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener métodos de pago del usuario
app.get('/api/payment-methods', [
  query('user_id').isUUID().withMessage('user_id es requerido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Error de validación', details: errors.array() });
    }

    const { user_id } = req.query;

    const result = await pool.query(`
      SELECT 
        payment_method_id,
        type,
        provider,
        last_four,
        expiry_month,
        expiry_year,
        is_default,
        is_active,
        created_at
      FROM payment_methods
      WHERE user_id = $1 AND is_active = true
      ORDER BY is_default DESC, created_at DESC
    `, [user_id]);

    res.json({ payment_methods: result.rows });

  } catch (error) {
    console.error('Error obteniendo métodos de pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Agregar método de pago
app.post('/api/payment-methods', [
  body('user_id').isUUID().withMessage('user_id debe ser UUID'),
  body('type').isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer']),
  body('provider').isString(),
  body('card_number').optional().isCreditCard(),
  body('expiry_month').optional().isInt({ min: 1, max: 12 }),
  body('expiry_year').optional().isInt({ min: 2020 }),
  body('cvv').optional().isLength({ min: 3, max: 4 }),
  body('is_default').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Error de validación', details: errors.array() });
    }

    const {
      user_id,
      type,
      provider,
      card_number,
      expiry_month,
      expiry_year,
      cvv,
      is_default = false
    } = req.body;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Si es el método por defecto, desactivar otros métodos por defecto
      if (is_default) {
        await client.query(`
          UPDATE payment_methods 
          SET is_default = false 
          WHERE user_id = $1
        `, [user_id]);
      }

      // Encriptar datos sensibles
      let encryptedData = null;
      let lastFour = null;

      if (card_number) {
        encryptedData = encryptData(JSON.stringify({
          card_number,
          cvv,
          expiry_month,
          expiry_year
        }));
        lastFour = card_number.slice(-4);
      }

      // Crear método de pago
      const result = await client.query(`
        INSERT INTO payment_methods (
          user_id, type, provider, last_four, expiry_month, 
          expiry_year, is_default, encrypted_data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING payment_method_id, type, provider, last_four, is_default, created_at
      `, [
        user_id,
        type,
        provider,
        lastFour,
        expiry_month,
        expiry_year,
        is_default,
        encryptedData
      ]);

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Método de pago agregado exitosamente',
        payment_method: result.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error agregando método de pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas de transacciones
app.get('/api/transactions/stats', [
  query('user_id').optional().isUUID(),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601()
], async (req, res) => {
  try {
    const { user_id, start_date, end_date } = req.query;

    let query = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_transactions,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_transactions,
        SUM(CASE WHEN payment_type = 'payment' AND status = 'completed' THEN amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN payment_type = 'refund' AND status = 'completed' THEN amount ELSE 0 END) as total_refunds
      FROM transactions
      WHERE 1=1
    `;
    let params = [];
    let paramCount = 0;

    if (user_id) {
      paramCount++;
      query += ` AND user_id = $${paramCount}`;
      params.push(user_id);
    }

    if (start_date) {
      paramCount++;
      query += ` AND created_at >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND created_at <= $${paramCount}`;
      params.push(end_date);
    }

    const result = await pool.query(query, params);

    res.json({ stats: result.rows[0] });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
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
  console.error('Payment Service Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Error interno del servidor'
  });
});

// Inicializar base de datos y arrancar servidor
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`💳 Payment Service iniciado en puerto ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`ℹ️  Info: http://localhost:${PORT}/api/info`);
  });
});

module.exports = app; 