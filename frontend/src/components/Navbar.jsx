import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaTimes, FaTimesCircle } from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
    const [darkMode, setDarkMode] = useState(
        () => localStorage.getItem("theme") === "dark" || false
    );
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    useEffect(() => {
        if (darkMode) {
            document.body.classList.add("dark-mode");
            localStorage.setItem("theme", "dark");
        } else {
            document.body.classList.remove("dark-mode");
            localStorage.setItem("theme", "light");
        }
    }, [darkMode]);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
        if (searchOpen) setSearchOpen(false);
    };

    const toggleSearch = () => {
        setSearchOpen(!searchOpen);
        if (menuOpen) setMenuOpen(false);
    };

    const closeAll = () => {
        setMenuOpen(false);
        setSearchOpen(false);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="logo">
                    <Link to="/" onClick={closeAll}>ZuluCommerce</Link>
                </div>

                <div className={`search-container ${searchOpen ? "active" : ""}`}>
                    <input 
                        type="text" 
                        placeholder="Buscar productos..." 
                        className="search-bar" 
                    />
                    <button 
                        className="search-close"
                        onClick={() => setSearchOpen(false)}
                        aria-label="Cerrar búsqueda"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="desktop-menu">
                    <ul className="nav-links">
                        <li><Link to="/products" onClick={closeAll}>Productos</Link></li>
                        <li><Link to="/cart" onClick={closeAll}>Carrito</Link></li>
                        <li><Link to="/login" onClick={closeAll}>Iniciar Sesión</Link></li>
                        <li><Link to="/UserProfile" onClick={closeAll}>Mi Perfil</Link></li>
                    </ul>
                    <button 
                        className="theme-toggle" 
                        onClick={() => setDarkMode(!darkMode)}
                        aria-label="Cambiar tema"
                    >
                        {darkMode ? "☀️" : "🌙"}
                    </button>
                </div>

                <div className="mobile-buttons">
                    <button 
                        className="search-toggle"
                        onClick={toggleSearch}
                        aria-label="Buscar productos"
                    >
                        <FaSearch />
                    </button>
                    <button 
                        className="menu-toggle" 
                        onClick={toggleMenu}
                        aria-label="Menú de navegación"
                    >
                        {menuOpen ? <FaTimesCircle /> : "☰"}
                    </button>
                </div>
            </div>

            {/* Menú desplegable móvil - Versión mejorada */}
            <div 
                className={`mobile-menu-container ${menuOpen ? "open" : ""}`}
                onClick={(e) => e.target.tagName === 'A' && closeAll()}
            >
                <ul className="mobile-nav-links">
                    <li><Link to="/products" onClick={closeAll}>Productos</Link></li>
                    <li><Link to="/cart" onClick={closeAll}>Carrito</Link></li>
                    <li><Link to="/login" onClick={closeAll}>Iniciar Sesión</Link></li>
                    <li><Link to="/UserProfile" onClick={closeAll}>Mi Perfil</Link></li>
                    <li>
                        <button 
                            className="theme-toggle mobile-theme" 
                            onClick={() => {
                                setDarkMode(!darkMode);
                                closeAll();
                            }}
                        >
                            {darkMode ? "☀️ Modo Claro" : "🌙 Modo Oscuro"}
                        </button>
                    </li>
                </ul>
            </div>

            {/* Overlay para cerrar menú */}
            {menuOpen && (
                <div 
                    className="menu-overlay"
                    onClick={closeAll}
                />
            )}
        </nav>
    );
};

export default Navbar;