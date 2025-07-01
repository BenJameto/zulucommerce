// frontend/src/pages/ProductDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './ProductDetailPage.css'; // Asegúrate que este archivo exista

const userId = 1; // Fijo para pruebas

const ProductDetailPage = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`http://localhost:4000/api/products/${productId}`)
      .then(res => {
        if (!res.ok) throw new Error('Producto no encontrado');
        return res.json();
      })
      .then(data => {
        setProduct(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [productId]);

  const handleQuantityChange = (amount) => {
    setQuantity(prevQuantity => {
      const newQuantity = prevQuantity + amount;
      if (newQuantity < 1) return 1;
      if (product && product.stock && newQuantity > product.stock) return product.stock;
      return newQuantity;
    });
  };

  const handleAddToCart = async () => {
    try {
      const response = await fetch('http://localhost:4001/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId: product.id, quantity })
      });
      if (!response.ok) throw new Error('Error al agregar al carrito');
      alert(`${quantity} x ${product.name} añadido al carrito!`);
    } catch (err) {
      alert('No se pudo agregar al carrito');
    }
  };

  const handleAddToWishlist = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId: product.id })
      });
      if (!response.ok) throw new Error('Error al agregar a la lista de deseos');
      alert(`${product.name} añadido a la lista de deseos!`);
    } catch (err) {
      alert('No se pudo agregar a la lista de deseos');
    }
  };

  if (loading) return <div className="product-detail-status">Cargando producto...</div>;
  if (error) return <div className="product-detail-status product-detail-error">{error} <Link to="/">Volver a la tienda</Link></div>;
  if (!product) return <div className="product-detail-status">Producto no disponible. <Link to="/">Volver a la tienda</Link></div>;

  return (
    <div className="product-detail-container">
      <button onClick={() => navigate(-1)} className="btn btn--secondary btn--back">
        &larr; Volver
      </button>
      <div className="product-detail-card">
        <div className="product-detail__image-gallery">
          <img src={product.image} alt={product.name} className="product-detail__main-image" />
        </div>
        <div className="product-detail__info">
          <h1 className="product-detail__name">{product.name}</h1>
          {product.category && (
            <p className="product-detail__category">Categoría: <Link to={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link></p>
          )}
          <p className="product-detail__price">${product.price.toFixed(2)}</p>
          {typeof product.stock !== 'undefined' && (
            <p 
              className="product-detail__stock" 
              style={{color: product.stock > 0 ? (product.stock < 5 ? 'var(--error-color)' : 'var(--success-color)') : 'var(--error-color)'}}
            >
              {product.stock > 0 ? `${product.stock} unidades disponibles` : "Agotado"}
              {product.stock > 0 && product.stock < 5 && " (¡Últimas unidades!)"}
            </p>
          )}
          <div className="product-detail__description">
            <h3>Descripción</h3>
            <p>{product.description}</p>
          </div>
          {(!('stock' in product) || product.stock > 0) && (
            <div className="product-detail__purchase-options">
              <div className="quantity-selector">
                <label htmlFor={`quantity-${product.id}`}>Cantidad:</label>
                <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>-</button>
                <input 
                  type="number" 
                  id={`quantity-${product.id}`}
                  value={quantity} 
                  min="1" 
                  max={product.stock || 99}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(parseInt(e.target.value,10) || 1, product.stock || 99) ))}
                />
                <button onClick={() => handleQuantityChange(1)} disabled={product.stock ? quantity >= product.stock : false}>+</button>
              </div>
              <button 
                className="btn btn--primary btn--add-to-cart-detail"
                onClick={handleAddToCart}
              >
                Añadir al Carrito
              </button>
            </div>
          )}
          <div className="product-detail__actions">
            <button 
              className="btn btn--icon btn--wishlist-detail"
              onClick={handleAddToWishlist}
              title="Añadir a Lista de Deseos"
            >
              ❤️ Añadir a Deseos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;