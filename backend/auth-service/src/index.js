const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf.toString(encoding));
    } catch (err) {
      console.error('❌ Error de JSON mal formado:', err.message);
      throw new Error('JSON inválido');
    }
  }
}));


// Rutas base
app.get('/', (req, res) => {
  res.send('Auth Service is running ✅');
});

// Importar rutas de auth
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});


