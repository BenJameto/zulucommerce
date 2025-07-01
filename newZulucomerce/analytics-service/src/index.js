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
const PORT = process.env.PORT || 3008;

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
    
    // Tabla de eventos de analytics
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        session_id VARCHAR(255),
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB,
        page_url VARCHAR(500),
        referrer VARCHAR(500),
        user_agent TEXT,
        ip_address INET,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Tabla de métricas de ventas
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID,
        user_id UUID,
        total_amount DECIMAL(10,2),
        items_count INTEGER,
        conversion_source VARCHAR(100),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Tabla de métricas de productos
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID,
        views_count INTEGER DEFAULT 0,
        add_to_cart_count INTEGER DEFAULT 0,
        purchase_count INTEGER DEFAULT 0,
        date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Tabla de métricas de usuarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        session_count INTEGER DEFAULT 0,
        page_views INTEGER DEFAULT 0,
        time_on_site INTEGER DEFAULT 0,
        last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Índices para optimizar consultas
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_sales_metrics_timestamp ON sales_metrics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_product_metrics_date ON product_metrics(date);
      CREATE INDEX IF NOT EXISTS idx_user_metrics_user_id ON user_metrics(user_id);
    `);

    client.release();
    console.log('✅ Base de datos de analytics inicializada correctamente');
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
      service: 'Analytics Service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      redis: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'Analytics Service',
      error: error.message
    });
  }
});

// Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    service: 'Analytics Service',
    version: '1.0.0',
    description: 'Microservicio de analytics para ZuluCommerce',
    endpoints: {
      health: '/health',
      track: 'POST /api/analytics/track',
      events: 'GET /api/analytics/events',
      metrics: 'GET /api/analytics/metrics',
      sales: 'GET /api/analytics/sales',
      products: 'GET /api/analytics/products',
      users: 'GET /api/analytics/users',
      reports: 'GET /api/analytics/reports'
    }
  });
});

// Track event endpoint
app.post('/api/analytics/track', [
  body('event_type').isString().notEmpty().withMessage('Event type es requerido'),
  body('user_id').optional().isUUID().withMessage('User ID debe ser un UUID válido'),
  body('session_id').optional().isString().withMessage('Session ID debe ser un string'),
  body('event_data').optional().isObject().withMessage('Event data debe ser un objeto'),
  body('page_url').optional().isURL().withMessage('Page URL debe ser una URL válida'),
  body('referrer').optional().isURL().withMessage('Referrer debe ser una URL válida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      event_type,
      user_id,
      session_id,
      event_data,
      page_url,
      referrer
    } = req.body;

    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');

    const client = await pool.connect();
    const result = await client.query(`
      INSERT INTO analytics_events (user_id, session_id, event_type, event_data, page_url, referrer, user_agent, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, timestamp
    `, [user_id, session_id, event_type, event_data, page_url, referrer, user_agent, ip_address]);

    client.release();

    // Actualizar métricas en tiempo real
    await updateRealTimeMetrics(event_type, user_id, event_data);

    res.status(201).json({
      success: true,
      event_id: result.rows[0].id,
      timestamp: result.rows[0].timestamp
    });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get events endpoint
app.get('/api/analytics/events', [
  query('user_id').optional().isUUID().withMessage('User ID debe ser un UUID válido'),
  query('event_type').optional().isString().withMessage('Event type debe ser un string'),
  query('start_date').optional().isISO8601().withMessage('Start date debe ser una fecha válida'),
  query('end_date').optional().isISO8601().withMessage('End date debe ser una fecha válida'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit debe ser entre 1 y 1000'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset debe ser un número positivo')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      user_id,
      event_type,
      start_date,
      end_date,
      limit = 100,
      offset = 0
    } = req.query;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (user_id) {
      whereConditions.push(`user_id = $${paramIndex++}`);
      params.push(user_id);
    }

    if (event_type) {
      whereConditions.push(`event_type = $${paramIndex++}`);
      params.push(event_type);
    }

    if (start_date) {
      whereConditions.push(`timestamp >= $${paramIndex++}`);
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push(`timestamp <= $${paramIndex++}`);
      params.push(end_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const client = await pool.connect();
    const result = await client.query(`
      SELECT id, user_id, session_id, event_type, event_data, page_url, referrer, timestamp
      FROM analytics_events
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, [...params, limit, offset]);

    const countResult = await client.query(`
      SELECT COUNT(*) as total
      FROM analytics_events
      ${whereClause}
    `, params);

    client.release();

    res.json({
      events: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: result.rows.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get metrics endpoint
app.get('/api/analytics/metrics', [
  query('start_date').optional().isISO8601().withMessage('Start date debe ser una fecha válida'),
  query('end_date').optional().isISO8601().withMessage('End date debe ser una fecha válida'),
  query('group_by').optional().isIn(['hour', 'day', 'week', 'month']).withMessage('Group by debe ser hour, day, week o month')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      start_date = moment().subtract(30, 'days').toISOString(),
      end_date = moment().toISOString(),
      group_by = 'day'
    } = req.query;

    const client = await pool.connect();

    // Métricas generales
    const generalMetrics = await client.query(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
        COUNT(CASE WHEN event_type = 'add_to_cart' THEN 1 END) as add_to_cart_events,
        COUNT(CASE WHEN event_type = 'purchase' THEN 1 END) as purchase_events
      FROM analytics_events
      WHERE timestamp BETWEEN $1 AND $2
    `, [start_date, end_date]);

    // Métricas por período
    let timeGroup;
    switch (group_by) {
      case 'hour':
        timeGroup = "DATE_TRUNC('hour', timestamp)";
        break;
      case 'day':
        timeGroup = "DATE_TRUNC('day', timestamp)";
        break;
      case 'week':
        timeGroup = "DATE_TRUNC('week', timestamp)";
        break;
      case 'month':
        timeGroup = "DATE_TRUNC('month', timestamp)";
        break;
    }

    const timeSeriesMetrics = await client.query(`
      SELECT 
        ${timeGroup} as period,
        COUNT(*) as events,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
        COUNT(CASE WHEN event_type = 'add_to_cart' THEN 1 END) as add_to_cart,
        COUNT(CASE WHEN event_type = 'purchase' THEN 1 END) as purchases
      FROM analytics_events
      WHERE timestamp BETWEEN $1 AND $2
      GROUP BY ${timeGroup}
      ORDER BY period
    `, [start_date, end_date]);

    // Top eventos
    const topEvents = await client.query(`
      SELECT 
        event_type,
        COUNT(*) as count
      FROM analytics_events
      WHERE timestamp BETWEEN $1 AND $2
      GROUP BY event_type
      ORDER BY count DESC
      LIMIT 10
    `, [start_date, end_date]);

    client.release();

    res.json({
      period: {
        start_date,
        end_date,
        group_by
      },
      general: generalMetrics.rows[0],
      time_series: timeSeriesMetrics.rows,
      top_events: topEvents.rows
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get sales metrics endpoint
app.get('/api/analytics/sales', [
  query('start_date').optional().isISO8601().withMessage('Start date debe ser una fecha válida'),
  query('end_date').optional().isISO8601().withMessage('End date debe ser una fecha válida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      start_date = moment().subtract(30, 'days').toISOString(),
      end_date = moment().toISOString()
    } = req.query;

    const client = await pool.connect();

    // Métricas de ventas
    const salesMetrics = await client.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value,
        SUM(items_count) as total_items_sold,
        COUNT(DISTINCT user_id) as unique_customers
      FROM sales_metrics
      WHERE timestamp BETWEEN $1 AND $2
    `, [start_date, end_date]);

    // Ventas por día
    const dailySales = await client.query(`
      SELECT 
        DATE_TRUNC('day', timestamp) as date,
        COUNT(*) as orders,
        SUM(total_amount) as revenue,
        AVG(total_amount) as avg_order_value
      FROM sales_metrics
      WHERE timestamp BETWEEN $1 AND $2
      GROUP BY DATE_TRUNC('day', timestamp)
      ORDER BY date
    `, [start_date, end_date]);

    // Top fuentes de conversión
    const conversionSources = await client.query(`
      SELECT 
        conversion_source,
        COUNT(*) as orders,
        SUM(total_amount) as revenue
      FROM sales_metrics
      WHERE timestamp BETWEEN $1 AND $2
      GROUP BY conversion_source
      ORDER BY revenue DESC
    `, [start_date, end_date]);

    client.release();

    res.json({
      period: { start_date, end_date },
      summary: salesMetrics.rows[0],
      daily_sales: dailySales.rows,
      conversion_sources: conversionSources.rows
    });
  } catch (error) {
    console.error('Error getting sales metrics:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get product metrics endpoint
app.get('/api/analytics/products', [
  query('start_date').optional().isISO8601().withMessage('Start date debe ser una fecha válida'),
  query('end_date').optional().isISO8601().withMessage('End date debe ser una fecha válida'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit debe ser entre 1 y 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      start_date = moment().subtract(30, 'days').toISOString(),
      end_date = moment().toISOString(),
      limit = 20
    } = req.query;

    const client = await pool.connect();

    // Top productos por vistas
    const topViewedProducts = await client.query(`
      SELECT 
        product_id,
        SUM(views_count) as total_views,
        SUM(add_to_cart_count) as total_add_to_cart,
        SUM(purchase_count) as total_purchases,
        ROUND((SUM(purchase_count)::DECIMAL / NULLIF(SUM(views_count), 0)) * 100, 2) as conversion_rate
      FROM product_metrics
      WHERE date BETWEEN $1::DATE AND $2::DATE
      GROUP BY product_id
      ORDER BY total_views DESC
      LIMIT $3
    `, [start_date, end_date, limit]);

    // Productos con mejor conversión
    const bestConvertingProducts = await client.query(`
      SELECT 
        product_id,
        SUM(views_count) as total_views,
        SUM(add_to_cart_count) as total_add_to_cart,
        SUM(purchase_count) as total_purchases,
        ROUND((SUM(purchase_count)::DECIMAL / NULLIF(SUM(views_count), 0)) * 100, 2) as conversion_rate
      FROM product_metrics
      WHERE date BETWEEN $1::DATE AND $2::DATE
        AND views_count > 0
      GROUP BY product_id
      ORDER BY conversion_rate DESC
      LIMIT $3
    `, [start_date, end_date, limit]);

    client.release();

    res.json({
      period: { start_date, end_date },
      top_viewed: topViewedProducts.rows,
      best_converting: bestConvertingProducts.rows
    });
  } catch (error) {
    console.error('Error getting product metrics:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get user metrics endpoint
app.get('/api/analytics/users', [
  query('start_date').optional().isISO8601().withMessage('Start date debe ser una fecha válida'),
  query('end_date').optional().isISO8601().withMessage('End date debe ser una fecha válida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      start_date = moment().subtract(30, 'days').toISOString(),
      end_date = moment().toISOString()
    } = req.query;

    const client = await pool.connect();

    // Métricas de usuarios
    const userMetrics = await client.query(`
      SELECT 
        COUNT(DISTINCT user_id) as total_users,
        AVG(session_count) as avg_sessions_per_user,
        AVG(page_views) as avg_page_views_per_user,
        AVG(time_on_site) as avg_time_on_site,
        COUNT(CASE WHEN session_count > 1 THEN 1 END) as returning_users
      FROM user_metrics
      WHERE updated_at BETWEEN $1 AND $2
    `, [start_date, end_date]);

    // Usuarios más activos
    const mostActiveUsers = await client.query(`
      SELECT 
        user_id,
        session_count,
        page_views,
        time_on_site,
        last_activity
      FROM user_metrics
      WHERE updated_at BETWEEN $1 AND $2
      ORDER BY page_views DESC
      LIMIT 20
    `, [start_date, end_date]);

    client.release();

    res.json({
      period: { start_date, end_date },
      summary: userMetrics.rows[0],
      most_active: mostActiveUsers.rows
    });
  } catch (error) {
    console.error('Error getting user metrics:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get reports endpoint
app.get('/api/analytics/reports', [
  query('report_type').isIn(['daily', 'weekly', 'monthly']).withMessage('Report type debe ser daily, weekly o monthly'),
  query('date').optional().isISO8601().withMessage('Date debe ser una fecha válida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { report_type, date = moment().format('YYYY-MM-DD') } = req.query;

    let startDate, endDate;
    switch (report_type) {
      case 'daily':
        startDate = moment(date).startOf('day');
        endDate = moment(date).endOf('day');
        break;
      case 'weekly':
        startDate = moment(date).startOf('week');
        endDate = moment(date).endOf('week');
        break;
      case 'monthly':
        startDate = moment(date).startOf('month');
        endDate = moment(date).endOf('month');
        break;
    }

    const client = await pool.connect();

    // Reporte completo
    const report = await client.query(`
      SELECT 
        'events' as metric_type,
        COUNT(*) as total_events,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
        COUNT(CASE WHEN event_type = 'add_to_cart' THEN 1 END) as add_to_cart_events,
        COUNT(CASE WHEN event_type = 'purchase' THEN 1 END) as purchase_events
      FROM analytics_events
      WHERE timestamp BETWEEN $1 AND $2
      
      UNION ALL
      
      SELECT 
        'sales' as metric_type,
        COUNT(*) as total_orders,
        COUNT(DISTINCT user_id) as unique_customers,
        NULL as total_sessions,
        NULL as page_views,
        NULL as add_to_cart_events,
        SUM(total_amount) as revenue
      FROM sales_metrics
      WHERE timestamp BETWEEN $1 AND $2
    `, [startDate.toISOString(), endDate.toISOString()]);

    client.release();

    const eventsData = report.rows.find(r => r.metric_type === 'events');
    const salesData = report.rows.find(r => r.metric_type === 'sales');

    res.json({
      report_type,
      period: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      },
      events: eventsData,
      sales: salesData,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Función para actualizar métricas en tiempo real
async function updateRealTimeMetrics(eventType, userId, eventData) {
  try {
    const client = await pool.connect();

    // Actualizar métricas de productos si el evento es relacionado
    if (eventData && eventData.product_id) {
      const productId = eventData.product_id;
      
      // Verificar si existe registro para hoy
      const existingRecord = await client.query(`
        SELECT id FROM product_metrics 
        WHERE product_id = $1 AND date = CURRENT_DATE
      `, [productId]);

      if (existingRecord.rows.length > 0) {
        // Actualizar registro existente
        let updateField = '';
        switch (eventType) {
          case 'product_view':
            updateField = 'views_count = views_count + 1';
            break;
          case 'add_to_cart':
            updateField = 'add_to_cart_count = add_to_cart_count + 1';
            break;
          case 'purchase':
            updateField = 'purchase_count = purchase_count + 1';
            break;
        }
        
        if (updateField) {
          await client.query(`
            UPDATE product_metrics 
            SET ${updateField}, updated_at = NOW()
            WHERE product_id = $1 AND date = CURRENT_DATE
          `, [productId]);
        }
      } else {
        // Crear nuevo registro
        let viewsCount = eventType === 'product_view' ? 1 : 0;
        let addToCartCount = eventType === 'add_to_cart' ? 1 : 0;
        let purchaseCount = eventType === 'purchase' ? 1 : 0;

        await client.query(`
          INSERT INTO product_metrics (product_id, views_count, add_to_cart_count, purchase_count)
          VALUES ($1, $2, $3, $4)
        `, [productId, viewsCount, addToCartCount, purchaseCount]);
      }
    }

    // Actualizar métricas de usuarios
    if (userId) {
      const existingUserRecord = await client.query(`
        SELECT id FROM user_metrics WHERE user_id = $1
      `, [userId]);

      if (existingUserRecord.rows.length > 0) {
        await client.query(`
          UPDATE user_metrics 
          SET page_views = page_views + 1, last_activity = NOW(), updated_at = NOW()
          WHERE user_id = $1
        `, [userId]);
      } else {
        await client.query(`
          INSERT INTO user_metrics (user_id, page_views, last_activity)
          VALUES ($1, 1, NOW())
        `, [userId]);
      }
    }

    client.release();
  } catch (error) {
    console.error('Error updating real-time metrics:', error);
  }
}

// Tarea programada para limpiar datos antiguos (ejecutar diariamente a las 2 AM)
cron.schedule('0 2 * * *', async () => {
  try {
    console.log('🧹 Ejecutando limpieza de datos antiguos...');
    const client = await pool.connect();
    
    // Eliminar eventos de más de 90 días
    await client.query(`
      DELETE FROM analytics_events 
      WHERE timestamp < NOW() - INTERVAL '90 days'
    `);
    
    // Eliminar métricas de productos de más de 365 días
    await client.query(`
      DELETE FROM product_metrics 
      WHERE date < CURRENT_DATE - INTERVAL '365 days'
    `);
    
    client.release();
    console.log('✅ Limpieza completada');
  } catch (error) {
    console.error('❌ Error en limpieza programada:', error);
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
    service: 'Analytics Service',
    available_endpoints: [
      'GET /health',
      'GET /api/info',
      'POST /api/analytics/track',
      'GET /api/analytics/events',
      'GET /api/analytics/metrics',
      'GET /api/analytics/sales',
      'GET /api/analytics/products',
      'GET /api/analytics/users',
      'GET /api/analytics/reports'
    ]
  });
});

// Inicializar y arrancar servidor
async function startServer() {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Analytics Service ejecutándose en puerto ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
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