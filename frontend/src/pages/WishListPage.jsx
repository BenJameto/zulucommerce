import React, { useState, useEffect } from 'react';
import './WishListPage.css';

function WishListPage() {
  // Suponemos un userId fijo para pruebas
  const userId = 1;
  const [wishList, setWishList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener la wishlist real del backend
  useEffect(() => {
    fetch(`http://localhost:3003/api/wishlist/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error('Error al obtener la wishlist');
        return res.json();
      })
      .then(data => {
        setWishList(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Eliminar producto de la wishlist en el backend
  const removeFromWishList = async (productId) => {
    try {
      const response = await fetch(`http://localhost:3003/api/wishlist/${userId}/${productId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Error al eliminar de la wishlist');
      setWishList(wishList.filter(item => item.product_id !== productId && item.id !== productId));
    } catch (err) {
      alert('No se pudo eliminar de la wishlist');
    }
  };

  // Agregar producto al carrito (igual que antes)
  const addToCart = async (product) => {
    try {
      const response = await fetch('http://localhost:4001/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          productId: product.product_id || product.id,
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

  if (loading) return <div className="wishlist-container"><p>Cargando...</p></div>;
  if (error) return <div className="wishlist-container"><p>Error: {error}</p></div>;

  return (
    <div className="wishlist-container">
      <h1 className="wishlist-title">Mi Lista de Deseos</h1>
      {wishList.length === 0 ? (
        <p className="empty-message">Tu lista de deseos está vacía.</p>
      ) : (
        <div className="wishlist-items-list">
          {wishList.map((product) => (
            <div className="wishlist-item" key={product.product_id || product.id}>
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
                  onClick={() => removeFromWishList(product.product_id || product.id)}
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
