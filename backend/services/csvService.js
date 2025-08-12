const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fileService = require('./fileService');

/**
 * CSV Service
 * Handles CSV import/export operations for portfolio data
 */
class CSVService {
  /**
   * Export accounts to CSV
   */
  async exportAccounts() {
    try {
      const accounts = await fileService.readJsonFile('accounts.json');
      const csvWriter = createCsvWriter({
        path: path.join(__dirname, '../data/exports/accounts_export.csv'),
        header: [
          { id: 'id', title: 'ID' },
          { id: 'name', title: 'Name' },
          { id: 'type', title: 'Type' },
          { id: 'balance', title: 'Balance' },
          { id: 'currency', title: 'Currency' },
          { id: 'description', title: 'Description' },
          { id: 'isActive', title: 'Active' },
          { id: 'createdAt', title: 'Created At' },
          { id: 'updatedAt', title: 'Updated At' },
          { id: 'totalInvestment', title: 'Total Investment' },
          { id: 'totalProfitLoss', title: 'Total P&L' },
          { id: 'lastSyncedAt', title: 'Last Synced' },
          { id: 'source', title: 'Source' }
        ]
      });

      // Flatten metadata for CSV export
      const flattenedAccounts = accounts.map(account => ({
        ...account,
        totalInvestment: account.metadata?.totalInvestment || '',
        totalProfitLoss: account.metadata?.totalProfitLoss || '',
        lastSyncedAt: account.metadata?.lastSyncedAt || '',
        source: account.metadata?.source || ''
      }));

      await csvWriter.writeRecords(flattenedAccounts);
      return {
        success: true,
        message: 'Accounts exported successfully',
        filePath: path.join(__dirname, '../data/exports/accounts_export.csv')
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error exporting accounts',
        error: error.message
      };
    }
  }

  /**
   * Export stocks to CSV
   */
  async exportStocks() {
    try {
      const stocks = await fileService.readJsonFile('stocks.json');
      const csvWriter = createCsvWriter({
        path: path.join(__dirname, '../data/exports/stocks_export.csv'),
        header: [
          { id: 'id', title: 'ID' },
          { id: 'accountId', title: 'Account ID' },
          { id: 'symbol', title: 'Symbol' },
          { id: 'name', title: 'Company Name' },
          { id: 'quantity', title: 'Quantity' },
          { id: 'purchasePrice', title: 'Purchase Price' },
          { id: 'currentPrice', title: 'Current Price' },
          { id: 'purchaseDate', title: 'Purchase Date' },
          { id: 'sector', title: 'Sector' },
          { id: 'exchange', title: 'Exchange' },
          { id: 'currentValue', title: 'Current Value' },
          { id: 'initialValue', title: 'Initial Value' },
          { id: 'absoluteGainLoss', title: 'Absolute Gain/Loss' },
          { id: 'percentageGainLoss', title: 'Percentage Gain/Loss' },
          { id: 'profitLossPercentage', title: 'Profit/Loss %' },
          { id: 'dailyChangePercentage', title: 'Daily Change %' },
          { id: 'marketCap', title: 'Market Cap' },
          { id: 'subSector', title: 'Sub Sector' },
          { id: 'source', title: 'Source' },
          { id: 'createdAt', title: 'Created At' },
          { id: 'updatedAt', title: 'Updated At' }
        ]
      });

      // Flatten nested objects for CSV export
      const flattenedStocks = stocks.map(stock => ({
        ...stock,
        absoluteGainLoss: stock.gainLoss?.absolute || '',
        percentageGainLoss: stock.gainLoss?.percentage || '',
        profitLossPercentage: stock.metadata?.profitLossPercentage || '',
        dailyChangePercentage: stock.metadata?.dailyChangePercentage || '',
        marketCap: stock.metadata?.marketCap || '',
        subSector: stock.metadata?.subSector || '',
        source: stock.metadata?.source || ''
      }));

      await csvWriter.writeRecords(flattenedStocks);
      return {
        success: true,
        message: 'Stocks exported successfully',
        filePath: path.join(__dirname, '../data/exports/stocks_export.csv')
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error exporting stocks',
        error: error.message
      };
    }
  }

