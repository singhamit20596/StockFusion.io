import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

interface Stock {
  id: string;
  name: string;
  symbol: string;
  quantity?: number;
  avgPrice?: number;
  currentPrice?: number;
  investment?: number;
  currentValue?: number;
  pnl?: number;
  pnlPercentage?: number;
  exchange?: string;
}

interface PortfolioSummary {
  totalInvestment: number;
  totalValue: number;
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
  totalStocks: number;
}

interface HoldingsTableProps {
  accountId: string;
  accountName: string;
}

export default function HoldingsTable({ accountId, accountName }: HoldingsTableProps) {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccountHoldings();
  }, [accountId]);

  const fetchAccountHoldings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/api/stocks/account/${accountId}`);
      const stocksData = response.data.data || [];

      setStocks(stocksData);

      // Calculate portfolio summary
      const totalInvestment = stocksData.reduce((sum: number, stock: Stock) => sum + (stock.investment || 0), 0);
      const totalValue = stocksData.reduce((sum: number, stock: Stock) => sum + (stock.currentValue || 0), 0);
      const totalProfitLoss = totalValue - totalInvestment;
      const totalProfitLossPercentage = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

      setSummary({
        totalInvestment,
        totalValue,
        totalProfitLoss,
        totalProfitLossPercentage,
        totalStocks: stocksData.length,
      });

    } catch (err: any) {
      setError('Failed to fetch account holdings: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching account holdings:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '₹0.00';
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (percentage: number | undefined | null) => {
    if (percentage === undefined || percentage === null || isNaN(percentage)) {
      return '0.00%';
    }
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Portfolio Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {summary && summary.totalProfitLoss >= 0 ? (
              <TrendingUp color="success" />
            ) : (
              <TrendingDown color="error" />
            )}
            Portfolio Summary - {accountName}
          </Typography>
          
          {summary && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mt: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Invested
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formatCurrency(summary.totalInvestment)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Current Value
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formatCurrency(summary.totalValue)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total P&L
                </Typography>
                <Typography 
                  variant="h6" 
                  fontWeight="bold"
                  color={summary.totalProfitLoss >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(summary.totalProfitLoss)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Overall P&L%
                </Typography>
                <Typography 
                  variant="h6" 
                  fontWeight="bold"
                  color={summary.totalProfitLossPercentage >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatPercentage(summary.totalProfitLossPercentage)}
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Holdings Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><Typography fontWeight="bold">Stock</Typography></TableCell>
              <TableCell align="right"><Typography fontWeight="bold">Qty</Typography></TableCell>
              <TableCell align="right"><Typography fontWeight="bold">Avg Price</Typography></TableCell>
              <TableCell align="right"><Typography fontWeight="bold">Current Price</Typography></TableCell>
              <TableCell align="right"><Typography fontWeight="bold">Invested</Typography></TableCell>
              <TableCell align="right"><Typography fontWeight="bold">Current Value</Typography></TableCell>
              <TableCell align="right"><Typography fontWeight="bold">P&L</Typography></TableCell>
              <TableCell align="right"><Typography fontWeight="bold">P&L%</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stocks.map((stock) => (
              <TableRow key={stock.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {stock.name || 'Unknown Stock'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stock.symbol || 'N/A'}{stock.exchange ? ` • ${stock.exchange}` : ''}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">{stock.quantity || 0}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">{formatCurrency(stock.avgPrice)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">{formatCurrency(stock.currentPrice)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">{formatCurrency(stock.investment)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">{formatCurrency(stock.currentValue)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label={formatCurrency(stock.pnl)}
                    color={(stock.pnl || 0) >= 0 ? 'success' : 'error'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label={formatPercentage(stock.pnlPercentage)}
                    color={(stock.pnlPercentage || 0) >= 0 ? 'success' : 'error'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {stocks.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            No holdings found for this account
          </Typography>
        </Box>
      )}
    </Box>
  );
}
