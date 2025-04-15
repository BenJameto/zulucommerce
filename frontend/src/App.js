

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Login from './pages/login';
import CartPage from './pages/CartPage'; 
import { CheckoutPage } from './pages/CheckoutPage';
import HomePage from './pages/HomePage';
import UserProfile from './pages/UserProfile';

function App() {
    return (
        <Router> {/* Envuelve tu aplicación con Router */}
            <div className="App">
                <Navbar/>{/*mandamos a traer la barra de navegacion */}
                <Routes> {/* Envuelve tus rutas con Routes */}
                    <Route path="/" element={<HomePage />} /> {/* Ruta para el inicio */}
                    <Route path="/userprofile" element={<UserProfile/>}/>{/*Ruta perfil de usuario*/} 
                    <Route path='/login' element={<Login/>}/>{/*Ruta para el login*/}
                    <Route path="/cart" element={<CartPage />} /> {/* Ruta para el carrito */}
                    <Route path="/checkout" element={<CheckoutPage />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
