import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CartPage.css';

const CartPage = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCart = async () => {
            try {
                const response = await fetch('http://localhost:4001/cart');
                const data = await response.json();
                setCartItems(data.cart); // ✅ Solo el array
            } catch (error) {
                console.error('Error al obtener el carrito:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCart();
    }, []);

    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = 0;
    const total = subtotal + shipping;

    const handleQuantityChange = (id, delta) => {
        setCartItems(currentItems =>
            currentItems.map(item => {
                if (item.id === id) {
                    const newQuantity = item.quantity + delta;
                    return { ...item, quantity: newQuantity >= 1 ? newQuantity : 1 };
                }
                return item;
            }).filter(item => item.quantity > 0)
        );
    };

    const handleRemoveItem = (id) => {
        setCartItems(currentItems => currentItems.filter(item => item.id !== id));
        console.log("Eliminar item con ID:", id);
    };

    return (
        <div className="cart-container">
            <h1 className="cart-title">Tu Carrito de Compras</h1>

            {loading ? (
                <p>Cargando carrito...</p>
            ) : cartItems.length === 0 ? (
                <p className="empty-cart-message">Tu carrito está vacío.</p>
            ) : (
                <div className="cart-grid">
                    <div className="cart-items">
                        {cartItems.map((item) => (
                            <div key={item.id} className="cart-item">
                                <img src={item.image} alt={item.name} className="cart-item-image" />
                                <div className="cart-item-info">
                                    <h3>{item.name}</h3>
                                    <p className="cart-item-price">${item.price.toFixed(2)}</p>
                                </div>
                                <div className="cart-item-quantity">
                                    <button onClick={() => handleQuantityChange(item.id, -1)} disabled={item.quantity <= 1}>-</button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => handleQuantityChange(item.id, 1)}>+</button>
                                </div>
                                <div className="cart-item-actions">
                                    <button className="btn-danger" onClick={() => handleRemoveItem(item.id)}>Eliminar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="order-summary">
                        <h2>Resumen de Orden</h2>
                        <p>Subtotal: <strong>${subtotal.toFixed(2)}</strong></p>
                        <p>Envío: <strong>Gratis</strong></p>
                        <p className="order-total">Total: <strong>${total.toFixed(2)}</strong></p>
                        <Link to="/checkout">
                            <button className="checkout-button btn-primary">Ir a pagar</button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;
