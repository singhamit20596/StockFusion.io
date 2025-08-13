import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  Security,
  TrendingUp,
  PlayArrow,
} from '@mui/icons-material';
import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

interface HoldingData {
  id?: string;
  symbol: string;
  name: string;
  isin?: string;
  sector?: string;
  exchange?: string;
  units: number;
  quantity?: number;
  currentPrice: number;
  ltp?: number;
  avgBuyPrice?: number;
  averagePrice?: number;
  totalValue: number;
  investedValue?: number;
  profitLoss: number;
  profitLossPercentage: number;
  dayChange?: number;
  dayChangePercentage?: number;
  marketCap?: string;
  pe?: number;
  pb?: number;
  dividendYield?: number;
  high52Week?: number;
  low52Week?: number;
  lastTradeTime?: string;
  scrapedAt?: string;
}

interface PortfolioSummary {
  totalInvested?: number;
  currentValue?: number;
  totalReturns?: number;
  totalReturnsPercentage?: number;
}

interface AdditionalInfo {
  sectors?: string[];
  performanceMetrics?: string[];
  accountInfo?: string;
}

interface ScrapingResponse {
  success: boolean;
  data: {
    holdings: HoldingData[];
    portfolioSummary?: PortfolioSummary;
    additionalInfo?: AdditionalInfo;
    metadata?: any;
    totalHoldings: number;
    scrapedAt: string;
  };
  message: string;
}

