/**
 * Mock Groww Scraper - DISABLED FOR REAL-TIME IMPLEMENTATION
 * Use only for development testing when Puppeteer is not available
 */
class MockGrowwScraper {
  constructor() {
    console.log('🚫 Mock Groww scraper initialized - DISABLED for real-time implementation');
    console.log('💡 Install Puppeteer dependencies for real scraping: npm run install-scraping');
    this.isLoggedIn = false;
  }

  /**
   * Mock initialization - returns error for real implementation
   */
  async initialize() {
    console.log('❌ Mock scraper disabled. Use real Puppeteer scraping.');
    return false;
  }

  /**
   * Disabled mock login - forces real implementation
   */
  async login(username, password, pin, otp = null, options = {}) {
    console.log('🚫 Mock login disabled. Please use real Groww authentication.');
    return { 
      success: false, 
      message: 'Mock data disabled. Use real Puppeteer scraping for live data.',
      requiresRealImplementation: true
    };
  }

  /**
   * Disabled mock scraping - forces real implementation
   */
  async scrapeHoldings() {
    console.log('🚫 Mock scraping disabled. Requires real Puppeteer implementation.');
    return [];
  }

  /**
   * Disabled mock close - forces real implementation
   */
  async close() {
    console.log('🚫 Mock close disabled. Use real browser automation.');
    return true;
  }

  /* 
  ===================================================================
  COMMENTED OUT - MOCK DATA FOR DEVELOPMENT TESTING ONLY
  Uncomment this section only for testing the UI flow when needed
  ===================================================================
  
  async scrapeHoldingsWithMockData() {
    console.log('🧪 Using MOCK data for testing purposes only');
    
    const mockData = [
      {
        id: `mock-stock-${Date.now()}-1`,
        name: 'Reliance Industries Ltd',
        symbol: 'RELIANCE',
        currentPrice: 2450.75,
        avgBuyPrice: 2350.00,
        units: 10,
        profitLossPercentage: 4.29,
        dailyChangePercentage: 1.2,
        sector: 'Energy',
        marketCap: 'Large Cap',
        subSector: 'Oil & Gas',
        totalValue: 24507.50,
        profitLoss: 1007.50,
        scrapedAt: new Date().toISOString()
      },
      {
        id: `mock-stock-${Date.now()}-2`,
        name: 'Tata Consultancy Services Ltd',
        symbol: 'TCS',
        currentPrice: 3250.40,
        avgBuyPrice: 3100.00,
        units: 5,
        profitLossPercentage: 4.85,
        dailyChangePercentage: -0.8,
        sector: 'Information Technology',
        marketCap: 'Large Cap',
        subSector: 'IT Services',
        totalValue: 16252.00,
        profitLoss: 752.00,
        scrapedAt: new Date().toISOString()
      }
    ];
    
    return mockData;
  }
  */

  /**
   * Enhanced mock login with credential validation and automation support - DISABLED
   */
  async login(username, password, pin, otp = null, options = {}) {
    console.log('🚫 All mock login methods disabled. Use real Puppeteer scraping only.');
    return { 
      success: false, 
      message: 'Mock data completely disabled. Install Puppeteer: npm run install-scraping',
      requiresRealImplementation: true
    };
  }

  /**
   * Delay helper function
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Mock navigate to holdings - DISABLED
   */
  async navigateToHoldings() {
    console.log('� Mock navigation disabled. Use real Puppeteer scraping.');
    return false;
  }

  /**
   * Enhanced mock scrape holdings - DISABLED
   */
  async scrapeHoldings() {
    console.log('🚫 Mock scraping disabled. Use real Puppeteer scraping.');
    return [];
  }

  /**
   * Enhanced mock portfolio summary - DISABLED
   */
  async getPortfolioSummary() {
    console.log('� Mock portfolio summary disabled. Use real Puppeteer scraping.');
    return null;
  }

  /**
   * Enhanced main mock scraping method with validation
   */
  async scrapeGrowwData(credentials) {
    try {
      const isAutomated = credentials.isAutomated || credentials.userLoggedIn;
      
      if (isAutomated) {
        console.log('🤖 Using enhanced mock scraper with automation mode');
        console.log('� Simulating automated browser navigation after user login');
      } else {
        console.log('�🎭 Using enhanced mock scraper (Puppeteer not available)');
      }
      
      // For automation mode, skip credential validation (user already logged in)
      if (!isAutomated && (!credentials.username || !credentials.password || !credentials.pin)) {
        return {
          success: false,
          message: 'Username, password, and PIN are required',
          error: 'MISSING_CREDENTIALS'
        };
      }
      
      // Simulate login
      const loginResult = await this.login(
        credentials.username, 
        credentials.password, 
        credentials.pin, 
        credentials.otp,
        { isAutomated, userLoggedIn: credentials.userLoggedIn }
      );
      
      if (!loginResult.success) {
        return {
          success: false,
          message: loginResult.message,
          error: 'LOGIN_FAILED'
        };
      }
      
      // Simulate navigation with automation feedback
      if (isAutomated) {
        console.log('🤖 Automated navigation: Detecting Holdings page...');
        await this.delay(500);
        console.log('📊 Automated navigation: Holdings page found, starting scrape...');
      }
      
      await this.navigateToHoldings();
      
      // Simulate scraping
      const holdings = await this.scrapeHoldings();
      const summary = await this.getPortfolioSummary();
      
      await this.cleanup();

      return {
        success: true,
        data: {
          holdings,
          summary,
          scrapedAt: new Date().toISOString(),
          source: 'groww_mock',
          userAccount: this.currentUser,
          isAutomated: isAutomated
        },
        message: isAutomated 
          ? `Successfully synced ${holdings.length} mock holdings from Groww (automated mode)` 
          : `Mock scraping completed - ${holdings.length} holdings for ${this.currentUser}`,
        isMockData: true,
        isAutomated: isAutomated
      };

    } catch (error) {
      console.error('❌ Mock scraping failed:', error.message);
      await this.cleanup();
      return {
        success: false,
        message: `Mock scraping failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Mock cleanup
   */
  async cleanup() {
    this.isLoggedIn = false;
    console.log('🧹 Mock cleanup completed');
  }
}

module.exports = MockGrowwScraper;
