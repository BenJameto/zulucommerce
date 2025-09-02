const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'zulucommerce',
  password: process.env.DB_PASSWORD || 'zulucommerce123',
  database: process.env.DB_NAME || 'products_db',
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
  const createCategoriesTable = `
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      description TEXT,
      slug VARCHAR(100) UNIQUE NOT NULL,
      parent_id UUID REFERENCES categories(id),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createProductsTable = `
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      slug VARCHAR(255) UNIQUE NOT NULL,
      sku VARCHAR(100) UNIQUE NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      compare_price DECIMAL(10,2),
      cost_price DECIMAL(10,2),
      category_id UUID REFERENCES categories(id),
      brand VARCHAR(100),
      weight DECIMAL(8,2),
      dimensions JSONB,
      images JSONB,
      attributes JSONB,
      is_active BOOLEAN DEFAULT true,
      is_featured BOOLEAN DEFAULT false,
      stock_quantity INTEGER DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 5,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createProductVariantsTable = `
    CREATE TABLE IF NOT EXISTS product_variants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      sku VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      compare_price DECIMAL(10,2),
      cost_price DECIMAL(10,2),
      stock_quantity INTEGER DEFAULT 0,
      attributes JSONB,
      images JSONB,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createProductReviewsTable = `
    CREATE TABLE IF NOT EXISTS product_reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id UUID NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      title VARCHAR(255),
      comment TEXT,
      is_approved BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(createCategoriesTable);
    await pool.query(createProductsTable);
    await pool.query(createProductVariantsTable);
    await pool.query(createProductReviewsTable);
    console.log('✅ Tablas de productos creadas correctamente');
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