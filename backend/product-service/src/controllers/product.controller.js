// "Base de datos" en memoria
let products = [
    { id: 1, name: "Botella de agua", price: 999.99, image: "https://m.media-amazon.com/images/I/61CQachvmqL.jpg" },
    { id: 2, name: "Botella de vino", price: 14.99, image: "https://www.espaciovino.com.ar/images/conocer/Mag1.jpg" },
    { id: 3, name: "Botella de vino tinto", price: 16.99, image: "https://www.espaciovino.com.ar/images/conocer/Mag1.jpg" },
    { id: 4, name: "Botella de vino tinto", price: 16.99, image: "https://www.espaciovino.com.ar/images/conocer/Mag1.jpg" },
    { id: 5, name: "Botella de vino tinto", price: 16.99, image: "https://www.espaciovino.com.ar/images/conocer/Mag1.jpg" },
    { id: 6, name: "Botella de vino tinto", price: 16.99, image: "https://www.espaciovino.com.ar/images/conocer/Mag1.jpg" }
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
