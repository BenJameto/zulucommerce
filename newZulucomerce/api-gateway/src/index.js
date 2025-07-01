const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'API Gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Gateway info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    service: 'ZuluCommerce API Gateway',
    version: '1.0.0',
    description: 'Gateway principal para microservicios de ZuluCommerce',
    endpoints: {
      health: '/health',
      info: '/api/info',
      auth: '/api/auth/*',
      products: '/api/products/*',
      cart: '/api/cart/*',
      orders: '/api/orders/*',
      search: '/api/search/*',
      payments: '/api/payments/*',
      shipping: '/api/shipping/*',
      analytics: '/api/analytics/*'
    }
  });
});

// Proxy configuration for future microservices
// Auth service proxy
app.use('/api/auth', createProxyMiddleware({
  target: 'http://auth-service:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api'
  },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔀 Proxy request: ${req.method} ${req.url} -> ${proxyReq.path}`);
    console.log(`📝 Request headers:`, req.headers);
    console.log(`📝 Proxy headers:`, proxyReq.getHeaders());
    
    // Asegurar que el body se envíe correctamente para peticiones POST
    if (req.body && req.method === 'POST') {
      const bodyData = JSON.stringify(req.body);
      console.log(`📦 Body data:`, bodyData);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Proxy response: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.log('❌ Auth service proxy error:', err.message, err.code);
    console.log('❌ Error details:', err);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Auth service temporarily unavailable',
        message: 'El servicio de autenticación no está disponible en este momento',
        details: err.message
      });
    }
  }
}));

// Products service proxy
app.use('/api/products', createProxyMiddleware({
  target: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/products': '/api/products'
  },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🛍️  Product proxy request: ${req.method} ${req.url} -> ${proxyReq.path}`);
    
    // Asegurar que el body se envíe correctamente para peticiones POST/PUT
    if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
      const bodyData = JSON.stringify(req.body);
      console.log(`📦 Product body data:`, bodyData);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Product proxy response: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.log('❌ Product service proxy error:', err.message, err.code);
    console.log('❌ Error details:', err);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Product service temporarily unavailable',
        message: 'El servicio de productos no está disponible en este momento',
        details: err.message
      });
    }
  }
}));

// Cart service proxy
app.use('/api/cart', createProxyMiddleware({
  target: process.env.CART_SERVICE_URL || 'http://cart-service:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/cart': '/api/cart'
  },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Cart proxy response: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.log('❌ Cart service proxy error:', err.message, err.code);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Cart service temporarily unavailable',
        message: 'El servicio de carrito no está disponible en este momento',
        details: err.message
      });
    }
  }
}));

// Orders service proxy
app.use('/api/orders', createProxyMiddleware({
  target: process.env.ORDER_SERVICE_URL || 'http://order-service:3004',
  changeOrigin: true,
  pathRewrite: {
    '^/api/orders': '/api/orders'
  },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Order proxy response: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.log('❌ Order service proxy error:', err.message, err.code);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Order service temporarily unavailable',
        message: 'El servicio de pedidos no está disponible en este momento',
        details: err.message
      });
    }
  }
}));

// Search service proxy
app.use('/api/search', createProxyMiddleware({
  target: process.env.SEARCH_SERVICE_URL || 'http://search-service:3005',
  changeOrigin: true,
  pathRewrite: {
    '^/api/search': '/api/search'
  },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Search proxy response: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.log('❌ Search service proxy error:', err.message, err.code);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Search service temporarily unavailable',
        message: 'El servicio de búsqueda no está disponible en este momento',
        details: err.message
      });
    }
  }
}));

// Payment service proxy
app.use('/api/payments', createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3006',
  changeOrigin: true,
  pathRewrite: {
    '^/api/payments': '/api/payments'
  },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Payment proxy response: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.log('❌ Payment service proxy error:', err.message, err.code);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Payment service temporarily unavailable',
        message: 'El servicio de pagos no está disponible en este momento',
        details: err.message
      });
    }
  }
}));