export default function ScrapingTest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [holdings, setHoldings] = useState<HoldingData[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary>({});
  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo>({});
  const [progress, setProgress] = useState({
    percentage: 0,
    message: '',
    isActive: false
  });

  const handleGrowwLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setHoldings([]);
      setPortfolioSummary({});
      setAdditionalInfo({});

      // Start progress tracking
      setProgress({
        percentage: 5,
        message: 'Initializing scraping request...',
        isActive: true
      });

      setSuccess('🌐 Starting real-time scraping...\n\n👆 A browser window will open for Groww login\n🔐 Please log in to your Groww account when prompted');

      // Update progress during the process
      setProgress({
        percentage: 10,
        message: 'Connecting to backend...',
        isActive: true
      });

      // Start a progress simulation while backend works
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev.percentage < 90) {
            const newPercentage = Math.min(prev.percentage + 5, 90);
            let message = prev.message;
            
            if (newPercentage >= 15 && newPercentage < 30) {
              message = 'Opening browser and navigating to Groww...';
            } else if (newPercentage >= 30 && newPercentage < 50) {
              message = 'Waiting for login completion...';
            } else if (newPercentage >= 50 && newPercentage < 70) {
              message = 'Login detected! Navigating to portfolio...';
            } else if (newPercentage >= 70 && newPercentage < 90) {
              message = 'Scraping portfolio data...';
            }
            
            return {
              percentage: newPercentage,
              message,
              isActive: true
            };
          }
          return prev;
        });
      }, 2000); // Update every 2 seconds

      // Call backend scraping API
      const response = await axios.post(`${API_BASE_URL}/api/scraping/test-groww`, {}, {
        timeout: 600000, // 10 minutes timeout
      });

      // Clear the progress interval
      clearInterval(progressInterval);

      console.log('✅ Scraping response:', response.data);
      console.log('✅ Response structure check:', {
        success: response.data.success,
        hasData: !!response.data.data,
        dataKeys: response.data.data ? Object.keys(response.data.data) : 'No data',
        hasHoldings: !!(response.data.data?.holdings || response.data.holdings),
        holdingsLength: (response.data.data?.holdings || response.data.holdings || []).length
      });

      if (response.data.success) {
        setProgress({
          percentage: 100,
          message: 'Scraping completed successfully!',
          isActive: false
        });
        
        // Handle the new comprehensive response structure with multiple fallbacks
        const scrapingData = response.data.data;
        let holdingsData = [];
        
        if (scrapingData?.holdings) {
          holdingsData = scrapingData.holdings;
        } else if (response.data.holdings) {
          holdingsData = response.data.holdings;
        } else if (Array.isArray(scrapingData)) {
          holdingsData = scrapingData;
        }
        
        console.log('✅ Final holdings data:', holdingsData);
        
        // DEBUG: Show how frontend maps each holding to table columns
        holdingsData.forEach((holding: HoldingData, index: number) => {
          console.log(`\n🎯 FRONTEND MAPPING for Holding ${index + 1}:`);
          console.log(`  📊 Table Column 1 (Stock): "${holding.name || holding.symbol || 'Unknown'}"`);
          console.log(`  📊 Table Column 2 (Qty): ${holding.units || holding.quantity || 0}`);
          console.log(`  📊 Table Column 3 (Avg Price): ₹${holding.avgBuyPrice || holding.averagePrice || 0}`);
          console.log(`  📊 Table Column 4 (Invested): ₹${holding.investedValue || ((holding.units || holding.quantity || 0) * (holding.avgBuyPrice || holding.averagePrice || 0))}`);
          console.log(`  📊 Table Column 5 (Current): ₹${holding.totalValue}`);
          console.log(`  📊 Table Column 6 (P&L): ₹${holding.profitLoss}`);
          console.log(`  📊 Table Column 7 (P&L%): ${holding.profitLossPercentage}%`);
          console.log(`  📊 Table Column 8 (%Day Change): ${holding.dayChangePercentage ? holding.dayChangePercentage + '%' : '-'}`);
        });
        
        setHoldings(holdingsData);
        setPortfolioSummary(scrapingData?.portfolioSummary || {});
        setAdditionalInfo(scrapingData?.additionalInfo || {});
        
        const summaryInfo = scrapingData?.portfolioSummary;
        let summaryText = '';
        if (summaryInfo?.totalInvested) {
          summaryText += `💰 Total Invested: ${formatCurrency(summaryInfo.totalInvested)}\n`;
        }
        if (summaryInfo?.currentValue) {
          summaryText += `📈 Current Value: ${formatCurrency(summaryInfo.currentValue)}\n`;
        }
        if (summaryInfo?.totalReturns) {
          summaryText += `💹 Total Returns: ${formatCurrency(summaryInfo.totalReturns)}`;
          if (summaryInfo?.totalReturnsPercentage) {
            summaryText += ` (${summaryInfo.totalReturnsPercentage.toFixed(2)}%)`;
          }
          summaryText += '\n';
        }
        
        setSuccess(`✅ Successfully scraped ${holdingsData.length} holdings with comprehensive data from Groww!\n\n🔄 Browser has been closed automatically\n${summaryText}\n📊 Detailed portfolio data displayed below`);
      } else {
        throw new Error(response.data.message || 'Scraping failed');
      }

    } catch (err: any) {
      console.error('❌ Scraping error:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config
      });
      
      setProgress({
        percentage: 0,
        message: '',
        isActive: false
      });
      
      let errorMessage = 'Failed to scrape Groww data. Please try again.';
      
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage = 'Scraping timed out. The process took longer than expected. Please try again and ensure you log in to Groww promptly.';
      } else if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        errorMessage = `❌ Cannot connect to backend server.\n\n🔧 Please ensure:\n• Backend is running on port 5002\n• No firewall blocking the connection\n• CORS is properly configured\n\n🔗 API URL: ${API_BASE_URL}/api/scraping/test-groww`;
      } else if (err.response?.status === 404) {
        errorMessage = `❌ API endpoint not found.\n\n🔧 Please check:\n• Backend server is running\n• API routes are properly configured\n\n🔗 Attempted URL: ${API_BASE_URL}/api/scraping/test-groww`;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`;
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TrendingUp color="primary" />
        Real-time Groww Portfolio Scraper
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        This tool will automatically:
        <br />
        • Open a secure browser window with Groww login
        <br />
        • Wait for you to complete the login process
        <br />
        • Automatically navigate to your portfolio and scrape holdings data
        <br />
        • Close the browser and display your portfolio data here
        <br />
        <br />
        <strong>⚠️ Important:</strong> Please complete the login process when prompted. The scraper will automatically proceed after login.
      </Typography>

      {/* Control Panel */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
            onClick={handleGrowwLogin}
            disabled={loading}
            size="large"
            sx={{ 
              background: 'linear-gradient(45deg, #00C851 30%, #007E33 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #007E33 30%, #004D20 90%)'
              },
              px: 4,
              py: 1.5
            }}
          >
            {loading ? 'Automatic Scraping in Progress...' : 'Start Automatic Portfolio Scraping'}
          </Button>
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      {progress.isActive && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Scraping Progress
            </Typography>
            <LinearProgress variant="determinate" value={progress.percentage} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              {progress.message} ({progress.percentage}%)
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {success && (
        <Alert severity="success" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
          {success}
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6">Scraping Failed</Typography>
          {error}
        </Alert>
      )}

      {/* Holdings Table */}
      {holdings.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Security sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Portfolio Holdings ({holdings.length} stocks)
              </Typography>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Stock</strong></TableCell>
                    <TableCell align="right"><strong>Qty</strong></TableCell>
                    <TableCell align="right"><strong>Avg Price</strong></TableCell>
                    <TableCell align="right"><strong>Invested</strong></TableCell>
                    <TableCell align="right"><strong>Current</strong></TableCell>
                    <TableCell align="right"><strong>P&L</strong></TableCell>
                    <TableCell align="right"><strong>P&L%</strong></TableCell>
                    <TableCell align="right"><strong>%Day Change</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {holdings.map((holding, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {holding.name || holding.symbol || 'Unknown'}
                          </Typography>
                          {holding.symbol && holding.name && (
                            <Typography variant="caption" color="text.secondary">
                              {holding.symbol}
                            </Typography>
                          )}
                          {holding.sector && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {holding.sector}
                            </Typography>
                          )}
                          {holding.exchange && (
                            <Typography variant="caption" color="primary.main">
                              {holding.exchange}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {holding.units || holding.quantity || 0}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(holding.avgBuyPrice || holding.averagePrice || 0)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(holding.investedValue || ((holding.units || holding.quantity || 0) * (holding.avgBuyPrice || holding.averagePrice || 0)))}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(holding.totalValue)}
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ color: holding.profitLoss >= 0 ? 'success.main' : 'error.main' }}
                      >
                        {formatCurrency(holding.profitLoss)}
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ color: holding.profitLoss >= 0 ? 'success.main' : 'error.main' }}
                      >
                        {formatPercentage(holding.profitLossPercentage)}
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          color: (holding.dayChangePercentage || 0) >= 0 ? 'success.main' : 'error.main' 
                        }}
                      >
                        {holding.dayChangePercentage ? formatPercentage(holding.dayChangePercentage) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Portfolio Summary */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                Portfolio Summary
              </Typography>
              
              {/* Portfolio metrics from scraped data */}
              {portfolioSummary.totalInvested && (
                <Typography variant="body2">
                  <strong>Total Invested:</strong> {formatCurrency(portfolioSummary.totalInvested)}
                </Typography>
              )}
              {portfolioSummary.currentValue && (
                <Typography variant="body2">
                  <strong>Current Value:</strong> {formatCurrency(portfolioSummary.currentValue)}
                </Typography>
              )}
              {portfolioSummary.totalReturns && (
                <Typography 
                  variant="body2"
                  sx={{ 
                    color: portfolioSummary.totalReturns >= 0 ? 'success.main' : 'error.main' 
                  }}
                >
                  <strong>Total Returns:</strong> {formatCurrency(portfolioSummary.totalReturns)}
                  {portfolioSummary.totalReturnsPercentage && 
                    ` (${portfolioSummary.totalReturnsPercentage.toFixed(2)}%)`
                  }
                </Typography>
              )}
              
              {/* Calculated metrics from holdings */}
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Total Holdings:</strong> {holdings.length}
              </Typography>
              <Typography variant="body2">
                <strong>Calculated Current Value:</strong> {formatCurrency(holdings.reduce((sum, h) => sum + h.totalValue, 0))}
              </Typography>
              <Typography variant="body2">
                <strong>Calculated Invested Value:</strong> {formatCurrency(holdings.reduce((sum, h) => sum + (h.investedValue || (h.units * (h.avgBuyPrice || 0))), 0))}
              </Typography>
              <Typography 
                variant="body2"
                sx={{ 
                  color: holdings.reduce((sum, h) => sum + h.profitLoss, 0) >= 0 ? 'success.main' : 'error.main' 
                }}
              >
                <strong>Calculated P&L:</strong> {formatCurrency(holdings.reduce((sum, h) => sum + h.profitLoss, 0))}
              </Typography>
              
              {/* Additional portfolio information */}
              {additionalInfo.sectors && additionalInfo.sectors.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Sectors:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {additionalInfo.sectors.slice(0, 10).map((sector, index) => (
                      <Chip 
                        key={index} 
                        label={sector} 
                        size="small" 
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
              
              {additionalInfo.accountInfo && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Account: {additionalInfo.accountInfo}
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
