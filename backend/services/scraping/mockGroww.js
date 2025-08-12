/**
 * Mock Groww Scraper for development/testing
 * Returns realistic mock data without requiring Puppeteer
 */
class MockGrowwScraper {
  constructor() {
    this.isLoggedIn = false;
  }

  /**
   * Initialize mock browser (no-op)
   */
  async initialize() {
    console.log('🚀 Mock browser initialized');
    return true;
  }

  /**
   * Mock login
   */
  async login(username, password, pin, otp = null) {
    console.log('🔐 Mock login successful');
    this.isLoggedIn = true;
    return { success: true, message: 'Mock login successful' };
  }

  /**
   * Mock navigate to holdings
   */
  async navigateToHoldings() {
    console.log('📊 Mock navigation to holdings');
    return true;
  }

  /**
   * Mock scrape holdings
   */
  async scrapeHoldings() {
    console.log('🔍 Mock scraping holdings data');
    
    // Return realistic mock stock data
    const mockHoldings = [
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
        subSector: 'Software',
        totalValue: 16252.00,
        profitLoss: 752.00,
        scrapedAt: new Date().toISOString()
      },
      {
        id: `mock-stock-${Date.now()}-3`,
        name: 'HDFC Bank Ltd',
        symbol: 'HDFCBANK',
        currentPrice: 1580.25,
        avgBuyPrice: 1650.00,
        units: 15,
        profitLossPercentage: -4.23,
        dailyChangePercentage: 0.5,
        sector: 'Financial Services',
        marketCap: 'Large Cap',
        subSector: 'Private Bank',
        totalValue: 23703.75,
        profitLoss: -1046.25,
        scrapedAt: new Date().toISOString()
      },
      {
        id: `mock-stock-${Date.now()}-4`,
        name: 'Infosys Ltd',
        symbol: 'INFY',
        currentPrice: 1420.80,
        avgBuyPrice: 1380.00,
        units: 8,
        profitLossPercentage: 2.96,
        dailyChangePercentage: 1.5,
        sector: 'Information Technology',
        marketCap: 'Large Cap',
        subSector: 'Software',
        totalValue: 11366.40,
        profitLoss: 326.40,
        scrapedAt: new Date().toISOString()
      }
    ];

    return mockHoldings;
  }

  /**
   * Mock portfolio summary
   */
  async getPortfolioSummary() {
    console.log('📈 Mock portfolio summary');
    
    return {
      totalValue: 75829.65,
      totalInvestment: 74790.00,
      totalProfitLoss: 1039.65,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Main mock scraping method
   */
  async scrapeGrowwData(credentials) {
    try {
      console.log('🎭 Using mock scraper (Puppeteer not available)');
      
      // Simulate login
      await this.login(credentials.username, credentials.password, credentials.pin, credentials.otp);
      
      // Simulate navigation
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
          source: 'groww_mock'
        },
        message: `Mock scraping completed - ${holdings.length} holdings`,
        isMockData: true
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
