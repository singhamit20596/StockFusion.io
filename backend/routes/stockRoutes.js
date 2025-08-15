const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

// Stock routes
router.get('/stocks', stockController.getAllStocks);
router.get('/stocks/symbols', stockController.getStocksBySymbol);
router.get('/stocks/account/:accountId', stockController.getStocksByAccount);
router.get('/stocks/:id', stockController.getStockById);
router.post('/stocks', stockController.createStock);
router.post('/stocks/bulk-create', stockController.bulkCreateStocks);
router.put('/stocks/:id', stockController.updateStock);
router.delete('/stocks/:id', stockController.deleteStock);
router.patch('/stocks/:id/price', stockController.updateStockPrice);

module.exports = router;