  /**
   * Export portfolios to CSV
   */
  async exportPortfolios() {
    try {
      const portfolios = await fileService.readJsonFile('portfolios.json');
      const csvWriter = createCsvWriter({
        path: path.join(__dirname, '../data/exports/portfolios_export.csv'),
        header: [
          { id: 'id', title: 'ID' },
          { id: 'name', title: 'Name' },
          { id: 'description', title: 'Description' },
          { id: 'strategy', title: 'Strategy' },
          { id: 'riskLevel', title: 'Risk Level' },
          { id: 'createdAt', title: 'Created At' },
          { id: 'updatedAt', title: 'Updated At' }
        ]
      });

      await csvWriter.writeRecords(portfolios);
      return {
        success: true,
        message: 'Portfolios exported successfully',
        filePath: path.join(__dirname, '../data/exports/portfolios_export.csv')
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error exporting portfolios',
        error: error.message
      };
    }
  }

  /**
   * Export all portfolio data (accounts, stocks, portfolios) to separate CSV files
   */
  async exportAllData() {
    try {
      // Ensure exports directory exists
      const exportsDir = path.join(__dirname, '../data/exports');
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }

      const results = await Promise.all([
        this.exportAccounts(),
        this.exportStocks(),
        this.exportPortfolios()
      ]);

      const success = results.every(result => result.success);
      
      return {
        success,
        message: success ? 'All data exported successfully' : 'Some exports failed',
        results: {
          accounts: results[0],
          stocks: results[1],
          portfolios: results[2]
        },
        exportDir: exportsDir
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error exporting data',
        error: error.message
      };
    }
  }

  /**
   * Import accounts from CSV
   */
  async importAccounts(filePath) {
    return new Promise((resolve) => {
      const accounts = [];
      const errors = [];
      let rowCount = 0;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rowCount++;
          try {
            // Reconstruct account object from flattened CSV
            const account = {
              id: row.ID || `imported-${Date.now()}-${rowCount}`,
              name: row.Name || row.name || '',
              type: row.Type || row.type || 'investment',
              balance: parseFloat(row.Balance || row.balance || 0),
              currency: row.Currency || row.currency || 'USD',
              description: row.Description || row.description || '',
              isActive: (row.Active || row.isActive || 'true').toLowerCase() === 'true',
              createdAt: row['Created At'] || row.createdAt || new Date().toISOString(),
              updatedAt: row['Updated At'] || row.updatedAt || new Date().toISOString(),
              metadata: {}
            };

            // Add metadata if present
            if (row['Total Investment'] || row.totalInvestment) {
              account.metadata.totalInvestment = parseFloat(row['Total Investment'] || row.totalInvestment);
            }
            if (row['Total P&L'] || row.totalProfitLoss) {
              account.metadata.totalProfitLoss = parseFloat(row['Total P&L'] || row.totalProfitLoss);
            }
            if (row['Last Synced'] || row.lastSyncedAt) {
              account.metadata.lastSyncedAt = row['Last Synced'] || row.lastSyncedAt;
            }
            if (row.Source || row.source) {
              account.metadata.source = row.Source || row.source;
            }

            accounts.push(account);
          } catch (error) {
            errors.push(`Row ${rowCount}: ${error.message}`);
          }
        })
        .on('end', async () => {
          try {
            // Save imported accounts
            const existingAccounts = await fileService.readJsonFile('accounts.json');
            const updatedAccounts = [...existingAccounts];

            let addedCount = 0;
            let updatedCount = 0;

            accounts.forEach(newAccount => {
              const existingIndex = updatedAccounts.findIndex(acc => acc.id === newAccount.id);
              if (existingIndex >= 0) {
                updatedAccounts[existingIndex] = { ...updatedAccounts[existingIndex], ...newAccount };
                updatedCount++;
              } else {
                updatedAccounts.push(newAccount);
                addedCount++;
              }
            });

            await fileService.writeJsonFile('accounts.json', updatedAccounts);

            resolve({
              success: true,
              message: `Imported ${accounts.length} accounts successfully`,
              statistics: {
                totalProcessed: rowCount,
                successful: accounts.length,
                added: addedCount,
                updated: updatedCount,
                errors: errors.length
              },
              errors
            });
          } catch (error) {
            resolve({
              success: false,
              message: 'Error saving imported accounts',
              error: error.message,
              errors
            });
          }
        })
        .on('error', (error) => {
          resolve({
            success: false,
            message: 'Error reading CSV file',
            error: error.message
          });
        });
    });
  }

  /**
   * Import stocks from CSV
   */
  async importStocks(filePath) {
    return new Promise((resolve) => {
      const stocks = [];
      const errors = [];
      let rowCount = 0;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rowCount++;
          try {
            const stock = {
              id: row.ID || `stock-${Date.now()}-${rowCount}`,
              accountId: row['Account ID'] || row.accountId || '',
              symbol: row.Symbol || row.symbol || '',
              name: row['Company Name'] || row.name || '',
              quantity: parseInt(row.Quantity || row.quantity || 0),
              purchasePrice: parseFloat(row['Purchase Price'] || row.purchasePrice || 0),
              currentPrice: parseFloat(row['Current Price'] || row.currentPrice || 0),
              purchaseDate: row['Purchase Date'] || row.purchaseDate || new Date().toISOString(),
              sector: row.Sector || row.sector || '',
              exchange: row.Exchange || row.exchange || 'NSE',
              currentValue: parseFloat(row['Current Value'] || row.currentValue || 0),
              initialValue: parseFloat(row['Initial Value'] || row.initialValue || 0),
              gainLoss: {
                absolute: parseFloat(row['Absolute Gain/Loss'] || row.absoluteGainLoss || 0),
                percentage: parseFloat(row['Percentage Gain/Loss'] || row.percentageGainLoss || 0)
              },
              metadata: {},
              createdAt: row['Created At'] || row.createdAt || new Date().toISOString(),
              updatedAt: row['Updated At'] || row.updatedAt || new Date().toISOString()
            };

            // Add metadata
            if (row['Profit/Loss %'] || row.profitLossPercentage) {
              stock.metadata.profitLossPercentage = parseFloat(row['Profit/Loss %'] || row.profitLossPercentage);
            }
            if (row['Daily Change %'] || row.dailyChangePercentage) {
              stock.metadata.dailyChangePercentage = parseFloat(row['Daily Change %'] || row.dailyChangePercentage);
            }
            if (row['Market Cap'] || row.marketCap) {
              stock.metadata.marketCap = row['Market Cap'] || row.marketCap;
            }
            if (row['Sub Sector'] || row.subSector) {
              stock.metadata.subSector = row['Sub Sector'] || row.subSector;
            }
            if (row.Source || row.source) {
              stock.metadata.source = row.Source || row.source;
            }

            stocks.push(stock);
          } catch (error) {
            errors.push(`Row ${rowCount}: ${error.message}`);
          }
        })
        .on('end', async () => {
          try {
            const existingStocks = await fileService.readJsonFile('stocks.json');
            const updatedStocks = [...existingStocks];

            let addedCount = 0;
            let updatedCount = 0;

            stocks.forEach(newStock => {
              const existingIndex = updatedStocks.findIndex(stock => stock.id === newStock.id);
              if (existingIndex >= 0) {
                updatedStocks[existingIndex] = { ...updatedStocks[existingIndex], ...newStock };
                updatedCount++;
              } else {
                updatedStocks.push(newStock);
                addedCount++;
              }
            });

            await fileService.writeJsonFile('stocks.json', updatedStocks);

            resolve({
              success: true,
              message: `Imported ${stocks.length} stocks successfully`,
              statistics: {
                totalProcessed: rowCount,
                successful: stocks.length,
                added: addedCount,
                updated: updatedCount,
                errors: errors.length
              },
              errors
            });
          } catch (error) {
            resolve({
              success: false,
              message: 'Error saving imported stocks',
              error: error.message,
              errors
            });
          }
        })
        .on('error', (error) => {
          resolve({
            success: false,
            message: 'Error reading CSV file',
            error: error.message
          });
        });
    });
  }

  /**
   * Get CSV template for data type
   */
  getCSVTemplate(dataType) {
    const templates = {
      accounts: [
        'ID,Name,Type,Balance,Currency,Description,Active,Created At,Updated At,Total Investment,Total P&L,Last Synced,Source',
        'acc-001,Main Account,investment,50000,USD,Primary investment account,true,2025-01-01T00:00:00Z,2025-01-01T00:00:00Z,45000,5000,2025-01-01T00:00:00Z,manual'
      ],
      stocks: [
        'ID,Account ID,Symbol,Company Name,Quantity,Purchase Price,Current Price,Purchase Date,Sector,Exchange,Current Value,Initial Value,Absolute Gain/Loss,Percentage Gain/Loss,Profit/Loss %,Daily Change %,Market Cap,Sub Sector,Source,Created At,Updated At',
        'stock-001,acc-001,AAPL,Apple Inc,10,150.00,180.00,2025-01-01T00:00:00Z,Technology,NASDAQ,1800,1500,300,20,20.0,2.5,Large Cap,Consumer Electronics,manual,2025-01-01T00:00:00Z,2025-01-01T00:00:00Z'
      ],
      portfolios: [
        'ID,Name,Description,Strategy,Risk Level,Created At,Updated At',
        'port-001,Growth Portfolio,Aggressive growth strategy,growth,high,2025-01-01T00:00:00Z,2025-01-01T00:00:00Z'
      ]
    };

    return templates[dataType] || [];
  }
}

module.exports = new CSVService();
