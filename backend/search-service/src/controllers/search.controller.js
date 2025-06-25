const pool = require('../db/connection');

exports.searchProducts = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Falta el parámetro de búsqueda' });

  try {
    const result = await pool.query(
      `SELECT * FROM products WHERE name ILIKE $1 OR description ILIKE $1 LIMIT 50`,
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error en la búsqueda', details: err.message });
  }
}; 