const express = require('express');
const cors = require('cors');
const searchRoutes = require('./routes/search.routes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/search', searchRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Search Service', version: '1.0.0' });
});

const PORT = process.env.PORT || 4008;
app.listen(PORT, () => {
  console.log(`Search Service escuchando en el puerto ${PORT}`);
}); 