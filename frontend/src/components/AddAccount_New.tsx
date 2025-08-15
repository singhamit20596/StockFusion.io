import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  Security,
  CheckCircle,
  Refresh,
} from '@mui/icons-material';
import { createAccount, getAccounts } from '../services/api';
import axios from 'axios';

interface AccountFormData {
  name: string;
  brokerType: string;
}

interface AddAccountProps {
  onAccountCreated?: () => void;
  onShowAccountDetails?: (accountId: string) => void;
}

const brokerTypes = [
  { value: 'groww', label: 'Groww', icon: '🌱' },
  { value: 'zerodha', label: 'Zerodha', icon: '📈', disabled: true },
  { value: 'manual', label: 'Manual Entry', icon: '✍️', disabled: true },
];

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export default function AddAccount({ onAccountCreated, onShowAccountDetails }: AddAccountProps = {}) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form data
  const [accountData, setAccountData] = useState<AccountFormData>({
    name: '',
    brokerType: '',
  });
  
  // Scraping progress and results
  const [scrapingProgress, setScrapingProgress] = useState<{
    percentage: number;
    message: string;
    isActive: boolean;
  }>({
    percentage: 0,
    message: '',
    isActive: false
  });
  
  const [scrapedHoldings, setScrapedHoldings] = useState<any[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<any>(null);
  const [createdAccountId, setCreatedAccountId] = useState<string | null>(null);

  const steps = [
    'Account Name',
    'Select Broker', 
    'Real-time Scraping',
    'Holdings Details',
  ];

  // Step 1: Check account name uniqueness
  const checkAccountNameUniqueness = async () => {
    if (!accountData.name.trim()) {
      setError('Please enter an account name');
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await getAccounts();
      const existingAccounts = response.data.data || [];
      
      const nameExists = existingAccounts.some(
        (acc: any) => acc.name.toLowerCase() === accountData.name.toLowerCase()
      );
      
      if (nameExists) {
        setError(`Account name "${accountData.name}" already exists. Please choose a different name.`);
        return false;
      }
      
      setSuccess('✅ Account name is available!');
      setActiveStep(1);
      return true;
      
    } catch (err: any) {
      setError('Failed to check account name: ' + (err.response?.data?.message || err.message));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Select broker and start scraping immediately
  const handleBrokerSelection = async (brokerType: string) => {
    if (brokerType !== 'groww') {
      setError('Only Groww is currently supported');
      return;
    }

    setAccountData(prev => ({ ...prev, brokerType }));
    setActiveStep(2); // Move to scraping step
    
    // Start scraping immediately
    await startRealTimeScraping();
  };

  // Step 3: Real-time scraping
  const startRealTimeScraping = async () => {
    try {
      setLoading(true);
      setError(null);
      setScrapingProgress({
        percentage: 0,
        message: 'Initializing real-time scraping...',
        isActive: true
      });

      // Create sync API client with longer timeout
      const syncApiClient = axios.create({
        baseURL: API_BASE_URL,
        timeout: 300000, // 5 minutes
      });

      // Listen for progress updates
      const eventSource = new EventSource(`${API_BASE_URL}/api/accounts/scraping-progress`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setScrapingProgress({
          percentage: data.percentage || 0,
          message: data.message || 'Scraping in progress...',
          isActive: true
        });
      };

      // Start scraping
      const response = await syncApiClient.post('/api/accounts/sync-groww', {
        accountName: accountData.name
      });

      console.log('✅ Scraping API response:', response.data);

      if (response.data.success) {
        const scrapingData = response.data.data;
        
        // Store scraped data
        setScrapedHoldings(scrapingData.holdings || []);
        setPortfolioSummary(scrapingData.summary || {});
        
        setScrapingProgress({
          percentage: 100,
          message: 'Scraping completed successfully!',
          isActive: false
        });
        
        setSuccess(`✅ Scraping completed successfully!`);
        
        // Auto-advance to holdings details
        setActiveStep(3);
        
      } else {
        throw new Error(response.data.message || 'Scraping failed');
      }

      eventSource.close();

    } catch (err: any) {
      console.error('❌ Scraping error:', err);
      setError('Scraping failed: ' + (err.response?.data?.message || err.message));
      setScrapingProgress({
        percentage: 0,
        message: 'Scraping failed',
        isActive: false
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Save account and holdings data
  const saveAccountAndHoldings = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Create the account first
      const accountResponse = await createAccount({
        name: accountData.name,
        type: 'investment',
        balance: portfolioSummary?.totalValue || 0,
        metadata: {
          source: 'groww',
          totalInvestment: scrapedHoldings.reduce((sum, h) => sum + (h.investment || h.investedValue || 0), 0),
          totalProfitLoss: scrapedHoldings.reduce((sum, h) => sum + (h.pnl || h.profitLoss || 0), 0),
          lastSyncedAt: new Date().toISOString()
        }
      });

      const createdAccount = accountResponse.data.data;
      console.log('✅ Account created:', createdAccount);
      
      // Store the created account ID for navigation
      setCreatedAccountId(createdAccount.id);

      // 2. Save holdings data linked to this account
      const holdingsResponse = await axios.post(`${API_BASE_URL}/api/stocks/bulk-create`, {
        accountId: createdAccount.id,
        holdings: scrapedHoldings
      });

      console.log('✅ Holdings saved:', holdingsResponse.data);

      setSuccess(`🎉 Data saved for account "${accountData.name}"! Account created with ${scrapedHoldings.length} holdings.`);
      
      // Trigger callback to refresh accounts list
      if (onAccountCreated) {
        onAccountCreated();
      }

    } catch (err: any) {
      console.error('❌ Save error:', err);
      setError('Failed to save account: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Retry scraping
  const retryScaping = () => {
    setError(null);
    setSuccess(null);
    startRealTimeScraping();
  };

  // Handle form field changes
  const handleAccountDataChange = (field: keyof AccountFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setAccountData(prev => ({ ...prev, [field]: event.target.value }));
    setError(null);
    setSuccess(null);
  };

  // Step validation
  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return accountData.name.trim() !== '';
      case 1:
        return accountData.brokerType !== '';
      case 2:
        return !scrapingProgress.isActive && scrapedHoldings.length > 0;
      case 3:
        return scrapedHoldings.length > 0;
      default:
        return true;
    }
  };

  // Render step content
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Account Name"
              value={accountData.name}
              onChange={handleAccountDataChange('name')}
              margin="normal"
              required
              helperText="Enter a unique name for your investment account"
              error={!!error}
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {success}
              </Alert>
            )}
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Select your broker to start importing your portfolio:
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              {brokerTypes.map((broker) => (
                <Card 
                  key={broker.value}
                  sx={{ 
                    cursor: broker.disabled ? 'not-allowed' : 'pointer',
                    opacity: broker.disabled ? 0.5 : 1,
                    border: accountData.brokerType === broker.value ? '2px solid #1976d2' : '1px solid #ddd',
                    '&:hover': broker.disabled ? {} : {
                      borderColor: '#1976d2',
                      backgroundColor: '#f5f5f5'
                    }
                  }}
                  onClick={() => !broker.disabled && handleBrokerSelection(broker.value)}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="h4">{broker.icon}</Typography>
                      <Box>
                        <Typography variant="h6">{broker.label}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {broker.disabled ? 'Coming Soon' : 'Click to start real-time scraping'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Real-time Scraping in Progress
            </Typography>
            
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Security color="primary" />
                  <Typography variant="body1">
                    Connecting to Groww and scraping your portfolio...
                  </Typography>
                </Box>
                
                <LinearProgress 
                  variant="determinate" 
                  value={scrapingProgress.percentage} 
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="body2" color="text.secondary">
                  {scrapingProgress.message} ({scrapingProgress.percentage}%)
                </Typography>
                
                {loading && (
                  <Box display="flex" alignItems="center" gap={1} mt={2}>
                    <CircularProgress size={20} />
                    <Typography variant="body2">
                      Please complete login in the browser window...
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ mt: 2 }}
                action={
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={retryScaping}
                    startIcon={<Refresh />}
                  >
                    Retry
                  </Button>
                }
              >
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {success}
              </Alert>
            )}
          </Box>
        );

      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            
            {scrapedHoldings.length > 0 && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <TrendingUp color="success" />
                    <Typography variant="h6">Portfolio Holdings</Typography>
                  </Box>
                  
                  {/* Portfolio Summary */}
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="h6" gutterBottom>Summary</Typography>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">Total Holdings</Typography>
                      <Typography variant="body2" fontWeight="bold">{scrapedHoldings.length}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">Total Invested</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        ₹{scrapedHoldings.reduce((sum, h) => sum + (h.investment || h.investedValue || 0), 0).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">Current Value</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        ₹{scrapedHoldings.reduce((sum, h) => sum + (h.currentValue || h.totalValue || 0), 0).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Total P&L</Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        color={scrapedHoldings.reduce((sum, h) => sum + (h.pnl || h.profitLoss || 0), 0) >= 0 ? 'success.main' : 'error.main'}
                      >
                        ₹{scrapedHoldings.reduce((sum, h) => sum + (h.pnl || h.profitLoss || 0), 0).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Holdings Table */}
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
                        {scrapedHoldings.map((holding, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px 8px' }}>
                              <Typography variant="body2" fontWeight="bold">
                                {holding.name || holding.symbol}
                              </Typography>
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <Typography variant="body2">{holding.units || holding.quantity}</Typography>
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <Typography variant="body2">₹{(holding.avgBuyPrice || holding.averagePrice || holding.avgPrice || 0).toFixed(2)}</Typography>
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <Typography variant="body2">₹{(holding.currentPrice || holding.ltp || 0).toFixed(2)}</Typography>
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <Typography variant="body2">₹{(holding.investedValue || holding.investment || 0).toLocaleString()}</Typography>
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <Typography variant="body2">₹{(holding.totalValue || holding.currentValue || 0).toLocaleString()}</Typography>
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <Chip
                                label={`₹${(holding.profitLoss || holding.pnl || 0).toLocaleString()}`}
                                color={(holding.profitLoss || holding.pnl || 0) >= 0 ? 'success' : 'error'}
                                size="small"
                                variant="outlined"
                              />
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <Chip
                                label={`${(holding.profitLossPercentage || 0).toFixed(2)}%`}
                                color={(holding.profitLossPercentage || 0) >= 0 ? 'success' : 'error'}
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
            )}
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                onClick={saveAccountAndHoldings}
                disabled={loading || scrapedHoldings.length === 0}
                startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                sx={{ 
                  bgcolor: 'success.main',
                  '&:hover': { bgcolor: 'success.dark' }
                }}
              >
                {loading ? 'Saving...' : 'Save Account & Holdings'}
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => {
                  if (onShowAccountDetails && createdAccountId) {
                    onShowAccountDetails(createdAccountId);
                  } else if (onAccountCreated) {
                    onAccountCreated();
                  }
                }}
                disabled={loading || !createdAccountId}
              >
                Show Account Details
              </Button>
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box maxWidth="md" mx="auto">
      <Typography variant="h4" gutterBottom>
        Add New Account
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
              <StepContent>
                {renderStepContent(index)}
                
                {/* Navigation Buttons */}
                <Box sx={{ mb: 2, mt: 2 }}>
                  <div>
                    {index === 0 && (
                      <Button
                        variant="contained"
                        onClick={checkAccountNameUniqueness}
                        disabled={!isStepValid(index) || loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                      >
                        {loading ? 'Checking...' : 'Check Availability'}
                      </Button>
                    )}
                    
                    {index > 0 && index < 3 && (
                      <Button
                        disabled={index === 0 || loading}
                        onClick={() => setActiveStep(index - 1)}
                        sx={{ mr: 1 }}
                      >
                        Back
                      </Button>
                    )}
                  </div>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>
    </Box>
  );
}
