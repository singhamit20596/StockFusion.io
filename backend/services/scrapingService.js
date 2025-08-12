const fileService = require('./fileService');
const Stock = require('../models/Stock');
const Account = require('../models/Account');
require('dotenv').config();

/**
 * Real-Time Scraping Service
 * ONLY uses real Puppeteer scraping - Mock data disabled for production use
 */
class ScrapingService {
  constructor() {
    this.realScraper = null;
    this.progressCallbacks = new Map(); // Store progress callbacks by session ID
    this.initializeRealScraper();
  }

  /**
   * Initialize ONLY the real scraper - no mock fallback
   */
  initializeRealScraper() {
    try {
      // Import and initialize real scraper
      const RealGrowwScraper = require('./scraping/realGroww');
      this.realScraper = new RealGrowwScraper();
      console.log('✅ Real Groww scraper initialized (Real-time mode)');
    } catch (error) {
      console.error('❌ Failed to initialize real scraper:', error.message);
      console.log('💡 To enable real scraping, run: npm run install-scraping');
      this.realScraper = null;
    }
  }

  /**
   * Set progress callback for real-time updates during scraping
   */
  setProgressCallback(sessionId, callback) {
    this.progressCallbacks.set(sessionId, callback);
    console.log(`📊 Progress callback set for session: ${sessionId}`);
  }

  /**
   * Remove progress callback after scraping completes
   */
  removeProgressCallback(sessionId) {
    this.progressCallbacks.delete(sessionId);
    console.log(`🧹 Progress callback removed for session: ${sessionId}`);
  }

  /**
   * Main method: Real-time Groww account synchronization with progress tracking
   * This method performs the complete flow:
   * 1. User logs in on Groww popup
   * 2. Automated navigation to Holdings page  
   * 3. Real-time scraping with progress updates
   * 4. Data processing and storage
   * 5. Browser cleanup
   */
  async syncGrowwAccountRealTime(accountId, options = {}) {
    const sessionId = options.sessionId || `session-${Date.now()}`;
    
    console.log(`🚀 Starting REAL-TIME Groww sync for account: ${accountId}`);
    console.log(`📊 Session ID: ${sessionId}`);

    // Validate real scraper availability
    if (!this.realScraper) {
      const error = 'Real scraper not available. Install Puppeteer: npm run install-scraping';
      console.error('❌', error);
      throw new Error(error);
    }

    const account = await fileService.findById('accounts.json', accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    try {
      // Set up progress callback if provided
      const progressCallback = this.progressCallbacks.get(sessionId);
      
      console.log(`🎯 Starting automated scraping for: ${account.name}`);
      
      // Perform complete automated scraping with progress tracking
      const scrapingResult = await this.realScraper.performAutomatedScraping(progressCallback);
      
      if (!scrapingResult.success) {
        throw new Error(scrapingResult.message);
      }

      console.log(`� Raw data scraped: ${scrapingResult.data.length} holdings`);

      // Process and store the scraped data
      const processedStocks = await this.processScrapedData(accountId, scrapingResult.data);
      
      // Calculate portfolio summary
      const portfolioSummary = this.calculatePortfolioSummary(processedStocks);
      
      // Update account with sync timestamp
      await this.updateAccountSyncStatus(accountId, {
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: 'success',
        stocksCount: processedStocks.length,
        totalValue: portfolioSummary.totalValue
      });

      // Clean up progress callback
      this.removeProgressCallback(sessionId);

      console.log(`✅ Real-time sync completed for: ${account.name}`);
      console.log(`📈 Portfolio summary: ${processedStocks.length} stocks, ₹${portfolioSummary.totalValue.toFixed(2)}`);

      return {
        success: true,
        message: `Successfully synced ${processedStocks.length} holdings from Groww (real-time)`,
        data: {
          account: await fileService.findById('accounts.json', accountId),
          stocks: processedStocks,
          summary: {
            totalStocks: processedStocks.length,
            totalValue: portfolioSummary.totalValue,
            totalInvestment: portfolioSummary.totalInvestment,
            totalProfitLoss: portfolioSummary.totalProfitLoss,
            totalProfitLossPercentage: portfolioSummary.totalProfitLossPercentage,
            syncedAt: new Date().toISOString(),
            source: 'real-time-groww'
          },
          isRealTime: true
        }
      };

    } catch (error) {
      console.error('❌ Real-time sync failed:', error.message);
      
      // Clean up progress callback on error
      this.removeProgressCallback(sessionId);
      
      // Update account with error status
      await this.updateAccountSyncStatus(accountId, {
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: 'failed',
        lastSyncError: error.message
      });

      throw new Error(`Real-time scraping failed: ${error.message}`);
    }
  }

  /**
   * Sync account data from Groww
   * @param {string} accountId - Account ID to sync
   * @param {Object} credentials - Groww login credentials
   */
  async syncGrowwAccount(accountId, credentials = {}) {
    try {
      console.log(`🔄 Starting Groww sync for account: ${accountId}`);
      console.log(`📍 Using ${this.isRealScrapingAvailable ? 'REAL-TIME' : 'MOCK'} scraper`);

      // Verify account exists
      const account = await fileService.findById('accounts.json', accountId);
      if (!account) {
        return {
          success: false,
          message: 'Account not found'
        };
      }

      // Check if this is a credential-less sync (demo mode)
      const hasCredentials = credentials.username && credentials.password && credentials.pin;
      const isResync = credentials.isResync;
      
      // For mock mode or credential-less sync, use demo credentials
      let syncCredentials = credentials;
      if (!hasCredentials && this.scrapingMode === 'mock') {
        console.log('🎭 Using demo credentials for mock sync');
        syncCredentials = {
          username: 'demo@groww.com',
          password: 'demo123',
          pin: '1234',
          isDemo: true,
          isAutomated: credentials.isAutomated,
          userLoggedIn: credentials.userLoggedIn
        };
      } else if (this.isRealScrapingAvailable && !hasCredentials && !isResync) {
        return {
          success: false,
          message: 'Username, password, and PIN are required for real-time scraping'
        };
      }
      
      // Add automation flags to credentials
      syncCredentials = {
        ...syncCredentials,
        isAutomated: credentials.isAutomated,
        userLoggedIn: credentials.userLoggedIn,
        automationFallback: credentials.automationFallback
      };
      
      // Scrape data from Groww
      const scrapingResult = await this.scraper.scrapeGrowwData(syncCredentials);
      
      if (!scrapingResult.success) {
        // Handle the case where Puppeteer is not installed
        if (scrapingResult.requiresInstallation) {
          return {
            success: false,
            message: 'Real-time scraping functionality requires additional dependencies. Please install Puppeteer packages.',
            requiresInstallation: true,
            installCommand: 'npm run install-scraping',
            fallbackMessage: 'Currently using mock data for demonstration.'
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
          : `Successfully synced ${savedStocks.length} real holdings from Groww`,
        isRealTimeData: this.isRealScrapingAvailable && !scrapingResult.isMockData
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

  /**
   * Update account sync status and metadata
   */
  async updateAccountSyncStatus(accountId, syncData) {
    try {
      const account = await fileService.findById('accounts.json', accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      // Update account with sync metadata
      const updateData = {
        metadata: {
          ...account.metadata,
          ...syncData
        },
        updatedAt: new Date().toISOString()
      };

      await fileService.updateById('accounts.json', accountId, updateData);
      console.log(`✅ Updated account ${accountId} with sync data`);
      
    } catch (error) {
      console.error(`❌ Failed to update account sync status:`, error.message);
      throw error;
    }
  }
}

module.exports = new ScrapingService();
