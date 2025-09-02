const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const cartRoutes = require('./routes/cart.routes');
const { connectRedis } = require('./db/redis');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4004;

// Middleware de seguridad
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: 'Demasiadas requests desde esta IP, intenta de nuevo más tarde.'
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Cart Service',
    version: '1.0.0'
  });
});

// Rutas
app.use('/api/cart', cartRoutes);

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error en Cart Service:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Conectar a Redis y iniciar servidor
const startServer = async () => {
  try {
    await connectRedis();
    console.log('✅ Conectado a Redis');
    
    app.listen(PORT, () => {
      console.log(`🛒 Cart Service corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al conectar a Redis:', error);
    process.exit(1);
  }
};

startServer(); 