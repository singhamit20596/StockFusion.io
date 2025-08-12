# CSV Import/Export Documentation

This document describes the CSV import/export functionality for the Investment Portfolio Management application.

## Overview

The CSV import/export feature allows you to:
- Export your portfolio data (accounts, stocks, portfolios) to CSV files for backup or analysis
- Import data from CSV files for bulk updates or data migration
- Download CSV templates to understand the expected format for imports

## Features

### Export Operations
- **Export All Data**: Download all accounts, stocks, and portfolios in separate CSV files
- **Export Accounts**: Download only account data
- **Export Stocks**: Download only stock holdings data  
- **Export Portfolios**: Download only portfolio data

### Import Operations
- **Import Accounts**: Upload a CSV file to create or update account records
- **Import Stocks**: Upload a CSV file to create or update stock holdings

### Templates
- Download CSV templates for accounts and stocks to see the expected data format

## Accessing CSV Operations

1. Start the application (both backend and frontend servers must be running)
2. Open the web interface at http://localhost:3000
3. Navigate to "CSV Import/Export" from the sidebar menu

## Export Process

### Single Export
1. Click on any "Export" button (Accounts, Stocks, or Portfolios)
2. The CSV file will be automatically downloaded to your default downloads folder
3. Files are named with descriptive names like `accounts_export.csv`

### Bulk Export  
1. Click "Export All Data" to download all data types at once
2. This creates separate CSV files for each data type

## Import Process

### Step 1: Download Template (Recommended)
1. Click on the template download link for the data type you want to import
2. This gives you the correct column headers and format

### Step 2: Prepare Your CSV File
- Use the template as a starting point
- Ensure all required columns are present
- Follow the data format examples in the template
- Save as a CSV file (UTF-8 encoding recommended)

### Step 3: Upload and Import
1. Select the import type (Accounts or Stocks)
2. Click "Select CSV File" and choose your prepared file
3. Click "Import" to process the file
4. Review the import results and any error messages

## Data Formats

### Accounts CSV Format
```csv
ID,Name,Type,Balance,Currency,Description,Active,Created At,Updated At,Total Investment,Total P&L,Last Synced,Source
acc-001,Main Brokerage,brokerage,75829.65,USD,Primary trading account,true,2024-01-15T08:00:00.000Z,2025-08-10T14:26:50.692Z,74790,1039.65,2025-08-10T14:26:50.692Z,manual
```

**Required Fields:**
- `Name`: Account name (string)
- `Type`: Account type (brokerage, retirement, savings, investment)
- `Currency`: Currency code (USD, EUR, etc.)

**Optional Fields:**
- `ID`: Unique identifier (auto-generated if not provided)
- `Balance`: Current balance (number)
- `Description`: Account description
- `Active`: true/false
- Date fields: ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)

### Stocks CSV Format
```csv
ID,Account ID,Symbol,Company Name,Quantity,Purchase Price,Current Price,Purchase Date,Sector,Exchange,Current Value,Initial Value,Absolute Gain/Loss,Percentage Gain/Loss,Profit/Loss %,Daily Change %,Market Cap,Sub Sector,Source,Created At,Updated At
,acc-001,RELIANCE,Reliance Industries Ltd,10,2350,2450.75,2025-08-10T14:26:50.691Z,Energy,NSE,24507.5,23500,1007.5,4.287234042553192,4.29,1.2,Large Cap,Oil & Gas,manual,2025-08-10T14:26:50.691Z,2025-08-10T14:26:50.691Z
```

**Required Fields:**
- `Account ID`: Must match an existing account ID
- `Symbol`: Stock ticker symbol
- `Company Name`: Full company name
- `Quantity`: Number of shares (number)
- `Purchase Price`: Price per share when purchased (number)

**Optional Fields:**
- All other fields are optional and will be calculated or updated automatically

## Import Rules

### Account Import
- **Create**: If no ID is provided or ID doesn't exist, a new account is created
- **Update**: If ID exists, the account is updated with new data
- **Validation**: Account type must be valid (brokerage, retirement, savings, investment)

### Stock Import
- **Create**: New stock holdings are created for valid account IDs
- **Update**: Existing stocks are updated based on Account ID + Symbol combination
- **Validation**: Account ID must exist in the system
- **Calculation**: Current value, profit/loss are automatically calculated

## Error Handling

The import process provides detailed feedback:

### Success Metrics
- **Created**: Number of new records added
- **Updated**: Number of existing records modified
- **Skipped**: Number of records ignored (duplicates or validation failures)

### Error Reporting
- Invalid data format errors
- Missing required fields
- Reference errors (e.g., invalid Account ID for stocks)
- Data type validation errors

## API Endpoints

The CSV functionality is available via REST API:

### Export Endpoints
```
GET /api/csv/export/accounts       # Download accounts CSV
GET /api/csv/export/stocks         # Download stocks CSV  
GET /api/csv/export/portfolios     # Download portfolios CSV
GET /api/csv/export/all           # Export all data (JSON response with file paths)
```

### Import Endpoints
```
POST /api/csv/import/accounts      # Upload accounts CSV
POST /api/csv/import/stocks        # Upload stocks CSV
```

### Template Endpoints
```
GET /api/csv/template/accounts     # Download accounts template
GET /api/csv/template/stocks       # Download stocks template
```

## File Locations

### Exports
- CSV export files are saved to: `backend/data/exports/`
- Files are automatically created with timestamps
- Previous exports are not automatically deleted

### Uploads
- Uploaded files are temporarily stored in: `backend/data/uploads/`
- Files are automatically cleaned up after processing

## Best Practices

### Data Preparation
1. Always download and review templates before creating import files
2. Use proper date formats (ISO 8601)
3. Ensure account IDs exist before importing stocks
4. Validate numeric fields (balances, prices, quantities)

### Backup Strategy
1. Export data regularly as backup
2. Test imports with small datasets first
3. Review import results before proceeding with large datasets

### Troubleshooting
1. Check server logs for detailed error messages
2. Verify CSV file encoding (UTF-8 recommended)
3. Ensure all required fields are present
4. Check for special characters that might cause parsing issues

## Security Considerations

- File uploads are limited to CSV format only
- Maximum file size: 10MB
- Files are validated before processing
- Temporary upload files are automatically cleaned up
- No file execution is performed on uploaded content

## Development Notes

### Dependencies
- `csv-parser`: For reading CSV files
- `csv-writer`: For writing CSV files  
- `multer`: For handling file uploads

### File Structure
```
backend/
├── controllers/csvController.js    # HTTP request handlers
├── routes/csvRoutes.js            # API route definitions
├── services/csvService.js         # Core CSV processing logic
└── data/
    ├── exports/                   # Generated CSV exports
    └── uploads/                   # Temporary file uploads
```

## Future Enhancements

- Portfolio data import functionality
- Batch processing for large files
- Data validation preview before import
- Scheduled automated exports
- CSV format customization options
- Data transformation rules
- Import history and rollback capability
