const { validationResult } = require('express-validator');
const { getClient } = require('../db/redis');
const axios = require('axios');

// Obtener carrito del usuario
const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const client = getClient();
    
    const cartKey = `cart:${userId}`;
    const cartData = await client.get(cartKey);
    
    if (!cartData) {
      return res.json({ 
        items: [], 
        total: 0, 
        itemCount: 0 
      });
    }
    
    const cart = JSON.parse(cartData);
    
    // Obtener información actualizada de productos
    const itemsWithDetails = await Promise.all(
      cart.items.map(async (item) => {
        try {
          const productResponse = await axios.get(
            `${process.env.PRODUCT_SERVICE_URL}/api/products/${item.productId}`
          );
          return {
            ...item,
            product: productResponse.data.product
          };
        } catch (error) {
          console.error(`Error al obtener producto ${item.productId}:`, error);
          return {
            ...item,
            product: { name: 'Producto no disponible', price: 0 }
          };
        }
      })
    );
    
    const total = itemsWithDetails.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);
    
    res.json({
      items: itemsWithDetails,
      total: parseFloat(total.toFixed(2)),
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0)
    });
    
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Agregar item al carrito
const addItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const userId = req.user.userId;
    const { productId, quantity } = req.body;
    const client = getClient();
    
    // Verificar que el producto existe y tiene stock
    try {
      const productResponse = await axios.get(
        `${process.env.PRODUCT_SERVICE_URL}/api/products/${productId}`
      );
      
      const product = productResponse.data.product;
      if (!product.is_active) {
        return res.status(400).json({ error: 'Producto no disponible' });
      }
      
      if (product.stock_quantity < quantity) {
        return res.status(400).json({ error: 'Stock insuficiente' });
      }
      
    } catch (error) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    const cartKey = `cart:${userId}`;
    const cartData = await client.get(cartKey);
    
    let cart = cartData ? JSON.parse(cartData) : { items: [] };
    
    // Verificar si el producto ya está en el carrito
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (existingItemIndex !== -1) {
      // Actualizar cantidad
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Agregar nuevo item
      cart.items.push({
        productId,
        quantity,
        addedAt: new Date().toISOString()
      });
    }
    
    // Guardar carrito actualizado
    await client.set(cartKey, JSON.stringify(cart), 'EX', 86400); // Expira en 24 horas
    
    res.json({
      message: 'Producto agregado al carrito',
      cart: {
        items: cart.items,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0)
      }
    });
    
  } catch (error) {
    console.error('Error al agregar item al carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar cantidad de item en el carrito
const updateItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const userId = req.user.userId;
    const { productId } = req.params;
    const { quantity } = req.body;
    const client = getClient();
    
    // Verificar stock disponible
    try {
      const productResponse = await axios.get(
        `${process.env.PRODUCT_SERVICE_URL}/api/products/${productId}`
      );
      
      const product = productResponse.data.product;
      if (product.stock_quantity < quantity) {
        return res.status(400).json({ error: 'Stock insuficiente' });
      }
      
    } catch (error) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    const cartKey = `cart:${userId}`;
    const cartData = await client.get(cartKey);
    
    if (!cartData) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }
    
    let cart = JSON.parse(cartData);
    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
    }
    
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].updatedAt = new Date().toISOString();
    
    // Guardar carrito actualizado
    await client.set(cartKey, JSON.stringify(cart), 'EX', 86400);
    
    res.json({
      message: 'Cantidad actualizada',
      cart: {
        items: cart.items,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0)
      }
    });
    
  } catch (error) {
    console.error('Error al actualizar item del carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Remover item del carrito
const removeItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;
    const client = getClient();
    
    const cartKey = `cart:${userId}`;
    const cartData = await client.get(cartKey);
    
    if (!cartData) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }
    
    let cart = JSON.parse(cartData);
    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
    }
    
    cart.items.splice(itemIndex, 1);
    
    // Guardar carrito actualizado
    await client.set(cartKey, JSON.stringify(cart), 'EX', 86400);
    
    res.json({
      message: 'Producto removido del carrito',
      cart: {
        items: cart.items,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0)
      }
    });
    
  } catch (error) {
    console.error('Error al remover item del carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Limpiar carrito
const clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const client = getClient();
    
    const cartKey = `cart:${userId}`;
    await client.del(cartKey);
    
    res.json({
      message: 'Carrito limpiado',
      cart: {
        items: [],
        itemCount: 0
      }
    });
    
  } catch (error) {
    console.error('Error al limpiar carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Checkout del carrito
const checkout = async (req, res) => {
  try {
    const userId = req.user.userId;
    const client = getClient();
    
    const cartKey = `cart:${userId}`;
    const cartData = await client.get(cartKey);
    
    if (!cartData) {
      return res.status(404).json({ error: 'Carrito vacío' });
    }
    
    const cart = JSON.parse(cartData);
    
    if (cart.items.length === 0) {
      return res.status(400).json({ error: 'Carrito vacío' });
    }
    
    // Crear orden en el Order Service
    try {
      const orderData = {
        userId,
        items: cart.items,
        total: 0 // Se calculará en el Order Service
      };
      
      const orderResponse = await axios.post(
        `${process.env.ORDER_SERVICE_URL}/api/orders`,
        orderData,
        {
          headers: {
            'Authorization': req.headers.authorization
          }
        }
      );
      
      // Limpiar carrito después de crear la orden
      await client.del(cartKey);
      
      res.json({
        message: 'Checkout exitoso',
        order: orderResponse.data.order
      });
      
    } catch (error) {
      console.error('Error al crear orden:', error);
      res.status(500).json({ error: 'Error al procesar el checkout' });
    }
    
  } catch (error) {
    console.error('Error en checkout:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  checkout
}; 