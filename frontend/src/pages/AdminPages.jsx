// frontend/src/pages/AdminPage.js
import React, { useState } from 'react';
// Asegúrate que se importa el CSS MEJORADO que ya tienes
import './AdminPage.css'; 

function AdminPage() {
  // Estados (sin cambios)
  const [productName, setProductName] = useState('');
  const [stock, setStock] = useState(0);
  const [price, setPrice] = useState(0);
  const [images, setImages] = useState([]);
  const [promotionActive, setPromotionActive] = useState(true);
  const customerEmails = [
    'cliente1@example.com',
    'cliente2@example.com',
    'cliente3@example.com'
  ];

  // Funciones (sin cambios)
  const addImageField = () => {
    if (images.length < 5) {
      setImages([...images, '']);
    }
  };
  const handleImageChange = (index, value) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };
  const removeImageField = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };
  const handleAddProduct = (e) => {
    e.preventDefault();
    const nonEmptyImages = images.filter(url => url.trim() !== '');
    if (nonEmptyImages.length > 0 && nonEmptyImages.length < 3) {
      alert("Si se agregan imágenes, debe proporcionar al menos 3 URLs.");
      return;
    }
    console.log('Producto agregado:', { 
      productName, 
      stock, 
      price, 
      images: nonEmptyImages 
    });
    if (stock <= 10) {
      console.log('Stock bajo, enviar notificación por correo.');
    }
    setProductName('');
    setStock(0);
    setPrice(0);
    setImages([]);
  };
  const togglePromotion = () => {
    setPromotionActive(!promotionActive);
  };

  return (
    <div className="admin-container">
      {/* El H1 ya está bien */}
      <h1>Panel de Administración</h1>
      
      {/* Sección para gestión de productos */}
      <section className="admin-section">
        <h2>Gestión de Productos</h2>
        {/* Añadir clase al formulario (recomendado) */}
        <form className="admin-form" onSubmit={handleAddProduct}>
          {/* Añadir clase a los grupos (recomendado) */}
          <div className="form-group">
            <label htmlFor="productName">Nombre del Producto:</label> {/* Añadido htmlFor */}
            <input 
              type="text" 
              id="productName" // Añadido id
              value={productName} 
              onChange={(e) => setProductName(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="stock">Stock:</label> {/* Añadido htmlFor */}
            <input 
              type="number" 
              id="stock" // Añadido id
              value={stock} 
              onChange={(e) => setStock(Number(e.target.value))} 
              required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="price">Precio:</label> {/* Añadido htmlFor */}
            <input 
              type="number" 
              id="price" // Añadido id
              step="0.01"
              value={price} 
              onChange={(e) => setPrice(Number(e.target.value))} 
              required 
            />
          </div>
          
          {/* Sección de Imágenes */}
          <div className="form-group"> {/* Envolver en form-group */}
            <h3>Imágenes del Producto</h3>
            <p>Nota: Si deseas agregar imágenes, ingresa entre 3 y 5 URLs (opcional).</p>
            {images.map((img, index) => (
              <div className="image-field" key={index}>
                <input 
                  type="text" 
                  placeholder={`URL de la imagen ${index + 1}`} 
                  value={img} 
                  onChange={(e) => handleImageChange(index, e.target.value)}
                />
                {/* Añadir clase btn-danger al botón Eliminar */}
                <button 
                  type="button" 
                  className="btn-danger" 
                  onClick={() => removeImageField(index)}
                >
                  Eliminar
                </button>
              </div>
            ))}
             {/* Añadir clase btn-primary o btn-secondary al botón Agregar */}
            <button 
              type="button" 
              className="btn-primary" /* O usa otra clase si defines más estilos */
              onClick={addImageField} 
              disabled={images.length >= 5}
              style={{marginTop: '10px', maxWidth: '200px'}} /* Estilo inline opcional o mover a CSS */
            >
              Agregar Imagen
            </button>
          </div>

          {/* Añadir clase btn-success al botón Agregar Producto */}
          <button type="submit" className="btn-success"> 
            Agregar Producto
          </button>
        </form>
      </section>

      {/* Sección para promociones */}
      <section className="admin-section">
        <h2>Promociones</h2>
        <p>
          Estado de la promoción: <strong>{promotionActive ? 'Activa' : 'Desactivada'}</strong>
        </p>
         {/* Añadir clase btn-primary al botón de toggle */}
        <button 
          className="btn-primary" 
          onClick={togglePromotion}
          style={{maxWidth: '250px'}} /* Estilo inline opcional */
        >
          {promotionActive ? 'Desactivar promoción' : 'Activar promoción'}
        </button>
        <div style={{ marginTop: '20px' }}> {/* Incrementado margen */}
          <h3>Reglas de Promoción</h3>
          <ul>
            <li>Venta de 10,000: Descuento del 10%</li>
            <li>Venta de 50,000: Descuento del 15%</li>
          </ul>
        </div>
      </section>

      {/* Sección para marketing y estadísticas */}
      <section className="admin-section">
        <h2>Marketing y Clientes</h2>
        {/* Usar form-group para consistencia si se quiere */}
        <div className="form-group"> 
          <h3>Correos de Clientes</h3>
          {/* Podrías estilizar esta lista si quieres */}
          <ul> 
            {customerEmails.map((email, index) => (
              <li key={index}>{email}</li>
            ))}
          </ul>
        </div>
        <div className="form-group" style={{ marginTop: '20px' }}> 
          <h3>Estadísticas de Clientes</h3>
          <p>
            Aquí se podrían mostrar datos como edades, países de origen y los productos más consumidos.
          </p>
           {/* Podrías añadir botones de acción aquí si es necesario */}
        </div>
      </section>
    </div>
  );
}

export default AdminPage;