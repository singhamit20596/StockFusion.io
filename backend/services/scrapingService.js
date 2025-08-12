const GrowwScraper = require('./scraping/mockGroww'); // Use mock scraper by default
const fileService = require('./fileService');
const Stock = require('../models/Stock');
const Account = require('../models/Account');

/**
 * Scraping Service
 * Handles integration of scraped data with our application
 */
class ScrapingService {
  /**
   * Sync account data from Groww
   * @param {string} accountId - Account ID to sync
   * @param {Object} credentials - Groww login credentials
   */
  async syncGrowwAccount(accountId, credentials) {
    try {
      console.log(`🔄 Starting Groww sync for account: ${accountId}`);

      // Verify account exists
      const account = await fileService.findById('accounts.json', accountId);
      if (!account) {
        return {
          success: false,
          message: 'Account not found'
        };
      }

      // Try to use real scraper if available, fallback to mock
      let scraper;
      try {
        // For now, always use mock scraper until Puppeteer is properly installed
        // const RealGrowwScraper = require('./scraping/groww');
        // scraper = new RealGrowwScraper();
        // console.log('🔍 Using real Groww scraper');
        throw new Error('Using mock for development');
      } catch (error) {
        scraper = new GrowwScraper(); // This is the mock scraper
        console.log('🎭 Using mock Groww scraper (Puppeteer not available)');
      }
      
            // Scrape data from Groww
      const scrapingResult = await scraper.scrapeGrowwData(credentials);
      
      if (!scrapingResult.success) {
        // Handle the case where Puppeteer is not installed
        if (scrapingResult.requiresInstallation) {
          return {
            success: false,
            message: 'Scraping functionality requires additional dependencies. Please install Puppeteer packages.',
            requiresInstallation: true,
            installCommand: 'npm run install-scraping'
          };
        }
        return scrapingResult;
      }

      const { holdings, summary } = scrapingResult.data;

      // Process and save scraped holdings
      const savedStocks = await this.processScrapedHoldings(accountId, holdings);

      // Update account with new summary data
      const updatedAccount = await this.updateAccountSummary(accountId, summary);

      console.log(`✅ Groww sync completed for account: ${accountId}`);
      
      return {
        success: true,
        data: {
          account: updatedAccount,
          stocks: savedStocks,
          summary: {
            totalStocks: savedStocks.length,
            totalValue: summary.totalValue,
            totalInvestment: summary.totalInvestment,
            totalProfitLoss: summary.totalProfitLoss,
            syncedAt: new Date().toISOString()
          },
          isMockData: scrapingResult.isMockData || false
        },
        message: scrapingResult.isMockData 
          ? `Successfully synced ${savedStocks.length} mock holdings from Groww (demo mode)`
          : `Successfully synced ${savedStocks.length} holdings from Groww`
      };

    } catch (error) {
      console.error('❌ Groww sync failed:', error.message);
      return {
        success: false,
        message: `Sync failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Process scraped holdings and save as stocks
   * @param {string} accountId - Account ID
   * @param {Array} holdings - Scraped holdings data
   */
  async processScrapedHoldings(accountId, holdings) {
    try {
      const savedStocks = [];
      
      // Remove existing stocks for this account (replace with fresh data)
      const existingStocks = await fileService.readJsonFile('stocks.json');
      const filteredStocks = existingStocks.filter(stock => stock.accountId !== accountId);

      for (const holding of holdings) {
        try {
          // Transform scraped data to our stock model format
          const stockData = {
            accountId,
            symbol: holding.symbol,
            name: holding.name,
            quantity: holding.units,
            purchasePrice: holding.avgBuyPrice,
            currentPrice: holding.currentPrice,
            purchaseDate: new Date().toISOString(), // We don't have purchase date from scraping
            sector: holding.sector,
            exchange: 'NSE', // Default to NSE for Indian stocks
            metadata: {
              source: 'groww',
              profitLossPercentage: holding.profitLossPercentage,
              dailyChangePercentage: holding.dailyChangePercentage,
              marketCap: holding.marketCap,
              subSector: holding.subSector,
              scrapedAt: holding.scrapedAt
            }
          };

          // Validate using our Stock model
          const stock = new Stock(stockData);
          const validation = stock.validate();

          if (validation.isValid) {
            const stockJson = stock.toJSON();
            filteredStocks.push(stockJson);
            savedStocks.push(stockJson);
            console.log(`✅ Processed stock: ${holding.symbol}`);
          } else {
            console.warn(`⚠️ Validation failed for stock ${holding.symbol}:`, validation.errors);
          }

        } catch (stockError) {
          console.error(`❌ Error processing stock ${holding.symbol}:`, stockError.message);
        }
      }

      // Save updated stocks array
      await fileService.writeJsonFile('stocks.json', filteredStocks);
      
      console.log(`✅ Saved ${savedStocks.length} stocks to database`);
      return savedStocks;

    } catch (error) {
      console.error('❌ Failed to process scraped holdings:', error.message);
      throw error;
    }
  }

  /**
   * Update account with portfolio summary data
   * @param {string} accountId - Account ID
   * @param {Object} summary - Portfolio summary from scraping
   */
  async updateAccountSummary(accountId, summary) {
    try {
      const updateData = {
        balance: summary.totalValue || 0,
        metadata: {
          totalInvestment: summary.totalInvestment || 0,
          totalProfitLoss: summary.totalProfitLoss || 0,
          lastSyncedAt: new Date().toISOString(),
          source: 'groww'
        },
        updatedAt: new Date().toISOString()
      };

      const updatedAccount = await fileService.updateById('accounts.json', accountId, updateData);
      console.log(`✅ Updated account ${accountId} with sync data`);
      
      return updatedAccount;

    } catch (error) {
      console.error('❌ Failed to update account summary:', error.message);
      throw error;
    }
  }

  /**
   * Get sync status for an account
   * @param {string} accountId - Account ID
   */
  async getSyncStatus(accountId) {
    try {
      const account = await fileService.findById('accounts.json', accountId);
      if (!account) {
        return { success: false, message: 'Account not found' };
      }

      const stocks = await fileService.findBy('stocks.json', { accountId });
      const growwStocks = stocks.filter(stock => 
        stock.metadata && stock.metadata.source === 'groww'
      );

      return {
        success: true,
        data: {
          accountId,
          accountName: account.name,
          lastSyncedAt: account.metadata?.lastSyncedAt || null,
          totalSyncedStocks: growwStocks.length,
          hasGrowwData: growwStocks.length > 0,
          totalValue: account.balance || 0,
          totalInvestment: account.metadata?.totalInvestment || 0,
          totalProfitLoss: account.metadata?.totalProfitLoss || 0
        }
      };

    } catch (error) {
      console.error('❌ Failed to get sync status:', error.message);
      return {
        success: false,
        message: `Failed to get sync status: ${error.message}`
      };
    }
  }

  /**
   * Clear synced data for an account
   * @param {string} accountId - Account ID
   */
  async clearSyncData(accountId) {
    try {
      // Remove all Groww-sourced stocks for this account
      const existingStocks = await fileService.readJsonFile('stocks.json');
      const filteredStocks = existingStocks.filter(stock => 
        !(stock.accountId === accountId && stock.metadata?.source === 'groww')
      );

      await fileService.writeJsonFile('stocks.json', filteredStocks);

      // Clear account metadata
      const updateData = {
        metadata: {},
        updatedAt: new Date().toISOString()
      };

      await fileService.updateById('accounts.json', accountId, updateData);

      console.log(`✅ Cleared sync data for account: ${accountId}`);
      
      return {
        success: true,
        message: 'Sync data cleared successfully'
      };

    } catch (error) {
      console.error('❌ Failed to clear sync data:', error.message);
      return {
        success: false,
        message: `Failed to clear sync data: ${error.message}`
      };
    }
  }
}

module.exports = new ScrapingService();
