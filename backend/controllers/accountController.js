const fileService = require('../services/fileService');
const scrapingService = require('../services/scrapingService');
const Account = require('../models/Account');

/**
 * Account Controller
 * Handles all account-related operations
 */
class AccountController {
  /**
   * Get all accounts
   * GET /api/accounts
   */
  async getAllAccounts(req, res) {
    try {
      const accounts = await fileService.readJsonFile('accounts.json');
      res.json({
        success: true,
        data: accounts,
        count: accounts.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching accounts',
        error: error.message
      });
    }
  }

  /**
   * Get account by ID
   * GET /api/accounts/:id
   */
  async getAccountById(req, res) {
    try {
      const { id } = req.params;
      const account = await fileService.findById('accounts.json', id);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      res.json({
        success: true,
        data: account
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching account',
        error: error.message
      });
    }
  }

  /**
   * Create new account
   * POST /api/accounts
   */
  async createAccount(req, res) {
    try {
      const account = new Account(req.body);
      const validation = account.validate();

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const savedAccount = await fileService.addItem('accounts.json', account.toJSON());
      
      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: savedAccount
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating account',
        error: error.message
      });
    }
  }

  /**
   * Update account
   * PUT /api/accounts/:id
   */
  async updateAccount(req, res) {
    try {
      const { id } = req.params;
      const existingAccount = await fileService.findById('accounts.json', id);
      
      if (!existingAccount) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      const updatedData = { ...existingAccount, ...req.body };
      const account = new Account(updatedData);
      const validation = account.validate();

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const savedAccount = await fileService.updateById('accounts.json', id, account.toJSON());
      
      res.json({
        success: true,
        message: 'Account updated successfully',
        data: savedAccount
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating account',
        error: error.message
      });
    }
  }

  /**
   * Delete account
   * DELETE /api/accounts/:id
   */
  async deleteAccount(req, res) {
    try {
      const { id } = req.params;
      
      // Check if account exists
      const account = await fileService.findById('accounts.json', id);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      // Check if account has stocks
      const stocks = await fileService.findBy('stocks.json', { accountId: id });
      if (stocks.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete account with existing stocks. Please remove all stocks first.'
        });
      }

      // Check if account is linked to portfolios
      const portfolioLinks = await fileService.findBy('portfolio_accounts.json', { accountId: id });
      if (portfolioLinks.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete account linked to portfolios. Please remove from portfolios first.'
        });
      }

      await fileService.deleteById('accounts.json', id);
      
      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting account',
        error: error.message
      });
    }
  }

  /**
   * Get account summary with total value
   * GET /api/accounts/:id/summary
   */
  async getAccountSummary(req, res) {
    try {
      const { id } = req.params;
      const account = await fileService.findById('accounts.json', id);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      const stocks = await fileService.findBy('stocks.json', { accountId: id });
      
      let totalStockValue = 0;
      let totalGainLoss = 0;
      
      stocks.forEach(stock => {
        const currentValue = stock.quantity * stock.currentPrice;
        const initialValue = stock.quantity * stock.purchasePrice;
        totalStockValue += currentValue;
        totalGainLoss += (currentValue - initialValue);
      });

      const summary = {
        ...account,
        stocks: {
          count: stocks.length,
          totalValue: totalStockValue,
          totalGainLoss: totalGainLoss,
          totalGainLossPercentage: totalStockValue > 0 ? (totalGainLoss / (totalStockValue - totalGainLoss)) * 100 : 0
        },
        totalAccountValue: account.balance + totalStockValue
      };

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching account summary',
        error: error.message
      });
    }
  }

  /**
   * Get account holdings/stocks
   * GET /api/accounts/:id/holdings
   */
  async getAccountHoldings(req, res) {
    try {
      const { id } = req.params;
      const account = await fileService.findById('accounts.json', id);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      // Get stocks for this account
      const stocks = await fileService.findBy('stocks.json', { accountId: id });
      
      // Calculate portfolio summary
      let totalValue = 0;
      let totalInvestment = 0;
      let totalProfitLoss = 0;
      
      stocks.forEach(stock => {
        totalValue += parseFloat(stock.currentValue) || 0;
        totalInvestment += parseFloat(stock.investment) || 0;
        totalProfitLoss += parseFloat(stock.pnl) || 0;
      });

      const summary = {
        totalStocks: stocks.length,
        totalValue,
        totalInvestment,
        totalProfitLoss,
        totalProfitLossPercentage: totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0
      };

      res.json({
        success: true,
        data: {
          account,
          stocks,
          summary
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching account holdings',
        error: error.message
      });
    }
  }

  /**
   * Sync account with Groww platform - REAL-TIME IMPLEMENTATION ONLY
   * POST /api/accounts/:id/sync
   */
  async syncWithGroww(req, res) {
    try {
      const { id } = req.params;
      
      // Verify account exists
      const account = await fileService.findById('accounts.json', id);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      console.log(`� Starting REAL-TIME Groww sync for account: ${account.name} (${id})`);

      // Check if this is an automated sync (user logged in via popup)
      const isAutomatedSync = req.body.automated || req.headers['x-automated-sync'];
      
      if (!isAutomatedSync) {
        return res.status(400).json({
          success: false,
          message: 'Only automated sync is supported. Please use the "Login with Groww" button.',
          requiresGrowwLogin: true
        });
      }

      console.log(`🤖 Using REAL-TIME automated sync for account: ${account.name}`);
      
      // Generate session ID for progress tracking
      const sessionId = `sync-${id}-${Date.now()}`;
      
      // Set up Server-Sent Events for progress updates (optional)
      if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control'
        });

        // Set up progress callback for real-time updates
        scrapingService.setProgressCallback(sessionId, (percentage, message) => {
          res.write(`data: ${JSON.stringify({ percentage, message })}\n\n`);
        });
      }

      try {
        // Perform real-time automated sync
        const syncResult = await scrapingService.syncGrowwAccountRealTime(id, {
          sessionId,
          userLoggedIn: true,
          isAutomated: true
        });

        if (!syncResult.success) {
          // Send error via SSE if applicable
          if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
            res.write(`data: ${JSON.stringify({ error: syncResult.message })}\n\n`);
            res.end();
          } else {
            return res.status(400).json({
              success: false,
              message: syncResult.message,
              data: syncResult
            });
          }
          return;
        }

        // Send success response
        if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
          res.write(`data: ${JSON.stringify({ 
            success: true, 
            message: syncResult.message,
            data: syncResult.data,
            completed: true
          })}\n\n`);
          res.end();
        } else {
          return res.json({
            success: true,
            message: syncResult.message,
            data: syncResult.data
          });
        }

      } catch (syncError) {
        console.error('❌ Real-time sync failed:', syncError.message);
        
        if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
          res.write(`data: ${JSON.stringify({ 
            error: `Real-time sync failed: ${syncError.message}`,
            requiresPuppeteer: syncError.message.includes('Puppeteer')
          })}\n\n`);
          res.end();
        } else {
          return res.status(500).json({
            success: false,
            message: `Real-time sync failed: ${syncError.message}`,
            error: syncError.message,
            requiresPuppeteer: syncError.message.includes('Puppeteer')
          });
        }
      }

    } catch (error) {
      console.error('❌ Sync controller error:', error.message);
      
      if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
        res.write(`data: ${JSON.stringify({ 
          error: `Controller error: ${error.message}`
        })}\n\n`);
        res.end();
      } else {
        res.status(500).json({
          success: false,
          message: 'Error syncing with Groww',
          error: error.message
        });
      }
    }
  }

  /**
   * Get sync status for account
   * GET /api/accounts/:id/sync/status
   */
  async getSyncStatus(req, res) {
    try {
      const { id } = req.params;
      
      const statusResult = await scrapingService.getSyncStatus(id);
      
      if (!statusResult.success) {
        return res.status(404).json(statusResult);
      }

      res.json({
        success: true,
        data: statusResult.data
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting sync status',
        error: error.message
      });
    }
  }

  /**
   * Clear synced data for account
   * DELETE /api/accounts/:id/sync
   */
  async clearSyncData(req, res) {
    try {
      const { id } = req.params;
      
      const clearResult = await scrapingService.clearSyncData(id);
      
      if (!clearResult.success) {
        return res.status(400).json(clearResult);
      }

      res.json({
        success: true,
        message: clearResult.message
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error clearing sync data',
        error: error.message
      });
    }
  }

  /**
   * Initiate Groww OAuth flow
   * POST /api/accounts/:id/auth/groww
   */
  async initiateGrowwAuth(req, res) {
    try {
      const { id } = req.params;
      const account = await fileService.findById('accounts.json', id);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      // Generate OAuth state for security
      const state = `${id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // In a real implementation, you would store the state securely
      // For now, we'll use localStorage on the frontend
      
      // Groww OAuth URL (Note: This is a placeholder - Groww doesn't have public OAuth)
      const redirectUri = `${req.protocol}://${req.get('host')}/auth/groww/callback`;
      const authUrl = `https://groww.in/oauth/authorize?` +
        `client_id=your_client_id&` +
        `response_type=code&` +
        `scope=portfolio+holdings&` +
        `state=${state}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}`;

      res.json({
        success: true,
        data: {
          authUrl,
          state,
          redirectUri
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error initiating Groww authentication',
        error: error.message
      });
    }
  }

  /**
   * Handle Groww OAuth callback
   * POST /api/accounts/:id/auth/groww/callback
   */
  async handleGrowwCallback(req, res) {
    try {
      const { id } = req.params;
      const { code, state, error } = req.body;

      if (error) {
        return res.status(400).json({
          success: false,
          message: `OAuth error: ${error}`
        });
      }

      if (!code || !state) {
        return res.status(400).json({
          success: false,
          message: 'Missing authorization code or state'
        });
      }

      const account = await fileService.findById('accounts.json', id);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      // In a real implementation, you would:
      // 1. Verify the state parameter
      // 2. Exchange the authorization code for access tokens
      // 3. Store the tokens securely
      // 4. Use the tokens to access Groww's API

      console.log(`🔐 OAuth callback received for account ${id}`);
      console.log(`📝 Authorization code: ${code}`);
      console.log(`🔒 State: ${state}`);

      // For now, simulate successful token exchange and trigger sync
      const syncResult = await this.syncWithGroww(req, res, true);
      
      res.json({
        success: true,
        message: 'OAuth authentication successful',
        data: {
          accountId: id,
          authenticated: true
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error handling OAuth callback',
        error: error.message
      });
    }
  }

  /**
   * Check scraping availability
   * GET /api/scraping/status
   */
  async getScrapingStatus(req, res) {
    try {
      const isAvailable = scrapingService.realScraper !== null;
      res.json({
        success: true,
        data: {
          isAvailable,
          scrapingMode: process.env.SCRAPING_MODE || 'real',
          message: isAvailable ? 'Real-time scraping is available' : 'Real-time scraping is not available'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking scraping status',
        error: error.message
      });
    }
  }

  /**
   * Sync with Groww and create account
   * POST /api/accounts/sync-groww
   */
  async syncGrowwAndCreateAccount(req, res) {
    try {
      const { accountName } = req.body;
      
      if (!accountName) {
        return res.status(400).json({
          success: false,
          message: 'Account name is required'
        });
      }

      console.log(`🌱 Starting Groww sync for new account: ${accountName}`);

      // Check if account name already exists
      const accounts = await fileService.readJsonFile('accounts.json');
      const existingAccount = accounts.find(acc => 
        acc.name.toLowerCase().trim() === accountName.toLowerCase().trim()
      );

      if (existingAccount) {
        return res.status(400).json({
          success: false,
          message: `Account with name "${accountName}" already exists`
        });
      }

      console.log(`🤖 Using REAL-TIME automated sync for new account: ${accountName}`);
      
      try {
        // Create the account first
        const newAccount = new Account({
          name: accountName,
          type: 'investment',
          balance: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        const savedAccount = await fileService.addItem('accounts.json', newAccount.toJSON());
        
        console.log(`✅ Account created: ${savedAccount.name} (ID: ${savedAccount.id})`);

        // Now perform real-time scraping for this account
        const syncResult = await scrapingService.syncGrowwAccountRealTime(savedAccount.id, {
          sessionId: `new-account-${Date.now()}`
        });

        if (!syncResult.success) {
          throw new Error(syncResult.message || 'Scraping failed');
        }

        console.log(`✅ Real scraping completed for account: ${savedAccount.name}`);

        // Return real sync results
        res.json({
          success: true,
          message: 'Account created and synced successfully with real data',
          data: {
            account: syncResult.data.account,
            holdings: syncResult.data.stocks,
            summary: syncResult.data.summary,
            isRealTime: true,
            isMockData: false
          }
        });

      } catch (syncError) {
        console.error('❌ Sync error:', syncError);
        res.status(500).json({
          success: false,
          message: 'Failed to sync with Groww',
          error: syncError.message
        });
      }

    } catch (error) {
      console.error('❌ Error in syncGrowwAndCreateAccount:', error);
      res.status(500).json({
        success: false,
        message: 'Error during Groww sync process',
        error: error.message
      });
    }
  }
}

module.exports = new AccountController();
