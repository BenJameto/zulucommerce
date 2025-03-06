import React from 'react';
import './CartPage.css';

const cartItems = [
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
    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = 0;  // En este caso lo dejamos fijo.
    const total = subtotal + shipping;

    return (
        <div className="cart-container">
            <h1 className="cart-title">Tu Carrito de Compras</h1>
            
            <div className="cart-grid">
                {/* Lista de productos */}
                <div className="cart-items">
                    {cartItems.map((item) => (
                        <div key={item.id} className="cart-item">
                            <img src={item.image} alt={item.name} className="cart-item-image"/>
                            <div className="cart-item-info">
                                <h3>{item.name}</h3>
                                <p>${item.price.toFixed(2)}</p>
                            </div>
                            <div className="cart-item-quantity">
                                <button>-</button>
                                <span>{item.quantity}</span>
                                <button>+</button>
                            </div>
                            <button className="remove-item">X</button>
                        </div>
                    ))}
                </div>

                {/* Resumen del pedido */}
                <div className="order-summary">
                    <h2>Resumen de Orden</h2>
                    <p>Subtotal: ${subtotal.toFixed(2)}</p>
                    <p>Envío: Gratis</p>
                    <p className="order-total">Total: ${total.toFixed(2)}</p>
                    <button className="checkout-button">Ir a pagar</button>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
