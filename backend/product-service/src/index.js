const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const productRoutes = require('./routes/product.routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/products', productRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`🛒 Product Service corriendo en http://localhost:${PORT}`);
});
