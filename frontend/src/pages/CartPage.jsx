// frontend/src/pages/CartPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './CartPage.css'; // Crearemos/actualizaremos este archivo CSS

const userId = 1; // Suponemos un userId fijo para pruebas

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Obtener el carrito real del backend
  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:4001/cart/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error('Error al obtener el carrito');
        return res.json();
      })
      .then(data => {
        // El backend responde con { cart: [...], totalQuantity }
        setCartItems(data.cart || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Actualizar cantidad de un producto en el carrito
  const updateQuantity = async (productId, newQuantity) => {
    try {
      // Aquí podrías tener un endpoint específico para actualizar cantidad, pero si no existe, puedes usar addProductToCart
      const response = await fetch(`http://localhost:4001/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId, quantity: newQuantity })
      });
      if (!response.ok) throw new Error('Error al actualizar cantidad');
      // Obtener carrito actualizado
      const data = await response.json();
      setCartItems(data.cart || []);
    } catch (err) {
      alert('No se pudo actualizar la cantidad');
    }
  };

  // Eliminar producto del carrito
  const removeFromCart = async (productId) => {
    try {
      const response = await fetch(`http://localhost:4001/cart/${userId}/${productId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Error al eliminar del carrito');
      // Obtener carrito actualizado
      const data = await response.json();
      setCartItems(data.cart || []);
    } catch (err) {
      alert('No se pudo eliminar del carrito');
    }
  };

  // Mover producto a la wishlist
  const moveToWishlist = async (productId) => {
    try {
      // Buscar el producto en el carrito
      const product = cartItems.find(item => item.product_id === productId || item.id === productId);
      if (!product) return;
      // Agregar a la wishlist
      await fetch('http://localhost:3003/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId })
      });
      // Eliminar del carrito
      await removeFromCart(productId);
      alert('Producto movido a la lista de deseos');
    } catch (err) {
      alert('No se pudo mover a la lista de deseos');
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingCost = subtotal > 500 ? 0 : 49.99;
  const total = subtotal + shippingCost;

  const incrementQuantity = (item) => {
    if (item.quantity < item.stock) {
      updateQuantity(item.product_id || item.id, item.quantity + 1);
    } else {
      alert(`No puedes añadir más de ${item.stock} unidades de ${item.name}.`);
    }
  };

  const decrementQuantity = (item) => {
    if (item.quantity > 1) {
      updateQuantity(item.product_id || item.id, item.quantity - 1);
    }
  };

  if (loading) {
    return <div className="cart-page-status">Cargando tu carrito...</div>;
  }
  if (error) {
    return <div className="cart-page-status">Error: {error}</div>;
  }

  return (
    <div className="cart-page-container">
      <h1 className="cart-page-title">Tu Carrito de Compras</h1>

      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <p>Tu carrito está actualmente vacío.</p>
          <Link to="/shop" className="btn btn--primary">
            Seguir Comprando
          </Link>
        </div>
      ) : (
        <div className="cart-grid">
          <div className="cart-items-list">
            {cartItems.map((item) => (
              <div key={item.product_id || item.id} className="cart-item-card">
                <Link to={`/product/${item.product_id || item.id}`} className="cart-item__img-link">
                  <img src={item.image} alt={item.name} className="cart-item__image" />
                </Link>
                <div className="cart-item__details">
                  <Link to={`/product/${item.product_id || item.id}`} className="cart-item__name-link">
                    <h2 className="cart-item__name">{item.name}</h2>
                  </Link>
                  <p className="cart-item__price">Precio unitario: ${Number(item.price).toFixed(2)}</p>
                  <div className="cart-item__quantity-selector">
                    <label htmlFor={`quantity-${item.product_id || item.id}`}>Cantidad:</label>
                    <button onClick={() => decrementQuantity(item)} disabled={item.quantity <= 1}>-</button>
                    <input
                      type="number"
                      id={`quantity-${item.product_id || item.id}`}
                      value={item.quantity}
                      min="1"
                      max={item.stock}
                      onChange={(e) => {
                        const newQty = parseInt(e.target.value, 10);
                        if (newQty >=1 && newQty <= item.stock) {
                           updateQuantity(item.product_id || item.id, newQty);
                        } else if (newQty < 1) {
                           updateQuantity(item.product_id || item.id, 1);
                        } else {
                           updateQuantity(item.product_id || item.id, item.stock);
                        }
                      }}
                    />
                    <button onClick={() => incrementQuantity(item)} disabled={item.quantity >= item.stock}>+</button>
                  </div>
                  <p className="cart-item__total-price">
                    Subtotal: <strong>${(Number(item.price) * item.quantity).toFixed(2)}</strong>
                  </p>
                </div>
                <div className="cart-item__actions">
                  <button 
                    className="btn btn--icon btn--danger" 
                    onClick={() => removeFromCart(item.product_id || item.id)}
                    title="Eliminar del carrito"
                  >
                    🗑️
                  </button>
                  <button 
                    className="btn btn--icon btn--wishlist" 
                    onClick={() => moveToWishlist(item.product_id || item.id)}
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
