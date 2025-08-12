#!/bin/bash

# CSV API Test Script
echo "Testing CSV endpoints..."
echo

# Check if backend is running
echo "1. Checking if backend is running..."
curl -s http://localhost:5001/api/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running on port 5001"
    exit 1
fi

echo

# Test export endpoints
echo "2. Testing CSV export endpoints..."

echo "Testing accounts export..."
curl -s -I http://localhost:5001/api/csv/export/accounts | head -1

echo "Testing stocks export..."
curl -s -I http://localhost:5001/api/csv/export/stocks | head -1

echo "Testing portfolios export..."
curl -s -I http://localhost:5001/api/csv/export/portfolios | head -1

echo

# Test template endpoints
echo "3. Testing CSV template endpoints..."

echo "Testing accounts template..."
curl -s -I http://localhost:5001/api/csv/template/accounts | head -1

echo "Testing stocks template..."
curl -s -I http://localhost:5001/api/csv/template/stocks | head -1

echo

echo "CSV API test completed!"
