const express = require('express');
const cors = require('cors');
const inventoryRoutes = require('./routes/inventory.routes');

const app = express();
const PORT = 3008;

app.use(cors());
app.use(express.json());
app.use('/api/inventory', inventoryRoutes);

app.listen(PORT, () => {
  console.log(`✅ Inventory Service corriendo en http://localhost:${PORT}`);
});
