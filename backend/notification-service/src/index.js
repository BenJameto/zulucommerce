const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3008;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
const notificationRoutes = require('./routes/notification.routes');
app.use('/api/notifications', notificationRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Notification Service',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error en Notification Service:', err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message 
  });
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`🚀 Notification Service running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔔 API Notifications: http://localhost:${PORT}/api/notifications`);
}); 