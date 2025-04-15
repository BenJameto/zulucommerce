const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json()); // Permite recibir JSON en las solicitudes
app.use(cors()); // Habilita CORS para permitir conexiones del frontend

// Base de datos temporal en memoria
let products = [
    { id: 1, name: "Botella de agua", price: 999.99, image: "https://m.media-amazon.com/images/I/61CQachvmqL.jpg" },
    { id: 2, name: "Botella de vino", price: 14.99, image: "https://www.espaciovino.com.ar/images/conocer/Mag1.jpg" },
    { id: 3, name: "Botella de vino tinto", price: 16.99, image: "https://www.espaciovino.com.ar/images/conocer/Mag1.jpg" }
];

// Obtener todos los productos
app.get('/api/products', (req, res) => {
    res.json(products);
});

// Agregar un nuevo producto
app.post('/api/products', (req, res) => {
    const { name, price, image } = req.body;
    const newProduct = { id: products.length + 1, name, price, image };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
