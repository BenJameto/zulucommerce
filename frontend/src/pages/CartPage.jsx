// frontend/src/pages/CartPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './CartPage.css'; // Crearemos/actualizaremos este archivo CSS

// Funciones Placeholder para acciones (DEBES REEMPLAZARLAS CON TU LÓGICA REAL)
const handleUpdateQuantityInCart = (productId, newQuantity, setCartItems) => {
  console.log(`Actualizar cantidad para producto ID ${productId} a ${newQuantity}`);
  setCartItems(prevItems =>
    prevItems.map(item =>
      item.id === productId ? { ...item, quantity: Math.max(1, newQuantity) } : item
    ).filter(item => item.quantity > 0) // Eliminar si la cantidad llega a 0 (opcional)
  );
  // Aquí llamarías a tu API o actualizarías tu estado global
  alert(`Cantidad actualizada para el producto ID ${productId}.`);
};

const handleRemoveFromCart = (productId, setCartItems) => {
  console.log(`Eliminar producto ID ${productId} del carrito`);
  setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  // Aquí llamarías a tu API o actualizarías tu estado global
  alert(`Producto ID ${productId} eliminado del carrito.`);
};

const handleMoveToWishlist = (productId, setCartItems) => {
  console.log(`Mover producto ID ${productId} del carrito a la lista de deseos`);
  // Lógica para añadir a la lista de deseos
  // ... (llamada a API, estado global de wishlist) ...

  // Luego, eliminar del carrito
  setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  alert(`Producto ID ${productId} movido a la lista de deseos y eliminado del carrito.`);
};


const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true); // Para simular carga inicial
  const navigate = useNavigate();

  // Simulación de carga inicial de datos del carrito
  useEffect(() => {
    setLoading(true);
    // En una app real, aquí harías un fetch a tu API para obtener el carrito del usuario
    // o lo leerías de tu estado global (Context, Redux, etc.)
    const mockCartData = [
      { id: "1", name: "Botella de Agua Ecológica", price: 20.00, image: "https://m.media-amazon.com/images/I/61CQachvmqL.jpg", quantity: 2, stock: 10 },
      { id: "2", name: "Sony WH-1000XM5 Audífonos", price: 5999.00, image: "https://http2.mlstatic.com/D_NQ_NP_620187-MLU69726815032_052023-O.webp", quantity: 1, stock: 5 },
    ];
    setTimeout(() => {
      setCartItems(mockCartData);
      setLoading(false);
    }, 500); // Simular delay de carga
  }, []);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingCost = subtotal > 500 ? 0 : 49.99; // Ejemplo: envío gratis sobre $500
  const total = subtotal + shippingCost;

  const incrementQuantity = (item) => {
    if (item.quantity < item.stock) {
      handleUpdateQuantityInCart(item.id, item.quantity + 1, setCartItems);
    } else {
      alert(`No puedes añadir más de ${item.stock} unidades de ${item.name}.`);
    }
  };

  const decrementQuantity = (item) => {
    if (item.quantity > 1) {
      handleUpdateQuantityInCart(item.id, item.quantity - 1, setCartItems);
    } else {
      // Opcional: preguntar si quiere eliminar si la cantidad es 1 y presiona "-"
      // handleRemoveFromCart(item.id, setCartItems); 
    }
  };


  if (loading) {
    return <div className="cart-page-status">Cargando tu carrito...</div>;
  }

  return (
    <div className="cart-page-container">
      <h1 className="cart-page-title">Tu Carrito de Compras</h1>

      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <p>Tu carrito está actualmente vacío.</p>
          <Link to="/shop" className="btn btn--primary"> {/* Asume que /shop es tu página de tienda */}
            Seguir Comprando
          </Link>
        </div>
      ) : (
        <div className="cart-grid">
          <div className="cart-items-list">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item-card">
                <Link to={`/product/${item.id}`} className="cart-item__img-link">
                  <img src={item.image} alt={item.name} className="cart-item__image" />
                </Link>
                <div className="cart-item__details">
                  <Link to={`/product/${item.id}`} className="cart-item__name-link">
                    <h2 className="cart-item__name">{item.name}</h2>
                  </Link>
                  <p className="cart-item__price">Precio unitario: ${item.price.toFixed(2)}</p>
                  <div className="cart-item__quantity-selector">
                    <label htmlFor={`quantity-${item.id}`}>Cantidad:</label>
                    <button onClick={() => decrementQuantity(item)} disabled={item.quantity <= 1}>-</button>
                    <input
                      type="number"
                      id={`quantity-${item.id}`}
                      value={item.quantity}
                      min="1"
                      max={item.stock}
                      onChange={(e) => {
                        const newQty = parseInt(e.target.value, 10);
                        if (newQty >=1 && newQty <= item.stock) {
                           handleUpdateQuantityInCart(item.id, newQty, setCartItems);
                        } else if (newQty < 1) {
                           handleUpdateQuantityInCart(item.id, 1, setCartItems);
                        } else {
                           handleUpdateQuantityInCart(item.id, item.stock, setCartItems);
                        }
                      }}
                    />
                    <button onClick={() => incrementQuantity(item)} disabled={item.quantity >= item.stock}>+</button>
                  </div>
                  <p className="cart-item__total-price">
                    Subtotal: <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                  </p>
                </div>
                <div className="cart-item__actions">
                  <button 
                    className="btn btn--icon btn--danger" 
                    onClick={() => handleRemoveFromCart(item.id, setCartItems)}
                    title="Eliminar del carrito"
                  >
                    🗑️ {/* O usa un icono SVG/Font */}
                  </button>
                  <button 
                    className="btn btn--icon btn--wishlist" 
                    onClick={() => handleMoveToWishlist(item.id, setCartItems)}
                    title="Mover a Lista de Deseos"
                  >
                    ❤️
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2 className="cart-summary__title">Resumen del Pedido</h2>
            <div className="cart-summary__item">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="cart-summary__item">
              <span>Envío:</span>
              <span>{shippingCost === 0 ? "Gratis" : `$${shippingCost.toFixed(2)}`}</span>
            </div>
            <div className="cart-summary__total">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button 
              onClick={() => navigate('/checkout')} 
              className="btn btn--primary btn--full-width cart-summary__checkout-btn"
              disabled={cartItems.length === 0}
            >
              Proceder al Pago
            </button>
            <Link to="/shop" className="btn btn--secondary btn--full-width cart-summary__continue-shopping-btn">
              Seguir Comprando
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
