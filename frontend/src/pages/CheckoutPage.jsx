import React, { useState } from 'react';
import './CheckoutPage.css';

export const CheckoutPage = () => {
  const [form, setForm] = useState({
    name: '',
    address: '',
    paymentMethod: 'credit-card',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Procesar pedido:', form);
  };

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nombre Completo</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Dirección</label>
          <input type="text" name="address" value={form.address} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Método de Pago</label>
          <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
            <option value="credit-card">Tarjeta de Crédito</option>
            <option value="paypal">PayPal</option>
          </select>
        </div>
        <button type="submit">Confirmar Pedido</button>
      </form>
    </div>
  );
};
