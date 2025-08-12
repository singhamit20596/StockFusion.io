# Investment Portfolio Full-Stack Application

A sophisticated full-stack investment portfolio application with MVC architecture, comprehensive CRUD operations, and JSON-based local storage.

> 📖 **For detailed Docker setup and troubleshooting, see [DOCKER.md](./DOCKER.md)**

## 🚀 Features

- **Frontend**: React with TypeScript, Material UI, Chart.js
- **Backend**: Node.js/Express with MVC architecture, JSON storage
- **CSV Import/Export**: Bulk data operations with templates and validation 📊
- **Automated Groww Portfolio Syncing** 🎯
  - Real-time data scraping from Groww platform
  - Mock mode for development without browser dependencies
  - Comprehensive stock data including profit/loss tracking
  - Secure credential handling with no data storage
- **Data Models**: Account, Stock, Portfolio with validation
- **API**: RESTful endpoints with error handling
- **Docker**: Full containerization for development and production
- **Sample Data**: Comprehensive seed data for testing

## 📁 Project Structure

```
/
├── backend/
│   ├── controllers/           # Business logic controllers
│   │   ├── accountController.js
│   │   ├── portfolioController.js
│   │   └── stockController.js
│   ├── models/               # Data models with validation  
│   │   ├── Account.js
│   │   ├── Portfolio.js
│   │   ├── PortfolioAccount.js
│   │   └── Stock.js
│   ├── routes/               # API route definitions
│   │   ├── accountRoutes.js
│   │   ├── portfolioRoutes.js
│   │   ├── stockRoutes.js
│   │   └── index.js
│   ├── services/             # Utility services
│   │   └── fileService.js    # JSON file operations
│   ├── data/                 # JSON data storage
│   │   ├── *.json           # Live data files
│   │   └── seed-*.json      # Sample data
│   ├── server.js             # Main Express server
│   ├── seedDatabase.js       # Database seeding script
│   └── README.md             # Backend documentation
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Main React component
│   │   └── components/
│   │       └── PortfolioChart.tsx
│   ├── package.json          # Frontend dependencies
│   └── Dockerfile           # Frontend containerization
├── docker-compose.yml        # Development setup
├── docker-compose.prod.yml   # Production setup
└── README.md                # This file
```

## Dependencies

### Backend
- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **body-parser**: Parse HTTP request bodies
- **dotenv**: Environment variable management
- **nodemon**: Development server with auto-restart

### Frontend
- **@mui/material**: Material UI components
- **@emotion/react**: CSS-in-JS library
- **@emotion/styled**: Styled components
- **@mui/icons-material**: Material UI icons
- **axios**: HTTP client
- **chart.js**: Chart library
- **react-chartjs-2**: React wrapper for Chart.js

## 🚀 Quick Start

### Option 1: Development with Sample Data

1. **Install backend dependencies and seed data**:
   ```bash
   cd backend
   npm install
   npm run seed
   npm run dev
   ```

2. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Access the application**:
   - Frontend: http://localhost:3002
   - Backend API: http://localhost:5001
   - API Health: http://localhost:5001/health

### Option 2: Full Docker Development

1. **Start all services**:
   ```bash
   docker-compose up --build
   ```

2. **Access the application**:
   - Frontend: http://localhost:3002
   - Backend API: http://localhost:5001
   - JSON Data: Persisted in Docker volume `investing_data`

### Option 3: Production Deployment

1. **Build and start production services**:
   ```bash
   docker-compose -f docker-compose.prod.yml up --build
   ```

2. **Access the application**:
   - Frontend: http://localhost (port 80)
   - Backend API: http://localhost:5001
   - JSON Data: Persisted in Docker volume `investing_data`

## 📊 Sample Data

The backend includes comprehensive seed data:
- **3 accounts**: Interactive Brokers, Fidelity 401k, Chase Savings
- **5 stocks**: AAPL, GOOGL, MSFT, SPY, VTI with realistic prices
- **2 portfolios**: Growth and retirement strategies
- **Account associations**: Realistic portfolio-account relationships

**Load sample data**: `npm run seed` (from backend directory)

## 🐳 Docker Configuration

### Container Architecture
- **Backend**: Node.js Express server with JSON file storage
- **Frontend**: React development server (dev) / Nginx (production)
- **Data Persistence**: Named Docker volume for JSON files

### Development Environment
```bash
# Start all services in development mode
docker-compose up --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Services running:**
- Frontend: http://localhost:3002 (React dev server with hot reload)
- Backend: http://localhost:5001 (Nodemon with auto-restart)
- Data Volume: `investing_data` (persists JSON files)

### Production Environment
```bash
# Start all services in production mode
docker-compose -f docker-compose.prod.yml up --build

# Run in background
docker-compose -f docker-compose.prod.yml up -d --build

# Stop production services
docker-compose -f docker-compose.prod.yml down
```

**Production features:**
- Frontend: http://localhost (Nginx with optimized React build)
- Backend: http://localhost:5001 (Node.js production mode)
- Security: Non-root user, production dependencies only
- Persistence: Same data volume as development

### Data Management
```bash
# List all volumes
docker volume ls

# Inspect data volume
docker volume inspect investing_investing_data

# Backup data volume
docker run --rm -v investing_investing_data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz -C /data .

