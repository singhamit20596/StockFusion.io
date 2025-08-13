import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
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
import { createAccount, syncAccount, type SyncResponse } from '../services/api';

interface AddAccountProps {
  onAccountCreated?: () => void;
}

interface AccountFormData {
  name: string;
  brokerType: string;
}

const brokerTypes = [
  { value: 'groww', label: 'Groww', icon: '🌱' },
  { value: 'zerodha', label: 'Zerodha', icon: '📈', disabled: true },
  { value: 'angelone', label: 'Angel One', icon: '👼', disabled: true },
  { value: 'manual', label: 'Manual Entry', icon: '✍️' },
];

export default function AddAccount({ onAccountCreated }: AddAccountProps = {}) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [syncResponse, setSyncResponse] = useState<SyncResponse | null>(null);
  
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

  const steps = [
    'Account Information',
    'Broker Selection',
    'Groww Login & Sync',
    'Confirmation',
  ];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
    setError(null);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError(null);
  };

  const handleAccountDataChange = (field: keyof AccountFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string } }
  ) => {
    setAccountData({ ...accountData, [field]: event.target.value });
  };

  const handleGrowwLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, create the account
      const accountResponse = await createAccount({
        name: accountData.name,
        type: 'investment',
        balance: 0,
      });

      const newAccountId = accountResponse.data.data.id;
      
      setSuccess('✅ Account created! Starting browser for Groww login...');

      // Start the new automated flow - backend will open browser for user login
      await handleAutomatedScraping(newAccountId);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account');
      setLoading(false);
    }
  };

  const handleAutomatedScraping = async (accountId: string) => {
    // Skip the popup flow and go directly to automated scraping
    // The backend will now open a browser window for user login
    await handlePostLoginSync(accountId);
  };

  const handlePostLoginSync = async (accountId: string) => {
    let progressInterval: NodeJS.Timeout | null = null;
    
    try {
      // Initialize progress tracking for real-time scraping
      setScrapingProgress({
        percentage: 0,
        message: 'Preparing automated scraping...',
        isActive: true
      });

      setSuccess('🤖 Starting automated portfolio scraping...\n\n⏱️ This will take a few moments...');

      // Start progress simulation with realistic updates
      progressInterval = setInterval(() => {
        setScrapingProgress(prev => {
          if (prev.percentage < 95) {
            const increment = Math.random() * 8 + 3; // Random increment between 3-11%
            const newPercentage = Math.min(prev.percentage + increment, 95);
            
            let message = prev.message;
            if (newPercentage < 15) {
              message = '🚀 Initializing browser automation...';
            } else if (newPercentage < 30) {
              message = '🌱 Connecting to Groww platform...';
            } else if (newPercentage < 45) {
              message = '🔍 Detecting user session...';
            } else if (newPercentage < 60) {
              message = '📊 Navigating to Holdings page...';
            } else if (newPercentage < 80) {
              message = '� Scraping portfolio data...';
            } else if (newPercentage < 95) {
              message = '📈 Processing scraped holdings...';
            }

            return {
              ...prev,
              percentage: Math.round(newPercentage),
              message
            };
          }
          return prev;
        });
      }, 1200); // Update every 1.2 seconds

      // Trigger the automated sync process with real-time scraping
      console.log('🚀 Starting automated sync for account:', accountId);
      
      const syncResponse = await syncAccount(accountId, { automated: true });

      // Clear progress updates
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      // Complete progress
      setScrapingProgress({
        percentage: 100,
        message: '✅ Scraping completed successfully!',
        isActive: false
      });

      if (syncResponse.data.success) {
        setSyncResponse(syncResponse.data);
        
        const stockCount = syncResponse.data.data?.summary?.totalStocks || 0;
        const totalValue = syncResponse.data.data?.summary?.totalValue || 0;
        
        setSuccess(
          '🎉 Portfolio scraping completed successfully!\n\n' +
          `✅ Successfully imported ${stockCount} holdings from Groww\n` +
          `💰 Total portfolio value: ${formatCurrency(totalValue)}\n\n` +
          '🧹 Groww page closed automatically\n' +
          '📊 Your holdings are now available in the dashboard!'
        );
        
        // Show completion message for a moment, then proceed
        setTimeout(() => {
          onAccountCreated?.();
          handleNext();
        }, 3000);
        
      } else {
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        setScrapingProgress({
          percentage: 0,
          message: '',
          isActive: false
        });
        
        const errorMessage = syncResponse.data.message || 'Failed to sync account data';
        
        // Check for actual Puppeteer dependency issues (not login issues)
        if (errorMessage.includes('Puppeteer is not installed') || 
            errorMessage.includes('install puppeteer dependencies') ||
            errorMessage.includes('Real-time scraping functionality requires additional dependencies')) {
          setError(
            '⚠️ Real-time scraping not available\n\n' +
            '🔧 Puppeteer dependencies are required for live portfolio scraping.\n\n' +
            '💡 To enable real-time scraping:\n' +
            '1. Run: npm run install-scraping\n' +
            '2. Restart the application\n\n' +
            '📧 Contact support if you need assistance.'
          );
        } else {
          setError(errorMessage);
        }
      }
    } catch (err: any) {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setScrapingProgress({
        percentage: 0,
        message: '',
        isActive: false
      });
      
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      
      // Check for actual Puppeteer dependency issues (not login issues)
      if (errorMessage.includes('Puppeteer is not installed') || 
          errorMessage.includes('install puppeteer dependencies') ||
          errorMessage.includes('Real-time scraping functionality requires additional dependencies')) {
        setError(
          '⚠️ Real-time scraping not available\n\n' +
          '🔧 This feature requires Puppeteer dependencies.\n\n' +
          '💡 To enable real-time scraping:\n' +
          '• Run: npm run install-scraping\n' +
          '• Restart the application\n\n' +
          'Meanwhile, you can manually add stocks to your portfolio.'
        );
      } else {
        setError(`Failed to sync account data: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create the account
      const accountResponse = await createAccount({
        name: accountData.name,
        type: 'investment',
        balance: 0,
      });

      // For non-Groww accounts, just create and proceed
      setSuccess('Account created successfully!');
      onAccountCreated?.();
      handleNext();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setAccountData({
      name: '',
      brokerType: '',
    });
    setError(null);
    setSuccess(null);
    setSyncResponse(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return accountData.name.trim() !== '';
      case 1:
        return accountData.brokerType !== '';
      case 2:
        // For Groww, we just need the broker to be selected
        // Login happens via redirect
        return accountData.brokerType !== '';
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
              placeholder="e.g., My Groww Account"
              helperText="Choose a name to identify this account in your portfolio"
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
                <Typography variant="h6">Groww Authentication</Typography>
              </Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  🔒 Secure Groww Authentication
                </Typography>
                <Typography variant="body2">
                  • Click "Login with Groww" to open Groww's official login page<br/>
                  • Complete your login using your Groww credentials<br/>
                  • Your credentials are never stored on our servers<br/>
                  • After login, we'll automatically import your holdings
                </Typography>
              </Alert>
              
              <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGrowwLogin}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <TrendingUp />}
                  sx={{ 
                    py: 2,
                    background: 'linear-gradient(45deg, #00d09c 30%, #0074D9 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #00c792 30%, #0066c7 90%)',
                    }
                  }}
                >
                  {loading ? 'Opening Groww Login...' : '🌱 Login with Groww'}
                </Button>

                {/* Real-time scraping progress */}
                {scrapingProgress.isActive && (
                  <Box sx={{ mt: 2 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        🤖 Automated Portfolio Scraping in Progress
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {scrapingProgress.message}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={scrapingProgress.percentage} 
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            background: 'linear-gradient(45deg, #00d09c 30%, #0074D9 90%)'
                          }
                        }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {scrapingProgress.percentage}% completed
                      </Typography>
                    </Alert>
                  </Box>
                )}
                
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  By clicking above, you'll be taken to Groww's secure login page.
                  After successful authentication, your holdings will be automatically imported.
                </Typography>
              </Box>
            </Box>
          );
        } else if (accountData.brokerType === 'manual') {
          return (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info">
                Manual entry selected. You can add stocks manually after creating the account.
              </Alert>
            </Box>
          );
        } else {
          return (
            <Box sx={{ mt: 2 }}>
              <Alert severity="warning">
                This broker integration is coming soon. For now, you can create the account manually.
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
            
            {syncResponse && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Sync Results
                </Typography>
                
                {syncResponse.data && (
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <TrendingUp color="success" />
                        <Typography variant="h6">Portfolio Summary</Typography>
                        {syncResponse.data.isMockData && (
                          <Chip label="Demo Mode" size="small" color="info" />
                        )}
                      </Box>
                      
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          Total Stocks
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {syncResponse.data.summary.totalStocks}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          Total Value
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(syncResponse.data.summary.totalValue)}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          Total Investment
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(syncResponse.data.summary.totalInvestment)}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Profit/Loss
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color={syncResponse.data.summary.totalProfitLoss >= 0 ? 'success.main' : 'error.main'}
                        >
                          {formatCurrency(syncResponse.data.summary.totalProfitLoss)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                )}
                
                <Typography variant="body2" color="text.secondary">
                  Account created successfully! You can view your holdings in the dashboard.
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleReset}
                startIcon={<AccountBalance />}
              >
                Add Another Account
              </Button>
            </Box>
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

                <Box sx={{ mt: 2 }}>
                  {index === steps.length - 1 ? null : (
                    <Box>
                      <Button
                        variant="contained"
                        onClick={
                          index === 2 && accountData.brokerType === 'groww' 
                            ? handleGrowwLogin 
                            : index === steps.length - 2 
                              ? handleCreateAccount 
                              : handleNext
                        }
                        disabled={!isStepValid(index) || loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                      >
                        {index === 2 && accountData.brokerType === 'groww' 
                          ? (loading ? 'Redirecting...' : 'Login with Groww') 
                          : index === steps.length - 2 
                            ? 'Create Account' 
                            : 'Continue'
                        }
                      </Button>
                      <Button
                        disabled={index === 0 || loading}
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
