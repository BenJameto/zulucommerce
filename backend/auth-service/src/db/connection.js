const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'zulucommerce',
  password: process.env.DB_PASSWORD || 'zulucommerce123',
  database: process.env.DB_NAME || 'auth_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Función para conectar a la base de datos
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL establecida');
    client.release();
    
    // Crear tablas si no existen
    await createTables();
    
    return pool;
  } catch (error) {
    console.error('❌ Error al conectar a PostgreSQL:', error);
    throw error;
  }
};

// Función para crear las tablas necesarias
const createTables = async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      role VARCHAR(20) DEFAULT 'customer',
      is_active BOOLEAN DEFAULT true,
      email_verified BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createRefreshTokensTable = `
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(500) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_revoked BOOLEAN DEFAULT false
    );
  `;

  const createPasswordResetTable = `
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(createUsersTable);
    await pool.query(createRefreshTokensTable);
    await pool.query(createPasswordResetTable);
    console.log('✅ Tablas creadas correctamente');
  } catch (error) {
    console.error('❌ Error al crear tablas:', error);
    throw error;
  }
};

// Función para cerrar la conexión
const closeDB = async () => {
  await pool.end();
  console.log('✅ Conexión a PostgreSQL cerrada');
};

module.exports = {
  pool,
  connectDB,
  closeDB
}; 