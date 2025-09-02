import React, { useState } from 'react';
import './login.css';
import { login, register } from '../services/authService';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        const res = await login({ username, password });
        console.log("✅ Sesión iniciada", res);
        // redirige o guarda el token si recibes uno
      } else {
        const res = await register({ email, username, password });
        console.log("✅ Usuario registrado", res);
      }
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error, revisa los datos ingresados.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">{isLogin ? 'Login' : 'Registro'}</h1>
        <form className="login-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="email"
              placeholder="Correo electronico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">
            {isLogin ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <p className="toggle-text">
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button
            type="button"
            className="toggle-button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            {isLogin ? 'Regístrate' : 'Iniciar sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
