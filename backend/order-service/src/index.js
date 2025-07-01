const express = require('express');
const cors = require('cors');
const orderRoutes = require('./routes/order.routes');

const app = express();
const PORT = 3007;

app.use(cors());
app.use(express.json());

app.use('/api/orders', orderRoutes);

app.listen(PORT, () => {
  console.log(`✅ Order Service corriendo en http://localhost:${PORT}`);
});
