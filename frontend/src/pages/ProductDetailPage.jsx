// frontend/src/pages/ProductDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './ProductDetailPage.css'; // Asegúrate que este archivo exista

const handleAddToCart = (product, quantity) => {
  console.log(`Añadido al carrito: ${quantity} x ${product.name} (ID: ${product.id})`);
  alert(`${quantity} x ${product.name} añadido al carrito!`);
};
const handleAddToWishlist = (product) => {
  console.log(`Añadido a lista de deseos: ${product.name} (ID: ${product.id})`);
  alert(`${product.name} añadido a la lista de deseos!`);
};

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
    // SIMULACIÓN DE FETCH: Reemplaza esto con tu fetch real
    setTimeout(() => {
      const exampleProducts = [
        { id: "1", name: "Botella de Agua Ecológica", price: 20.00, image: "https://m.media-amazon.com/images/I/61CQachvmqL.jpg", description: "Botella de agua reutilizable hecha con materiales reciclados, perfecta para mantener tus bebidas frías o calientes.", stock: 15, category: "Accesorios" },
        { id: "2", name: "Sony WH-1000XM5 Audífonos", price: 5999.00, image: "https://http2.mlstatic.com/D_NQ_NP_620187-MLU69726815032_052023-O.webp", description: "Experimenta la cancelación de ruido líder en la industria con estos audífonos inalámbricos de alta calidad.", stock: 5, category: "Electrónicos" },
        { id: "3", name: "Camiseta Orgánica", price: 29.99, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=500', description: "Camiseta cómoda y suave hecha de algodón 100% orgánico.", stock: 3, category: "Ropa" },
        // ... añade más productos que coincidan con los IDs que usas en la Home
      ];
      const foundProduct = exampleProducts.find(p => p.id.toString() === productId);
      if (foundProduct) {
        setProduct(foundProduct);
      } else {
        setError("Producto no encontrado.");
      }
      setLoading(false);
    }, 1000);
  }, [productId]);

  const handleQuantityChange = (amount) => {
    setQuantity(prevQuantity => {
      const newQuantity = prevQuantity + amount;
      if (newQuantity < 1) return 1;
      if (product && newQuantity > product.stock) return product.stock;
      return newQuantity;
    });
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
          <p className="product-detail__category">Categoría: <Link to={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link></p>
          <p className="product-detail__price">${product.price.toFixed(2)}</p>
          <p 
            className="product-detail__stock" 
            style={{color: product.stock > 0 ? (product.stock < 5 ? 'var(--error-color)' : 'var(--success-color)') : 'var(--error-color)'}}
          >
            {product.stock > 0 ? `${product.stock} unidades disponibles` : "Agotado"}
            {product.stock > 0 && product.stock < 5 && " (¡Últimas unidades!)"}
          </p>
          <div className="product-detail__description">
            <h3>Descripción</h3>
            <p>{product.description}</p>
          </div>
          {product.stock > 0 && (
            <div className="product-detail__purchase-options">
              <div className="quantity-selector">
                <label htmlFor={`quantity-${product.id}`}>Cantidad:</label>
                <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>-</button>
                <input 
                  type="number" 
                  id={`quantity-${product.id}`}
                  value={quantity} 
                  min="1" 
                  max={product.stock}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(parseInt(e.target.value,10) || 1, product.stock) ))}
                />
                <button onClick={() => handleQuantityChange(1)} disabled={quantity >= product.stock}>+</button>
              </div>
              <button 
                className="btn btn--primary btn--add-to-cart-detail"
                onClick={() => handleAddToCart(product, quantity)}
              >
                Añadir al Carrito
              </button>
            </div>
          )}
          <div className="product-detail__actions">
            <button 
              className="btn btn--icon btn--wishlist-detail" // Asegúrate que .btn--icon esté definido globalmente o en este CSS
              onClick={() => handleAddToWishlist(product)}
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