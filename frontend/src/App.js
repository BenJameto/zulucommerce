

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './pages/login';
import CartPage from './pages/CartPage'; // Asegúrate de que la ruta sea correcta

function App() {
    return (
        <Router> {/* Envuelve tu aplicación con Router */}
            <div className="App">
                <Routes> {/* Envuelve tus rutas con Routes */}
                    <Route path="/" element={<Login />} /> {/* Ruta para el login */}
                    <Route path="/cart" element={<CartPage />} /> {/* Ruta para el carrito */}
                </Routes>
            </div>
        </Router>
    );
}

export default App;
