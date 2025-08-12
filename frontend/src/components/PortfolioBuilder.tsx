import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  DragIndicator,
  AccountBalance,
  Close,
} from '@mui/icons-material';
import {
  getPortfolios,
  getAccounts,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  addAccountToPortfolio,
  removeAccountFromPortfolio,
  getPortfolioSummary,
  type Portfolio,
  type Account,
} from '../services/api';

interface PortfolioFormData {
  name: string;
  description: string;
  strategy: string;
  riskLevel: string;
}

interface PortfolioWithAccounts extends Portfolio {
  accounts?: Account[];
  totalValue?: number;
  totalStocks?: number;
}

interface DragState {
  isDragging: boolean;
  draggedAccount: Account | null;
  dragOverPortfolio: string | null;
}

const strategies = [
  { value: 'growth', label: 'Growth Strategy' },
  { value: 'value', label: 'Value Investing' },
  { value: 'dividend', label: 'Dividend Focused' },
  { value: 'balanced', label: 'Balanced Portfolio' },
  { value: 'aggressive', label: 'Aggressive Growth' },
  { value: 'conservative', label: 'Conservative' },
];

const riskLevels = [
  { value: 'low', label: 'Low Risk', color: 'success' },
  { value: 'medium', label: 'Medium Risk', color: 'warning' },
  { value: 'high', label: 'High Risk', color: 'error' },
];

