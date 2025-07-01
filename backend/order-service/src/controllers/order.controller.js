let orders = [];

const createOrder = (req, res) => {
  const order = req.body;
  order.id = orders.length + 1;
  orders.push(order);
  res.status(201).json(order);
};

const getOrders = (req, res) => {
  res.json(orders);
};

module.exports = { createOrder, getOrders };