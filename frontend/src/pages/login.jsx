import React, { useState } from 'react';
import './login.css';  // 👈 Aquí importamos el archivo CSS

function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isLogin) {
            console.log('Iniciando sesión:', { username, password });
        } else {
            console.log('Registrando usuario:', { fullName, username, password });
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1 className="login-title">{isLogin ? 'Login' : 'Registro'}</h1>
                <form className="login-form" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <input 
                            type="text" 
                            placeholder="Nombre Completo" 
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)} 
                        />
                    )}
                    <input 
                        type="text" 
                        placeholder="Usuario" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)} 
                    />
                    <input 
                        type="password" 
                        placeholder="Contraseña" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)} 
                    />
                    <button type="submit">
                        {isLogin ? 'Ingresar' : 'Crear cuenta'}
                    </button>
                </form>

                <p className="toggle-text">
                    {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                    <button 
                        type="button" 
                        className="toggle-button"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? 'Regístrate' : 'Iniciar sesión'}
                    </button>
                </p>
            </div>
        </div>
    );
}

export default Login;
