// src/components/Landing/FeaturedProduct.jsx
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

const FeaturedProduct = ({ product }) => {
  if (!product) return null;

  return (
    <section className="featured-product">
      <div className="featured-product__container">
        <Link to={`/product/${product.id}`} className="featured-product__img-link">
          <div className="featured-product__image-wrapper">
            <img
              src={product.image}
              alt={product.name}
              className="featured-product__img"
            />
          </div>
        </Link>
        <div className="featured-product__info">
          <Link to={`/product/${product.id}`} className="featured-product__title-link">
            <h2 className="featured-product__title">{product.name}</h2>
          </Link>
          <p className="featured-product__desc">
            {product.description ||
              "Este es uno de nuestros productos más destacados por su alta calidad, diseño innovador y origen sostenible. ¡Descúbrelo!"}
          </p>
          <p className="featured-product__price">
            <span>Precio: </span>${product.price.toFixed(2)}
          </p>
          <div className="featured-product__actions product-actions">
            <button 
              className="btn btn--primary"
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
            <Link 
              to={`/product/${product.id}`} 
              className="btn btn--secondary featured-product__btn-details"
            >
              Ver Más Detalles
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProduct;

 