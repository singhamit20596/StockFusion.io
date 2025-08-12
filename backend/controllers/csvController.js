const csvService = require('../services/csvService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../data/uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only allow CSV files
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * CSV Controller
 * Handles CSV import/export operations
 */
class CSVController {
  /**
   * Export all portfolio data to CSV files
   * GET /api/csv/export/all
   */
  async exportAllData(req, res) {
    try {
      const result = await csvService.exportAllData();
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: {
            exportDirectory: result.exportDir,
            files: {
              accounts: 'accounts_export.csv',
              stocks: 'stocks_export.csv',
              portfolios: 'portfolios_export.csv'
            },
            results: result.results
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error exporting data',
        error: error.message
      });
    }
  }

  /**
   * Export accounts to CSV
   * GET /api/csv/export/accounts
   */
  async exportAccounts(req, res) {
    try {
      const result = await csvService.exportAccounts();
      
      if (result.success) {
        res.download(result.filePath, 'accounts_export.csv', (err) => {
          if (err) {
            res.status(500).json({
              success: false,
              message: 'Error downloading file',
              error: err.message
            });
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error exporting accounts',
        error: error.message
      });
    }
  }

  /**
   * Export stocks to CSV
   * GET /api/csv/export/stocks
   */
  async exportStocks(req, res) {
    try {
      const result = await csvService.exportStocks();
      
      if (result.success) {
        res.download(result.filePath, 'stocks_export.csv', (err) => {
          if (err) {
            res.status(500).json({
              success: false,
              message: 'Error downloading file',
              error: err.message
            });
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error exporting stocks',
        error: error.message
      });
    }
  }

  /**
   * Export portfolios to CSV
   * GET /api/csv/export/portfolios
   */
  async exportPortfolios(req, res) {
    try {
      const result = await csvService.exportPortfolios();
      
      if (result.success) {
        res.download(result.filePath, 'portfolios_export.csv', (err) => {
          if (err) {
            res.status(500).json({
              success: false,
              message: 'Error downloading file',
              error: err.message
            });
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error exporting portfolios',
        error: error.message
      });
    }
  }

  /**
   * Import accounts from CSV
   * POST /api/csv/import/accounts
   */
  async importAccounts(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No CSV file uploaded'
        });
      }

      const result = await csvService.importAccounts(req.file.path);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: result.statistics,
          errors: result.errors
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          error: result.error,
          errors: result.errors
        });
      }
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        success: false,
        message: 'Error importing accounts',
        error: error.message
      });
    }
  }

  /**
   * Import stocks from CSV
   * POST /api/csv/import/stocks
   */
  async importStocks(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No CSV file uploaded'
        });
      }

      const result = await csvService.importStocks(req.file.path);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: result.statistics,
          errors: result.errors
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          error: result.error,
          errors: result.errors
        });
      }
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        success: false,
        message: 'Error importing stocks',
        error: error.message
      });
    }
  }

  /**
   * Get CSV template for specific data type
   * GET /api/csv/template/:type
   */
  async getCSVTemplate(req, res) {
    try {
      const { type } = req.params;
      const validTypes = ['accounts', 'stocks', 'portfolios'];
      
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid template type. Valid types: ${validTypes.join(', ')}`
        });
      }

      const template = csvService.getCSVTemplate(type);
      
      if (template.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_template.csv"`);
      
      // Send CSV content
      res.send(template.join('\n'));
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error generating template',
        error: error.message
      });
    }
  }

  /**
   * Get upload middleware for specific route
   */
  getUploadMiddleware() {
    return upload.single('csvFile');
  }
}

module.exports = new CSVController();
