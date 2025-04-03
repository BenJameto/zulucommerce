// frontend/src/pages/WishListPage.js
import React, { useState } from 'react';
import './WishListPage.css';

function WishListPage() {
  // Estado inicial con productos de ejemplo
  const [wishList, setWishList] = useState([
    {
      id: 1,
      name: 'Eco-Friendly Water Bottle',
      image: 'https://via.placeholder.com/100',
      description: 'Stay hydrated with our premium eco-friendly water bottle.',
      price: 24.99,
      inStock: true,
    },
    {
      id: 2,
      name: 'Reusable Coffee Cup',
      image: 'https://via.placeholder.com/100',
      description: 'A stylish reusable coffee cup to reduce waste.',
      price: 14.99,
      inStock: false,
    },
  ]);

  // Eliminar un producto de la lista
  const removeFromWishList = (id) => {
    const updatedList = wishList.filter((item) => item.id !== id);
    setWishList(updatedList);
  };

  // Agregar al carrito (simulado)
  const addToCart = (product) => {
    alert(`Agregado al carrito: ${product.name}`);
    // Aquí podrías llamar a tu backend o actualizar el estado global (Redux, Context, etc.)
  };

  return (
    <div className="wishlist-container">
      <h1 className="wishlist-title">My Wishlist</h1>
      
      {/* Si la wishlist está vacía, muestra un mensaje */}
      {wishList.length === 0 ? (
        <p className="empty-message">Your wishlist is empty.</p>
      ) : (
        <table className="wishlist-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Stock Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {wishList.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="product-info">
                    <img src={product.image} alt={product.name} />
                    <div>
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                    </div>
                  </div>
                </td>
                <td>${product.price}</td>
                <td>
                  {product.inStock ? (
                    <span className="in-stock">In Stock</span>
                  ) : (
                    <span className="out-of-stock">Out of Stock</span>
                  )}
                </td>
                <td>
                  <button
                    className="add-to-cart-btn"
                    onClick={() => addToCart(product)}
                    disabled={!product.inStock}
                  >
                    Add to Cart
                  </button>
                  <button
                    className="remove-btn"
                    onClick={() => removeFromWishList(product.id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default WishListPage;
