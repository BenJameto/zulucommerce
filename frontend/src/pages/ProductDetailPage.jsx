// frontend/src/pages/ProductDetailPage.js
import React, { useState } from 'react';
import './ProductDetailPage.css'; // Asegúrate de importar el CSS final

function ProductDetailPage() {
  // Datos simulados de producto (sin cambios)
  const product = {
    id: 1,
    name: 'Sony WH-1000XM5 Audífonos Inalámbricos',
    brand: 'Sony',
    price: 5999.00, // Usar .00 para claridad
    rating: 4.7,
    reviewsCount: 16537,
    images: [
      'https://http2.mlstatic.com/D_NQ_NP_620187-MLU69726815032_052023-O.webp',
      'https://mobomx.vtexassets.com/arquivos/ids/196876-800-auto?v=638212067600330000&width=800&height=auto&aspect=true',
      'https://perfectchoice.me/cdn/shop/files/V-930051001_600x.png?v=1692040449',
      // Añadir más imágenes si quieres que se muestren como thumbnails
    ],
    description: 'Estos audífonos ofrecen cancelación de ruido avanzada, diseño ergonómico y una experiencia de sonido envolvente.',
    specs: {
      'Tipo de conexión': 'Inalámbrico',
      'Cancelación de ruido': 'Activa',
      'Marca': 'Sony',
      'Color': 'Negro',
      'Peso': '250 gramos',
      'Compatibilidad': 'Bluetooth 5.0',
      'Duración Batería': 'Hasta 30 horas (con NC)',
    },
    reviews: [
      {
        user: 'Juan Pérez',
        title: 'Excelentes audífonos',
        comment: 'La cancelación de ruido es impresionante, la calidad de sonido es clara y equilibrada.',
        rating: 5,
        date: '2025-04-15', // Añadir fecha opcional
      },
      {
        user: 'Ana Gómez',
        title: 'Muy buenos, pero caros',
        comment: 'El precio es un poco alto, pero vale la pena por la calidad de sonido y la duración de la batería.',
        rating: 4,
        date: '2025-04-10', // Añadir fecha opcional
      },
    ],
    inStock: true, // Añadir estado de stock
  };

  const [selectedImage, setSelectedImage] = useState(product.images[0]);

  // Funciones Handler (Simuladas)
  const handleAddToCart = () => {
    alert(`¡Producto agregado al carrito: ${product.name}!`);
    // Lógica real de añadir al carrito (API call, state update)
  };

  const handleAddToWishlist = () => {
    alert(`¡Producto agregado a la lista de deseos: ${product.name}!`);
    // Lógica real de añadir a wishlist (API call, state update)
  };

  const handleBuyNow = () => {
    alert(`Iniciando compra inmediata para: ${product.name}!`);
     // Lógica real de compra inmediata (redirigir a checkout con el item?)
  }

  return (
    <div className="product-detail-container">
      {/* Sección superior: imágenes y datos principales */}
      <div className="top-section">
        {/* Galería de Imágenes */}
        <div className="image-gallery">
          <div className="main-image">
            <img src={selectedImage} alt={product.name} />
          </div>
          <div className="thumbnail-list">
            {product.images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Thumbnail ${index + 1}`}
                onClick={() => setSelectedImage(img)}
                className={selectedImage === img ? 'thumbnail active' : 'thumbnail'}
              />
            ))}
          </div>
        </div>

        {/* Resumen del Producto */}
        <div className="product-summary">
          <p className="brand">Marca: {product.brand}</p>
          <h1>{product.name}</h1>
          
          <div className="rating-container">
            <span className="rating">{product.rating} ★</span>
            {/* Enlace simulado a reviews */}
            <a href="#reviews-section" className="reviews-count">({product.reviewsCount} opiniones)</a> 
          </div>

          <div className="price-container">
              <span className="price">$ {product.price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              {/* Podrías añadir precio anterior o descuento aquí si aplica */}
              {/* <span className="discount-badge">-15%</span> */}
          </div>

          {product.inStock ? (
            <p className="stock-status in-stock">Disponible</p>
          ) : (
            <p className="stock-status out-of-stock">Agotado</p>
          )}

          {/* Contenedor para botones de acción */}
          <div className="action-buttons"> 
            <button 
              className="add-to-cart-btn" // Botón primario
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              Agregar al Carrito
            </button>
            {/* NUEVO BOTÓN: Agregar a Wishlist (Secundario) */}
            <button 
              className="add-to-wishlist-btn" // Botón secundario
              onClick={handleAddToWishlist}
            >
              Agregar a Wishlist
            </button>
            {/* Botón opcional Compra Rápida */}
             <button 
              className="buy-now-btn" // Estilo diferente (ej. más oscuro/rojo)
              onClick={handleBuyNow}
              disabled={!product.inStock}
            >
              Comprar Ahora
            </button>
          </div>
        </div>
      </div>

      {/* Sección de descripción y especificaciones */}
      <div className="info-section">
        <div className="description">
          <h2>Descripción del producto</h2>
          <p>{product.description}</p>
        </div>
        <div className="specs">
          <h2>Información del producto</h2>
          <ul>
            {/* Mapeo mejorado para specs */}
            {Object.entries(product.specs).map(([key, value]) => (
              <li key={key}>
                <strong>{key}:</strong> <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sección de opiniones (reviews) */}
      <div id="reviews-section" className="reviews-section"> {/* Añadido ID para enlace */}
        <h2>Opiniones de Clientes</h2>
        {product.reviews.length > 0 ? (
            product.reviews.map((review, index) => (
              <div className="review" key={index}>
                <div className="review-header">
                    <h3 title={review.title}>{review.title}</h3>
                    <span className="rating">{review.rating} ★</span>
                </div>
                <p className="user">
                  Por <strong>{review.user}</strong> 
                  {review.date && <span className="date"> el {new Date(review.date).toLocaleDateString('es-MX')}</span>} 
                </p>
                <p className="comment">{review.comment}</p>
              </div>
            ))
        ) : (
            <p>Aún no hay opiniones para este producto.</p>
        )}
      </div>
    </div>
  );
}

export default ProductDetailPage;