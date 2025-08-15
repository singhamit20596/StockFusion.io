import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  AccountBalance,
  Refresh,
  ArrowBack,
} from '@mui/icons-material';
import axios from 'axios';

interface AccountDetailsProps {
  accountId: string;
  onBack: () => void;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export default function AccountDetails({ accountId, onBack }: AccountDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<any>(null);
  const [holdings, setHoldings] = useState<any[]>([]);

  useEffect(() => {
    loadAccountDetails();
  }, [accountId]);

  const loadAccountDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load account info
      const accountResponse = await axios.get(`${API_BASE_URL}/api/accounts/${accountId}`);
      setAccount(accountResponse.data.data);

      // Load account holdings
      const holdingsResponse = await axios.get(`${API_BASE_URL}/api/stocks/account/${accountId}`);
      setHoldings(holdingsResponse.data.data || []);

    } catch (err: any) {
      console.error('❌ Error loading account details:', err);
      setError('Failed to load account details: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
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
      <Box>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={onBack}
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" onClick={loadAccountDetails}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  const totalInvested = holdings.reduce((sum, h) => sum + (h.metadata?.investedValue || 0), 0);
  const totalCurrent = holdings.reduce((sum, h) => sum + (h.metadata?.currentValue || 0), 0);
  const totalPnL = totalCurrent - totalInvested;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={onBack}
          variant="outlined"
        >
          Back
        </Button>
        <Box>
          <Typography variant="h4">{account?.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {account?.metadata?.source || 'Unknown'} • Last synced: {
              account?.metadata?.lastSyncedAt 
                ? new Date(account.metadata.lastSyncedAt).toLocaleDateString()
                : 'Never'
            }
          </Typography>
        </Box>
        <Button
          startIcon={<Refresh />}
          onClick={loadAccountDetails}
          variant="outlined"
          size="small"
        >
          Refresh
        </Button>
      </Box>

      {/* Portfolio Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <AccountBalance color="primary" />
            <Typography variant="h6">Portfolio Summary</Typography>
          </Box>
          
          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2}>
            <Box>
              <Typography variant="body2" color="text.secondary">Total Holdings</Typography>
              <Typography variant="h6">{holdings.length}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Total Invested</Typography>
              <Typography variant="h6">₹{totalInvested.toLocaleString()}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Current Value</Typography>
              <Typography variant="h6">₹{totalCurrent.toLocaleString()}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Total P&L</Typography>
              <Typography 
                variant="h6" 
                color={totalPnL >= 0 ? 'success.main' : 'error.main'}
              >
                ₹{totalPnL.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Holdings Table */}
      {holdings.length > 0 ? (
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <TrendingUp color="success" />
              <Typography variant="h6">Holdings Details</Typography>
            </Box>
            
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold' }}>Stocks</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>Qty</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>Avg Price</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>Current Price</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>Invested</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>Current</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>P&L</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>P&L%</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding, index) => (
                    <tr key={holding.id || index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <Typography variant="body2" fontWeight="bold">
                          {holding.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {holding.symbol} • {holding.exchange}
                        </Typography>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <Typography variant="body2">{holding.quantity}</Typography>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <Typography variant="body2">₹{holding.purchasePrice?.toFixed(2)}</Typography>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <Typography variant="body2">₹{holding.currentPrice?.toFixed(2)}</Typography>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <Typography variant="body2">₹{(holding.metadata?.investedValue || 0).toLocaleString()}</Typography>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <Typography variant="body2">₹{(holding.metadata?.currentValue || 0).toLocaleString()}</Typography>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <Chip
                          label={`₹${(holding.metadata?.profitLoss || 0).toLocaleString()}`}
                          color={(holding.metadata?.profitLoss || 0) >= 0 ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <Chip
                          label={`${(holding.metadata?.profitLossPercentage || ((holding.metadata?.profitLoss || 0) / (holding.metadata?.investedValue || 1)) * 100).toFixed(2)}%`}
                          color={(holding.metadata?.profitLoss || 0) >= 0 ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary">
              No holdings found for this account.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
