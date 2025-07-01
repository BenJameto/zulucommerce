const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');
const { query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const natural = require('natural');
const { removeStopwords } = require('stopword');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

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
  max: 200, // máximo 200 requests por ventana (más permisivo para búsquedas)
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
    service: 'Search Service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    service: 'ZuluCommerce Search Service',
    version: '1.0.0',
    description: 'Servicio de búsqueda avanzada de productos',
    endpoints: {
      health: '/health',
      info: '/api/info',
      search: 'GET /api/search',
      suggestions: 'GET /api/suggestions',
      popularSearches: 'GET /api/popular-searches',
      searchHistory: 'GET/POST /api/search-history'
    }
  });
});

// Inicializar base de datos
async function initDatabase() {
  try {
    const client = await pool.connect();
    
    // Crear tabla de historial de búsquedas
    await client.query(`
      CREATE TABLE IF NOT EXISTS search_history (
        id SERIAL PRIMARY KEY,
        user_id UUID,
        query TEXT NOT NULL,
        filters JSONB,
        results_count INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de búsquedas populares
    await client.query(`
      CREATE TABLE IF NOT EXISTS popular_searches (
        id SERIAL PRIMARY KEY,
        query TEXT NOT NULL UNIQUE,
        search_count INTEGER DEFAULT 1,
        last_searched TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de sugerencias de búsqueda
    await client.query(`
      CREATE TABLE IF NOT EXISTS search_suggestions (
        id SERIAL PRIMARY KEY,
        suggestion TEXT NOT NULL UNIQUE,
        category VARCHAR(100),
        weight INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear índices para mejorar el rendimiento de búsqueda
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_name_search 
      ON products USING gin(to_tsvector('spanish', name))
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_description_search 
      ON products USING gin(to_tsvector('spanish', description))
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_category_search 
      ON products USING gin(to_tsvector('spanish', category))
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_search_history_query 
      ON search_history USING gin(to_tsvector('spanish', query))
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_search_history_user_id 
      ON search_history(user_id)
    `);

    client.release();
    console.log('✅ Base de datos de búsqueda inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos de búsqueda:', error);
  }
}

// Función para procesar y limpiar términos de búsqueda
function processSearchQuery(query) {
  if (!query) return '';
  
  // Convertir a minúsculas
  let processedQuery = query.toLowerCase();
  
  // Remover stopwords
  const words = processedQuery.split(' ');
  const filteredWords = removeStopwords(words, ['es', 'en']); // español e inglés
  
  // Stemming básico (reducir palabras a su raíz)
  const stemmer = natural.PorterStemmer;
  const stemmedWords = filteredWords.map(word => stemmer.stem(word));
  
  return stemmedWords.join(' ');
}

// Función para construir la consulta SQL de búsqueda
function buildSearchQuery(searchTerms, filters = {}) {
  let sql = `
    SELECT 
      p.*,
      c.name as category_name,
      ts_rank(to_tsvector('spanish', p.name || ' ' || p.description || ' ' || c.name), plainto_tsquery('spanish', $1)) as rank
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = true
  `;
  
  const params = [searchTerms];
  let paramCount = 1;
  
  // Búsqueda por texto
  if (searchTerms) {
    sql += ` AND (
      to_tsvector('spanish', p.name || ' ' || p.description || ' ' || c.name) @@ plainto_tsquery('spanish', $1)
    )`;
  }
  
  // Filtros adicionales
  if (filters.category) {
    paramCount++;
    sql += ` AND c.name ILIKE $${paramCount}`;
    params.push(`%${filters.category}%`);
  }
  
  if (filters.min_price !== undefined) {
    paramCount++;
    sql += ` AND p.price >= $${paramCount}`;
    params.push(filters.min_price);
  }
  
  if (filters.max_price !== undefined) {
    paramCount++;
    sql += ` AND p.price <= $${paramCount}`;
    params.push(filters.max_price);
  }
  
  if (filters.brand) {
    paramCount++;
    sql += ` AND p.brand ILIKE $${paramCount}`;
    params.push(`%${filters.brand}%`);
  }
  
  if (filters.in_stock !== undefined) {
    if (filters.in_stock) {
      sql += ` AND p.stock_quantity > 0`;
    } else {
      sql += ` AND p.stock_quantity = 0`;
    }
  }
  
  // Ordenar por relevancia y luego por otros criterios
  sql += ` ORDER BY rank DESC, p.created_at DESC`;
  
  return { sql, params };
}

// Búsqueda de productos
app.get('/api/search', [
  query('q').optional().isString().trim(),
  query('category').optional().isString(),
  query('min_price').optional().isFloat({ min: 0 }),
  query('max_price').optional().isFloat({ min: 0 }),
  query('brand').optional().isString(),
  query('in_stock').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sort').optional().isIn(['relevance', 'price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Error de validación', details: errors.array() });
    }

    const {
      q: query,
      category,
      min_price,
      max_price,
      brand,
      in_stock,
      page = 1,
      limit = 20,
      sort = 'relevance'
    } = req.query;

    const userId = req.headers['x-user-id']; // ID del usuario si está autenticado

    // Procesar términos de búsqueda
    const processedQuery = processSearchQuery(query);
    
    // Construir filtros
    const filters = {
      category,
      min_price: min_price ? parseFloat(min_price) : undefined,
      max_price: max_price ? parseFloat(max_price) : undefined,
      brand,
      in_stock: in_stock !== undefined ? in_stock === 'true' : undefined
    };

    // Construir consulta SQL
    const { sql: baseSql, params } = buildSearchQuery(processedQuery, filters);
    
    // Agregar paginación
    const offset = (page - 1) * limit;
    const paginatedSql = `${baseSql} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const paginatedParams = [...params, parseInt(limit), offset];

    // Ejecutar búsqueda
    const result = await pool.query(paginatedSql, paginatedParams);
    
    // Contar total de resultados para paginación
    const countSql = `SELECT COUNT(*) FROM (${baseSql}) as search_results`;
    const countResult = await pool.query(countSql, params);
    const totalResults = parseInt(countResult.rows[0].count);

    // Guardar en historial de búsqueda si hay usuario
    if (userId && processedQuery) {
      try {
        await pool.query(`
          INSERT INTO search_history (user_id, query, filters, results_count)
          VALUES ($1, $2, $3, $4)
        `, [userId, processedQuery, JSON.stringify(filters), totalResults]);
      } catch (error) {
        console.error('Error guardando historial de búsqueda:', error);
      }
    }

    // Actualizar búsquedas populares
    if (processedQuery) {
      try {
        await pool.query(`
          INSERT INTO popular_searches (query, search_count, last_searched)
          VALUES ($1, 1, CURRENT_TIMESTAMP)
          ON CONFLICT (query) 
          DO UPDATE SET 
            search_count = popular_searches.search_count + 1,
            last_searched = CURRENT_TIMESTAMP
        `, [processedQuery]);
      } catch (error) {
        console.error('Error actualizando búsquedas populares:', error);
      }
    }

    res.json({
      query: processedQuery,
      filters,
      results: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResults,
        pages: Math.ceil(totalResults / limit)
      },
      suggestions: processedQuery ? await generateSuggestions(processedQuery) : []
    });

  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Generar sugerencias de búsqueda
async function generateSuggestions(query) {
  try {
    const result = await pool.query(`
      SELECT suggestion, weight
      FROM search_suggestions
      WHERE suggestion ILIKE $1
      ORDER BY weight DESC, suggestion ASC
      LIMIT 5
    `, [`%${query}%`]);
    
    return result.rows;
  } catch (error) {
    console.error('Error generando sugerencias:', error);
    return [];
  }
}

// Obtener sugerencias de búsqueda
app.get('/api/suggestions', [
  query('q').isString().trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Error de validación', details: errors.array() });
    }

    const { q } = req.query;
    const suggestions = await generateSuggestions(q);

    res.json({ suggestions });
  } catch (error) {
    console.error('Error obteniendo sugerencias:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener búsquedas populares
app.get('/api/popular-searches', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT query, search_count
      FROM popular_searches
      ORDER BY search_count DESC, last_searched DESC
      LIMIT 10
    `);

    res.json({ popular_searches: result.rows });
  } catch (error) {
    console.error('Error obteniendo búsquedas populares:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener historial de búsqueda del usuario
app.get('/api/search-history', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const result = await pool.query(`
      SELECT query, filters, results_count, created_at
      FROM search_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `, [userId]);

    res.json({ search_history: result.rows });
  } catch (error) {
    console.error('Error obteniendo historial de búsqueda:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Búsqueda avanzada con múltiples criterios
app.post('/api/advanced-search', [
  query('queries').isArray(),
  query('filters').optional().isObject(),
  query('sort').optional().isIn(['relevance', 'price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Error de validación', details: errors.array() });
    }

    const { queries, filters = {}, sort = 'relevance' } = req.body;

    // Combinar múltiples consultas
    const combinedQuery = queries.join(' ');
    const processedQuery = processSearchQuery(combinedQuery);

    // Construir consulta SQL
    const { sql, params } = buildSearchQuery(processedQuery, filters);

    // Ejecutar búsqueda
    const result = await pool.query(sql, params);

    res.json({
      queries,
      filters,
      results: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error en búsqueda avanzada:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Búsqueda por similitud (productos similares)
app.get('/api/similar-products/:productId', [
  query('limit').optional().isInt({ min: 1, max: 20 })
], async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 5 } = req.query;

    // Obtener información del producto
    const productResult = await pool.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1 AND p.is_active = true
    `, [productId]);

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const product = productResult.rows[0];

    // Buscar productos similares
    const similarResult = await pool.query(`
      SELECT 
        p.*,
        c.name as category_name,
        (
          CASE WHEN p.category_id = $1 THEN 3 ELSE 0 END +
          CASE WHEN p.brand = $2 THEN 2 ELSE 0 END +
          CASE WHEN ABS(p.price - $3) / $3 < 0.3 THEN 1 ELSE 0 END
        ) as similarity_score
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id != $4 AND p.is_active = true
      ORDER BY similarity_score DESC, p.created_at DESC
      LIMIT $5
    `, [product.category_id, product.brand, product.price, productId, parseInt(limit)]);

    res.json({
      original_product: product,
      similar_products: similarResult.rows
    });

  } catch (error) {
    console.error('Error buscando productos similares:', error);
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
  console.error('Search Service Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Error interno del servidor'
  });
});

// Inicializar base de datos y arrancar servidor
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🔍 Search Service iniciado en puerto ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`ℹ️  Info: http://localhost:${PORT}/api/info`);
  });
});

module.exports = app; 