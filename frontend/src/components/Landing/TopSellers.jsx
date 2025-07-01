// src/components/Landing/TopSellers.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./Landing.css";

const userId = 1; // Fijo para pruebas

const handleAddToCart = async (product) => {
  try {
    const response = await fetch("http://localhost:4001/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, productId: product.id, quantity: 1 })
    });
    if (!response.ok) throw new Error("Error al agregar al carrito");
    alert(`${product.name} añadido al carrito!`);
  } catch (err) {
    alert("No se pudo agregar al carrito");
  }
};
const handleAddToWishlist = async (product) => {
  try {
    const response = await fetch("http://localhost:3003/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, productId: product.id })
    });
    if (!response.ok) throw new Error("Error al agregar a la lista de deseos");
    alert(`${product.name} añadido a la lista de deseos!`);
  } catch (err) {
    alert("No se pudo agregar a la lista de deseos");
  }
};

const TopSellers = ({ products = [] }) => {
  if (!products.length) return null;

  return (
    <section className="top-sellers">
      <h2 className="top-sellers__title">Lo Más Vendido</h2>
      <div className="top-sellers__grid">
        {products.map((product) => (
          <div key={product.id} className="top-sellers__card">
            <Link to={`/product/${product.id}`} className="top-sellers__img-link">
              <div className="top-sellers__img-container">
                <img
                  src={product.image}
                  alt={product.name}
                  className="top-sellers__img"
                />
              </div>
            </Link>
            <div className="top-sellers__info">
              <div>
                <Link to={`/product/${product.id}`} className="top-sellers__name-link">
                  <h3 className="top-sellers__name">{product.name}</h3>
                </Link>
                <p className="top-sellers__price">
                  ${product.price.toFixed(2)}
                </p>
              </div>
              <div className="top-sellers__actions product-actions">
                <button 
                  className="btn btn--primary btn--small"
                  onClick={() => handleAddToCart(product)}
                >
                  Al Carrito
                </button>
                <button 
                  className="btn btn--icon btn--wishlist"
                  onClick={() => handleAddToWishlist(product)}
                  title="Añadir a Lista de Deseos"
                >
                  ❤️
                </button>
                <Link 
                  to={`/product/${product.id}`} 
                  className="btn btn--secondary btn--small top-sellers__btn-details"
                >
                  Detalles
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TopSellers;
