# Backend API Documentation

## Overview
Sophisticated Node.js/Express backend with MVC architecture for the Investing Portfolio application. Features JSON-based local storage, comprehensive CRUD operations, and robust data validation.

## Architecture

```
backend/
├── controllers/          # Business logic controllers
│   ├── accountController.js
│   ├── portfolioController.js
│   └── stockController.js
├── models/              # Data models with validation
│   ├── Account.js
│   ├── Portfolio.js
│   ├── PortfolioAccount.js
│   └── Stock.js
├── routes/              # API route definitions
│   ├── accountRoutes.js
│   ├── portfolioRoutes.js
│   ├── stockRoutes.js
│   └── index.js
├── services/            # Utility services
│   └── fileService.js   # JSON file operations
├── data/               # JSON data storage
│   ├── accounts.json
│   ├── stocks.json
│   ├── portfolios.json
│   ├── portfolio_accounts.json
│   └── seed-*.json     # Sample data
├── server.js           # Main Express server
└── seedDatabase.js     # Database seeding script
```

## API Endpoints

### Health Check
- **GET** `/health` - API health status

### Accounts
- **GET** `/api/accounts` - Get all accounts
- **GET** `/api/accounts/:id` - Get account by ID
- **POST** `/api/accounts` - Create new account
- **PUT** `/api/accounts/:id` - Update account
- **DELETE** `/api/accounts/:id` - Delete account
- **GET** `/api/accounts/:id/summary` - Get account with stocks summary

### Stocks
- **GET** `/api/stocks` - Get all stocks
- **GET** `/api/stocks/:id` - Get stock by ID
- **GET** `/api/stocks/account/:accountId` - Get stocks by account
- **GET** `/api/stocks/symbols` - Get stocks grouped by symbol
- **POST** `/api/stocks` - Create new stock
- **PUT** `/api/stocks/:id` - Update stock
- **DELETE** `/api/stocks/:id` - Delete stock
- **PATCH** `/api/stocks/:id/price` - Update stock price

### Portfolios
- **GET** `/api/portfolios` - Get all portfolios
- **GET** `/api/portfolios/:id` - Get portfolio by ID
- **POST** `/api/portfolios` - Create new portfolio
- **PUT** `/api/portfolios/:id` - Update portfolio
- **DELETE** `/api/portfolios/:id` - Delete portfolio
- **GET** `/api/portfolios/:id/summary` - Get portfolio with accounts/stocks
- **POST** `/api/portfolios/:id/accounts` - Add account to portfolio
- **DELETE** `/api/portfolios/:id/accounts/:accountId` - Remove account from portfolio

## Data Models

### Account
```json
{
  "id": "string (auto-generated)",
  "name": "string (required)",
  "type": "savings|checking|investment|retirement",
  "provider": "string (optional)",
  "accountNumber": "string (optional)",
  "balance": "number (required, >= 0)",
  "currency": "string (default: USD)",
  "description": "string (optional)",
  "isActive": "boolean (default: true)",
  "createdAt": "ISO date string",
  "updatedAt": "ISO date string"
}
```

### Stock
```json
{
  "id": "string (auto-generated)",
  "accountId": "string (required)",
  "symbol": "string (required)",
  "name": "string (required)",
  "quantity": "number (required, > 0)",
  "purchasePrice": "number (required, > 0)",
  "currentPrice": "number (required, >= 0)",
  "purchaseDate": "ISO date string (required)",
  "sector": "string (optional)",
  "exchange": "string (optional)",
  "currentValue": "number (calculated)",
  "initialValue": "number (calculated)", 
  "gainLoss": {
    "absolute": "number (calculated)",
    "percentage": "number (calculated)"
  },
  "createdAt": "ISO date string",
  "updatedAt": "ISO date string"
}
```

### Portfolio
```json
{
  "id": "string (auto-generated)",
  "name": "string (required)",
  "description": "string (optional)",
  "riskLevel": "conservative|moderate|moderate-aggressive|aggressive",
  "targetReturn": "number (default: 0)",
  "isActive": "boolean (default: true)",
  "createdAt": "ISO date string",
  "updatedAt": "ISO date string"
}
```

## Features

### Data Validation
- Comprehensive model validation with custom error messages
- Business rule enforcement (e.g., positive quantities, valid dates)
- Referential integrity checks

### Calculated Fields
- Automatic calculation of stock values and gains/losses
- Portfolio summaries with aggregated metrics
- Real-time percentage calculations

### Error Handling
- Structured error responses with success flags
- Validation error details
- HTTP status codes

### File Service
- Safe JSON file operations with error handling
- CRUD operations: create, read, update, delete
- Search operations: findById, findBy
- Atomic writes to prevent corruption

## Scripts

```bash
npm run dev        # Start development server with nodemon
npm run start      # Start production server
npm run seed       # Populate database with sample data
```

## Sample Data
The backend includes comprehensive seed data:
- **3 accounts**: Brokerage, retirement, and savings accounts
- **5 stocks**: Mix of individual stocks (AAPL, GOOGL, MSFT) and ETFs (SPY, VTI)
- **2 portfolios**: Growth and retirement strategies
- **Portfolio associations**: Realistic account-portfolio relationships

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": {...},
  "count": 5,
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Validation error 1", "Validation error 2"]
}
```

## Getting Started

1. **Install dependencies:**
   ```bash
   cd backend && npm install
   ```

2. **Seed the database:**
   ```bash
   npm run seed
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

4. **Test the API:**
   ```bash
   curl http://localhost:5001/health
   curl http://localhost:5001/api/accounts
   ```

## Next Steps
- Authentication and authorization
- Real-time stock price updates
- Database migration from JSON to PostgreSQL
- Advanced portfolio analytics
- Automated testing suite
