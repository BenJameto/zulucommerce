const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet());
app.use(cors());
app.use(compression());
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
    service: 'API Gateway',
    version: '1.0.0'
  });
});

// Proxy middleware para autenticación
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  
  if (!token && req.path.startsWith('/api/auth')) {
    return next();
  }
  
  if (!token && (req.path.startsWith('/api/users') || 
                 req.path.startsWith('/api/cart') || 
                 req.path.startsWith('/api/orders'))) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }
  
  next();
};

app.use(authMiddleware);

// Configuración de proxies para cada microservicio
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
  users: process.env.USER_SERVICE_URL || 'http://localhost:4002',
  products: process.env.PRODUCT_SERVICE_URL || 'http://localhost:4003',
  cart: process.env.CART_SERVICE_URL || 'http://localhost:4004',
  orders: process.env.ORDER_SERVICE_URL || 'http://localhost:4005',
  payments: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4006',
  inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:4007'
};

// Proxy para Auth Service
app.use('/api/auth', createProxyMiddleware({
  target: services.auth,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  },
  onError: (err, req, res) => {
    console.error('Error en Auth Service:', err);
    res.status(503).json({ error: 'Auth Service no disponible' });
  }
}));

// Proxy para User Service
app.use('/api/users', createProxyMiddleware({
  target: services.users,
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/api/users'
  },
  onError: (err, req, res) => {
    console.error('Error en User Service:', err);
    res.status(503).json({ error: 'User Service no disponible' });
  }
}));

// Proxy para Product Service
app.use('/api/products', createProxyMiddleware({
  target: services.products,
  changeOrigin: true,
  pathRewrite: {
    '^/api/products': '/api/products'
  },
  onError: (err, req, res) => {
    console.error('Error en Product Service:', err);
    res.status(503).json({ error: 'Product Service no disponible' });
  }
}));

// Proxy para Cart Service
app.use('/api/cart', createProxyMiddleware({
  target: services.cart,
  changeOrigin: true,
  pathRewrite: {
    '^/api/cart': '/api/cart'
  },
  onError: (err, req, res) => {
    console.error('Error en Cart Service:', err);
    res.status(503).json({ error: 'Cart Service no disponible' });
  }
}));

// Proxy para Order Service
app.use('/api/orders', createProxyMiddleware({
  target: services.orders,
  changeOrigin: true,
  pathRewrite: {
    '^/api/orders': '/api/orders'
  },
  onError: (err, req, res) => {
    console.error('Error en Order Service:', err);
    res.status(503).json({ error: 'Order Service no disponible' });
  }
}));

// Proxy para Payment Service
app.use('/api/payments', createProxyMiddleware({
  target: services.payments,
  changeOrigin: true,
  pathRewrite: {
    '^/api/payments': '/api/payments'
  },
  onError: (err, req, res) => {
    console.error('Error en Payment Service:', err);
    res.status(503).json({ error: 'Payment Service no disponible' });
  }
}));

// Proxy para Inventory Service
app.use('/api/inventory', createProxyMiddleware({
  target: services.inventory,
  changeOrigin: true,
  pathRewrite: {
    '^/api/inventory': '/api/inventory'
  },
  onError: (err, req, res) => {
    console.error('Error en Inventory Service:', err);
    res.status(503).json({ error: 'Inventory Service no disponible' });
  }
}));

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
  console.error('Error en API Gateway:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway corriendo en http://localhost:${PORT}`);
  console.log('📋 Servicios configurados:');
  Object.entries(services).forEach(([name, url]) => {
    console.log(`   ${name}: ${url}`);
  });
}); 