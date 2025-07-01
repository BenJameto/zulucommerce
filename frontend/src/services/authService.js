// src/services/authService.js

const API_URL = 'http://localhost:3001/api/auth';

// Obtener token del localStorage
const getToken = () => {
    return localStorage.getItem('token');
};

// Configuración de headers con autenticación
const getHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

export const login = async ({ username, password }) => {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al iniciar sesión');
        }

        // Guardar token en localStorage
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        return data;
    } catch (error) {
        console.error('Error en login:', error);
        throw error;
    }
};

export const register = async ({ email, username, password, first_name, last_name }) => {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                username,
                password,
                first_name,
                last_name
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al registrar');
        }

        // Guardar token en localStorage si se recibe
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        return data;
    } catch (error) {
        console.error('Error en registro:', error);
        throw error;
    }
};

export const verifyToken = async () => {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('No hay token disponible');
        }

        const response = await fetch(`${API_URL}/verify`, {
            method: 'GET',
            headers: getHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            // Si el token es inválido, limpiar localStorage
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
            throw new Error(data.error || 'Token inválido');
        }

        return data;
    } catch (error) {
        console.error('Error verificando token:', error);
        throw error;
    }
};

export const logout = async () => {
    try {
        const response = await fetch(`${API_URL}/logout`, {
            method: 'POST',
            headers: getHeaders(),
        });

        // Limpiar localStorage independientemente de la respuesta del servidor
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        if (!response.ok) {
            console.warn('Error en logout del servidor, pero se limpió el localStorage');
        }

        return { message: 'Logout exitoso' };
    } catch (error) {
        console.error('Error en logout:', error);
        // Limpiar localStorage incluso si hay error
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw error;
    }
};

export const isAuthenticated = () => {
    const token = getToken();
    return !!token;
};

export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const getTokenValue = () => {
    return getToken();
};
