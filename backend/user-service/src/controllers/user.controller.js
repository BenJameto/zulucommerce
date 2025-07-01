const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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
        console.log('✅ Conexión exitosa a la base de datos - User Service');
        release();
    }
});

// Obtener todos los usuarios (con paginación)
exports.getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT id, email, username, first_name, last_name, phone, 
                   date_of_birth, address, created_at, updated_at
            FROM users 
            WHERE 1=1
        `;
        const params = [];
        
        if (search) {
            query += ` AND (username ILIKE $1 OR email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1)`;
            params.push(`%${search}%`);
        }
        
        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        
        const result = await pool.query(query, params);
        
        // Contar total de usuarios
        let countQuery = `SELECT COUNT(*) FROM users WHERE 1=1`;
        if (search) {
            countQuery += ` AND (username ILIKE $1 OR email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1)`;
        }
        const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);
        
        res.json({
            users: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count),
                totalPages: Math.ceil(countResult.rows[0].count / limit)
            }
        });
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener usuario por ID
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(`
            SELECT id, email, username, first_name, last_name, phone, 
                   date_of_birth, address, created_at, updated_at
            FROM users 
            WHERE id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener perfil del usuario actual
exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id; // Viene del middleware de autenticación
        
        const result = await pool.query(`
            SELECT id, email, username, first_name, last_name, phone, 
                   date_of_birth, address, created_at, updated_at
            FROM users 
            WHERE id = $1
        `, [userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Crear nuevo usuario
exports.createUser = async (req, res) => {
    try {
        const { 
            email, 
            username, 
            password, 
            first_name, 
            last_name, 
            phone, 
            date_of_birth, 
            address 
        } = req.body;
        
        // Verificar si el usuario ya existe
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ 
                error: 'El email o username ya están registrados' 
            });
        }
        
        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insertar nuevo usuario
        const result = await pool.query(`
            INSERT INTO users (email, username, password, first_name, last_name, phone, date_of_birth, address)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, email, username, first_name, last_name, phone, date_of_birth, address, created_at
        `, [email, username, hashedPassword, first_name, last_name, phone, date_of_birth, address]);
        
        res.status(201).json({
            message: 'Usuario creado exitosamente',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error creando usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Actualizar usuario
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            first_name, 
            last_name, 
            phone, 
            date_of_birth, 
            address 
        } = req.body;
        
        const result = await pool.query(`
            UPDATE users 
            SET first_name = COALESCE($1, first_name),
                last_name = COALESCE($2, last_name),
                phone = COALESCE($3, phone),
                date_of_birth = COALESCE($4, date_of_birth),
                address = COALESCE($5, address),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
            RETURNING id, email, username, first_name, last_name, phone, date_of_birth, address, updated_at
        `, [first_name, last_name, phone, date_of_birth, address, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json({
            message: 'Usuario actualizado exitosamente',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error actualizando usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Actualizar perfil del usuario actual
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            first_name, 
            last_name, 
            phone, 
            date_of_birth, 
            address 
        } = req.body;
        
        const result = await pool.query(`
            UPDATE users 
            SET first_name = COALESCE($1, first_name),
                last_name = COALESCE($2, last_name),
                phone = COALESCE($3, phone),
                date_of_birth = COALESCE($4, date_of_birth),
                address = COALESCE($5, address),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
            RETURNING id, email, username, first_name, last_name, phone, date_of_birth, address, updated_at
        `, [first_name, last_name, phone, date_of_birth, address, userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json({
            message: 'Perfil actualizado exitosamente',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Cambiar contraseña
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        
        // Verificar contraseña actual
        const user = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
        
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        const isValidPassword = await bcrypt.compare(currentPassword, user.rows[0].password);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Contraseña actual incorrecta' });
        }
        
        // Encriptar nueva contraseña
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        
        // Actualizar contraseña
        await pool.query(
            'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashedNewPassword, userId]
        );
        
        res.json({ message: 'Contraseña cambiada exitosamente' });
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Eliminar usuario
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener estadísticas de usuarios
exports.getUserStats = async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_users_30_days,
                COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as new_users_7_days,
                COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as new_users_today
            FROM users
        `);
        
        res.json(stats.rows[0]);
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}; 