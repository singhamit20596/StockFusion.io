/**
 * Simple test script to verify browser automation works
 */

async function testBrowser() {
  try {
    console.log('🚀 Testing browser automation...');
    
    // Import puppeteer
    const puppeteer = require('puppeteer');
    
    // Launch browser (non-headless)
    console.log('📖 Launching browser...');
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1366,768'
      ]
    });

    console.log('✅ Browser launched successfully');
    
    // Create new page
    const page = await browser.newPage();
    console.log('📄 Page created');
    
    // Navigate to Groww
    console.log('🔗 Navigating to Groww...');
    await page.goto('https://groww.in/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    console.log('✅ Successfully navigated to Groww');
    console.log('🌐 Current URL:', page.url());
    
    // Get page title
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Wait for user to manually log in (or close browser)
    console.log('⏳ Waiting 30 seconds for you to interact with the browser...');
    console.log('👆 You should see a Chrome window with Groww login page');
    
    await page.waitForTimeout(30000);
    
    console.log('🧹 Closing browser...');
    await browser.close();
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testBrowser();