# Restore data volume
docker run --rm -v investing_investing_data:/data -v $(pwd):/backup alpine tar xzf /backup/data-backup.tar.gz -C /data

# Reset all data (removes volume)
docker-compose down -v
```

## 🎯 API Endpoints

### Health & Status
- `GET /health` - API health check

### Accounts
- `GET /api/accounts` - Get all accounts
- `GET /api/accounts/:id` - Get account by ID  
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account
- `GET /api/accounts/:id/summary` - Account with stocks summary

### Groww Integration 🔥
- `POST /api/accounts/:id/sync` - Sync account with Groww holdings
- `GET /api/accounts/:id/sync/status` - Get sync status and last update
- `DELETE /api/accounts/:id/sync` - Clear synced data

### Stocks
- `GET /api/stocks` - Get all stocks
- `GET /api/stocks/:id` - Get stock by ID
- `GET /api/stocks/account/:accountId` - Get stocks by account
- `GET /api/stocks/symbols` - Get stocks grouped by symbol
- `POST /api/stocks` - Create new stock
- `PUT /api/stocks/:id` - Update stock
- `DELETE /api/stocks/:id` - Delete stock
- `PATCH /api/stocks/:id/price` - Update stock price

### Portfolios
- `GET /api/portfolios` - Get all portfolios
- `GET /api/portfolios/:id` - Get portfolio by ID
- `POST /api/portfolios` - Create new portfolio
- `PUT /api/portfolios/:id` - Update portfolio
- `DELETE /api/portfolios/:id` - Delete portfolio
- `GET /api/portfolios/:id/summary` - Portfolio with accounts/stocks
- `POST /api/portfolios/:id/accounts` - Add account to portfolio
- `DELETE /api/portfolios/:id/accounts/:accountId` - Remove account

### CSV Import/Export 📊
- `GET /api/csv/export/accounts` - Download accounts CSV
- `GET /api/csv/export/stocks` - Download stocks CSV
- `GET /api/csv/export/portfolios` - Download portfolios CSV
- `GET /api/csv/export/all` - Export all data (JSON response)
- `POST /api/csv/import/accounts` - Upload accounts CSV
- `POST /api/csv/import/stocks` - Upload stocks CSV
- `GET /api/csv/template/accounts` - Download accounts template
- `GET /api/csv/template/stocks` - Download stocks template

> 📋 **For detailed CSV usage instructions, see [CSV_GUIDE.md](./CSV_GUIDE.md)**

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=investing_db
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your_jwt_secret
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_VERSION=1.0.0
```

## 🔧 Development Commands

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Populate database with sample data
- `npm run install-scraping` - Install Puppeteer for Groww scraping

### Frontend
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

### Docker
- `docker-compose up --build` - Start development environment 
- `docker-compose -f docker-compose.prod.yml up --build` - Start production
- `docker-compose down` - Stop all services
- `docker volume ls` - List persistent data volumes
- `docker volume rm investing_investing_data` - Reset JSON data

## 🏗️ Architecture Features

1. **MVC Backend Architecture**:
   - Controllers for business logic
   - Models with validation
   - Services for data operations
   - Routes for API endpoints

2. **Data Validation**:
   - Input validation with custom error messages
   - Business rule enforcement
   - Referential integrity checks

3. **Calculated Fields**:
   - Automatic stock value calculations
   - Gain/loss percentages
   - Portfolio aggregated metrics

4. **Error Handling**:
   - Structured error responses
   - HTTP status codes
   - Validation error details

5. **JSON Storage Layer**:
   - Safe file operations
   - CRUD operations
   - Search and filter capabilities

## 🧪 Testing the API

```bash
# Health check
curl http://localhost:5001/health

# Get all accounts
curl http://localhost:5001/api/accounts

# Sync with Groww (mock mode)
curl -X POST http://localhost:5001/api/accounts/acc-001/sync \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test","pin":"1234"}'

# Check sync status
curl http://localhost:5001/api/accounts/acc-001/sync/status

# Get portfolio summary
curl http://localhost:5001/api/portfolios/port-001/summary

# Create new account
curl -X POST http://localhost:5001/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Account","type":"investment","balance":5000}'
```

## 📋 Additional Documentation

- **[Groww Scraping Guide](./SCRAPING.md)** - Comprehensive documentation for the Groww integration
- **[Backend README](./backend/README.md)** - Backend-specific documentation
- **[Frontend README](./frontend/README.md)** - Frontend-specific documentation

## Next Steps

1. **Database Integration**: Add PostgreSQL integration with an ORM like Prisma or Sequelize
2. **Authentication**: Implement JWT-based authentication
3. **Real-time Updates**: Add WebSocket support for live portfolio updates
4. **Multi-Broker Support**: Extend scraping to Zerodha, Angel One, etc.
5. **Testing**: Add unit and integration tests
6. **CI/CD**: Set up GitHub Actions for automated deployment
7. **Monitoring**: Add logging and monitoring solutions

## Technologies Used

- **Frontend**: React, TypeScript, Material UI, Chart.js
- **Backend**: Node.js, Express, CORS
- **Scraping**: Puppeteer, Puppeteer-extra, Stealth plugin
- **Database**: JSON storage (PostgreSQL ready)
- **Containerization**: Docker, Docker Compose
- **Development**: Nodemon, Create React App
- **Production**: Nginx, Multi-stage builds
