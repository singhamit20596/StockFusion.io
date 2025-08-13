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
} from '@mui/material';
import {
  Security,
  TrendingUp,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

interface HoldingData {
  id?: string;
  symbol: string;
  name: string;
  units: number;
  currentPrice: number;
  avgBuyPrice?: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  scrapedAt?: string;
}

export default function ScrapingTest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [holdings, setHoldings] = useState<HoldingData[]>([]);
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

      // Start progress tracking
      setProgress({
        percentage: 10,
        message: 'Initializing browser...',
        isActive: true
      });

      setSuccess('🌐 Opening Chrome browser for Groww login...\n\n👆 A new browser window will open\n🔐 Please log in to your Groww account');

      // Call backend scraping API
      const response = await axios.post(`${API_BASE_URL}/api/scraping/test-groww`, {}, {
        timeout: 600000, // 10 minutes timeout
      });

      console.log('✅ Scraping response:', response.data);

      if (response.data.success) {
        setProgress({
          percentage: 100,
          message: 'Scraping completed successfully!',
          isActive: false
        });
        
        // Handle both possible response structures
        const holdingsData = response.data.data?.holdings || response.data.holdings || [];
        setHoldings(holdingsData);
        setSuccess(`✅ Successfully scraped ${holdingsData.length} holdings from Groww!`);
      } else {
        throw new Error(response.data.message || 'Scraping failed');
      }

    } catch (err: any) {
      console.error('❌ Scraping error:', err);
      
      setProgress({
        percentage: 0,
        message: '',
        isActive: false
      });
      
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('Scraping timed out. Please ensure you log in to Groww within 10 minutes and try again.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to scrape Groww data');
      }
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
      <Typography variant="h4" gutterBottom>
        Real-time Groww Scraping Test
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        This tool will open a Groww login page, allow you to login manually, 
        and then automatically scrape your portfolio data in real-time.
      </Typography>

      {/* Control Panel */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <TrendingUp />}
            onClick={handleGrowwLogin}
            disabled={loading}
            size="large"
            sx={{ mr: 2 }}
          >
            {loading ? 'Scraping in Progress...' : 'Start Real-time Scraping'}
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
                    <TableCell align="right"><strong>Units</strong></TableCell>
                    <TableCell align="right"><strong>Current Price</strong></TableCell>
                    <TableCell align="right"><strong>Total Value</strong></TableCell>
                    <TableCell align="right"><strong>P&L</strong></TableCell>
                    <TableCell align="right"><strong>P&L %</strong></TableCell>
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
                        </Box>
                      </TableCell>
                      <TableCell align="right">{holding.units}</TableCell>
                      <TableCell align="right">{formatCurrency(holding.currentPrice)}</TableCell>
                      <TableCell align="right">{formatCurrency(holding.totalValue)}</TableCell>
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
              <Typography variant="body2">
                Total Holdings: {holdings.length}
              </Typography>
              <Typography variant="body2">
                Total Value: {formatCurrency(holdings.reduce((sum, h) => sum + h.totalValue, 0))}
              </Typography>
              <Typography 
                variant="body2"
                sx={{ 
                  color: holdings.reduce((sum, h) => sum + h.profitLoss, 0) >= 0 ? 'success.main' : 'error.main' 
                }}
              >
                Total P&L: {formatCurrency(holdings.reduce((sum, h) => sum + h.profitLoss, 0))}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
