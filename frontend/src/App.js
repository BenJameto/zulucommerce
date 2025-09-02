import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Componentes básicos para empezar
function HomePage() {
  return (
    <div className="home-page">
      <h1>Bienvenido a ZuluCommerce</h1>
      <p>Tu plataforma de comercio electrónico con microservicios</p>
    </div>
  );
}

function LoginPage() {
  return (
    <div className="login-page">
      <h2>Iniciar Sesión</h2>
      <p>Página de login en desarrollo</p>
    </div>
  );
}

function CartPage() {
  return (
    <div className="cart-page">
      <h2>Carrito de Compras</h2>
      <p>Carrito en desarrollo</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <h1>ZuluCommerce</h1>
          <ul>
            <li><a href="/">Inicio</a></li>
            <li><a href="/login">Login</a></li>
            <li><a href="/cart">Carrito</a></li>
          </ul>
        </nav>
        
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cart" element={<CartPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
