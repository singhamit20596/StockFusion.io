const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');

// Portfolio routes
router.get('/portfolios', portfolioController.getAllPortfolios);
router.get('/portfolios/:id', portfolioController.getPortfolioById);
router.post('/portfolios', portfolioController.createPortfolio);
router.put('/portfolios/:id', portfolioController.updatePortfolio);
router.delete('/portfolios/:id', portfolioController.deletePortfolio);
router.get('/portfolios/:id/summary', portfolioController.getPortfolioSummary);
router.post('/portfolios/:id/accounts', portfolioController.addAccountToPortfolio);
router.delete('/portfolios/:id/accounts/:accountId', portfolioController.removeAccountFromPortfolio);

module.exports = router;
