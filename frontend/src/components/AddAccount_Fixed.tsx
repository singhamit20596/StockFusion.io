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
} from '@mui/icons-material';
import { createAccount, getAccounts } from '../services/api';
import axios from 'axios';

interface AccountFormData {
  name: string;
  brokerType: string;
}

interface AddAccountProps {
  onAccountCreated?: () => void;
}

const brokerTypes = [
  { value: 'groww', label: 'Groww', icon: '🌱' },
  { value: 'zerodha', label: 'Zerodha', icon: '📈', disabled: true },
  { value: 'manual', label: 'Manual Entry', icon: '✍️' },
];

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

export default function AddAccount({ onAccountCreated }: AddAccountProps = {}) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Progress tracking for real-time scraping
  const [scrapingProgress, setScrapingProgress] = useState<{
    percentage: number;
    message: string;
    isActive: boolean;
  }>({
    percentage: 0,
    message: '',
    isActive: false
  });

  const [accountData, setAccountData] = useState<AccountFormData>({
    name: '',
    brokerType: '',
  });

  const [syncResults, setSyncResults] = useState<any>(null);

  const steps = [
    'Account Name',
    'Select Broker',
    'Connect & Sync',
    'Confirmation',
  ];

  const handleAccountDataChange = (field: keyof AccountFormData) => (
    event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
  ) => {
    setAccountData({ ...accountData, [field]: event.target.value });
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setError(null);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError(null);
  };

  const checkAccountExists = async (name: string): Promise<boolean> => {
    try {
      const response = await getAccounts();
      const accounts = response.data.data || [];
      return accounts.some((account: any) => 
        account.name.toLowerCase().trim() === name.toLowerCase().trim()
      );
    } catch (error) {
      console.error('Error checking accounts:', error);
      return false;
    }
  };

  const validateAccountName = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!accountData.name.trim()) {
        throw new Error('Account name is required');
      }

      // Check if account name already exists
      const exists = await checkAccountExists(accountData.name.trim());
      if (exists) {
        throw new Error(`Account with name "${accountData.name}" already exists. Please choose a different name.`);
      }

      setSuccess('✅ Account name is available!');
      handleNext();
    } catch (err: any) {
      setError(err.message || 'Failed to validate account name');
    } finally {
      setLoading(false);
    }
  };

  const handleGrowwLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Start the scraping process with progress tracking
      setScrapingProgress({
        percentage: 10,
        message: 'Starting Groww sync...',
        isActive: true
      });

      setSuccess('🌐 Opening Chrome browser for Groww login...\n\n👆 A new browser window will open automatically\n🔐 Please log in to your Groww account in that window');

      // Call backend to start automated scraping
      const syncApiClient = axios.create({
        baseURL: API_BASE_URL,
        timeout: 600000, // 10 minutes
      });

      setScrapingProgress({
        percentage: 30,
        message: 'Browser opening...',
        isActive: true
      });

      const response = await syncApiClient.post('/api/accounts/sync-groww', {
        accountName: accountData.name // Pass the account name for creation after sync
      });

      if (response.data.success) {
        setSyncResults(response.data.data);
        setScrapingProgress({
          percentage: 100,
          message: 'Sync completed successfully!',
          isActive: false
        });
        setSuccess('✅ Portfolio synced successfully! Creating account...');
        
        // Now create the account with the synced data
        await createAccountWithSyncData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Sync failed');
      }

    } catch (err: any) {
      setScrapingProgress({
        percentage: 0,
        message: '',
        isActive: false
      });
      
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('Sync timed out. Please ensure you log in to Groww within 10 minutes and try again.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to sync with Groww');
      }
    } finally {
      setLoading(false);
    }
  };

  const createAccountWithSyncData = async (syncData: any) => {
    try {
      // Create account with synced portfolio data
      const accountResponse = await createAccount({
        name: accountData.name,
        type: 'investment',
        balance: syncData.summary?.totalValue || 0
      });

      setSuccess('🎉 Account created successfully with portfolio data!');
      handleNext();
      
      if (onAccountCreated) {
        onAccountCreated();
      }
    } catch (err: any) {
      setError('Sync successful but failed to create account: ' + (err.response?.data?.message || err.message));
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return accountData.name.trim() !== '';
      case 1:
        return accountData.brokerType !== '';
      case 2:
        return true; // Sync step
      default:
        return true;
    }
  };

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
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Select Broker
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              {brokerTypes.map((broker) => (
                <Card
                  key={broker.value}
                  sx={{
                    cursor: broker.disabled ? 'not-allowed' : 'pointer',
                    border: accountData.brokerType === broker.value ? 2 : 1,
                    borderColor: accountData.brokerType === broker.value ? 'primary.main' : 'divider',
                    opacity: broker.disabled ? 0.5 : 1,
                  }}
                  onClick={() => !broker.disabled && setAccountData({ ...accountData, brokerType: broker.value })}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="h5">{broker.icon}</Typography>
                        <Box>
                          <Typography variant="h6">{broker.label}</Typography>
                          {broker.disabled && (
                            <Chip label="Coming Soon" size="small" color="warning" />
                          )}
                          {broker.value === 'groww' && (
                            <Chip label="Full Automation" size="small" color="success" />
                          )}
                        </Box>
                      </Box>
                      {accountData.brokerType === broker.value && (
                        <CheckCircle color="primary" />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        );

      case 2:
        if (accountData.brokerType === 'groww') {
          return (
            <Box sx={{ mt: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Security color="primary" />
                <Typography variant="h6">Connect to Groww</Typography>
              </Box>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                🚀 Click below to start the automated sync process. A browser window will open for secure Groww login.
              </Alert>

              {scrapingProgress.isActive && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Sync Progress: {scrapingProgress.percentage}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={scrapingProgress.percentage} 
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {scrapingProgress.message}
                  </Typography>
                </Box>
              )}

              <Card sx={{ p: 3, textAlign: 'center' }}>
                <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                  <Typography variant="h5">🌱</Typography>
                  <Typography variant="h6" gutterBottom>
                    Ready to Connect Groww
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Click below to start automated portfolio sync
                  </Typography>
                  
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleGrowwLogin}
                    disabled={loading || scrapingProgress.isActive}
                    startIcon={loading || scrapingProgress.isActive ? <CircularProgress size={20} /> : <Security />}
                    sx={{ 
                      bgcolor: 'success.main',
                      '&:hover': { bgcolor: 'success.dark' },
                      minWidth: 200
                    }}
                  >
                    {loading || scrapingProgress.isActive ? 'Syncing...' : 'Login with Groww'}
                  </Button>
                </Box>
              </Card>
            </Box>
          );
        } else {
          return (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info">
                {accountData.brokerType === 'manual' 
                  ? 'Manual entry selected. You can add stocks manually after creating the account.'
                  : 'This broker integration is coming soon.'}
              </Alert>
            </Box>
          );
        }

      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            
            {syncResults && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <TrendingUp color="success" />
                    <Typography variant="h6">Portfolio Summary</Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Total Stocks
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {syncResults.summary?.totalStocks || 0}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Total Value
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ₹{syncResults.summary?.totalValue?.toLocaleString() || 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
            
            <Typography variant="body1">
              Account "{accountData.name}" has been created successfully with your Groww portfolio data!
            </Typography>
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
                
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}

                {success && !scrapingProgress.isActive && index !== 3 && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    {success}
                  </Alert>
                )}

                <Box sx={{ mt: 2 }}>
                  {index === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={() => window.location.reload()}
                    >
                      Create Another Account
                    </Button>
                  ) : (
                    <Box>
                      <Button
                        variant="contained"
                        onClick={index === 0 ? validateAccountName : index === 2 ? handleGrowwLogin : handleNext}
                        disabled={!isStepValid(index) || loading || scrapingProgress.isActive}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                      >
                        {index === 0 ? 'Check Availability' : 
                         index === 2 ? 'Connect to Groww' : 
                         'Continue'}
                      </Button>
                      <Button
                        disabled={index === 0 || loading || scrapingProgress.isActive}
                        onClick={handleBack}
                        sx={{ ml: 1 }}
                      >
                        Back
                      </Button>
                    </Box>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>
    </Box>
  );
}
