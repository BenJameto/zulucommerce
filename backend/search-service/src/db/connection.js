const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres-products',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'zulucommerce',
  password: process.env.DB_PASSWORD || 'zulucommerce123',
  database: process.env.DB_NAME || 'products_db',
});

module.exports = pool; 