const fileService = require('../services/fileService');
const Portfolio = require('../models/Portfolio');

/**
 * Portfolio Controller
 * Handles all portfolio-related operations
 */
class PortfolioController {
  /**
   * Get all portfolios
   * GET /api/portfolios
   */
  async getAllPortfolios(req, res) {
    try {
      const portfolios = await fileService.readJsonFile('portfolios.json');
      const portfolioModels = portfolios.map(portfolio => new Portfolio(portfolio).toJSON());
      
      res.json({
        success: true,
        data: portfolioModels,
        count: portfolioModels.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching portfolios',
        error: error.message
      });
    }
  }

  /**
   * Get portfolio by ID
   * GET /api/portfolios/:id
   */
  async getPortfolioById(req, res) {
    try {
      const { id } = req.params;
      const portfolio = await fileService.findById('portfolios.json', id);
      
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found'
        });
      }

      const portfolioModel = new Portfolio(portfolio);
      res.json({
        success: true,
        data: portfolioModel.toJSON()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching portfolio',
        error: error.message
      });
    }
  }

  /**
   * Create new portfolio
   * POST /api/portfolios
   */
  async createPortfolio(req, res) {
    try {
      const portfolio = new Portfolio(req.body);
      const validation = portfolio.validate();

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const savedPortfolio = await fileService.addItem('portfolios.json', portfolio.toJSON());
      
      res.status(201).json({
        success: true,
        message: 'Portfolio created successfully',
        data: savedPortfolio
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating portfolio',
        error: error.message
      });
    }
  }

  /**
   * Update portfolio
   * PUT /api/portfolios/:id
   */
  async updatePortfolio(req, res) {
    try {
      const { id } = req.params;
      const existingPortfolio = await fileService.findById('portfolios.json', id);
      
      if (!existingPortfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found'
        });
      }

      const updatedData = { ...existingPortfolio, ...req.body };
      const portfolio = new Portfolio(updatedData);
      const validation = portfolio.validate();

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const savedPortfolio = await fileService.updateById('portfolios.json', id, portfolio.toJSON());
      
      res.json({
        success: true,
        message: 'Portfolio updated successfully',
        data: savedPortfolio
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating portfolio',
        error: error.message
      });
    }
  }

  /**
   * Delete portfolio
   * DELETE /api/portfolios/:id
   */
  async deletePortfolio(req, res) {
    try {
      const { id } = req.params;
      
      const portfolio = await fileService.findById('portfolios.json', id);
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found'
        });
      }

      // Check if portfolio has associated accounts
      const portfolioAccounts = await fileService.findBy('portfolio_accounts.json', { portfolioId: id });
      if (portfolioAccounts.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete portfolio with associated accounts. Remove accounts first.',
          associatedAccounts: portfolioAccounts.length
        });
      }

      await fileService.deleteById('portfolios.json', id);
      
      res.json({
        success: true,
        message: 'Portfolio deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting portfolio',
        error: error.message
      });
    }
  }

  /**
   * Get portfolio summary with accounts and stocks
   * GET /api/portfolios/:id/summary
   */
  async getPortfolioSummary(req, res) {
    try {
      const { id } = req.params;
      
      // Get portfolio
      const portfolio = await fileService.findById('portfolios.json', id);
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found'
        });
      }

      // Get portfolio accounts
      const portfolioAccounts = await fileService.findBy('portfolio_accounts.json', { portfolioId: id });
      const accountIds = portfolioAccounts.map(pa => pa.accountId);

      // Get accounts and stocks
      const accounts = await fileService.readJsonFile('accounts.json');
      const stocks = await fileService.readJsonFile('stocks.json');

      // Filter accounts in this portfolio
      const portfolioAccountDetails = accounts
        .filter(account => accountIds.includes(account.id))
        .map(account => {
          const accountStocks = stocks.filter(stock => stock.accountId === account.id);
          return {
            ...account,
            stocks: accountStocks,
            stockCount: accountStocks.length,
            totalValue: accountStocks.reduce((sum, stock) => sum + (stock.currentPrice * stock.quantity), 0),
            totalGainLoss: accountStocks.reduce((sum, stock) => 
              sum + ((stock.currentPrice - stock.purchasePrice) * stock.quantity), 0
            )
          };
        });

      // Calculate portfolio totals
      const portfolioTotalValue = portfolioAccountDetails.reduce((sum, account) => sum + account.totalValue, 0);
      const portfolioTotalGainLoss = portfolioAccountDetails.reduce((sum, account) => sum + account.totalGainLoss, 0);
      const portfolioTotalInitialValue = portfolioTotalValue - portfolioTotalGainLoss;

      const portfolioModel = new Portfolio(portfolio);
      
      res.json({
        success: true,
        data: {
          portfolio: portfolioModel.toJSON(),
          accounts: portfolioAccountDetails,
          summary: {
            totalAccounts: portfolioAccountDetails.length,
            totalStocks: portfolioAccountDetails.reduce((sum, account) => sum + account.stockCount, 0),
            totalValue: portfolioTotalValue,
            totalInitialValue: portfolioTotalInitialValue,
            totalGainLoss: portfolioTotalGainLoss,
            totalGainLossPercentage: portfolioTotalInitialValue > 0 
              ? (portfolioTotalGainLoss / portfolioTotalInitialValue) * 100 
              : 0
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching portfolio summary',
        error: error.message
      });
    }
  }

  /**
   * Add account to portfolio
   * POST /api/portfolios/:id/accounts
   */
  async addAccountToPortfolio(req, res) {
    try {
      const { id } = req.params;
      const { accountId } = req.body;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: 'Account ID is required'
        });
      }

      // Verify portfolio exists
      const portfolio = await fileService.findById('portfolios.json', id);
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found'
        });
      }

      // Verify account exists
      const account = await fileService.findById('accounts.json', accountId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      // Check if account is already in portfolio
      const existingAssociation = await fileService.findBy('portfolio_accounts.json', { 
        portfolioId: id, 
        accountId 
      });

      if (existingAssociation.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Account is already in this portfolio'
        });
      }

      // Create portfolio-account association
      const portfolioAccount = {
        id: require('crypto').randomUUID(),
        portfolioId: id,
        accountId,
        addedAt: new Date().toISOString()
      };

      await fileService.addItem('portfolio_accounts.json', portfolioAccount);
      
      res.status(201).json({
        success: true,
        message: 'Account added to portfolio successfully',
        data: portfolioAccount
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error adding account to portfolio',
        error: error.message
      });
    }
  }

  /**
   * Remove account from portfolio
   * DELETE /api/portfolios/:id/accounts/:accountId
   */
  async removeAccountFromPortfolio(req, res) {
    try {
      const { id, accountId } = req.params;

      // Find portfolio-account association
      const associations = await fileService.findBy('portfolio_accounts.json', { 
        portfolioId: id, 
        accountId 
      });

      if (associations.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Account not found in this portfolio'
        });
      }

      // Remove association
      await fileService.deleteById('portfolio_accounts.json', associations[0].id);
      
      res.json({
        success: true,
        message: 'Account removed from portfolio successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error removing account from portfolio',
        error: error.message
      });
    }
  }
}

module.exports = new PortfolioController();
