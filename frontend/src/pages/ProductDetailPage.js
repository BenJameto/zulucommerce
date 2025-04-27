// frontend/src/pages/ProductDetailPage.js
import React, { useState } from 'react';
import './ProductDetailPage.css';

function ProductDetailPage() {
  // Datos simulados de producto
  const product = {
    id: 1,
    name: 'Sony WH-1000XM5 Audífonos Inalámbricos',
    brand: 'Sony',
    price: 5999,
    rating: 4.7,
    reviewsCount: 16537,
    images: [
      'https://http2.mlstatic.com/D_NQ_NP_620187-MLU69726815032_052023-O.webp',
      'https://mobomx.vtexassets.com/arquivos/ids/196876-800-auto?v=638212067600330000&width=800&height=auto&aspect=true',
      'https://perfectchoice.me/cdn/shop/files/V-930051001_600x.png?v=1692040449',
    ],
    description: 'Estos audífonos ofrecen cancelación de ruido avanzada, diseño ergonómico y una experiencia de sonido envolvente.',
    specs: {
      'Tipo de conexión': 'Inalámbrico',
      'Cancelación de ruido': 'Activa',
      'Marca': 'Sony',
      'Color': 'Negro',
      'Peso': '250 gramos',
      'Compatibilidad': 'Bluetooth 5.0',
    },
    reviews: [
      {
        user: 'Juan Pérez',
        title: 'Excelentes audífonos',
        comment: 'La cancelación de ruido es impresionante, la calidad de sonido es clara y equilibrada.',
        rating: 5,
      },
      {
        user: 'Ana Gómez',
        title: 'Muy buenos, pero caros',
        comment: 'El precio es un poco alto, pero vale la pena por la calidad de sonido y la duración de la batería.',
        rating: 4,
      },
    ],
  };

  const [selectedImage, setSelectedImage] = useState(product.images[0]);

  const handleAddToCart = () => {
    alert(`¡Producto agregado al carrito: ${product.name}!`);
    // Aquí podrías llamar a tu backend o actualizar un estado global (Redux, Context, etc.)
  };

  return (
    <div className="product-detail-container">
      {/* Sección superior: imágenes y datos principales */}
      <div className="top-section">
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

        <div className="product-summary">
          <h1>{product.name}</h1>
          <p className="brand">Marca: {product.brand}</p>
          <p className="price">$ {product.price.toLocaleString()}</p>
          <div className="rating">
            <span>{product.rating} ★</span>
            <span className="reviews-count">({product.reviewsCount} opiniones)</span>
          </div>
          <button className="add-to-cart-btn" onClick={handleAddToCart}>
            Agregar al Carrito
          </button>
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
            {Object.entries(product.specs).map(([key, value]) => (
              <li key={key}>
                <strong>{key}: </strong> {value}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sección de opiniones (reviews) */}
      <div className="reviews-section">
        <h2>Opiniones</h2>
        {product.reviews.map((review, index) => (
          <div className="review" key={index}>
            <h3>{review.title}</h3>
            <p className="user">
              Por <strong>{review.user}</strong> - Calificación: {review.rating} ★
            </p>
            <p className="comment">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductDetailPage;
