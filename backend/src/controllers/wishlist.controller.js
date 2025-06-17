// Lógica en memoria por ahora (después lo conectaremos a DB)
let wishlist = [];

// Obtener todos los ítems
const getWishlist = (req, res) => {
  res.json(wishlist);
};

// Agregar un ítem
const addToWishlist = (req, res) => {
  const { userId, productId } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ error: 'userId y productId son requeridos' });
  }

  const newItem = {
    id: wishlist.length + 1,
    userId,
    productId,
  };

  wishlist.push(newItem);
  res.status(201).json(newItem);
};

// Eliminar ítem
const deleteFromWishlist = (req, res) => {
  const id = parseInt(req.params.id);
  wishlist = wishlist.filter(item => item.id !== id);
  res.status(204).send();
};

// Exportar funciones
module.exports = {
  getWishlist,
  addToWishlist,
  deleteFromWishlist
};
