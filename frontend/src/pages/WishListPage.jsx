// frontend/src/pages/WishListPage.js
import React, { useState } from 'react';
import './WishListPage.css'; // Asegúrate que este es el CSS actualizado que te daré abajo

function WishListPage() {
  // Estado inicial con productos de ejemplo (sin cambios)
  const [wishList, setWishList] = useState([
    {
      id: 1,
      name: 'Botella de agua',
      image: 'https://m.media-amazon.com/images/I/61CQachvmqL.jpg',
      // description: 'Stay hydrated with our premium eco-friendly water bottle.', // Descripción opcional, puede hacer la tarjeta alta
      price: 24.99,
      inStock: true,
    },
    {
      id: 2,
      name: 'Reusable Coffee Cup',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpjuPdKoQdZvx24XerVr8e8ufiuCeIBChpTw&s', // Placeholder
      // description: 'A stylish reusable coffee cup to reduce waste.',
      price: 14.99,
      inStock: false,
    },
    // Añade más productos si quieres
  ]);

  // Eliminar un producto de la lista (sin cambios)
  const removeFromWishList = (id) => {
    const updatedList = wishList.filter((item) => item.id !== id);
    setWishList(updatedList);
  };

  // Agregar al carrito (simulado - sin cambios)
  const addToCart = (product) => {
    alert(`Agregado al carrito: ${product.name}`);
    // Lógica real de añadir al carrito aquí
  };

  return (
    <div className="wishlist-container">
      <h1 className="wishlist-title">Mi Lista de Deseos</h1> {/* Título ajustado */}
      
      {/* Si la wishlist está vacía, muestra un mensaje */}
      {wishList.length === 0 ? (
        <p className="empty-message">Tu lista de deseos está vacía.</p>
      ) : (
        // NUEVO: Contenedor para la lista de tarjetas
        <div className="wishlist-items-list">
          {wishList.map((product) => (
            // NUEVO: Tarjeta individual para cada producto
            <div className="wishlist-item" key={product.id}>
              
              <img 
                className="wishlist-item-image" 
                src={product.image} 
                alt={product.name} 
              />
              
              <div className="wishlist-item-details">
                <h3 className="wishlist-item-name">{product.name}</h3>
                <p className="wishlist-item-price">${product.price.toFixed(2)}</p> {/* Asegurar formato de precio */}
                <p className={`stock-status ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
                  {product.inStock ? 'En Stock' : 'Agotado'}
                </p>
              </div>

              <div className="wishlist-item-actions">
                <button
                  className="add-to-cart-btn"
                  onClick={() => addToCart(product)}
                  disabled={!product.inStock}
                >
                  Añadir a la Cesta {/* Texto ajustado */}
                </button>
                <button
                  className="remove-btn"
                  onClick={() => removeFromWishList(product.id)}
                >
                  Eliminar {/* Texto ajustado */}
                </button>
              </div>

            </div> // Fin de wishlist-item
          ))} 
        </div> // Fin de wishlist-items-list
      )}
    </div> // Fin de wishlist-container
  );
}

export default WishListPage;