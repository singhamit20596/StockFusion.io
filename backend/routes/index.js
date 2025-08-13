const express = require('express');
const router = express.Router();

// Import all route modules
const accountRoutes = require('./accountRoutes');
const stockRoutes = require('./stockRoutes');
const portfolioRoutes = require('./portfolioRoutes');
const csvRoutes = require('./csvRoutes');
const scrapingRoutes = require('./scrapingRoutes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Use route modules
router.use('/api', accountRoutes);
router.use('/api', stockRoutes);
router.use('/api', portfolioRoutes);
router.use('/api/csv', csvRoutes);
router.use('/api', scrapingRoutes);

module.exports = router;
