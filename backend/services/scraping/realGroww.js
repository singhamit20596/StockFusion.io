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
   * Initialize browser for interactive login (non-headless)
   */
  async initializeInteractiveBrowser() {
    try {
      this.updateProgress(5, 'Initializing browser...');
      console.log('🚀 Initializing Puppeteer browser...');

      // Check if Puppeteer is available
      let puppeteer;
      try {
        puppeteer = require('puppeteer');
      } catch (error) {
        console.log('❌ Puppeteer not installed. Please run: npm run install-scraping');
        throw new Error('Puppeteer is not installed. Please install puppeteer dependencies first.');
      }

      // Launch browser in NON-HEADLESS mode for user interaction
      this.browser = await puppeteer.launch({
        headless: false, // Important: Allow user interaction
        slowMo: 50,
        defaultViewport: null, // Use default viewport
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security', // Help with CORS issues
          '--disable-features=VizDisplayCompositor',
          '--no-first-run',
          '--no-default-browser-check',
          '--window-size=1366,768',
          '--start-maximized'
        ]
      });

      this.page = await this.browser.newPage();
      
      // Set viewport and user agent for better compatibility
      await this.page.setViewport({ width: 1366, height: 768 });
      await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Enable console logs from the page for debugging
      this.page.on('console', msg => console.log('🖥️ Page console:', msg.text()));
      this.page.on('pageerror', error => console.log('🚫 Page error:', error.message));

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
   * Navigate to Groww login and wait for user to log in
   */
  async waitForUserLogin() {
    try {
      this.updateProgress(15, 'Connecting to Groww...');
      console.log('🔗 Navigating to Groww...');

      // Navigate to Groww login page with enhanced error handling
      try {
        console.log('🌐 Attempting to load: https://groww.in/login');
        await this.page.goto('https://groww.in/login', { 
          waitUntil: 'domcontentloaded', // Changed from networkidle2 for faster loading
          timeout: 60000 // Increased timeout
        });
        
        // Wait a bit more for the page to fully render
        await this.page.waitForTimeout(3000);
        
        const currentUrl = this.page.url();
        console.log('✅ Successfully navigated to:', currentUrl);
        
        // Check if page loaded correctly
        const pageTitle = await this.page.title();
        console.log('📄 Page title:', pageTitle);
        
      } catch (navigationError) {
        console.error('❌ Navigation failed:', navigationError.message);
        console.log('🔄 Retrying with fallback URL...');
        
        // Try alternative URL
        await this.page.goto('https://groww.in', { 
          waitUntil: 'domcontentloaded',
          timeout: 60000 
        });
        
        await this.page.waitForTimeout(2000);
        
        // Navigate to login from homepage
        console.log('🔗 Clicking login from homepage...');
        try {
          await this.page.click('a[href*="login"], button[data-testid="login"], .login-button, [class*="login"]');
          await this.page.waitForTimeout(3000);
        } catch (clickError) {
          console.log('⌨️ Manually navigating to login...');
          await this.page.goto('https://groww.in/login', { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
          });
        }
      }

      this.updateProgress(25, 'Groww page loaded - Please log in to your account in the browser window');
      console.log('⏳ Waiting for user to log in...');
      console.log('👆 Please log in to your Groww account in the opened browser window');

      // Wait for successful login by monitoring URL changes and page content
      let loginAttempts = 0;
      const maxAttempts = 120; // 10 minutes maximum wait time

      while (loginAttempts < maxAttempts) {
        await this.page.waitForTimeout(5000); // Check every 5 seconds
        
        const currentUrl = this.page.url();
        
        // Check if redirected away from login page
        if (!currentUrl.includes('/login')) {
          // Additional check for login indicators
          const isLoggedIn = await this.page.evaluate(() => {
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
            this.updateProgress(35, 'Login successful! Proceeding with scraping...');
            console.log('✅ User successfully logged in');
            return true;
          }
        }

        loginAttempts++;
        
        // Update progress message periodically
        if (loginAttempts % 12 === 0) { // Every minute
          const minutes = Math.floor(loginAttempts / 12);
          this.updateProgress(20 + (loginAttempts / maxAttempts) * 10, 
            `Still waiting for login... (${minutes} min${minutes !== 1 ? 's' : ''})`);
        }
      }

      throw new Error('Login timeout - user did not log in within 10 minutes');
    } catch (error) {
      console.error('❌ Login process failed:', error.message);
      this.updateProgress(0, `Login failed: ${error.message}`);
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

      // Go directly to the correct holdings URL first
      const holdingsUrls = [
        'https://groww.in/stocks/user/holdings',  // Primary holdings page
        'https://groww.in/holdings',
        'https://groww.in/portfolio', 
        'https://groww.in/dashboard'
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
   * Scrape comprehensive portfolio data including holdings, portfolio summary, and additional details
   */
  async scrapeHoldings() {
    try {
      this.updateProgress(60, 'Scraping comprehensive portfolio data...');
      console.log('🔍 Starting comprehensive data extraction...');

      // Wait for initial data to load
      await this.page.waitForTimeout(3000);
      
      // Scroll the page to ensure all content is loaded (lazy loading)
      console.log('📜 Scrolling page to load all content...');
      await this.page.evaluate(async () => {
        // Scroll to bottom to trigger any lazy loading
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Scroll back to top
        window.scrollTo(0, 0);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Scroll through middle sections
        const height = document.body.scrollHeight;
        for (let i = 0; i < 3; i++) {
          window.scrollTo(0, height * (i + 1) / 4);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Final scroll to ensure everything is loaded
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, 2000));
      });

      console.log('✅ Page scroll completed, extracting data...');

      const portfolioData = await this.page.evaluate(() => {
        const data = {
          holdings: [],
          portfolioSummary: {},
          additionalInfo: {},
          metadata: {
            scrapedAt: new Date().toISOString(),
            source: 'Groww',
            pageUrl: window.location.href
          }
        };
        
        // Extract portfolio summary first
        try {
          const summarySelectors = [
            '[class*="portfolio-summary"]',
            '[class*="total-investment"]',
            '[class*="current-value"]',
            '[class*="total-returns"]',
            '[class*="portfolio-value"]',
            '[data-testid*="portfolio"]',
            '[class*="investment-summary"]'
          ];

          summarySelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
              const text = element.textContent || '';
              const numbers = text.match(/[\d,]+\.?\d*/g) || [];
              
              if (text.toLowerCase().includes('invested') || text.toLowerCase().includes('investment')) {
                const amount = numbers.length > 0 ? parseFloat(numbers[0].replace(/,/g, '')) : 0;
                if (amount > 0) data.portfolioSummary.totalInvested = amount;
              }
              
              if (text.toLowerCase().includes('current') || text.toLowerCase().includes('value')) {
                const amount = numbers.length > 0 ? parseFloat(numbers[0].replace(/,/g, '')) : 0;
                if (amount > 0) data.portfolioSummary.currentValue = amount;
              }
              
              if (text.toLowerCase().includes('return') || text.toLowerCase().includes('gain') || text.toLowerCase().includes('profit')) {
                const amount = numbers.length > 0 ? parseFloat(numbers[0].replace(/,/g, '')) : 0;
                if (amount !== 0) data.portfolioSummary.totalReturns = amount;
                
                // Extract percentage if available
                const percentMatch = text.match(/([\+\-]?\d+\.?\d*)%/);
                if (percentMatch) {
                  data.portfolioSummary.totalReturnsPercentage = parseFloat(percentMatch[1]);
                }
              }
            });
          });
        } catch (error) {
          console.log('Error extracting portfolio summary:', error);
        }

        // Enhanced holdings extraction - search multiple sections and structures
        const allPossibleSelectors = [
          // Main holdings table
          'table tbody tr',
          'table tr:not(:first-child)', // All table rows except header
          
          // Alternative table structures
          '[class*="holdings-table"] tr',
          '[class*="portfolio-table"] tr',
          '[class*="equity-table"] tr',
          
          // Card-based layouts
          '[class*="holding"] [class*="row"]',
          '[class*="holding"] [class*="card"]',
          '[class*="stock"] [class*="item"]',
          '[class*="stock"] [class*="card"]',
          '[class*="equity"] [class*="row"]',
          '[class*="equity"] [class*="item"]',
          
          // Data attributes
          '[data-testid*="holding"]',
          '[data-testid*="stock"]',
          '[data-testid*="equity"]',
          '[data-testid*="portfolio"]',
          
          // Portfolio sections
          '[class*="portfolio"] [class*="item"]',
          '[class*="portfolio"] [class*="row"]',
          '[class*="investment"] [class*="item"]',
          
          // Grid layouts
          '[class*="grid"] [class*="item"]',
          '[class*="list"] [class*="item"]'
        ];

        let allFoundElements = [];
        const usedSelectors = [];
        
        // Try each selector and collect all unique elements
        for (const selector of allPossibleSelectors) {
          try {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              const elementArray = Array.from(elements);
              console.log(`Found ${elements.length} elements with selector: ${selector}`);
              
              // Filter out duplicates by checking element content
              const newElements = elementArray.filter(newEl => {
                return !allFoundElements.some(existingEl => 
                  existingEl.textContent === newEl.textContent && 
                  existingEl.innerHTML === newEl.innerHTML
                );
              });
              
              if (newElements.length > 0) {
                allFoundElements = allFoundElements.concat(newElements);
                usedSelectors.push(`${selector}: +${newElements.length} new`);
              }
            }
          } catch (error) {
            console.log(`Error with selector ${selector}:`, error.message);
          }
        }
        
        console.log(`Total unique elements found: ${allFoundElements.length}`);
        console.log(`Successful selectors: ${usedSelectors.join(', ')}`);
        
        // Additional: Look for specific sections that might contain holdings
        const sectionsToCheck = [
          '[class*="holdings"]',
          '[class*="portfolio"]', 
          '[class*="investments"]',
          '[class*="equity"]',
          '[class*="stocks"]',
          'main',
          '[role="main"]'
        ];
        
        sectionsToCheck.forEach(sectionSelector => {
          try {
            const sections = document.querySelectorAll(sectionSelector);
            sections.forEach((section, index) => {
              const sectionRows = section.querySelectorAll('tr, [class*="row"], [class*="item"]');
              if (sectionRows.length > 0) {
                console.log(`Section ${sectionSelector}[${index}] contains ${sectionRows.length} potential holdings`);
                
                // Add any new elements from sections
                const sectionElements = Array.from(sectionRows).filter(newEl => {
                  return !allFoundElements.some(existingEl => 
                    existingEl.textContent === newEl.textContent && 
                    existingEl.innerHTML === newEl.innerHTML
                  );
                });
                
                if (sectionElements.length > 0) {
                  allFoundElements = allFoundElements.concat(sectionElements);
                  console.log(`Added ${sectionElements.length} more elements from ${sectionSelector}`);
                }
              }
            });
          } catch (error) {
            console.log(`Error checking section ${sectionSelector}:`, error.message);
          }
        });

        const foundElements = allFoundElements;

        foundElements.forEach((element, index) => {
          try {
            const text = element.textContent || '';
            
            // DEBUG: Log raw HTML structure for first few elements
            if (index < 5) {
              console.log(`\n🔍 DEBUG Element ${index}:`);
              console.log(`📄 HTML: ${element.outerHTML.substring(0, 300)}...`);
              console.log(`📝 Text Content: "${text.substring(0, 100)}..."`);
              console.log(`🏷️ Tag: ${element.tagName}, Classes: ${element.className}`);
            }
            
            // Skip header rows or non-data elements
            if (text.toLowerCase().includes('stock name') || 
                text.toLowerCase().includes('symbol') ||
                text.toLowerCase().includes('quantity') ||
                text.toLowerCase().includes('holding') ||
                text.toLowerCase().includes('portfolio') ||
                text.length < 10 || // Too short to be meaningful
                text.trim() === '') {
              if (index < 5) {
                console.log(`⏭️ SKIPPED: Header or empty element`);
              }
              return; // Skip this element
            }
            
            // Enhanced stock information extraction
            const stockData = {
              id: `groww-stock-${Date.now()}-${index}`,
              name: '',
              symbol: '',
              isin: '',
              sector: '',
              exchange: '',
              currentPrice: 0,
              avgBuyPrice: 0,
              units: 0,
              totalValue: 0,
              investedValue: 0,
              profitLoss: 0,
              profitLossPercentage: 0,
              dayChange: 0,
              dayChangePercentage: 0,
              marketCap: '',
              pe: 0,
              pb: 0,
              dividendYield: 0,
              high52Week: 0,
              low52Week: 0,
              lastTradeTime: '',
              quantity: 0,
              averagePrice: 0,
              ltp: 0, // Last Traded Price
              scrapedAt: new Date().toISOString(),
              elementSource: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : '')
            };

            // Extract stock name and symbol with multiple strategies
            const nameSelectors = [
              '[class*="name"]', '[class*="company"]', '[data-testid*="name"]',
              '[class*="stock-name"]', '[class*="equity-name"]', '[class*="instrument-name"]',
              'td:first-child', 'div:first-child', '[class*="title"]'
            ];
            
            if (index < 5) {
              console.log(`\n🏷️ EXTRACTING NAME for Element ${index}:`);
            }
            
            for (const selector of nameSelectors) {
              const nameElement = element.querySelector(selector);
              if (nameElement && !stockData.name) {
                const nameText = nameElement.textContent.trim();
                if (index < 5) {
                  console.log(`✅ Found name with selector "${selector}": "${nameText}"`);
                  console.log(`📄 Name element HTML: ${nameElement.outerHTML.substring(0, 200)}`);
                }
                if (nameText && nameText.length > 2 && nameText.length < 100) {
                  stockData.name = nameText;
                  if (index < 5) {
                    console.log(`🎯 SET stockData.name = "${stockData.name}"`);
                  }
                  break;
                }
              }
            }
            
            // If no name found in child elements, try getting from element structure
            if (!stockData.name) {
              const textParts = text.split(/\s+/).filter(part => part.length > 2);
              if (textParts.length > 0) {
                // Look for text that looks like a stock name (not a number)
                for (const part of textParts) {
                  if (!/^\d+/.test(part) && part.length > 2 && part.length < 50) {
                    stockData.name = part;
                    break;
                  }
                }
              }
            }

            const symbolSelectors = [
              '[class*="symbol"]', '[class*="ticker"]', '[class*="code"]',
              '[class*="stock-code"]', '[class*="instrument-code"]',
              'td:nth-child(2)', 'div:nth-child(2)'
            ];
            
            for (const selector of symbolSelectors) {
              const symbolElement = element.querySelector(selector);
              if (symbolElement && !stockData.symbol) {
                const symbolText = symbolElement.textContent.trim();
                if (symbolText && symbolText.length >= 2 && symbolText.length <= 20) {
                  stockData.symbol = symbolText;
                  break;
                }
              }
            }

            // Extract sector information
            const sectorElement = element.querySelector('[class*="sector"], [class*="industry"], [data-testid*="sector"]');
            if (sectorElement) {
              stockData.sector = sectorElement.textContent.trim();
            }

            // Extract exchange information
            const exchangeElement = element.querySelector('[class*="exchange"], [class*="market"], [data-testid*="exchange"]');
            if (exchangeElement) {
              stockData.exchange = exchangeElement.textContent.trim();
            }

            // Enhanced numerical data extraction with table-specific mapping
            // For Groww holdings table, the typical structure is:
            // Company | Qty | Avg Price | Current Price | Invested | Current Value | Day Change | P&L | P&L%
            
            // Try to extract data from table cells first (most accurate)
            const tableCells = element.querySelectorAll('td');
            let isTableRow = tableCells.length >= 4;
            
            if (isTableRow && tableCells.length >= 7) {
              try {
                // Direct table cell extraction with positional mapping
                console.log(`\n📊 PROCESSING TABLE ROW ${index} with ${tableCells.length} cells:`);
                
                // Log all table cell contents for debugging
                for (let i = 0; i < tableCells.length; i++) {
                  const cellText = tableCells[i].textContent.trim();
                  const cellHTML = tableCells[i].outerHTML.substring(0, 150);
                  console.log(`  Cell ${i}: "${cellText}" | HTML: ${cellHTML}...`);
                }
                
                // Standard Groww table structure (0-indexed):
                // 0: Company Name, 1: Quantity, 2: Avg Price, 3: Current Price, 4: Invested, 5: Current Value, 6: Day Change, 7: P&L, 8: P&L%
                
                // Extract quantity from cell 1 (should be integer or small decimal)
                if (tableCells[1]) {
                  const qtyText = tableCells[1].textContent.trim();
                  const qty = parseFloat(qtyText.replace(/[,\s]/g, ''));
                  console.log(`🔢 QUANTITY: Raw="${qtyText}" → Parsed=${qty}`);
                  if (!isNaN(qty) && qty > 0) {
                    stockData.units = qty;
                    stockData.quantity = qty;
                    console.log(`✅ SET stockData.units = ${qty}`);
                  }
                }
                
                // Extract average price from cell 2
                if (tableCells[2]) {
                  const avgPriceText = tableCells[2].textContent.trim();
                  const avgPrice = parseFloat(avgPriceText.replace(/[₹,\s]/g, ''));
                  console.log(`💰 AVG PRICE: Raw="${avgPriceText}" → Parsed=${avgPrice}`);
                  if (!isNaN(avgPrice) && avgPrice > 0) {
                    stockData.avgBuyPrice = avgPrice;
                    stockData.averagePrice = avgPrice;
                    console.log(`✅ SET stockData.avgBuyPrice = ${avgPrice}`);
                  }
                }
                
                // Extract current price from cell 3
                if (tableCells[3]) {
                  const currentPriceText = tableCells[3].textContent.trim();
                  const currentPrice = parseFloat(currentPriceText.replace(/[₹,\s]/g, ''));
                  console.log(`📈 CURRENT PRICE: Raw="${currentPriceText}" → Parsed=${currentPrice}`);
                  if (!isNaN(currentPrice) && currentPrice > 0) {
                    stockData.currentPrice = currentPrice;
                    stockData.ltp = currentPrice;
                    console.log(`✅ SET stockData.currentPrice = ${currentPrice}`);
                  }
                }
                
                // Extract invested value from cell 4
                if (tableCells[4]) {
                  const investedText = tableCells[4].textContent.trim();
                  const invested = parseFloat(investedText.replace(/[₹,\s]/g, ''));
                  console.log(`💵 INVESTED: Raw="${investedText}" → Parsed=${invested}`);
                  if (!isNaN(invested) && invested > 0) {
                    stockData.investedValue = invested;
                    console.log(`✅ SET stockData.investedValue = ${invested}`);
                  }
                }
                
                // Extract current value from cell 5
                if (tableCells[5]) {
                  const currentValueText = tableCells[5].textContent.trim();
                  const currentValue = parseFloat(currentValueText.replace(/[₹,\s]/g, ''));
                  console.log(`💎 CURRENT VALUE: Raw="${currentValueText}" → Parsed=${currentValue}`);
                  if (!isNaN(currentValue) && currentValue > 0) {
                    stockData.totalValue = currentValue;
                    console.log(`✅ SET stockData.totalValue = ${currentValue}`);
                  }
                }
                
                // Extract P&L from cell 7 (if available)
                if (tableCells[7]) {
                  const plText = tableCells[7].textContent.trim();
                  const pl = parseFloat(plText.replace(/[₹,\s\+]/g, ''));
                  console.log(`📊 P&L: Raw="${plText}" → Parsed=${pl}`);
                  if (!isNaN(pl)) {
                    stockData.profitLoss = pl;
                    console.log(`✅ SET stockData.profitLoss = ${pl}`);
                  }
                }
                
                // Fallback calculation for invested value if not found
                if (!stockData.investedValue && stockData.units > 0 && stockData.avgBuyPrice > 0) {
                  stockData.investedValue = stockData.units * stockData.avgBuyPrice;
                  console.log(`📊 Calculated Invested Value: ${stockData.investedValue}`);
                }
                
                // Fallback calculation for P&L if not found
                if (!stockData.profitLoss && stockData.totalValue > 0 && stockData.investedValue > 0) {
                  stockData.profitLoss = stockData.totalValue - stockData.investedValue;
                  console.log(`📊 Calculated P&L: ${stockData.profitLoss}`);
                }
                
                console.log(`📈 Final mapped data: Qty=${stockData.units}, AvgPrice=${stockData.avgBuyPrice}, CurrentPrice=${stockData.currentPrice}, Invested=${stockData.investedValue}, Current=${stockData.totalValue}, P&L=${stockData.profitLoss}`);
                
              } catch (error) {
                console.log('Error in table cell extraction:', error);
              }
            }
            
            // Fallback: Enhanced text-based extraction for Groww format
            if (!stockData.units || !stockData.totalValue || !stockData.avgBuyPrice) {
              console.log('📊 Enhanced text-based extraction for Groww format');
              
              // Groww text format: "CompanyName[number] sharesAvg. ₹[price]₹[currentPrice][change] ([changePercent])+₹[profit][profitPercent]%₹[currentValue]₹[investedValue]"
              // Example: "Nuvama Wealth19 sharesAvg. ₹5,168.90₹6,930.0077.00 (1.12%)+₹33,460.9034.07%₹1,31,670.00₹98,209.10"
              
              console.log(`🔍 Raw text for parsing: "${text}"`);
              
              // Extract shares/units
              const sharesMatch = text.match(/(\d+(?:\.\d+)?)\s*shares/i);
              if (sharesMatch) {
                const shares = parseFloat(sharesMatch[1]);
                stockData.units = shares;
                stockData.quantity = shares;
                console.log(`📊 Extracted shares: ${shares}`);
              }
              
              // Extract average price (after "Avg. ₹")
              const avgPriceMatch = text.match(/Avg\.\s*₹\s*([\d,]+(?:\.\d{2})?)/i);
              if (avgPriceMatch) {
                const avgPrice = parseFloat(avgPriceMatch[1].replace(/,/g, ''));
                stockData.avgBuyPrice = avgPrice;
                stockData.averagePrice = avgPrice;
                console.log(`📊 Extracted avg price: ₹${avgPrice}`);
              }
              
              // Extract current price (after avgPrice and before day change)
              const pricePattern = /₹([\d,]+(?:\.\d{2})?)/g;
              const allPrices = [...text.matchAll(pricePattern)].map(match => 
                parseFloat(match[1].replace(/,/g, ''))
              );
              
              if (allPrices.length >= 2) {
                // Second price is usually current price
                stockData.currentPrice = allPrices[1];
                stockData.ltp = allPrices[1];
                console.log(`📊 Extracted current price: ₹${allPrices[1]}`);
              }
              
              // Extract profit/loss (look for +₹ or -₹ followed by number)
              const profitMatch = text.match(/([+\-])₹\s*([\d,]+(?:\.\d{2})?)/);
              if (profitMatch) {
                const sign = profitMatch[1] === '+' ? 1 : -1;
                const profitAmount = parseFloat(profitMatch[2].replace(/,/g, ''));
                stockData.profitLoss = sign * profitAmount;
                console.log(`📊 Extracted P&L: ${sign > 0 ? '+' : '-'}₹${profitAmount}`);
              }
              
              // Extract profit percentage
              const profitPercentMatch = text.match(/([+\-]?[\d,]+(?:\.\d{2})?)\s*%/);
              if (profitPercentMatch) {
                stockData.profitLossPercentage = parseFloat(profitPercentMatch[1]);
                console.log(`📊 Extracted P&L%: ${stockData.profitLossPercentage}%`);
              }
              
              // Extract current value and invested value (last two ₹ amounts)
              if (allPrices.length >= 4) {
                stockData.totalValue = allPrices[allPrices.length - 2]; // Second to last
                stockData.investedValue = allPrices[allPrices.length - 1]; // Last
                console.log(`📊 Extracted current value: ₹${stockData.totalValue}`);
                console.log(`📊 Extracted invested value: ₹${stockData.investedValue}`);
              }
              
              // Calculate invested value if missing but have units and avg price
              if (!stockData.investedValue && stockData.units > 0 && stockData.avgBuyPrice > 0) {
                stockData.investedValue = stockData.units * stockData.avgBuyPrice;
                console.log(`📊 Calculated invested value: ₹${stockData.investedValue}`);
              }
              
              // Calculate P&L if missing
              if (!stockData.profitLoss && stockData.totalValue > 0 && stockData.investedValue > 0) {
                stockData.profitLoss = stockData.totalValue - stockData.investedValue;
                console.log(`📊 Calculated P&L: ₹${stockData.profitLoss}`);
              }
              
              // Calculate P&L percentage if missing
              if (!stockData.profitLossPercentage && stockData.profitLoss !== 0 && stockData.investedValue > 0) {
                stockData.profitLossPercentage = (stockData.profitLoss / stockData.investedValue) * 100;
                console.log(`📊 Calculated P&L%: ${stockData.profitLossPercentage.toFixed(2)}%`);
              }
              
              console.log(`🎯 FINAL PARSED DATA: Units=${stockData.units}, AvgPrice=₹${stockData.avgBuyPrice}, CurrentPrice=₹${stockData.currentPrice}, Invested=₹${stockData.investedValue}, Current=₹${stockData.totalValue}, P&L=₹${stockData.profitLoss}`);
            }

            // Extract percentage values for P&L and day change
            const percentagePattern = /([\+\-]?\d+\.?\d*)%/g;
            const percentages = [...text.matchAll(percentagePattern)].map(match => parseFloat(match[1]));

            // Calculate P&L percentage
            if (stockData.totalValue > 0 && stockData.investedValue > 0) {
              stockData.profitLossPercentage = ((stockData.totalValue - stockData.investedValue) / stockData.investedValue) * 100;
            }

            // Map percentage values to day change (usually the percentage we find in text)
            if (percentages.length >= 1) {
              stockData.dayChangePercentage = percentages[0];
            }

            // Extract additional metadata from text
            if (text.toLowerCase().includes('nse')) stockData.exchange = 'NSE';
            if (text.toLowerCase().includes('bse')) stockData.exchange = 'BSE';
            
            // Extract market cap if mentioned
            const marketCapMatch = text.match(/(?:market cap|mcap):?\s*([\d,]+\.?\d*)\s*(?:cr|crore|l|lakh)?/i);
            if (marketCapMatch) {
              stockData.marketCap = marketCapMatch[1];
            }

            // Extract ISIN if available
            const isinMatch = text.match(/([A-Z]{2}[A-Z0-9]{10})/);
            if (isinMatch) {
              stockData.isin = isinMatch[1];
            }

            // Enhanced validation - only add if we have meaningful data
            const hasValidName = stockData.name && stockData.name.length > 2;
            const hasValidNumbers = stockData.totalValue > 0 || stockData.currentPrice > 0 || stockData.units > 0;
            const isNotHeaderRow = !text.toLowerCase().includes('total') || stockData.totalValue > 0;
            
            if ((hasValidName || stockData.symbol) && hasValidNumbers && isNotHeaderRow) {
              console.log(`\n✅ VALID HOLDING FOUND #${data.holdings.length + 1}:`);
              console.log(`📛 Name: "${stockData.name || stockData.symbol}"`);
              console.log(`🔢 Units: ${stockData.units}`);
              console.log(`💰 Avg Price: ₹${stockData.avgBuyPrice}`);
              console.log(`💵 Invested: ₹${stockData.investedValue}`);
              console.log(`💎 Current Value: ₹${stockData.totalValue}`);
              console.log(`📊 P&L: ₹${stockData.profitLoss}`);
              console.log(`📈 Current Price: ₹${stockData.currentPrice}`);
              console.log(`🎯 ADDING TO HOLDINGS ARRAY`);
              data.holdings.push(stockData);
            } else {
              if (index < 10) {
                console.log(`⚠️ SKIPPED Element ${index}: name="${stockData.name}", symbol="${stockData.symbol}", value=${stockData.totalValue}, hasValidName=${hasValidName}, hasValidNumbers=${hasValidNumbers}, text="${text.substring(0, 50)}..."`);
              }
            }
          } catch (error) {
            console.log('Error processing holding element:', error);
          }
        });

        // Extract additional portfolio information
        try {
          // Portfolio composition
          const sectorElements = document.querySelectorAll('[class*="sector"], [class*="allocation"]');
          const sectors = [];
          sectorElements.forEach(element => {
            const text = element.textContent.trim();
            if (text && text.length > 0 && text.length < 50) {
              sectors.push(text);
            }
          });
          if (sectors.length > 0) {
            data.additionalInfo.sectors = [...new Set(sectors)];
          }

          // Performance metrics
          const performanceElements = document.querySelectorAll('[class*="performance"], [class*="return"], [class*="gain"]');
          const performance = [];
          performanceElements.forEach(element => {
            const text = element.textContent.trim();
            if (text.includes('%') || text.includes('return')) {
              performance.push(text);
            }
          });
          if (performance.length > 0) {
            data.additionalInfo.performanceMetrics = performance;
          }

          // Account information
          const accountElements = document.querySelectorAll('[class*="account"], [class*="user"], [class*="profile"]');
          accountElements.forEach(element => {
            const text = element.textContent.trim();
            if (text && text.length > 0 && text.length < 100) {
              data.additionalInfo.accountInfo = text;
            }
          });

        } catch (error) {
          console.log('Error extracting additional info:', error);
        }

        return data;
      });

      this.updateProgress(80, `Extracted ${portfolioData.holdings.length} holdings with comprehensive data`);
      console.log(`✅ Extracted ${portfolioData.holdings.length} holdings with enhanced details`);
      console.log(`📊 Portfolio Summary:`, portfolioData.portfolioSummary);
      console.log(`ℹ️ Additional Info:`, portfolioData.additionalInfo);
      
      // DEBUG: Show final data structure being returned
      console.log(`\n🎯 FINAL DATA STRUCTURE BEING SENT TO FRONTEND:`);
      console.log(`📦 Total Holdings: ${portfolioData.holdings.length}`);
      portfolioData.holdings.forEach((holding, index) => {
        console.log(`\n  📊 Holding ${index + 1}:`);
        console.log(`    🏢 name: "${holding.name}"`);
        console.log(`    🔤 symbol: "${holding.symbol}"`);
        console.log(`    🔢 units: ${holding.units}`);
        console.log(`    💰 avgBuyPrice: ${holding.avgBuyPrice}`);
        console.log(`    💵 investedValue: ${holding.investedValue}`);
        console.log(`    💎 totalValue: ${holding.totalValue}`);
        console.log(`    📊 profitLoss: ${holding.profitLoss}`);
        console.log(`    📈 currentPrice: ${holding.currentPrice}`);
        console.log(`    📱 dayChangePercentage: ${holding.dayChangePercentage}`);
      });

      return portfolioData;
    } catch (error) {
      console.error('❌ Failed to scrape comprehensive data:', error.message);
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
   * Complete automated scraping process with interactive login
   */
  async performAutomatedScraping(progressCallback = null) {
    try {
      if (progressCallback) {
        this.setProgressCallback(progressCallback);
      }

      console.log('🚀 Starting automated Groww scraping...');
      this.updateProgress(0, 'Starting automated scraping...');

      // Initialize browser in NON-HEADLESS mode for user login
      await this.initializeInteractiveBrowser();

      // Open Groww login page and wait for user login
      await this.waitForUserLogin();

      // Once logged in, navigate to holdings
      await this.navigateToHoldings();

      // Scrape comprehensive portfolio data
      const portfolioData = await this.scrapeHoldings();

      // Close browser
      await this.close();

      console.log('🎉 Automated scraping completed successfully');
      console.log(`📊 Raw data scraped: ${portfolioData.holdings.length} holdings`);
      
      return {
        success: true,
        data: {
          holdings: portfolioData.holdings,
          portfolioSummary: portfolioData.portfolioSummary,
          additionalInfo: portfolioData.additionalInfo,
          metadata: portfolioData.metadata,
          totalHoldings: portfolioData.holdings.length,
          scrapedAt: new Date().toISOString()
        },
        message: `Successfully scraped ${portfolioData.holdings.length} holdings with comprehensive data from Groww`
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
