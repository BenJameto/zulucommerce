import React, { useState } from 'react';
import './WishListPage.css';

function WishListPage() {
  const [wishList, setWishList] = useState([
    {
      id: 1,
      name: 'Botella de agua',
      image: 'https://m.media-amazon.com/images/I/61CQachvmqL.jpg',
      price: 24.99,
      inStock: true,
    },
    {
      id: 2,
      name: 'Reusable Coffee Cup',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpjuPdKoQdZvx24XerVr8e8ufiuCeIBChpTw&s',
      price: 14.99,
      inStock: false,
    },
  ]);

  const removeFromWishList = (id) => {
    const updatedList = wishList.filter((item) => item.id !== id);
    setWishList(updatedList);
  };

  const addToCart = async (product) => {
    try {
      const response = await fetch('http://localhost:4001/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al agregar al carrito');
      }

      const data = await response.json();
      alert(`✅ ${product.name} fue agregado al carrito`);
      console.log(data);
    } catch (error) {
      console.error(error);
      alert('❌ No se pudo agregar al carrito');
    }
  };

  return (
    <div className="wishlist-container">
      <h1 className="wishlist-title">Mi Lista de Deseos</h1>
      
      {wishList.length === 0 ? (
        <p className="empty-message">Tu lista de deseos está vacía.</p>
      ) : (
        <div className="wishlist-items-list">
          {wishList.map((product) => (
            <div className="wishlist-item" key={product.id}>
              <img
                className="wishlist-item-image"
                src={product.image}
                alt={product.name}
              />

              <div className="wishlist-item-details">
                <h3 className="wishlist-item-name">{product.name}</h3>
                <p className="wishlist-item-price">${product.price.toFixed(2)}</p>
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
                  Añadir a la Cesta
                </button>
                <button
                  className="remove-btn"
                  onClick={() => removeFromWishList(product.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WishListPage;