// Analytics service direct endpoints (health, info) - MUST BE BEFORE GENERAL ANALYTICS ROUTE
app.use('/api/analytics/health', createProxyMiddleware({
  target: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3008',
  changeOrigin: true,
  pathRewrite: {
    '^/api/analytics/health': '/health'
  },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`📊 Analytics health proxy request: ${req.method} ${req.url} -> ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Analytics health proxy response: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.log('❌ Analytics service health proxy error:', err.message, err.code);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Analytics service temporarily unavailable',
        message: 'El servicio de analytics no está disponible en este momento',
        details: err.message
      });
    }
  }
}));

app.use('/api/analytics/info', createProxyMiddleware({
  target: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3008',
  changeOrigin: true,
  pathRewrite: {
    '^/api/analytics/info': '/api/info'
  },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`📊 Analytics info proxy request: ${req.method} ${req.url} -> ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Analytics info proxy response: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.log('❌ Analytics service info proxy error:', err.message, err.code);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Analytics service temporarily unavailable',
        message: 'El servicio de analytics no está disponible en este momento',
        details: err.message
      });
    }
  }
}));

// Analytics service proxy (general route)
app.use('/api/analytics', createProxyMiddleware({
  target: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3008',
  changeOrigin: true,
  pathRewrite: {
    '^/api/analytics': '/api/analytics'
  },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`📊 Analytics proxy request: ${req.method} ${req.url} -> ${proxyReq.path}`);
    
    if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
      const bodyData = JSON.stringify(req.body);
      console.log(`📦 Analytics body data:`, bodyData);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Analytics proxy response: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.log('❌ Analytics service proxy error:', err.message, err.code);
    console.log('❌ Error details:', err);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Analytics service temporarily unavailable',
        message: 'El servicio de analytics no está disponible en este momento',
        details: err.message
      });
    }
  }
}));

// Shipping service direct endpoints (health, info) - MUST BE BEFORE GENERAL SHIPPING ROUTE
app.use('/api/shipping/health', createProxyMiddleware({
  target: process.env.SHIPPING_SERVICE_URL || 'http://shipping-service:3007',
  changeOrigin: true,
  pathRewrite: {
    '^/api/shipping/health': '/health'
  },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🚚 Shipping health proxy request: ${req.method} ${req.url} -> ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Shipping health proxy response: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.log('❌ Shipping service health proxy error:', err.message, err.code);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Shipping service temporarily unavailable',
        message: 'El servicio de envíos no está disponible en este momento',
        details: err.message
      });
    }
  }
}));

app.use('/api/shipping/info', createProxyMiddleware({
  target: process.env.SHIPPING_SERVICE_URL || 'http://shipping-service:3007',
  changeOrigin: true,
  pathRewrite: {
    '^/api/shipping/info': '/api/info'
  },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🚚 Shipping info proxy request: ${req.method} ${req.url} -> ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Shipping info proxy response: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.log('❌ Shipping service info proxy error:', err.message, err.code);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Shipping service temporarily unavailable',
        message: 'El servicio de envíos no está disponible en este momento',
        details: err.message
      });
    }
  }
}));

// Shipping service proxy (general route)
app.use('/api/shipping', createProxyMiddleware({
  target: process.env.SHIPPING_SERVICE_URL || 'http://shipping-service:3007',
  changeOrigin: true,
  pathRewrite: {
    '^/api/shipping': '/api/shipping'
  },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🚚 Shipping proxy request: ${req.method} ${req.url} -> ${proxyReq.path}`);
    
    if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
      const bodyData = JSON.stringify(req.body);
      console.log(`📦 Shipping body data:`, bodyData);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Shipping proxy response: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.log('❌ Shipping service proxy error:', err.message, err.code);
    console.log('❌ Error details:', err);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Shipping service temporarily unavailable',
        message: 'El servicio de envíos no está disponible en este momento',
        details: err.message
      });
    }
  }
}));

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenido a ZuluCommerce API Gateway',
    version: '1.0.0',
    documentation: '/api/info'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'El endpoint solicitado no existe',
    availableEndpoints: ['/health', '/api/info', '/api/auth/*', '/api/products/*', '/api/cart/*', '/api/orders/*', '/api/search/*', '/api/payments/*', '/api/shipping/*', '/api/analytics/*']
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('API Gateway Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Error interno del servidor'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway iniciado en puerto ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`ℹ️  Info: http://localhost:${PORT}/api/info`);
});

module.exports = app; 