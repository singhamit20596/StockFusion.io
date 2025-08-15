import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Snackbar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  AccountBalance,
  Add,
  TrendingUp,
  Sync,
  Schedule,
  Error as ErrorIcon,
  CheckCircle,
  ImportExport,
} from '@mui/icons-material';
import { getAccounts, getSyncStatus, syncAccount, type Account, type SyncStatus } from '../services/api';

const drawerWidth = 280;

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  onDataRefresh?: () => void; // Add callback for refreshing dashboard
  selectedAccountId?: string; // Add selected account state
  onAccountSelect?: (accountId: string, accountName?: string) => void; // Add account selection callback
}

interface AccountWithSync extends Account {
  syncStatus?: SyncStatus;
}

interface SyncState {
  [accountId: string]: {
    isLoading: boolean;
    error: string | null;
  };
}

export default function Layout({ children, currentPage, onPageChange, onDataRefresh, selectedAccountId, onAccountSelect }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accounts, setAccounts] = useState<AccountWithSync[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStates, setSyncStates] = useState<SyncState>({});
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  useEffect(() => {
    fetchAccountsWithSyncStatus();
  }, []);

  const fetchAccountsWithSyncStatus = async () => {
    try {
      setLoading(true);
      const accountsResponse = await getAccounts();
      const accountsData = accountsResponse.data.data;

      // Fetch sync status for each account
      const accountsWithSync = await Promise.all(
        accountsData.map(async (account) => {
          try {
            const syncResponse = await getSyncStatus(account.id);
            return {
              ...account,
              syncStatus: syncResponse.data.data,
            };
          } catch {
            // If sync status fails, just return account without sync data
            return account;
          }
        })
      );

      setAccounts(accountsWithSync);
    } catch (err) {
      setError('Failed to fetch accounts');
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAccount = async (accountId: string, accountName: string) => {
    // Set loading state for this account
    setSyncStates(prev => ({
      ...prev,
      [accountId]: { isLoading: true, error: null }
    }));

    try {
      const response = await syncAccount(accountId);
      
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: `Successfully synced ${accountName}`,
          severity: 'success',
        });
        
        // Refresh accounts data
        await fetchAccountsWithSyncStatus();
        
        // Trigger dashboard refresh if callback is provided
        if (onDataRefresh) {
          onDataRefresh();
        }
      } else {
        throw new Error(response.data.message || 'Sync failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to sync account';
      
      setSyncStates(prev => ({
        ...prev,
        [accountId]: { isLoading: false, error: errorMessage }
      }));
      
      setSnackbar({
        open: true,
        message: `Failed to sync ${accountName}: ${errorMessage}`,
        severity: 'error',
      });
    } finally {
      setSyncStates(prev => ({
        ...prev,
        [accountId]: { ...prev[accountId], isLoading: false }
      }));
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const getTotalInvestment = () => {
    return accounts.reduce((total, account) => {
      return total + (account.syncStatus?.totalInvestment || 0);
    }, 0);
  };

  const getTotalValue = () => {
    return accounts.reduce((total, account) => {
      return total + (account.syncStatus?.totalValue || 0);
    }, 0);
  };

  const getTotalProfitLoss = () => {
    return accounts.reduce((total, account) => {
      return total + (account.syncStatus?.totalProfitLoss || 0);
    }, 0);
  };

  const getTotalProfitLossPercentage = () => {
    const totalInvestment = getTotalInvestment();
    const totalProfitLoss = getTotalProfitLoss();
    return totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;
  };

  const getLastSyncDate = () => {
    const lastSyncs = accounts
      .map(account => account.syncStatus?.lastSyncedAt)
      .filter(Boolean)
      .sort()
      .reverse();
    
    return lastSyncs.length > 0 ? new Date(lastSyncs[0]!).toLocaleDateString() : 'Never';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Dashboard /> },
    { id: 'add-account', label: 'Add Account', icon: <Add /> },
    { id: 'scraping-test', label: 'Real-time Scraping', icon: <TrendingUp /> },
    { id: 'portfolio-builder', label: 'Portfolio Builder', icon: <TrendingUp /> },
    { id: 'csv-operations', label: 'CSV Import/Export', icon: <ImportExport /> },
  ];

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Investment Portfolio
        </Typography>
      </Toolbar>
      <Divider />

      {/* Portfolio Summary */}
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Portfolio Summary
        </Typography>
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Total Investment
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatCurrency(getTotalInvestment())}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Current Value
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatCurrency(getTotalValue())}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Total P&L
              </Typography>
              <Typography
                variant="body2"
                fontWeight="bold"
                color={getTotalProfitLoss() >= 0 ? 'success.main' : 'error.main'}
              >
                {formatCurrency(getTotalProfitLoss())}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Overall P&L%
              </Typography>
              <Typography
                variant="body2"
                fontWeight="bold"
                color={getTotalProfitLossPercentage() >= 0 ? 'success.main' : 'error.main'}
              >
                {getTotalProfitLossPercentage() >= 0 ? '+' : ''}{getTotalProfitLossPercentage().toFixed(2)}%
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box display="flex" alignItems="center" gap={1}>
              <Schedule fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Last sync: {getLastSyncDate()}
              </Typography>
            </Box>
          </Paper>
        )}
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={currentPage === item.id}
              onClick={() => onPageChange(item.id)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Accounts List */}
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Accounts ({accounts.length})
        </Typography>
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={20} />
          </Box>
        ) : (
          <List dense>
            {accounts
              .sort((a, b) => new Date((b as any).createdAt || (b as any).updatedAt || 0).getTime() - new Date((a as any).createdAt || (a as any).updatedAt || 0).getTime())
              .map((account) => (
              <ListItem
                key={account.id}
                sx={{ px: 0 }}
                secondaryAction={
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {syncStates[account.id]?.error && (
                      <Tooltip title={syncStates[account.id].error}>
                        <ErrorIcon fontSize="small" color="error" />
                      </Tooltip>
                    )}
                    <Tooltip title="Sync Account">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSyncAccount(account.id, account.name);
                        }}
                        disabled={syncStates[account.id]?.isLoading || !account.syncStatus?.hasGrowwData}
                        color="primary"
                      >
                        {syncStates[account.id]?.isLoading ? (
                          <CircularProgress size={16} />
                        ) : (
                          <Sync fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <ListItemButton 
                  onClick={() => {
                    onAccountSelect?.(account.id, account.name);
                  }}
                  selected={selectedAccountId === account.id}
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemIcon>
                    <AccountBalance fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" fontWeight="medium">
                        {account.name}
                      </Typography>
                      {account.syncStatus?.hasGrowwData && (
                        <Chip
                          label="Synced"
                          size="small"
                          color="success"
                          variant="outlined"
                          icon={<CheckCircle fontSize="small" />}
                        />
                      )}
                      {syncStates[account.id]?.error && (
                        <Chip
                          label="Error"
                          size="small"
                          color="error"
                          variant="outlined"
                          icon={<ErrorIcon fontSize="small" />}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {formatCurrency(account.syncStatus?.totalValue || account.balance)}
                      </Typography>
                      {account.syncStatus && account.syncStatus.totalSyncedStocks > 0 && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {account.syncStatus.totalSyncedStocks} stocks
                        </Typography>
                      )}
                      {account.syncStatus?.lastSyncedAt && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Last sync: {new Date(account.syncStatus.lastSyncedAt).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {menuItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>

      {/* Snackbar for sync notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
