// Gracefully handle missing Puppeteer dependencies
let puppeteer, StealthPlugin, isPuppeteerAvailable = false;

try {
  puppeteer = require('puppeteer-extra');
  StealthPlugin = require('puppeteer-extra-plugin-stealth');
  
  // Add stealth plugin to avoid detection
  puppeteer.use(StealthPlugin());
  isPuppeteerAvailable = true;
  console.log('✅ Puppeteer dependencies loaded successfully');
} catch (error) {
  console.warn('⚠️ Puppeteer dependencies not installed. Real scraping not available.');
  console.warn('To enable real scraping, run: npm run install-scraping');
  isPuppeteerAvailable = false;
}

// Import mock scraper as fallback
const MockGrowwScraper = require('./mockGroww');

/**
 * Groww Portfolio Scraper
 * Scrapes holdings data from Groww platform using Puppeteer
 */
class GrowwScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isLoggedIn = false;
  }

  /**
   * Initialize browser and page
   */
  async initialize() {
    try {
      // Check if Puppeteer is available
      if (!isPuppeteerAvailable) {
        throw new Error('Puppeteer is not installed. Please install puppeteer dependencies first.');
      }

      this.browser = await puppeteer.launch({
        headless: false, // Set to true for production
        slowMo: 50,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--window-size=1366,768'
        ]
      });

      this.page = await this.browser.newPage();
      
      // Set viewport
      await this.page.setViewport({ width: 1366, height: 768 });
      
      // Set user agent to avoid detection
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      console.log('🚀 Browser initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error.message);
      throw error;
    }
  }

  /**
   * Login to Groww platform
   * @param {string} username - Mobile number or email
   * @param {string} password - Account password
   * @param {string} pin - 4-digit PIN
   * @param {string} otp - OTP (if required)
   */
  async login(username, password, pin, otp = null) {
    try {
      console.log('🔐 Starting Groww login process...');
      
      // Navigate to Groww login page
      await this.page.goto('https://groww.in/login', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for login form
      await this.page.waitForSelector('input[data-cy="login-email"]', { timeout: 10000 });

      // Enter username (mobile/email)
      await this.page.type('input[data-cy="login-email"]', username, { delay: 100 });
      console.log('✅ Username entered');

      // Click continue button
      await this.page.click('button[data-cy="login-email-continue"]');
      await this.page.waitForTimeout(2000);

      // Enter password
      await this.page.waitForSelector('input[data-cy="login-password"]', { timeout: 10000 });
      await this.page.type('input[data-cy="login-password"]', password, { delay: 100 });
      console.log('✅ Password entered');

      // Click login button
      await this.page.click('button[data-cy="login-password-continue"]');
      await this.page.waitForTimeout(3000);

      // Handle OTP if required
      const otpSelector = 'input[data-cy="login-otp"]';
      try {
        await this.page.waitForSelector(otpSelector, { timeout: 5000 });
        
        if (otp) {
          await this.page.type(otpSelector, otp, { delay: 100 });
          console.log('✅ OTP entered');
          
          await this.page.click('button[data-cy="login-otp-continue"]');
          await this.page.waitForTimeout(3000);
        } else {
          console.log('⏳ OTP required but not provided. Please check your phone/email.');
          return { success: false, message: 'OTP required', requiresOTP: true };
        }
      } catch (otpError) {
        console.log('ℹ️ OTP not required or already handled');
      }

      // Handle PIN if required
      const pinSelector = 'input[data-cy="login-pin"]';
      try {
        await this.page.waitForSelector(pinSelector, { timeout: 5000 });
        
        await this.page.type(pinSelector, pin, { delay: 100 });
        console.log('✅ PIN entered');
        
        await this.page.click('button[data-cy="login-pin-continue"]');
        await this.page.waitForTimeout(3000);
      } catch (pinError) {
        console.log('ℹ️ PIN not required at this step');
      }

      // Verify login success by checking for dashboard elements
      try {
        await this.page.waitForSelector('[data-cy="dashboard"]', { timeout: 10000 });
        console.log('🎉 Login successful!');
        this.isLoggedIn = true;
        return { success: true, message: 'Login successful' };
      } catch (dashboardError) {
        // Alternative check for login success
        const currentUrl = this.page.url();
        if (currentUrl.includes('dashboard') || currentUrl.includes('portfolio')) {
          console.log('🎉 Login successful (alternative verification)!');
          this.isLoggedIn = true;
          return { success: true, message: 'Login successful' };
        } else {
          throw new Error('Login verification failed');
        }
      }

    } catch (error) {
      console.error('❌ Login failed:', error.message);
      return { success: false, message: `Login failed: ${error.message}` };
    }
  }

  /**
   * Navigate to holdings/portfolio page
   */
  async navigateToHoldings() {
    try {
      if (!this.isLoggedIn) {
        throw new Error('Not logged in. Please login first.');
      }

      console.log('📊 Navigating to holdings page...');
      
      // Navigate to portfolio/holdings page
      await this.page.goto('https://groww.in/holdings', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for holdings to load
      await this.page.waitForSelector('[data-cy="holdings-container"]', { timeout: 15000 });
      console.log('✅ Holdings page loaded');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to navigate to holdings:', error.message);
      throw error;
    }
  }

  /**
   * Scrape stock holdings data
   */
  async scrapeHoldings() {
    try {
      if (!this.isLoggedIn) {
        throw new Error('Not logged in. Please login first.');
      }

      console.log('🔍 Scraping holdings data...');
      
      // Wait for holdings data to load
      await this.page.waitForSelector('[data-cy="stock-holding-item"]', { timeout: 15000 });

      // Extract holdings data
      const holdings = await this.page.evaluate(() => {
        const holdingItems = document.querySelectorAll('[data-cy="stock-holding-item"]');
        const data = [];

        holdingItems.forEach((item, index) => {
          try {
            // Extract basic stock information
            const nameElement = item.querySelector('[data-cy="stock-name"]') || item.querySelector('.stock-name') || item.querySelector('h3');
            const priceElement = item.querySelector('[data-cy="current-price"]') || item.querySelector('.current-price');
            const avgPriceElement = item.querySelector('[data-cy="avg-price"]') || item.querySelector('.avg-price');
            const unitsElement = item.querySelector('[data-cy="units"]') || item.querySelector('.units');
            const profitLossElement = item.querySelector('[data-cy="profit-loss"]') || item.querySelector('.profit-loss');
            const dailyChangeElement = item.querySelector('[data-cy="daily-change"]') || item.querySelector('.daily-change');

            // Extract additional details
            const sectorElement = item.querySelector('[data-cy="sector"]') || item.querySelector('.sector');
            const marketCapElement = item.querySelector('[data-cy="market-cap"]') || item.querySelector('.market-cap');
            const subSectorElement = item.querySelector('[data-cy="sub-sector"]') || item.querySelector('.sub-sector');

            // Helper function to extract numeric value
            const extractNumber = (element) => {
              if (!element) return 0;
              const text = element.textContent.trim();
              const number = parseFloat(text.replace(/[^\d.-]/g, ''));
              return isNaN(number) ? 0 : number;
            };

            // Helper function to extract percentage
            const extractPercentage = (element) => {
              if (!element) return 0;
              const text = element.textContent.trim();
              const match = text.match(/([-+]?\d+\.?\d*)%/);
              return match ? parseFloat(match[1]) : 0;
            };

            const stockData = {
              id: `groww-stock-${Date.now()}-${index}`,
              name: nameElement ? nameElement.textContent.trim() : 'Unknown Stock',
              symbol: nameElement ? nameElement.textContent.trim().split(' ')[0] : 'UNKNOWN',
              currentPrice: extractNumber(priceElement),
              avgBuyPrice: extractNumber(avgPriceElement),
              units: extractNumber(unitsElement),
              profitLossPercentage: extractPercentage(profitLossElement),
              dailyChangePercentage: extractPercentage(dailyChangeElement),
              sector: sectorElement ? sectorElement.textContent.trim() : 'Unknown',
              marketCap: marketCapElement ? marketCapElement.textContent.trim() : 'Unknown',
              subSector: subSectorElement ? subSectorElement.textContent.trim() : 'Unknown',
              totalValue: 0, // Will be calculated
              profitLoss: 0, // Will be calculated
              scrapedAt: new Date().toISOString()
            };

            // Calculate derived values
            stockData.totalValue = stockData.currentPrice * stockData.units;
            stockData.profitLoss = (stockData.currentPrice - stockData.avgBuyPrice) * stockData.units;

            data.push(stockData);
          } catch (itemError) {
            console.warn(`Warning: Error processing holding item ${index}:`, itemError.message);
          }
        });

        return data;
      });

      console.log(`✅ Scraped ${holdings.length} holdings`);
      return holdings;

    } catch (error) {
      console.error('❌ Failed to scrape holdings:', error.message);
      throw error;
    }
  }

  /**
   * Get portfolio summary data
   */
  async getPortfolioSummary() {
    try {
      console.log('📈 Extracting portfolio summary...');
      
      const summary = await this.page.evaluate(() => {
        // Look for portfolio summary elements
        const totalValueElement = document.querySelector('[data-cy="total-portfolio-value"]') || 
                                 document.querySelector('.total-value') ||
                                 document.querySelector('.portfolio-value');
        
        const totalInvestmentElement = document.querySelector('[data-cy="total-investment"]') || 
                                     document.querySelector('.total-investment');
        
        const totalProfitLossElement = document.querySelector('[data-cy="total-profit-loss"]') || 
                                     document.querySelector('.total-profit-loss');

        const extractNumber = (element) => {
          if (!element) return 0;
          const text = element.textContent.trim();
          const number = parseFloat(text.replace(/[^\d.-]/g, ''));
          return isNaN(number) ? 0 : number;
        };

        return {
          totalValue: extractNumber(totalValueElement),
          totalInvestment: extractNumber(totalInvestmentElement),
          totalProfitLoss: extractNumber(totalProfitLossElement),
          lastUpdated: new Date().toISOString()
        };
      });

      console.log('✅ Portfolio summary extracted');
      return summary;

    } catch (error) {
      console.error('❌ Failed to get portfolio summary:', error.message);
      return {
        totalValue: 0,
        totalInvestment: 0,
        totalProfitLoss: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Main scraping method
   * @param {Object} credentials - { username, password, pin, otp }
   */
  async scrapeGrowwData(credentials) {
    try {
      // Check if Puppeteer is available
      if (!isPuppeteerAvailable) {
        console.log('🎭 Puppeteer not available, using mock scraper');
        const mockScraper = new MockGrowwScraper();
        return await mockScraper.scrapeGrowwData(credentials);
      }

      const { username, password, pin, otp } = credentials;

      // Initialize browser
      await this.initialize();

      // Login
      const loginResult = await this.login(username, password, pin, otp);
      if (!loginResult.success) {
        await this.cleanup();
        return loginResult;
      }

      // Navigate to holdings
      await this.navigateToHoldings();

      // Scrape holdings data
      const holdings = await this.scrapeHoldings();

      // Get portfolio summary
      const summary = await this.getPortfolioSummary();

      // Cleanup
      await this.cleanup();

      return {
        success: true,
        data: {
          holdings,
          summary,
          scrapedAt: new Date().toISOString(),
          source: 'groww'
        },
        message: `Successfully scraped ${holdings.length} holdings`
      };

    } catch (error) {
      console.error('❌ Scraping failed:', error.message);
      await this.cleanup();
      return {
        success: false,
        message: `Scraping failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Cleanup browser resources
   */
  async cleanup() {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      this.isLoggedIn = false;
      console.log('🧹 Browser cleanup completed');
    } catch (error) {
      console.error('⚠️ Cleanup error:', error.message);
    }
  }
}

module.exports = GrowwScraper;
