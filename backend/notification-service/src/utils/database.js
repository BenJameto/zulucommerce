const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'zulucommerce',
  password: process.env.DB_PASSWORD || 'zulucommerce123',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5433,
  database: process.env.DB_DATABASE || 'zulucommerce',
});

// Verificar conexión
pool.on('connect', () => {
  console.log('✅ Notification Service: Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Notification Service: Error de conexión a PostgreSQL', err);
});

module.exports = pool; 