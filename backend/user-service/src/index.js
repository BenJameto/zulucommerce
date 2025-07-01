const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
const userRoutes = require('./routes/user.routes');
app.use('/api/users', userRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'User Service',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error en User Service:', err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message 
  });
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`🚀 User Service running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`👥 API Users: http://localhost:${PORT}/api/users`);
}); 