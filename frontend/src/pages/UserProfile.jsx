import React, { useState, useEffect } from "react";
import { getUserProfile, updateUserProfile, changePassword } from "../services/userService";
import "./UserProfile.css";

const UserProfile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [formData, setFormData] = useState({});
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Cargar datos del usuario al montar el componente
    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const userData = await getUserProfile();
            setUser(userData);
            setFormData({
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
                phone: userData.phone || '',
                date_of_birth: userData.date_of_birth ? userData.date_of_birth.split('T')[0] : '',
                address: userData.address || ''
            });
        } catch (err) {
            setError(err.message);
            console.error('Error cargando perfil:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            setError(null);
            const updatedUser = await updateUserProfile(formData);
            setUser(updatedUser.user);
            setIsEditing(false);
            alert('Perfil actualizado exitosamente');
        } catch (err) {
            setError(err.message);
            console.error('Error actualizando perfil:', err);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setError('La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            setError(null);
            await changePassword(passwordData.currentPassword, passwordData.newPassword);
            setIsChangingPassword(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            alert('Contraseña cambiada exitosamente');
        } catch (err) {
            setError(err.message);
            console.error('Error cambiando contraseña:', err);
        }
    };

    if (loading) {
        return (
            <div className="profile-container">
                <div className="loading">Cargando perfil...</div>
            </div>
        );
    }

    if (error && !user) {
        return (
            <div className="profile-container">
                <div className="error">
                    <h2>Error</h2>
                    <p>{error}</p>
                    <button onClick={loadUserProfile}>Reintentar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <h1>Perfil de Usuario</h1>
            
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <div className="profile-sections">
                {/* Información Personal */}
                <div className="profile-section">
                    <div className="section-header">
                        <h2>Información Personal</h2>
                        <button 
                            className="edit-btn"
                            onClick={() => setIsEditing(!isEditing)}
                        >
                            {isEditing ? 'Cancelar' : 'Editar'}
                        </button>
                    </div>

                    {!isEditing ? (
                        <div className="user-info">
                            <div className="user-photo">
                                <div className="photo-placeholder">👤</div>
                            </div>
                            <div className="user-details">
                                <p><strong>Nombre:</strong> {user.first_name} {user.last_name}</p>
                                <p><strong>Email:</strong> {user.email}</p>
                                <p><strong>Usuario:</strong> {user.username}</p>
                                <p><strong>Teléfono:</strong> {user.phone || 'No especificado'}</p>
                                <p><strong>Fecha de nacimiento:</strong> {user.date_of_birth || 'No especificada'}</p>
                                <p><strong>Dirección:</strong> {user.address || 'No especificada'}</p>
                                <p><strong>Miembro desde:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdateProfile} className="edit-form">
                            <div className="form-group">
                                <label>Nombre:</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    placeholder="Tu nombre"
                                />
                            </div>
                            <div className="form-group">
                                <label>Apellido:</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    placeholder="Tu apellido"
                                />
                            </div>
                            <div className="form-group">
                                <label>Teléfono:</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="+1234567890"
                                />
                            </div>
                            <div className="form-group">
                                <label>Fecha de nacimiento:</label>
                                <input
                                    type="date"
                                    name="date_of_birth"
                                    value={formData.date_of_birth}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Dirección:</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="Tu dirección completa"
                                    rows="3"
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="save-btn">Guardar Cambios</button>
                                <button 
                                    type="button" 
                                    className="cancel-btn"
                                    onClick={() => setIsEditing(false)}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Cambiar Contraseña */}
                <div className="profile-section">
                    <div className="section-header">
                        <h2>Seguridad</h2>
                        <button 
                            className="edit-btn"
                            onClick={() => setIsChangingPassword(!isChangingPassword)}
                        >
                            {isChangingPassword ? 'Cancelar' : 'Cambiar Contraseña'}
                        </button>
                    </div>

                    {isChangingPassword && (
                        <form onSubmit={handleChangePassword} className="password-form">
                            <div className="form-group">
                                <label>Contraseña actual:</label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="Tu contraseña actual"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Nueva contraseña:</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="Nueva contraseña (mín. 6 caracteres)"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirmar nueva contraseña:</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="Confirma la nueva contraseña"
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="save-btn">Cambiar Contraseña</button>
                                <button 
                                    type="button" 
                                    className="cancel-btn"
                                    onClick={() => {
                                        setIsChangingPassword(false);
                                        setPasswordData({
                                            currentPassword: '',
                                            newPassword: '',
                                            confirmPassword: ''
                                        });
                                    }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Información de la Cuenta */}
                <div className="profile-section">
                    <h2>Información de la Cuenta</h2>
                    <div className="account-info">
                        <p><strong>ID de usuario:</strong> {user.id}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Usuario:</strong> {user.username}</p>
                        <p><strong>Cuenta creada:</strong> {new Date(user.created_at).toLocaleString()}</p>
                        {user.updated_at && (
                            <p><strong>Última actualización:</strong> {new Date(user.updated_at).toLocaleString()}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
