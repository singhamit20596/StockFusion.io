const fileService = require('../services/fileService');
const Stock = require('../models/Stock');

/**
 * Stock Controller
 * Handles all stock-related operations
 */
class StockController {
  /**
   * Get all stocks
   * GET /api/stocks
   */
  async getAllStocks(req, res) {
    try {
      const stocks = await fileService.readJsonFile('stocks.json');
      const stockModels = stocks.map(stock => new Stock(stock).toJSON());
      
      res.json({
        success: true,
        data: stockModels,
        count: stockModels.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching stocks',
        error: error.message
      });
    }
  }

  /**
   * Get stocks by account ID
   * GET /api/stocks/account/:accountId
   */
  async getStocksByAccount(req, res) {
    try {
      const { accountId } = req.params;
      
      // Verify account exists
      const account = await fileService.findById('accounts.json', accountId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      const stocks = await fileService.findBy('stocks.json', { accountId });
      const stockModels = stocks.map(stock => new Stock(stock).toJSON());
      
      res.json({
        success: true,
        data: stockModels,
        count: stockModels.length,
        accountId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching stocks by account',
        error: error.message
      });
    }
  }

  /**
   * Get stock by ID
   * GET /api/stocks/:id
   */
  async getStockById(req, res) {
    try {
      const { id } = req.params;
      const stock = await fileService.findById('stocks.json', id);
      
      if (!stock) {
        return res.status(404).json({
          success: false,
          message: 'Stock not found'
        });
      }

      const stockModel = new Stock(stock);
      res.json({
        success: true,
        data: stockModel.toJSON()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching stock',
        error: error.message
      });
    }
  }

  /**
   * Create new stock
   * POST /api/stocks
   */
  async createStock(req, res) {
    try {
      // Verify account exists
      const account = await fileService.findById('accounts.json', req.body.accountId);
      if (!account) {
        return res.status(400).json({
          success: false,
          message: 'Account not found'
        });
      }

      const stock = new Stock(req.body);
      const validation = stock.validate();

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const savedStock = await fileService.addItem('stocks.json', stock.toJSON());
      
      res.status(201).json({
        success: true,
        message: 'Stock created successfully',
        data: savedStock
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating stock',
        error: error.message
      });
    }
  }

  /**
   * Update stock
   * PUT /api/stocks/:id
   */
  async updateStock(req, res) {
    try {
      const { id } = req.params;
      const existingStock = await fileService.findById('stocks.json', id);
      
      if (!existingStock) {
        return res.status(404).json({
          success: false,
          message: 'Stock not found'
        });
      }

      // If accountId is being changed, verify new account exists
      if (req.body.accountId && req.body.accountId !== existingStock.accountId) {
        const account = await fileService.findById('accounts.json', req.body.accountId);
        if (!account) {
          return res.status(400).json({
            success: false,
            message: 'New account not found'
          });
        }
      }

      const updatedData = { ...existingStock, ...req.body };
      const stock = new Stock(updatedData);
      const validation = stock.validate();

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const savedStock = await fileService.updateById('stocks.json', id, stock.toJSON());
      
      res.json({
        success: true,
        message: 'Stock updated successfully',
        data: savedStock
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating stock',
        error: error.message
      });
    }
  }

  /**
   * Delete stock
   * DELETE /api/stocks/:id
   */
  async deleteStock(req, res) {
    try {
      const { id } = req.params;
      
      const stock = await fileService.findById('stocks.json', id);
      if (!stock) {
        return res.status(404).json({
          success: false,
          message: 'Stock not found'
        });
      }

      await fileService.deleteById('stocks.json', id);
      
      res.json({
        success: true,
        message: 'Stock deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting stock',
        error: error.message
      });
    }
  }

  /**
   * Update stock price
   * PATCH /api/stocks/:id/price
   */
  async updateStockPrice(req, res) {
    try {
      const { id } = req.params;
      const { currentPrice } = req.body;

      if (!currentPrice || currentPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid current price is required'
        });
      }

      const existingStock = await fileService.findById('stocks.json', id);
      if (!existingStock) {
        return res.status(404).json({
          success: false,
          message: 'Stock not found'
        });
      }

      const updatedStock = await fileService.updateById('stocks.json', id, { 
        currentPrice: parseFloat(currentPrice),
        updatedAt: new Date().toISOString()
      });

      const stockModel = new Stock(updatedStock);
      
      res.json({
        success: true,
        message: 'Stock price updated successfully',
        data: stockModel.toJSON()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating stock price',
        error: error.message
      });
    }
  }

  /**
   * Get stocks grouped by symbol
   * GET /api/stocks/symbols
   */
  async getStocksBySymbol(req, res) {
    try {
      const stocks = await fileService.readJsonFile('stocks.json');
      const stockModels = stocks.map(stock => new Stock(stock).toJSON());
      
      // Group by symbol
      const groupedStocks = stockModels.reduce((acc, stock) => {
        if (!acc[stock.symbol]) {
          acc[stock.symbol] = {
            symbol: stock.symbol,
            name: stock.name,
            sector: stock.sector,
            exchange: stock.exchange,
            holdings: [],
            totalQuantity: 0,
            totalValue: 0,
            totalInitialValue: 0
          };
        }
        
        acc[stock.symbol].holdings.push(stock);
        acc[stock.symbol].totalQuantity += stock.quantity;
        acc[stock.symbol].totalValue += stock.currentValue;
        acc[stock.symbol].totalInitialValue += stock.initialValue;
        
        return acc;
      }, {});

      // Calculate totals and percentages
      Object.values(groupedStocks).forEach(group => {
        group.totalGainLoss = group.totalValue - group.totalInitialValue;
        group.totalGainLossPercentage = group.totalInitialValue > 0 
          ? (group.totalGainLoss / group.totalInitialValue) * 100 
          : 0;
      });

      res.json({
        success: true,
        data: Object.values(groupedStocks),
        count: Object.keys(groupedStocks).length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching stocks by symbol',
        error: error.message
      });
    }
  }
}

module.exports = new StockController();
