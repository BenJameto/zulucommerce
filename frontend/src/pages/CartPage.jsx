// frontend/src/pages/CartPage.js
import React, { useState } from 'react'; // Importar useState si vas a manejar el estado
import { Link } from 'react-router-dom';
import './CartPage.css'; // Importar el CSS actualizado

// Estado inicial con productos de ejemplo
const initialCartItems = [
    {
        id: 1,
        name: 'Botella Ecológica',
        price: 24.99,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=500',
    },
    {
        id: 2,
        name: 'Camiseta Orgánica',
        price: 29.99,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=500',
    },
];

const CartPage = () => {
    // Usar estado para manejar los items del carrito
    const [cartItems, setCartItems] = useState(initialCartItems);

    // Calcular totales basados en el estado
    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = 0; 
    const total = subtotal + shipping;

    // --- Funciones para manejar cantidad y eliminación (Ejemplos) ---
    const handleQuantityChange = (id, delta) => {
        setCartItems(currentItems => 
            currentItems.map(item => {
                if (item.id === id) {
                    const newQuantity = item.quantity + delta;
                    return { ...item, quantity: newQuantity >= 1 ? newQuantity : 1 }; // Mínimo 1
                }
                return item;
            }).filter(item => item.quantity > 0) // Opcional: eliminar si la cantidad llega a 0
        );
    };

    const handleRemoveItem = (id) => {
        setCartItems(currentItems => currentItems.filter(item => item.id !== id));
        console.log("Eliminar item con ID:", id); // Simulación
        // Aquí harías la llamada API real para eliminar del backend
    };
    // --- Fin Funciones ---


    return (
        <div className="cart-container">
            <h1 className="cart-title">Tu Carrito de Compras</h1>
            
            {cartItems.length === 0 ? (
                <p className="empty-cart-message">Tu carrito está vacío.</p> 
            ) : (
                <div className="cart-grid">
                    {/* Lista de productos */}
                    <div className="cart-items">
                        {cartItems.map((item) => (
                            <div key={item.id} className="cart-item">
                                <img src={item.image} alt={item.name} className="cart-item-image"/>
                                <div className="cart-item-info">
                                    <h3>{item.name}</h3>
                                    {/* CORRECCIÓN: Añadir clase para precio si se necesita estilizar diferente */}
                                    <p className="cart-item-price">${item.price.toFixed(2)}</p> 
                                </div>
                                <div className="cart-item-quantity">
                                    {/* Añadir onClick a botones de cantidad */}
                                    <button onClick={() => handleQuantityChange(item.id, -1)} disabled={item.quantity <= 1}>-</button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => handleQuantityChange(item.id, 1)}>+</button>
                                </div>
                                {/* ****** CAMBIO PRINCIPAL AQUÍ ****** */}
                                <div className="cart-item-actions"> {/* Envolver botón en actions para layout */}
                                    <button 
                                        className="btn-danger" /* Usar clase de botón peligro */
                                        onClick={() => handleRemoveItem(item.id)} /* Añadir onClick */
                                    >
                                        Eliminar {/* Cambiar texto */}
                                    </button>
                                </div>
                                {/* ****** FIN CAMBIO PRINCIPAL ****** */}
                            </div>
                        ))}
                    </div>

                    {/* Resumen del pedido */}
                    <div className="order-summary">
                        <h2>Resumen de Orden</h2>
                        <p>Subtotal: <strong>${subtotal.toFixed(2)}</strong></p> {/* Añadir strong opcional */}
                        <p>Envío: <strong>Gratis</strong></p>
                        <p className="order-total">Total: <strong>${total.toFixed(2)}</strong></p>
                        <Link to="/checkout">
                            {/* Usar clase btn-primary para consistencia */}
                            <button className="checkout-button btn-primary">Ir a pagar</button> 
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;