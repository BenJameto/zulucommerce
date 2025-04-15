import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";

const HomePage = () => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        // Llamar a la API del backend para obtener productos
        fetch("http://localhost:5000/api/products")
            .then((res) => res.json())
            .then((data) => setProducts(data))
            .catch((error) => console.error("Error al cargar productos:", error));
    }, []);

    return (
        <div className="home-container">
            <h1>Bienvenido a ZuluCommerce</h1>
            <div className="product-grid">
                {products.map((product) => (
                    <div key={product.id} className="product-card">
                        <img src={product.image} alt={product.name} />
                        <h3>{product.name}</h3>
                        <p>${product.price.toFixed(2)}</p>
                        <Link to={`/product/${product.id}`} className="details-btn">
                            Ver detalles
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HomePage;
