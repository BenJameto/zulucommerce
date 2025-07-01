const express = require('express');
const router = express.Router();
const { getInventory, updateStock } = require('../controllers/inventory.controller');

router.get('/', getInventory);
router.post('/', updateStock);

module.exports = router;
