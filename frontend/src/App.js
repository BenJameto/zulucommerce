// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Importa las páginas (asegúrate de que existan en la carpeta 'src/pages')
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPages';
import WishListPage from './pages/WishListPage';
import ProductDetailPage from './pages/ProductDetailPage'; // <-- Importa tu nueva página

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/wishlist" element={<WishListPage />} />
        {/* Nueva ruta para el detalle del producto */}
        <Route path="/product-detail" element={<ProductDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;
