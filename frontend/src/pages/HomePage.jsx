// frontend/src/pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import "./HomePage.css"; // Estilos generales de HomePage
import "../components/Landing/Landing.css"; // Estilos específicos de los componentes de Landing

import Hero from "../components/Landing/Hero";
import FlashSale from "../components/Landing/FlashSale";
import TopSellers from "../components/Landing/TopSellers";
import FeaturedProduct from "../components/Landing/FeaturedProduct";

// Componente simple para mostrar mensajes de carga, error o vacío
const StatusMessage = ({ children, type = "info" }) => (
  <div
    style={{
      padding: "20px",
      margin: "30px auto",
      textAlign: "center",
      maxWidth: "700px",
      backgroundColor: type === "error" ? "var(--error-bg)" : "var(--card-bg)",
      color: type === "error" ? "var(--error-color)" : "var(--text-secondary)",
      border: `1px solid ${type === "error" ? "var(--error-color)" : "var(--border-color)"}`,
      borderRadius: "var(--border-radius-small)", // Coma es correcta aquí porque hay una propiedad después
      boxShadow: "var(--card-shadow)" // SIN COMA aquí porque es la ÚLTIMA propiedad del objeto style
    }}
  >
    {children}
  </div>
);


const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    // Asegúrate que este endpoint exista y devuelva los productos como esperas.
    // Si tu API está en un puerto diferente o ruta, ajústalo.
    fetch("http://localhost:4000/api/products") 
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Error HTTP ${res.status}: No se pudo obtener la información de productos.`);
        }
        return res.json();
      })
      .then((data) => {
        // Ajusta según la estructura de tu respuesta JSON.
        // Si 'data' es directamente el array de productos: setProducts(data);
        // Si 'data' es un objeto como { products: [...] }: setProducts(data.products || []);
        setProducts(Array.isArray(data) ? data : (data.products || []));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar productos:", err);
        setError(err.message || "No se pudieron cargar los productos. Inténtalo más tarde.");
        setLoading(false);
      });
  }, []);

  // Lógica para seleccionar productos para cada sección.
  // Puedes personalizar esta lógica según tus necesidades o datos de la API.
  const flashSaleProduct = products.length > 0 ? products[0] : null;
  const topSellersProducts = products.slice(1, Math.min(products.length, 7)); // Hasta 6 productos para TopSellers
  const featuredProductData = products.length > 7 ? products[7] : (products.length > 1 && products.length <=7 ? products[products.length-1] : null) ;


  return (
    <>
      {/* El componente Hero (carrusel) se renderiza independientemente de la carga de productos */}
      <Hero />

      {/* Contenedor para el resto del contenido de la página principal */}
      <div className="home-content-container" style={{padding: "0 clamp(1rem, 3vw, 2rem)"}}>
        {loading && <StatusMessage>Cargando nuestros productos destacados...</StatusMessage>}
        {error && <StatusMessage type="error">{error}</StatusMessage>}

        {!loading && !error && (
          <>
            {flashSaleProduct ? (
              <FlashSale product={flashSaleProduct} endsInHours={24} />
            ) : (
              // Solo muestra este mensaje si no hay productos en absoluto después de cargar
              products.length === 0 && <StatusMessage>Nuestras ofertas relámpago aparecerán aquí pronto.</StatusMessage>
            )}

            {topSellersProducts.length > 0 ? (
              <TopSellers products={topSellersProducts} />
            ) : (
              // Solo muestra este mensaje si no hay productos en absoluto después de cargar
              products.length === 0 && <StatusMessage>Descubre nuestros productos más populares en breve.</StatusMessage>
            )}

            {featuredProductData ? (
              <FeaturedProduct product={featuredProductData} />
            ) : (
              // Lógica para mostrar este mensaje solo si hay algunos productos pero no uno destacado específico
              products.length > 0 && !flashSaleProduct && topSellersProducts.length === 0 &&
              <StatusMessage>Aún no tenemos un producto destacado especial para ti hoy.</StatusMessage>
            )}

            {/* Mensaje general si no hay productos en absoluto después de cargar y no hay error */}
            {products.length === 0 && !loading && !error && (
              <StatusMessage>¡Vaya! Parece que no hay productos para mostrar en este momento. Por favor, vuelve a intentarlo más tarde.</StatusMessage>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default HomePage;