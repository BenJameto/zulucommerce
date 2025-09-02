const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

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
    service: 'Auth Service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    service: 'ZuluCommerce Auth Service',
    version: '1.0.0',
    description: 'Servicio de autenticación y autorización',
    endpoints: {
      health: '/health',
      info: '/api/info',
      register: 'POST /api/register',
      login: 'POST /api/login',
      verify: 'GET /api/verify',
      profile: 'GET /api/profile'
    }
  });
});

// Inicializar base de datos
async function initDatabase() {
  try {
    const client = await pool.connect();
    
    // Crear tabla de usuarios si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear índice en email
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);

    client.release();
    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  }
}

// Middleware de validación
const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim()
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      message: 'Token de acceso requerido'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'zulucommerce-secret', (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Invalid token',
        message: 'Token inválido'
      });
    }
    req.user = user;
    next();
  });
};

// Endpoint de registro
app.post('/api/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Error de validación',
        details: errors.array()
      });
    }

    const { email, password, firstName, lastName } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'El usuario ya existe'
      });
    }

    // Encriptar contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const newUser = await pool.query(
      'INSERT INTO users (email, password, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name, role, created_at',
      [email, hashedPassword, firstName, lastName]
    );

    // Generar token
    const token = jwt.sign(
      { 
        userId: newUser.rows[0].id,
        email: newUser.rows[0].email,
        role: newUser.rows[0].role
      },
      process.env.JWT_SECRET || 'zulucommerce-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
        firstName: newUser.rows[0].first_name,
        lastName: newUser.rows[0].last_name,
        role: newUser.rows[0].role
      },
      token
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error interno del servidor'
    });
  }
});

// Endpoint de login
app.post('/api/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Error de validación',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Buscar usuario
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Credenciales inválidas'
      });
    }

    // Generar token
    const token = jwt.sign(
      { 
        userId: user.rows[0].id,
        email: user.rows[0].email,
        role: user.rows[0].role
      },
      process.env.JWT_SECRET || 'zulucommerce-secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        firstName: user.rows[0].first_name,
        lastName: user.rows[0].last_name,
        role: user.rows[0].role
      },
      token
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error interno del servidor'
    });
  }
});

// Endpoint de verificación de token
app.get('/api/verify', authenticateToken, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Endpoint de perfil de usuario
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        firstName: user.rows[0].first_name,
        lastName: user.rows[0].last_name,
        role: user.rows[0].role,
        createdAt: user.rows[0].created_at
      }
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
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
  console.error('Auth Service Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Error interno del servidor'
  });
});

// Inicializar base de datos y arrancar servidor
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🔐 Auth Service iniciado en puerto ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`ℹ️  Info: http://localhost:${PORT}/api/info`);
  });
});

module.exports = app; 