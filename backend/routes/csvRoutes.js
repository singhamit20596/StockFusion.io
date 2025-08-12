const express = require('express');
const router = express.Router();
const csvController = require('../controllers/csvController');

/**
 * CSV Routes
 * Handles CSV import/export operations for portfolio data
 */

// Export routes - GET requests for downloading CSV files
router.get('/export/all', csvController.exportAllData);
router.get('/export/accounts', csvController.exportAccounts);
router.get('/export/stocks', csvController.exportStocks);
router.get('/export/portfolios', csvController.exportPortfolios);

// Import routes - POST requests with file upload
router.post('/import/accounts', 
  csvController.getUploadMiddleware(),
  csvController.importAccounts
);

router.post('/import/stocks',
  csvController.getUploadMiddleware(),
  csvController.importStocks
);

// Template routes - GET requests for downloading CSV templates
router.get('/template/:type', csvController.getCSVTemplate);

module.exports = router;
