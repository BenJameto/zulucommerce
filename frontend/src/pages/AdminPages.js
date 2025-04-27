// frontend/src/pages/AdminPage.js
import React, { useState } from 'react';
import './AdminPage.css';

function AdminPage() {
  // Estados para detalles del producto
  const [productName, setProductName] = useState('');
  const [stock, setStock] = useState(0);
  const [price, setPrice] = useState(0);
  
  // Estado para las imágenes: se guardarán las URLs
  const [images, setImages] = useState([]);
  
  // Estado para la promoción
  const [promotionActive, setPromotionActive] = useState(true);
  
  // Simulación de datos de clientes
  const customerEmails = [
    'cliente1@example.com',
    'cliente2@example.com',
    'cliente3@example.com'
  ];

  // Función para agregar un campo de imagen (máximo 5)
  const addImageField = () => {
    if (images.length < 5) {
      setImages([...images, '']);
    }
  };

  // Actualizar el valor de una imagen en el índice indicado
  const handleImageChange = (index, value) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  // Eliminar un campo de imagen
  const removeImageField = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  // Función para agregar el producto
  const handleAddProduct = (e) => {
    e.preventDefault();
    
    // Si se han ingresado imágenes, se requiere que al menos 3 sean no vacías
    const nonEmptyImages = images.filter(url => url.trim() !== '');
    if (nonEmptyImages.length > 0 && nonEmptyImages.length < 3) {
      alert("Si se agregan imágenes, debe proporcionar al menos 3 URLs.");
      return;
    }
    
    // Aquí enviarías los datos al backend; por ahora, solo se imprime en consola
    console.log('Producto agregado:', { 
      productName, 
      stock, 
      price, 
      images: nonEmptyImages 
    });
    
    // Si el stock es bajo (<= 10), simula notificación
    if (stock <= 10) {
      console.log('Stock bajo, enviar notificación por correo.');
    }
    
    // Reiniciar el formulario
    setProductName('');
    setStock(0);
    setPrice(0);
    setImages([]);
  };

  // Alternar estado de promoción
  const togglePromotion = () => {
    setPromotionActive(!promotionActive);
  };

  return (
    <div className="admin-container">
      <h1>Panel de Administración</h1>
      
      {/* Sección para gestión de productos */}
      <section className="admin-section">
        <h2>Gestión de Productos</h2>
        <form onSubmit={handleAddProduct}>
          <div>
            <label>Nombre del Producto:</label>
            <input 
              type="text" 
              value={productName} 
              onChange={(e) => setProductName(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label>Stock:</label>
            <input 
              type="number" 
              value={stock} 
              onChange={(e) => setStock(Number(e.target.value))} 
              required 
            />
          </div>
          <div>
            <label>Precio:</label>
            <input 
              type="number" 
              step="0.01"
              value={price} 
              onChange={(e) => setPrice(Number(e.target.value))} 
              required 
            />
          </div>
          <div>
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
                <button type="button" onClick={() => removeImageField(index)}>
                  Eliminar
                </button>
              </div>
            ))}
            <button type="button" onClick={addImageField} disabled={images.length >= 5}>
              Agregar Imagen
            </button>
          </div>
          <button type="submit">Agregar Producto</button>
        </form>
      </section>

      {/* Sección para promociones */}
      <section className="admin-section">
        <h2>Promociones</h2>
        <p>
          Estado de la promoción: <strong>{promotionActive ? 'Activa' : 'Desactivada'}</strong>
        </p>
        <button onClick={togglePromotion}>
          {promotionActive ? 'Desactivar promoción' : 'Activar promoción'}
        </button>
        <div style={{ marginTop: '10px' }}>
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
        <div>
          <h3>Correos de Clientes</h3>
          <ul>
            {customerEmails.map((email, index) => (
              <li key={index}>{email}</li>
            ))}
          </ul>
        </div>
        <div style={{ marginTop: '20px' }}>
          <h3>Estadísticas de Clientes</h3>
          <p>
            Aquí se podrían mostrar datos como edades, países de origen y los productos más consumidos.
          </p>
        </div>
      </section>
    </div>
  );
}

export default AdminPage;
