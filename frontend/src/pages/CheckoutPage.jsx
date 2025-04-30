// frontend/src/pages/CheckoutPage.js
import React, { useState } from 'react';
import './CheckoutPage.css'; // Importar el CSS actualizado

export const CheckoutPage = () => {
  const [form, setForm] = useState({
    name: '',
    address: '',
    paymentMethod: 'credit-card',
    // Añadir más campos si los necesitas para el ejemplo
    city: '',
    postalCode: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Procesar pedido:', form); 
    alert('Pedido confirmado (simulación)'); 
  };

  return (
    // Contenedor principal para centrar y fondo
    <div className="checkout-container"> 
      {/* NUEVO: Contenedor tipo tarjeta para el contenido */}
      <div className="checkout-card"> 
        <h1 className="checkout-title">Checkout</h1> 
        
        <form className="checkout-form" onSubmit={handleSubmit}> 
          
          {/* Grupo 1: Información de Envío */}
          <fieldset className="form-group">
            <legend>Información de Envío</legend> 
            
            {/* Campo Nombre */}
            <div> {/* Div interno para label+input */}
              <label htmlFor="name">Nombre Completo</label> 
              <input 
                type="text" 
                id="name"
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                required 
                placeholder="Tu nombre aquí..."
              />
            </div>

            {/* Campo Dirección */}
            <div>
              <label htmlFor="address">Dirección</label>
              <input 
                type="text" 
                id="address" 
                name="address" 
                value={form.address} 
                onChange={handleChange} 
                required 
                placeholder="Calle, número, colonia..." 
              />
            </div>
             {/* Puedes añadir más campos como Ciudad, Código Postal aquí */}

          </fieldset> 
          {/* Fin Grupo 1 */}

          {/* Grupo 2: Método de Pago */}
          <fieldset className="form-group">
             <legend>Método de Pago</legend>

             {/* Campo Selección Método */}
            <div>
              <label htmlFor="paymentMethod">Selecciona Método</label>
              <select 
                id="paymentMethod" 
                name="paymentMethod" 
                value={form.paymentMethod} 
                onChange={handleChange}
              >
                <option value="credit-card">Tarjeta de Crédito</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>

            {/* Aquí podrías mostrar campos específicos de tarjeta si 'credit-card' está seleccionado */}
            {form.paymentMethod === 'credit-card' && (
              <>
                <div>
                  <label htmlFor="cardNumber">Número de Tarjeta</label>
                  <input type="text" id="cardNumber" name="cardNumber" placeholder="---- ---- ---- ----" required={form.paymentMethod === 'credit-card'} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}> {/* Para Expiry/CVV */}
                   <div style={{ flex: 1 }}>
                     <label htmlFor="expiryDate">Expiración (MM/AA)</label>
                     <input type="text" id="expiryDate" name="expiryDate" placeholder="MM/AA" required={form.paymentMethod === 'credit-card'} />
                   </div>
                   <div style={{ flex: 1 }}>
                      <label htmlFor="cvv">CVV</label>
                      <input type="text" id="cvv" name="cvv" placeholder="123" required={form.paymentMethod === 'credit-card'} />
                   </div>
                </div>
              </>
            )}

          </fieldset>
          {/* Fin Grupo 2 */}

          <button type="submit" className="checkout-submit-btn"> 
            Confirmar Pedido
          </button>
        </form>
      </div> 
      {/* Fin .checkout-card */}
    </div> 
    // Fin .checkout-container
  );
};

// export default CheckoutPage;
// export default CheckoutPage; // Asegúrate que la exportación sea correcta para tu proyecto