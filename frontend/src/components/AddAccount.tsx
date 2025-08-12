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
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AccountBalance,
  TrendingUp,
  Security,
  CheckCircle,
} from '@mui/icons-material';
import { createAccount, syncWithGroww, type SyncCredentials, type SyncResponse } from '../services/api';

interface AccountFormData {
  name: string;
  type: string;
  balance: number;
  brokerType: string;
}

interface GrowwCredentials {
  username: string;
  password: string;
  pin: string;
  otp: string;
}

const brokerTypes = [
  { value: 'groww', label: 'Groww', icon: '🌱' },
  { value: 'zerodha', label: 'Zerodha', icon: '📈', disabled: true },
  { value: 'angelone', label: 'Angel One', icon: '👼', disabled: true },
  { value: 'manual', label: 'Manual Entry', icon: '✍️' },
];

const accountTypes = [
  { value: 'investment', label: 'Investment Account' },
  { value: 'trading', label: 'Trading Account' },
  { value: 'retirement', label: 'Retirement Account' },
  { value: 'savings', label: 'Savings Account' },
];

export default function AddAccount() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [syncResponse, setSyncResponse] = useState<SyncResponse | null>(null);

  const [accountData, setAccountData] = useState<AccountFormData>({
    name: '',
    type: 'investment',
    balance: 0,
    brokerType: '',
  });

  const [growwCredentials, setGrowwCredentials] = useState<GrowwCredentials>({
    username: '',
    password: '',
    pin: '',
    otp: '',
  });

  const steps = [
    'Account Information',
    'Broker Selection',
    'Credentials & Sync',
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

  const handleCredentialsChange = (field: keyof GrowwCredentials) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setGrowwCredentials({ ...growwCredentials, [field]: event.target.value });
  };

  const handleCreateAccount = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create the account first
      const accountResponse = await createAccount({
        name: accountData.name,
        type: accountData.type,
        balance: accountData.balance,
      });

      const newAccountId = accountResponse.data.id;

      // If Groww is selected, sync the account
      if (accountData.brokerType === 'groww') {
        const syncCredentials: SyncCredentials = {
          username: growwCredentials.username,
          password: growwCredentials.password,
          pin: growwCredentials.pin,
          otp: growwCredentials.otp || undefined,
        };

        const syncResult = await syncWithGroww(newAccountId, syncCredentials);
        setSyncResponse(syncResult.data);
        
        if (syncResult.data.success) {
          setSuccess('Account created and synced successfully!');
        } else {
          setError(syncResult.data.message || 'Sync failed');
        }
      } else {
        setSuccess('Account created successfully!');
      }

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
      type: 'investment',
      balance: 0,
      brokerType: '',
    });
    setGrowwCredentials({
      username: '',
      password: '',
      pin: '',
      otp: '',
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
        return accountData.name.trim() !== '' && accountData.balance >= 0;
      case 1:
        return accountData.brokerType !== '';
      case 2:
        if (accountData.brokerType === 'groww') {
          return (
            growwCredentials.username.trim() !== '' &&
            growwCredentials.password.trim() !== '' &&
            growwCredentials.pin.trim() !== ''
          );
        }
        return true;
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
              placeholder="e.g., Main Trading Account"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Account Type</InputLabel>
              <Select
                value={accountData.type}
                onChange={handleAccountDataChange('type')}
                label="Account Type"
              >
                {accountTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Initial Balance"
              type="number"
              value={accountData.balance}
              onChange={handleAccountDataChange('balance')}
              margin="normal"
              helperText="This will be updated after sync for broker accounts"
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
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
                <Typography variant="h6">Groww Login Credentials</Typography>
              </Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Your credentials are used only for syncing and are never stored.
              </Alert>
              
              <TextField
                fullWidth
                label="Email/Username"
                value={growwCredentials.username}
                onChange={handleCredentialsChange('username')}
                margin="normal"
                required
                type="email"
              />
              
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={growwCredentials.password}
                onChange={handleCredentialsChange('password')}
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="PIN"
                type={showPin ? 'text' : 'password'}
                value={growwCredentials.pin}
                onChange={handleCredentialsChange('pin')}
                margin="normal"
                required
                inputProps={{ maxLength: 6 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPin(!showPin)}
                        edge="end"
                      >
                        {showPin ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="OTP (if required)"
                value={growwCredentials.otp}
                onChange={handleCredentialsChange('otp')}
                margin="normal"
                inputProps={{ maxLength: 6 }}
                helperText="Leave empty if not prompted for OTP"
              />
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
                        onClick={index === steps.length - 2 ? handleCreateAccount : handleNext}
                        disabled={!isStepValid(index) || loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                      >
                        {index === steps.length - 2 ? 'Create Account' : 'Continue'}
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
