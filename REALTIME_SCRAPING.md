# Real-Time Scraping Setup Guide

This guide explains how to enable real-time portfolio scraping from Groww instead of using mock data.

## Current Status
- ✅ **Mock Mode**: Currently active (demo data)
- ⚠️ **Real Mode**: Requires Puppeteer installation

## Prerequisites

1. **Node.js** version 18 or higher
2. **Chrome/Chromium** browser installed
3. **Stable internet connection**
4. **Valid Groww account credentials**

## Installation Steps

### Step 1: Install Puppeteer Dependencies
```bash
cd backend
npm run install-scraping
```

If the above fails due to certificate issues, try:
```bash
set PUPPETEER_SKIP_DOWNLOAD=true
npm install puppeteer@21.3.6 puppeteer-extra@3.3.6 puppeteer-extra-plugin-stealth@2.11.2
```

### Step 2: Configure Environment
Edit `backend/.env` file:
```env
SCRAPING_MODE=real
BROWSER_HEADLESS=false
```

### Step 3: Restart the Server
```bash
npm run dev
```

## Configuration Options

### Environment Variables (.env)

| Variable | Values | Description |
|----------|--------|-------------|
| `SCRAPING_MODE` | `mock` \| `real` | Scraping mode |
| `BROWSER_HEADLESS` | `true` \| `false` | Browser visibility |
| `PUPPETEER_SKIP_DOWNLOAD` | `true` \| `false` | Skip Chrome download |

### Scraping Modes

#### Mock Mode (Default)
- ✅ No external dependencies
- ✅ Fast and reliable
- ✅ Demo credentials available
- ❌ No real portfolio data

#### Real Mode
- ✅ Actual portfolio data
- ✅ Real-time prices
- ❌ Requires Puppeteer setup
- ❌ Slower execution
- ❌ Requires valid Groww credentials

## Demo Credentials (Mock Mode Only)

For testing the application flow:

| Email | Password | PIN |
|-------|----------|-----|
| demo@groww.com | demo123 | 1234 |
| test@example.com | test123 | 5678 |
| user@demo.com | user123 | 9999 |

## Troubleshooting

### Issue: Puppeteer Installation Fails
**Solution**: 
```bash
set PUPPETEER_SKIP_DOWNLOAD=true
npm install puppeteer --no-save
```

### Issue: "Account not found" Error
**Solution**: 
1. Check credentials are correct
2. Verify account exists on Groww
3. Try with demo credentials first

### Issue: Browser Won't Start
**Solution**: 
1. Install Chrome/Chromium
2. Set `BROWSER_HEADLESS=false` for debugging
3. Check Windows Defender/antivirus settings

### Issue: Scraping Fails
**Solution**: 
1. Check internet connection
2. Verify Groww website is accessible
3. Try with `SCRAPING_MODE=mock` first

## Security Notes

- Credentials are never stored permanently
- Browser session is cleaned up after each scraping
- Use environment variables for sensitive configuration
- Consider using app-specific passwords if available

## Performance Notes

- Real scraping takes 30-60 seconds
- Mock mode is instant
- Browser automation requires more memory
- Consider running in headless mode for production

## Support

If you encounter issues:
1. Check the server logs for detailed error messages
2. Verify all prerequisites are met
3. Try mock mode first to ensure basic functionality
4. Check network connectivity and Groww website availability
