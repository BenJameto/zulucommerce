const { Pool } = require('pg');
require('dotenv').config();

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
        console.log('✅ Conexión exitosa a la base de datos - Wishlist Service');
        release();
    }
});

// Obtener lista de deseos de un usuario
const getWishlist = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            'SELECT w.*, p.name, p.price, p.image FROM wishlist w JOIN products p ON w.product_id = p.id WHERE w.user_id = $1',
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error al obtener lista de deseos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Agregar producto a la lista de deseos
const addToWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;
        
        if (!userId || !productId) {
            return res.status(400).json({ error: 'userId y productId son requeridos' });
        }

        // Verificar si el producto ya está en la lista
        const checkResult = await pool.query(
            'SELECT * FROM wishlist WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        if (checkResult.rows.length > 0) {
            return res.status(400).json({ error: 'El producto ya está en la lista de deseos' });
        }

        const result = await pool.query(
            'INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2) RETURNING *',
            [userId, productId]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('❌ Error al agregar a lista de deseos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Eliminar producto de la lista de deseos
const removeFromWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.params;
        const result = await pool.query(
            'DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2 RETURNING *',
            [userId, productId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado en la lista de deseos' });
        }
        
        res.json({ message: 'Producto eliminado de la lista de deseos' });
    } catch (error) {
        console.error('❌ Error al eliminar de lista de deseos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist
}; 