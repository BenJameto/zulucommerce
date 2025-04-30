// "Base de datos" en memoria
let products = [
    { id: 1, name: "Botella de agua", price: 20.00, image: "https://m.media-amazon.com/images/I/61CQachvmqL.jpg" },
    { id: 2, name: "Sony WH-1000XM5 Audífonos Inalámbricos", price: 5999, image: 'https://http2.mlstatic.com/D_NQ_NP_620187-MLU69726815032_052023-O.webp', },
    { id: 3, name: "Camiseta Orgánica", price: 29.99, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=500' },
    { id: 4, name: "Botella Ecológica", price: 24.99, image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=500' },
    { id: 5, name: "Reusable Coffee Cup", price: 16.99, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpjuPdKoQdZvx24XerVr8e8ufiuCeIBChpTw&s" },
    { id: 6, name: "Botella de vino tinto", price: 42.99, image: "https://lacanasteria.com/wp-content/uploads/2023/03/Mucho-Mas-Black-Edition-750ML.jpg" }
];

// ✅ GET
const getProducts = (req, res) => {
    res.json(products);
};

// ✅ POST
const addProduct = (req, res) => {
    const { name, price, image } = req.body;
    const newProduct = { id: products.length + 1, name, price, image };
    products.push(newProduct);
    res.status(201).json(newProduct);
};

// ✅ Exporta todo correctamente
module.exports = {
    getProducts,
    addProduct
};
