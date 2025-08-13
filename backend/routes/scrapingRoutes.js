const express = require('express');
const router = express.Router();
const scrapingService = require('../services/scrapingService');

// Test endpoint for direct Groww scraping without account creation
router.post('/scraping/test-groww', async (req, res) => {
  try {
    console.log('Starting direct Groww scraping test...');
    
    // Create a test session
    const sessionId = `test-${Date.now()}`;
    
    // Wait for scraping to complete instead of running in background
    const scrapingResult = await scrapingService.scrapeGrowwRealtime({
      sessionId,
      onProgress: (progress) => {
        console.log(`Scraping progress: ${JSON.stringify(progress)}`);
      }
    });

    // Send the final result
    res.json({
      success: true,
      message: scrapingResult.message || 'Scraping completed',
      sessionId: sessionId,
      data: scrapingResult.data || { holdings: [], totalHoldings: 0 }
    });

  } catch (error) {
    console.error('Error during Groww scraping:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete scraping',
      error: error.message,
      data: { holdings: [], totalHoldings: 0 }
    });
  }
});

// Get scraping progress/status
router.get('/scraping/status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // For now, return a simple status
    // TODO: Implement proper progress tracking storage
    res.json({
      success: true,
      sessionId,
      status: 'in_progress',
      message: 'Scraping in progress...'
    });

  } catch (error) {
    console.error('Error getting scraping status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scraping status',
      error: error.message
    });
  }
});

module.exports = router;
