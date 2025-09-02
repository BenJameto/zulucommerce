const express = require('express');
const cors = require('cors');
const cartRoutes = require('./routes/cart.routes');

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

app.use('/cart', cartRoutes);

app.get('/', (req, res) => {
  res.send('Cart Service funcionando 🚀');
});

app.listen(PORT, () => {
  console.log(`Cart service corriendo en http://localhost:${PORT}`);
});
