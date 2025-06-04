// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'; // Asegúrate que este archivo contiene tus variables CSS globales y estilos base

// Verifica CADA UNA de estas importaciones contra las exportaciones en los archivos correspondientes:
import Navbar from './components/Navbar';
import Login from './pages/login'; // ¿Es 'login.jsx' o 'Login.jsx'? La consistencia en nombres ayuda.
import CartPage from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage'; // REQUIERE: export const CheckoutPage en CheckoutPage.jsx
import HomePage from './pages/HomePage';
import UserProfile from './pages/UserProfile';
import AdminPages from './pages/AdminPages'; // ¿Es 'AdminPages.jsx' o 'AdminPage.jsx'? (Visto como AdminPage.jsx antes)
import ProductDetailPage from './pages/ProductDetailPage';
import WishListPage from './pages/WishListPage';

function App() {
    return (
        <Router>
            <div className="App">
                <Navbar />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/userprofile" element={<UserProfile />}/>
                    <Route path='/login' element={<Login />}/>
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/admin" element={<AdminPages />} /> {/* Asegúrate que 'AdminPages' sea el componente correcto */}
                    <Route path="/wishlist" element={<WishListPage />} />
                    {/* La ruta para ProductDetailPage usualmente incluye un parámetro como productId */}
                    <Route path="/product/:productId" element={<ProductDetailPage />} /> 
                </Routes>
            </div>
        </Router>
    );
}

export default App;