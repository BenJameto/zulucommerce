let inventory = [
  { id: 1, productId: 101, quantity: 50 },
  { id: 2, productId: 102, quantity: 30 },
];

const getInventory = (req, res) => {
  res.json(inventory);
};

const updateStock = (req, res) => {
  const { productId, quantity } = req.body;
  const item = inventory.find(i => i.productId === productId);
  if (item) {
    item.quantity = quantity;
    res.json({ message: 'Stock actualizado', item });
  } else {
    const newItem = { id: inventory.length + 1, productId, quantity };
    inventory.push(newItem);
    res.status(201).json({ message: 'Producto agregado al inventario', newItem });
  }
};

module.exports = { getInventory, updateStock };
