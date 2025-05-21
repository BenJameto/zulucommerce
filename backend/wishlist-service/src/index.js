const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf.toString(encoding));
    } catch (err) {
      console.error('❌ JSON inválido:', err.message);
      throw new Error('JSON inválido');
    }
  }
}));

// Ruta base de prueba
app.get('/', (req, res) => {
  res.send('✅ Wish List Service funcionando correctamente');
});

// Importar rutas (las crearemos en el siguiente paso)
const wishRoutes = require('./routes/wishlist.routes');
app.use('/api/wishlist', wishRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Wish List Service corriendo en puerto ${PORT}`);
});
