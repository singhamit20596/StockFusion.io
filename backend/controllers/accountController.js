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
   * Sync account with Groww platform
   * POST /api/accounts/:id/sync
   */
  async syncWithGroww(req, res) {
    try {
      const { id } = req.params;
      const { username, password, pin, otp } = req.body;

      // Verify account exists
      const account = await fileService.findById('accounts.json', id);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      // Check if this is a re-sync request (no credentials provided)
      const isResync = !username && !password && !pin;
      
      if (!isResync) {
        // Validate required credentials for new sync
        if (!username || !password || !pin) {
          return res.status(400).json({
            success: false,
            message: 'Username, password, and PIN are required for new account sync'
          });
        }
      } else {
        // For re-sync, check if account has previous sync data
        const syncStatus = await scrapingService.getSyncStatus(id);
        if (!syncStatus.success || !syncStatus.data.hasGrowwData) {
          return res.status(400).json({
            success: false,
            message: 'Account has no previous sync data. Please provide credentials for initial sync.'
          });
        }
      }

      console.log(`🔄 Starting Groww ${isResync ? 'resync' : 'sync'} for account: ${account.name}`);

      // Perform sync using scraping service
      const syncResult = await scrapingService.syncGrowwAccount(id, {
        username,
        password,
        pin,
        otp,
        isResync
      });

      if (!syncResult.success) {
        return res.status(400).json(syncResult);
      }

      res.json({
        success: true,
        message: syncResult.message,
        data: syncResult.data
      });

    } catch (error) {
      console.error('❌ Sync error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error syncing with Groww',
        error: error.message
      });
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
}

module.exports = new AccountController();
