const { Pool } = require('pg');
require('dotenv').config();

// Verificar que las variables de entorno estén cargadas
console.log('Configuración de la base de datos:', {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    // No mostramos la contraseña por seguridad
    password: process.env.DB_PASSWORD ? '******' : 'No definida'
});

const pool = new Pool({
    user: process.env.DB_USER || 'zulucommerce',
    password: process.env.DB_PASSWORD || 'zulucommerce123',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5433,
    database: process.env.DB_DATABASE || 'zulucommerce'
});

// Verificar conexión a la base de datos
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.stack);
    } else {
        console.log('✅ Conexión exitosa a la base de datos');
        release();
    }
});

// ✅ GET
const getProducts = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, CAST(price AS FLOAT) as price, image FROM products');
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No se encontraron productos' });
        }
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error al obtener productos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// ✅ POST
const addProduct = async (req, res) => {
    try {
    const { name, price, image } = req.body;
        
        if (!name || !price || !image) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        const result = await pool.query(
            'INSERT INTO products (name, price, image) VALUES ($1, $2, $3) RETURNING id, name, CAST(price AS FLOAT) as price, image',
            [name, price, image]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('❌ Error al agregar producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// ✅ GET producto por ID
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT id, name, CAST(price AS FLOAT) as price, image FROM products WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('❌ Error al obtener producto por ID:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// ✅ Exporta todo correctamente
module.exports = {
    getProducts,
    addProduct,
    getProductById
};
