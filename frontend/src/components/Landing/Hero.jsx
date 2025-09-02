// src/components/Landing/Hero.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Landing.css";

const heroSlidesData = [
  {
    id: 1,
    backgroundUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Compras Sostenibles para un Futuro Mejor",
    subtitle: "Descubre nuestra colección seleccionada de productos ecológicos que marcan la diferencia.",
    primaryCta: { text: "Explorar Tienda", href: "/shop" },
    secondaryCta: { text: "Saber Más", href: "/about" },
  },
  {
    id: 2,
    backgroundUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=1200&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Nuevas Llegadas Tecnológicas",
    subtitle: "Lo último en gadgets y dispositivos para tu día a día.",
    primaryCta: { text: "Ver Novedades", href: "/products?category=new-arrivals" },
    secondaryCta: { text: "Ofertas", href: "/products?filter=sale" },
  },
  {
    id: 3,
    backgroundUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1200&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Estilo y Confort para tu Hogar",
    subtitle: "Encuentra la inspiración y los productos para crear el espacio de tus sueños.",
    primaryCta: { text: "Decoración Hogar", href: "/products?category=home-decor" },
    secondaryCta: { text: "Muebles", href: "/products?category=furniture" },
  },
];

const Hero = () => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentSlideIndex((prevIndex) =>
        prevIndex === heroSlidesData.length - 1 ? 0 : prevIndex + 1
      );
    }, 7000);

    return () => clearTimeout(timer);
  }, [currentSlideIndex]);

  return (
    <section className="hero">
      {heroSlidesData.map((slide, index) => (
        <div
          key={slide.id}
          className={`hero-slide ${index === currentSlideIndex ? "active" : ""}`}
          style={{ backgroundImage: `url(${slide.backgroundUrl})` }}
          aria-hidden={index !== currentSlideIndex}
        >
          <div className="hero__overlay-content">
            <h1 className="hero__title">{slide.title}</h1>
            <p className="hero__subtitle">{slide.subtitle}</p>
            <div className="hero__buttons">
              <Link to={slide.primaryCta.href} className="btn btn--primary">
                {slide.primaryCta.text}
              </Link>
              <Link to={slide.secondaryCta.href} className="btn btn--secondary">
                {slide.secondaryCta.text}
              </Link>
            </div>
          </div>
        </div>
      ))}
      <div className="hero__dots">
        {heroSlidesData.map((_, index) => (
          <button
            key={index}
            className={`hero__dot ${index === currentSlideIndex ? "active" : ""}`}
            onClick={() => setCurrentSlideIndex(index)}
            aria-label={`Ir a la diapositiva ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;

