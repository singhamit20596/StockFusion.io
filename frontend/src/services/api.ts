import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds default timeout
});

// Create a separate instance for long-running operations like sync
const syncApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 600000, // 10 minutes timeout for sync operations
});

// Types
export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  metadata?: {
    totalInvestment?: number;
    totalProfitLoss?: number;
    lastSyncedAt?: string;
    source?: string;
  };
}

export interface Stock {
  id: string;
  accountId: string;
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  sector: string;
  exchange: string;
  currentValue: number;
  initialValue: number;
  gainLoss: {
    absolute: number;
    percentage: number;
  };
  metadata?: {
    source?: string;
    profitLossPercentage?: number;
    dailyChangePercentage?: number;
    marketCap?: string;
    subSector?: string;
    scrapedAt?: string;
  };
}

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  strategy: string;
  riskLevel: string;
}

export interface SyncCredentials {
  username: string;
  password: string;
  pin: string;
  otp?: string;
}

export interface SyncResponse {
  success: boolean;
  message: string;
  data?: {
    account: Account;
    stocks: Stock[];
    summary: {
      totalStocks: number;
      totalValue: number;
      totalInvestment: number;
      totalProfitLoss: number;
      syncedAt: string;
    };
    isMockData?: boolean;
  };
  error?: string;
  requiresOTP?: boolean;
}

export interface SyncStatus {
  accountId: string;
  accountName: string;
  lastSyncedAt?: string;
  totalSyncedStocks: number;
  hasGrowwData: boolean;
  totalValue: number;
  totalInvestment: number;
  totalProfitLoss: number;
}

// API Functions

// API Health
export const getHealth = () => api.get('/health');

// Accounts
export const getAccounts = () => api.get<{success: boolean; data: Account[]; count: number}>('/api/accounts');
export const getAccount = (id: string) => api.get<{success: boolean; data: Account}>(`/api/accounts/${id}`);
export const createAccount = (account: Omit<Account, 'id'>) => api.post<{success: boolean; data: Account}>('/api/accounts', account);
export const updateAccount = (id: string, account: Partial<Account>) => api.put<{success: boolean; data: Account}>(`/api/accounts/${id}`, account);
export const deleteAccount = (id: string) => api.delete(`/api/accounts/${id}`);
export const getAccountSummary = (id: string) => api.get(`/api/accounts/${id}/summary`);

// Groww Integration (using longer timeout)
export const syncWithGroww = (accountId: string, credentials: SyncCredentials) =>
  syncApi.post<SyncResponse>(`/api/accounts/${accountId}/sync`, credentials);
export const syncAccount = (accountId: string, options?: { automated?: boolean }) =>
  syncApi.post<SyncResponse>(`/api/accounts/${accountId}/sync`, options || {});
export const getSyncStatus = (accountId: string) =>
  api.get<{ success: boolean; data: SyncStatus }>(`/api/accounts/${accountId}/sync/status`);
export const clearSyncData = (accountId: string) =>
  api.delete(`/api/accounts/${accountId}/sync`);

// OAuth Integration
export const initiateGrowwAuth = (accountId: string) =>
  api.post<{ success: boolean; data: { authUrl: string; state: string; redirectUri: string } }>(`/api/accounts/${accountId}/auth/groww`);
export const handleGrowwCallback = (accountId: string, code: string, state: string) =>
  api.post<{ success: boolean; data: { accountId: string; authenticated: boolean } }>(`/api/accounts/${accountId}/auth/groww/callback`, { code, state });

// Stocks
export const getStocks = () => api.get<{success: boolean; data: Stock[]; count: number}>('/api/stocks');
export const getStock = (id: string) => api.get<{success: boolean; data: Stock}>(`/api/stocks/${id}`);
export const getStocksByAccount = (accountId: string) => api.get<{success: boolean; data: Stock[]}>(`/api/stocks/account/${accountId}`);
export const getStocksBySymbol = () => api.get('/api/stocks/symbols');
export const createStock = (stock: Omit<Stock, 'id'>) => api.post<{success: boolean; data: Stock}>('/api/stocks', stock);
export const updateStock = (id: string, stock: Partial<Stock>) => api.put<{success: boolean; data: Stock}>(`/api/stocks/${id}`, stock);
export const deleteStock = (id: string) => api.delete(`/api/stocks/${id}`);
export const updateStockPrice = (id: string, price: number) => 
  api.patch(`/api/stocks/${id}/price`, { currentPrice: price });

// Portfolios
export const getPortfolios = () => api.get<Portfolio[]>('/api/portfolios');
export const getPortfolio = (id: string) => api.get<Portfolio>(`/api/portfolios/${id}`);
export const createPortfolio = (portfolio: Omit<Portfolio, 'id'>) => api.post<Portfolio>('/api/portfolios', portfolio);
export const updatePortfolio = (id: string, portfolio: Partial<Portfolio>) => api.put<Portfolio>(`/api/portfolios/${id}`, portfolio);
export const deletePortfolio = (id: string) => api.delete(`/api/portfolios/${id}`);
export const getPortfolioSummary = (id: string) => api.get(`/api/portfolios/${id}/summary`);
export const addAccountToPortfolio = (portfolioId: string, accountId: string) =>
  api.post(`/api/portfolios/${portfolioId}/accounts`, { accountId });
export const removeAccountFromPortfolio = (portfolioId: string, accountId: string) =>
  api.delete(`/api/portfolios/${portfolioId}/accounts/${accountId}`);

export default api;
