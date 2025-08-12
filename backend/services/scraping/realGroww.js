/**
 * Real Groww Scraper with Puppeteer
 * Implements actual browser automation for Groww holdings scraping
 * Includes progress tracking and automated navigation
 */

class RealGrowwScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isLoggedIn = false;
    this.progressCallback = null;
    console.log('🎯 Real Groww scraper initialized');
  }

  /**
   * Set progress callback for real-time updates
   */
  setProgressCallback(callback) {
    this.progressCallback = callback;
  }

  /**
   * Update progress with callback
   */
  updateProgress(percentage, message) {
    console.log(`📊 Progress: ${percentage}% - ${message}`);
    if (this.progressCallback) {
      this.progressCallback(percentage, message);
    }
  }

  /**
   * Initialize Puppeteer browser
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Puppeteer browser...');
      this.updateProgress(5, 'Initializing browser...');

      // Check if Puppeteer is available
      let puppeteer;
      try {
        puppeteer = require('puppeteer');
      } catch (error) {
        console.log('❌ Puppeteer not installed. Please run: npm run install-scraping');
        throw new Error('Puppeteer is not installed. Please install puppeteer dependencies first.');
      }

      // Launch browser in headless mode for automation
      this.browser = await puppeteer.launch({
        headless: true, // Set to false for debugging
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      this.page = await this.browser.newPage();
      
      // Set viewport and user agent
      await this.page.setViewport({ width: 1366, height: 768 });
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      this.updateProgress(10, 'Browser initialized successfully');
      console.log('✅ Real browser initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error.message);
      this.updateProgress(0, `Failed to initialize browser: ${error.message}`);
      throw error;
    }
  }

  /**
   * Navigate to Groww and detect user session
   * This assumes user has already logged in via popup
   */
  async detectUserSession() {
    try {
      this.updateProgress(15, 'Connecting to Groww...');
      console.log('🔗 Navigating to Groww...');

      // Navigate to Groww dashboard
      await this.page.goto('https://groww.in/', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      this.updateProgress(25, 'Checking authentication status...');

      // Wait for page to load and check if user is logged in
      await this.page.waitForTimeout(3000);

      // Check for login indicators
      const isLoggedIn = await this.page.evaluate(() => {
        // Look for user profile elements or dashboard content
        const profileElement = document.querySelector('[data-testid="user-profile"]') || 
                              document.querySelector('.usr23UserName') ||
                              document.querySelector('[class*="profile"]') ||
                              document.querySelector('[class*="user"]');
        
        const dashboardElement = document.querySelector('[href*="dashboard"]') ||
                                document.querySelector('[class*="dashboard"]') ||
                                document.querySelector('[data-testid="portfolio"]');

        return !!(profileElement || dashboardElement);
      });

      if (isLoggedIn) {
        this.isLoggedIn = true;
        this.updateProgress(35, 'User session detected successfully');
        console.log('✅ User session detected - proceeding with scraping');
        return { success: true, message: 'User session detected' };
      } else {
        this.updateProgress(0, 'No active user session found');
        console.log('❌ No user session detected');
        return { success: false, message: 'User not logged in or session expired' };
      }
    } catch (error) {
      console.error('❌ Failed to detect user session:', error.message);
      this.updateProgress(0, `Session detection failed: ${error.message}`);
      return { success: false, message: `Session detection failed: ${error.message}` };
    }
  }

  /**
   * Navigate to holdings page with progress tracking
   */
  async navigateToHoldings() {
    try {
      this.updateProgress(40, 'Navigating to Holdings page...');
      console.log('📊 Navigating to Holdings page...');

      // Look for holdings/portfolio navigation
      const holdingsUrls = [
        'https://groww.in/holdings',
        'https://groww.in/portfolio',
        'https://groww.in/dashboard',
        'https://groww.in/stocks/user/holdings'
      ];

      let navigationSuccess = false;

      for (const url of holdingsUrls) {
        try {
          console.log(`🔍 Trying URL: ${url}`);
          await this.page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 20000 
          });

          // Wait for content to load
          await this.page.waitForTimeout(3000);

          // Check if holdings content is present
          const hasHoldings = await this.page.evaluate(() => {
            const holdingsIndicators = [
              '[data-testid="holdings"]',
              '[class*="holding"]',
              '[class*="portfolio"]',
              'table',
              '[class*="stock"]',
              '.holdings-container',
              '.portfolio-container'
            ];

            return holdingsIndicators.some(selector => {
              const element = document.querySelector(selector);
              return element && element.textContent.length > 0;
            });
          });

          if (hasHoldings) {
            navigationSuccess = true;
            this.updateProgress(50, 'Holdings page loaded successfully');
            console.log(`✅ Successfully navigated to holdings: ${url}`);
            break;
          }
        } catch (error) {
          console.log(`⚠️ Failed to navigate to ${url}:`, error.message);
          continue;
        }
      }

      if (!navigationSuccess) {
        throw new Error('Unable to navigate to holdings page');
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to navigate to holdings:', error.message);
      this.updateProgress(0, `Navigation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Scrape holdings data with progress tracking
   */
  async scrapeHoldings() {
    try {
      this.updateProgress(60, 'Scraping holdings data...');
      console.log('🔍 Starting holdings data extraction...');

      // Wait for holdings data to load
      await this.page.waitForTimeout(2000);

      const holdingsData = await this.page.evaluate(() => {
        const holdings = [];
        
        // Multiple selectors to find holdings data
        const possibleSelectors = [
          'table tbody tr',
          '[class*="holding"] [class*="row"]',
          '[class*="stock"] [class*="item"]',
          '[data-testid*="holding"]',
          '.portfolio-table tr',
          '[class*="portfolio"] [class*="item"]'
        ];

        let foundElements = [];
        
        for (const selector of possibleSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            foundElements = Array.from(elements);
            break;
          }
        }

        foundElements.forEach((element, index) => {
          try {
            const text = element.textContent || '';
            
            // Extract stock information using various patterns
            const stockData = {
              id: `groww-stock-${Date.now()}-${index}`,
              name: '',
              symbol: '',
              currentPrice: 0,
              avgBuyPrice: 0,
              units: 0,
              totalValue: 0,
              profitLoss: 0,
              profitLossPercentage: 0,
              scrapedAt: new Date().toISOString()
            };

            // Try to extract stock name and symbol
            const nameElement = element.querySelector('[class*="name"], [class*="company"], [data-testid*="name"]');
            if (nameElement) {
              stockData.name = nameElement.textContent.trim();
            }

            const symbolElement = element.querySelector('[class*="symbol"], [class*="ticker"]');
            if (symbolElement) {
              stockData.symbol = symbolElement.textContent.trim();
            }

            // Extract numerical values
            const numberPattern = /[\d,]+\.?\d*/g;
            const numbers = text.match(numberPattern) || [];
            const cleanNumbers = numbers.map(n => parseFloat(n.replace(/,/g, '')) || 0);

            if (cleanNumbers.length >= 4) {
              stockData.units = cleanNumbers[0] || 0;
              stockData.avgBuyPrice = cleanNumbers[1] || 0;
              stockData.currentPrice = cleanNumbers[2] || 0;
              stockData.totalValue = cleanNumbers[3] || 0;
              
              if (cleanNumbers.length >= 5) {
                stockData.profitLoss = cleanNumbers[4] || 0;
              }
              
              if (cleanNumbers.length >= 6) {
                stockData.profitLossPercentage = cleanNumbers[5] || 0;
              }
            }

            // Only add if we have meaningful data
            if (stockData.name || stockData.symbol || stockData.totalValue > 0) {
              holdings.push(stockData);
            }
          } catch (error) {
            console.log('Error processing holding element:', error);
          }
        });

        return holdings;
      });

      this.updateProgress(80, `Extracted ${holdingsData.length} holdings`);
      console.log(`✅ Extracted ${holdingsData.length} holdings from Groww`);

      // Process and validate the scraped data
      const validHoldings = holdingsData.filter(holding => 
        holding.name || holding.symbol || holding.totalValue > 0
      );

      this.updateProgress(90, 'Processing scraped data...');
      console.log(`📊 Processed ${validHoldings.length} valid holdings`);

      return validHoldings;
    } catch (error) {
      console.error('❌ Failed to scrape holdings:', error.message);
      this.updateProgress(0, `Scraping failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Close browser and complete scraping
   */
  async close() {
    try {
      this.updateProgress(95, 'Closing browser...');
      console.log('🧹 Closing browser...');

      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
      }

      this.updateProgress(100, 'Scraping completed successfully');
      console.log('✅ Browser closed successfully');
      return true;
    } catch (error) {
      console.error('❌ Error closing browser:', error.message);
      return false;
    }
  }

  /**
   * Complete automated scraping process
   */
  async performAutomatedScraping(progressCallback = null) {
    try {
      if (progressCallback) {
        this.setProgressCallback(progressCallback);
      }

      console.log('🚀 Starting automated Groww scraping...');
      this.updateProgress(0, 'Starting automated scraping...');

      // Initialize browser
      await this.initialize();

      // Detect user session
      const sessionResult = await this.detectUserSession();
      if (!sessionResult.success) {
        throw new Error(sessionResult.message);
      }

      // Navigate to holdings
      await this.navigateToHoldings();

      // Scrape holdings data
      const holdingsData = await this.scrapeHoldings();

      // Close browser
      await this.close();

      console.log('🎉 Automated scraping completed successfully');
      return {
        success: true,
        data: holdingsData,
        message: `Successfully scraped ${holdingsData.length} holdings from Groww`
      };
    } catch (error) {
      console.error('❌ Automated scraping failed:', error.message);
      
      // Ensure browser is closed on error
      if (this.browser) {
        try {
          await this.browser.close();
        } catch (closeError) {
          console.error('Error closing browser:', closeError.message);
        }
      }

      this.updateProgress(0, `Scraping failed: ${error.message}`);
      return {
        success: false,
        data: [],
        message: error.message
      };
    }
  }
}

module.exports = RealGrowwScraper;
