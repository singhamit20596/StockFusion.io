import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Stock, getStocks, getAccounts } from '../services/api';
import { TrendingUp, TrendingDown, AccountBalance, ShowChart } from '@mui/icons-material';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardStats {
  totalValue: number;
  totalInvestment: number;
  totalProfitLoss: number;
  totalStocks: number;
  totalAccounts: number;
  profitLossPercentage: number;
}

interface SectorData {
  [sector: string]: {
    value: number;
    stocks: number;
    investment: number;
  };
}

interface MarketCapData {
  [cap: string]: {
    value: number;
    stocks: number;
  };
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalValue: 0,
    totalInvestment: 0,
    totalProfitLoss: 0,
    totalStocks: 0,
    totalAccounts: 0,
    profitLossPercentage: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stocksResponse, accountsResponse] = await Promise.all([
        getStocks(),
        getAccounts(),
      ]);

      const stocksData = stocksResponse.data.data;
      const accountsData = accountsResponse.data.data;

      setStocks(stocksData);

      // Calculate stats
      const totalValue = stocksData.reduce((sum: number, stock: Stock) => sum + stock.currentValue, 0);
      const totalInvestment = stocksData.reduce((sum: number, stock: Stock) => sum + stock.initialValue, 0);
      const totalProfitLoss = totalValue - totalInvestment;
      const profitLossPercentage = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

      setStats({
        totalValue,
        totalInvestment,
        totalProfitLoss,
        totalStocks: stocksData.length,
        totalAccounts: accountsData.length,
        profitLossPercentage,
      });
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
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

  const getSectorData = (): SectorData => {
    return stocks.reduce((acc, stock) => {
      const sector = stock.sector || 'Unknown';
      if (!acc[sector]) {
        acc[sector] = { value: 0, stocks: 0, investment: 0 };
      }
      acc[sector].value += stock.currentValue;
      acc[sector].investment += stock.initialValue;
      acc[sector].stocks += 1;
      return acc;
    }, {} as SectorData);
  };

  const getMarketCapData = (): MarketCapData => {
    return stocks.reduce((acc, stock) => {
      const marketCap = stock.metadata?.marketCap || 'Unknown';
      if (!acc[marketCap]) {
        acc[marketCap] = { value: 0, stocks: 0 };
      }
      acc[marketCap].value += stock.currentValue;
      acc[marketCap].stocks += 1;
      return acc;
    }, {} as MarketCapData);
  };

  const getSubSectorData = () => {
    const subSectorData = stocks.reduce((acc, stock) => {
      const subSector = stock.metadata?.subSector || 'Unknown';
      if (!acc[subSector]) {
        acc[subSector] = 0;
      }
      acc[subSector] += stock.currentValue;
      return acc;
    }, {} as { [subSector: string]: number });

    return Object.entries(subSectorData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Top 10 sub-sectors
  };

  const sectorChartData = () => {
    const sectorData = getSectorData();
    const sectors = Object.keys(sectorData);
    const values = sectors.map(sector => sectorData[sector].value);

    return {
      labels: sectors,
      datasets: [
        {
          data: values,
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#FF6384',
            '#C9CBCF',
          ],
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    };
  };

  const marketCapChartData = () => {
    const marketCapData = getMarketCapData();
    const caps = Object.keys(marketCapData);
    const values = caps.map(cap => marketCapData[cap].value);

    return {
      labels: caps,
      datasets: [
        {
          data: values,
          backgroundColor: [
            '#4CAF50',
            '#2196F3',
            '#FF9800',
            '#F44336',
            '#9C27B0',
          ],
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    };
  };

  const subSectorChartData = () => {
    const subSectorData = getSubSectorData();
    const labels = subSectorData.map(([subSector]) => subSector);
    const values = subSectorData.map(([, value]) => value);

    return {
      labels,
      datasets: [
        {
          label: 'Investment Value',
          data: values,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const value = context.parsed || context.raw;
            return `${context.label}: ${formatCurrency(value)}`;
          },
        },
      },
    },
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return formatCurrency(value);
          },
        },
      },
    },
    plugins: {
      ...chartOptions.plugins,
      legend: {
        display: false,
      },
    },
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
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Portfolio Dashboard
      </Typography>

      {/* Stats Cards */}
      <Box display="flex" flexDirection="row" flexWrap="wrap" gap={2} sx={{ mb: 4 }}>
        <Box flex={1} minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Value
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(stats.totalValue)}
                  </Typography>
                </Box>
                <ShowChart color="primary" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box flex={1} minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Investment
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(stats.totalInvestment)}
                  </Typography>
                </Box>
                <AccountBalance color="secondary" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box flex={1} minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Profit/Loss
                  </Typography>
                  <Typography 
                    variant="h5" 
                    color={stats.totalProfitLoss >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(stats.totalProfitLoss)}
                  </Typography>
                  <Chip
                    label={`${stats.profitLossPercentage >= 0 ? '+' : ''}${stats.profitLossPercentage.toFixed(2)}%`}
                    color={stats.profitLossPercentage >= 0 ? 'success' : 'error'}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                {stats.totalProfitLoss >= 0 ? (
                  <TrendingUp color="success" fontSize="large" />
                ) : (
                  <TrendingDown color="error" fontSize="large" />
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box flex={1} minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Holdings
                  </Typography>
                  <Typography variant="h5">
                    {stats.totalStocks}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    in {stats.totalAccounts} accounts
                  </Typography>
                </Box>
                <AccountBalance color="info" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Charts */}
      <Box display="flex" flexDirection="row" flexWrap="wrap" gap={3}>
        <Box flex={1} minWidth="400px">
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Sector Allocation
            </Typography>
            {Object.keys(getSectorData()).length > 0 ? (
              <Box height={300}>
                <Doughnut data={sectorChartData()} options={chartOptions} />
              </Box>
            ) : (
              <Box display="flex" alignItems="center" justifyContent="center" height={300}>
                <Typography variant="body2" color="textSecondary">
                  No sector data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        <Box flex={1} minWidth="400px">
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Market Cap Distribution
            </Typography>
            {Object.keys(getMarketCapData()).length > 0 ? (
              <Box height={300}>
                <Doughnut data={marketCapChartData()} options={chartOptions} />
              </Box>
            ) : (
              <Box display="flex" alignItems="center" justifyContent="center" height={300}>
                <Typography variant="body2" color="textSecondary">
                  No market cap data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        <Box width="100%">
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Top Sub-Sectors by Investment Value
            </Typography>
            {getSubSectorData().length > 0 ? (
              <Box height={300}>
                <Bar data={subSectorChartData()} options={barChartOptions} />
              </Box>
            ) : (
              <Box display="flex" alignItems="center" justifyContent="center" height={300}>
                <Typography variant="body2" color="textSecondary">
                  No sub-sector data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
