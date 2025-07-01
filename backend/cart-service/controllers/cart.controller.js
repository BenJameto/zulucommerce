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
        console.log('✅ Conexión exitosa a la base de datos - Cart Service');
        release();
    }
});

// Obtener carrito de un usuario
const getCart = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            'SELECT c.*, p.name, p.price, p.image FROM cart_items c JOIN products p ON c.product_id = p.id WHERE c.user_id = $1',
            [userId]
        );
        
        const totalQuantity = result.rows.reduce((total, item) => total + parseInt(item.quantity), 0);
        
        res.json({
            cart: result.rows,
            totalQuantity
        });
    } catch (error) {
        console.error('❌ Error al obtener carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Agregar producto al carrito
const addProductToCart = async (req, res) => {
    try {
        const { userId, productId, quantity = 1 } = req.body;
        
        if (!userId || !productId) {
            return res.status(400).json({ error: 'userId y productId son requeridos' });
        }

        // Verificar si el producto ya está en el carrito
        const existingItem = await pool.query(
            'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        if (existingItem.rows.length > 0) {
            // Actualizar cantidad
            const newQuantity = existingItem.rows[0].quantity + quantity;
            await pool.query(
                'UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3',
                [newQuantity, userId, productId]
            );
        } else {
            // Agregar nuevo item
            await pool.query(
                'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)',
                [userId, productId, quantity]
            );
        }

        // Obtener carrito actualizado
        const updatedCart = await pool.query(
            'SELECT c.*, p.name, p.price, p.image FROM cart_items c JOIN products p ON c.product_id = p.id WHERE c.user_id = $1',
            [userId]
        );

        const totalQuantity = updatedCart.rows.reduce((total, item) => total + parseInt(item.quantity), 0);

        res.status(201).json({
            message: 'Producto agregado al carrito',
            cart: updatedCart.rows,
            totalQuantity
        });
    } catch (error) {
        console.error('❌ Error al agregar al carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Eliminar producto del carrito
const removeProductFromCart = async (req, res) => {
    try {
        const { userId, productId } = req.params;
        
        const result = await pool.query(
            'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2 RETURNING *',
            [userId, productId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
        }

        // Obtener carrito actualizado
        const updatedCart = await pool.query(
            'SELECT c.*, p.name, p.price, p.image FROM cart_items c JOIN products p ON c.product_id = p.id WHERE c.user_id = $1',
            [userId]
        );

        const totalQuantity = updatedCart.rows.reduce((total, item) => total + parseInt(item.quantity), 0);

        res.json({
            message: 'Producto eliminado del carrito',
            cart: updatedCart.rows,
            totalQuantity
        });
    } catch (error) {
        console.error('❌ Error al eliminar del carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Vaciar carrito
const clearCart = async (req, res) => {
    try {
        const { userId } = req.params;
        
        await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
        
        res.json({
            message: 'Carrito vaciado',
            cart: [],
            totalQuantity: 0
        });
    } catch (error) {
        console.error('❌ Error al vaciar carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
  getCart,
  addProductToCart,
  removeProductFromCart,
  clearCart
}; 