const API_URL = 'http://localhost:3005/api/users';

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

// Obtener perfil del usuario actual
export const getUserProfile = async () => {
    try {
        const response = await fetch(`${API_URL}/profile`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('No autorizado. Por favor inicia sesión.');
            }
            throw new Error('Error al obtener el perfil');
        }

        return await response.json();
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        throw error;
    }
};

// Actualizar perfil del usuario
export const updateUserProfile = async (userData) => {
    try {
        const response = await fetch(`${API_URL}/profile`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('No autorizado. Por favor inicia sesión.');
            }
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al actualizar el perfil');
        }

        return await response.json();
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        throw error;
    }
};

// Cambiar contraseña
export const changePassword = async (currentPassword, newPassword) => {
    try {
        const response = await fetch(`${API_URL}/change-password`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({
                currentPassword,
                newPassword
            }),
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('No autorizado. Por favor inicia sesión.');
            }
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al cambiar la contraseña');
        }

        return await response.json();
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        throw error;
    }
};

// Obtener usuario por ID (para administradores)
export const getUserById = async (userId) => {
    try {
        const response = await fetch(`${API_URL}/${userId}`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('No autorizado. Por favor inicia sesión.');
            }
            throw new Error('Error al obtener el usuario');
        }

        return await response.json();
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        throw error;
    }
};

// Obtener todos los usuarios (para administradores)
export const getAllUsers = async (page = 1, limit = 10, search = '') => {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(search && { search })
        });

        const response = await fetch(`${API_URL}?${params}`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('No autorizado. Por favor inicia sesión.');
            }
            throw new Error('Error al obtener los usuarios');
        }

        return await response.json();
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        throw error;
    }
};

// Obtener estadísticas de usuarios
export const getUserStats = async () => {
    try {
        const response = await fetch(`${API_URL}/stats`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error('Error al obtener estadísticas');
        }

        return await response.json();
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        throw error;
    }
}; 