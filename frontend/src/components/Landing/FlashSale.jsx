// src/components/Landing/FlashSale.jsx
import React, { useEffect, useState } from "react";
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

const FlashSale = ({ product, endsInHours = 12 }) => {
  const [timeLeft, setTimeLeft] = useState(endsInHours * 3600);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const pad = (n) => (n < 10 ? "0" + n : n);
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  if (!product) return null;

  return (
    <section className="flash-sale">
      <div className="flash-sale__banner">
        <div className="flash-sale__info">
          <h2 className="flash-sale__title">¡Oferta Relámpago!</h2>
          <p className="flash-sale__timer">
            Termina en: <span>{formatTime(timeLeft)}</span>
          </p>
        </div>
        <div className="flash-sale__product-card">
          <Link to={`/product/${product.id}`} className="flash-sale__img-link">
            <img
              src={product.image}
              alt={product.name}
              className="flash-sale__img"
            />
          </Link>
          <div className="flash-sale__details">
            <Link to={`/product/${product.id}`} className="flash-sale__name-link">
              <h3 className="flash-sale__name">{product.name}</h3>
            </Link>
            <p className="flash-sale__price">${product.price.toFixed(2)}</p>
            <div className="flash-sale__actions product-actions">
              <button 
                className="btn btn--success flash-sale__btn-cart"
                onClick={() => handleAddToCart(product)}
              >
                Añadir al Carrito
              </button>
              <button 
                className="btn btn--icon btn--wishlist"
                onClick={() => handleAddToWishlist(product)}
                title="Añadir a Lista de Deseos"
              >
                ❤️
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FlashSale;
 