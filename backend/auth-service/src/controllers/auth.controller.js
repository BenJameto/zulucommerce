const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
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
        console.log('✅ Conexión exitosa a la base de datos - Auth Service');
        release();
    }
});

// Registro
exports.register = async (req, res) => {
    try {
        const { email, username, password, first_name, last_name } = req.body;

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
            INSERT INTO users (email, username, password, first_name, last_name)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, email, username, first_name, last_name, created_at
        `, [email, username, hashedPassword, first_name || null, last_name || null]);

        const newUser = result.rows[0];

        // Generar token JWT
        const token = jwt.sign(
            { 
                id: newUser.id, 
                username: newUser.username, 
                email: newUser.email 
            }, 
            process.env.JWT_SECRET || 'secreto', 
            { expiresIn: '24h' }
        );

        res.status(201).json({ 
            message: 'Usuario registrado correctamente',
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                username: newUser.username,
                first_name: newUser.first_name,
                last_name: newUser.last_name
            }
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Buscar usuario por username o email
        const result = await pool.query(`
            SELECT id, email, username, password, first_name, last_name
            FROM users 
            WHERE username = $1 OR email = $1
        `, [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = result.rows[0];

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generar token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                email: user.email 
            }, 
            process.env.JWT_SECRET || 'secreto', 
            { expiresIn: '24h' }
        );

        res.json({ 
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Verificar token
exports.verifyToken = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Token requerido' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto');
        
        // Obtener información actualizada del usuario
        const result = await pool.query(`
            SELECT id, email, username, first_name, last_name, created_at
            FROM users 
            WHERE id = $1
        `, [decoded.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ 
            valid: true,
            user: result.rows[0]
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado' });
        }
        console.error('Error verificando token:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Logout (opcional - el frontend puede simplemente eliminar el token)
exports.logout = async (req, res) => {
    try {
        // En una implementación más avanzada, podrías agregar el token a una lista negra
        res.json({ message: 'Logout exitoso' });
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