export default function PortfolioBuilder() {
  const [portfolios, setPortfolios] = useState<PortfolioWithAccounts[]>([]);
  const [unassignedAccounts, setUnassignedAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  
  const [formData, setFormData] = useState<PortfolioFormData>({
    name: '',
    description: '',
    strategy: '',
    riskLevel: '',
  });

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedAccount: null,
    dragOverPortfolio: null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [portfoliosResponse, accountsResponse] = await Promise.all([
        getPortfolios(),
        getAccounts(),
      ]);

      const portfoliosData = portfoliosResponse.data;
      const accountsData = accountsResponse.data;

      // Fetch portfolio summaries to get accounts and totals
      const portfoliosWithAccounts = await Promise.all(
        portfoliosData.map(async (portfolio) => {
          try {
            const summaryResponse = await getPortfolioSummary(portfolio.id);
            const summary = summaryResponse.data;
            return {
              ...portfolio,
              accounts: summary.accounts || [],
              totalValue: summary.totalValue || 0,
              totalStocks: summary.totalStocks || 0,
            };
          } catch {
            return {
              ...portfolio,
              accounts: [],
              totalValue: 0,
              totalStocks: 0,
            };
          }
        })
      );

      // Find unassigned accounts
      const assignedAccountIds = portfoliosWithAccounts
        .flatMap(p => p.accounts?.map((a: Account) => a.id) || []);
      const unassigned = accountsData.filter(
        account => !assignedAccountIds.includes(account.id)
      );

      setPortfolios(portfoliosWithAccounts);
      setUnassignedAccounts(unassigned);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async () => {
    try {
      await createPortfolio(formData);
      setCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create portfolio');
    }
  };

  const handleUpdatePortfolio = async () => {
    if (!editingPortfolio) return;
    
    try {
      await updatePortfolio(editingPortfolio.id, formData);
      setEditingPortfolio(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update portfolio');
    }
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    if (!window.confirm('Are you sure you want to delete this portfolio?')) return;
    
    try {
      await deletePortfolio(portfolioId);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete portfolio');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      strategy: '',
      riskLevel: '',
    });
  };

  const openEditDialog = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio);
    setFormData({
      name: portfolio.name,
      description: portfolio.description,
      strategy: portfolio.strategy,
      riskLevel: portfolio.riskLevel,
    });
    setCreateDialogOpen(true);
  };

  const closeDialog = () => {
    setCreateDialogOpen(false);
    setEditingPortfolio(null);
    resetForm();
  };

  // Drag and Drop handlers
  const handleDragStart = (account: Account) => {
    setDragState({
      isDragging: true,
      draggedAccount: account,
      dragOverPortfolio: null,
    });
  };

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      draggedAccount: null,
      dragOverPortfolio: null,
    });
  };

  const handleDragOver = (portfolioId: string) => {
    setDragState(prev => ({
      ...prev,
      dragOverPortfolio: portfolioId,
    }));
  };

  const handleDrop = async (portfolioId: string) => {
    const { draggedAccount } = dragState;
    if (!draggedAccount) return;

    try {
      await addAccountToPortfolio(portfolioId, draggedAccount.id);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add account to portfolio');
    }

    handleDragEnd();
  };

  const handleRemoveAccount = async (portfolioId: string, accountId: string) => {
    try {
      await removeAccountFromPortfolio(portfolioId, accountId);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove account from portfolio');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRiskLevelColor = (riskLevel: string) => {
    const risk = riskLevels.find(r => r.value === riskLevel);
    return risk?.color || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Portfolio Builder</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Portfolio
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box display="flex" gap={3}>
        {/* Unassigned Accounts */}
        <Box flex={1} minWidth="300px">
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Available Accounts ({unassignedAccounts.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {unassignedAccounts.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="body2" color="text.secondary">
                  All accounts are assigned to portfolios
                </Typography>
              </Box>
            ) : (
              <List dense>
                {unassignedAccounts.map((account) => (
                  <ListItem
                    key={account.id}
                    sx={{
                      cursor: 'grab',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                    draggable
                    onDragStart={() => handleDragStart(account)}
                    onDragEnd={handleDragEnd}
                  >
                    <ListItemIcon>
                      <DragIndicator />
                    </ListItemIcon>
                    <ListItemText
                      primary={account.name}
                      secondary={formatCurrency(account.balance)}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Box>

        {/* Portfolios */}
        <Box flex={2}>
          <Box display="flex" flexDirection="column" gap={2}>
            {portfolios.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No portfolios created yet
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Create your first portfolio to organize your accounts
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Create Portfolio
                </Button>
              </Paper>
            ) : (
              portfolios.map((portfolio) => (
                <Paper
                  key={portfolio.id}
                  sx={{
                    p: 2,
                    border: dragState.dragOverPortfolio === portfolio.id ? 2 : 1,
                    borderColor: dragState.dragOverPortfolio === portfolio.id ? 'primary.main' : 'divider',
                    backgroundColor: dragState.dragOverPortfolio === portfolio.id ? 'action.hover' : 'background.paper',
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    handleDragOver(portfolio.id);
                  }}
                  onDrop={() => handleDrop(portfolio.id)}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6">{portfolio.name}</Typography>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {portfolio.description}
                      </Typography>
                      <Box display="flex" gap={1}>
                        <Chip
                          label={strategies.find(s => s.value === portfolio.strategy)?.label || portfolio.strategy}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={riskLevels.find(r => r.value === portfolio.riskLevel)?.label || portfolio.riskLevel}
                          size="small"
                          color={getRiskLevelColor(portfolio.riskLevel) as any}
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    <Box display="flex" gap={1}>
                      <IconButton size="small" onClick={() => openEditDialog(portfolio)}>
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeletePortfolio(portfolio.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Portfolio Stats */}
                  <Box display="flex" gap={3} mb={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Value
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(portfolio.totalValue || 0)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Accounts
                      </Typography>
                      <Typography variant="h6">
                        {portfolio.accounts?.length || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Holdings
                      </Typography>
                      <Typography variant="h6">
                        {portfolio.totalStocks || 0}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Accounts in Portfolio */}
                  <Typography variant="subtitle2" gutterBottom>
                    Accounts
                  </Typography>
                  {portfolio.accounts && portfolio.accounts.length > 0 ? (
                    <List dense>
                      {portfolio.accounts.map((account) => (
                        <ListItem
                          key={account.id}
                          sx={{
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 1,
                          }}
                        >
                          <ListItemIcon>
                            <AccountBalance />
                          </ListItemIcon>
                          <ListItemText
                            primary={account.name}
                            secondary={formatCurrency(account.balance)}
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveAccount(portfolio.id, account.id)}
                          >
                            <Close />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box
                      sx={{
                        border: 2,
                        borderStyle: 'dashed',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 3,
                        textAlign: 'center',
                        backgroundColor: 'action.hover',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Drag accounts here to add them to this portfolio
                      </Typography>
                    </Box>
                  )}
                </Paper>
              ))
            )}
          </Box>
        </Box>
      </Box>

      {/* Create/Edit Portfolio Dialog */}
      <Dialog open={createDialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPortfolio ? 'Edit Portfolio' : 'Create New Portfolio'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Portfolio Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Strategy</InputLabel>
            <Select
              value={formData.strategy}
              onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
              label="Strategy"
              required
            >
              {strategies.map((strategy) => (
                <MenuItem key={strategy.value} value={strategy.value}>
                  {strategy.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Risk Level</InputLabel>
            <Select
              value={formData.riskLevel}
              onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value })}
              label="Risk Level"
              required
            >
              {riskLevels.map((risk) => (
                <MenuItem key={risk.value} value={risk.value}>
                  {risk.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            onClick={editingPortfolio ? handleUpdatePortfolio : handleCreatePortfolio}
            variant="contained"
            disabled={!formData.name || !formData.strategy || !formData.riskLevel}
          >
            {editingPortfolio ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
