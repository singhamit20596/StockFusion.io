import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AddAccount from './components/AddAccount';
import PortfolioBuilder from './components/PortfolioBuilder';
import CSVOperations from './components/CSVOperations';
import GrowwCallback from './components/GrowwCallback';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#2e7d32',
    },
    error: {
      main: '#d32f2f',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  const [dashboardKey, setDashboardKey] = useState(0);
  const [layoutKey, setLayoutKey] = useState(0);

  const handleDataRefresh = () => {
    // Force Dashboard component to re-render by changing its key
    setDashboardKey(prev => prev + 1);
  };

  const handleAccountCreated = () => {
    // Force both Layout and Dashboard to refresh when an account is created
    setLayoutKey(prev => prev + 1);
    setDashboardKey(prev => prev + 1);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* OAuth callback route - standalone page */}
          <Route path="/auth/groww/callback" element={<GrowwCallback />} />
          
          {/* Main application routes with layout */}
          <Route path="/*" element={
            <Box sx={{ display: 'flex', minHeight: '100vh' }}>
              <MainAppRoutes 
                layoutKey={layoutKey}
                dashboardKey={dashboardKey}
                onDataRefresh={handleDataRefresh}
                onAccountCreated={handleAccountCreated}
              />
            </Box>
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

// Separate component for main app routes with layout
function MainAppRoutes({ layoutKey, dashboardKey, onDataRefresh, onAccountCreated }: {
  layoutKey: number;
  dashboardKey: number;
  onDataRefresh: () => void;
  onAccountCreated: () => void;
}) {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard key={dashboardKey} />;
      case 'add-account':
        return <AddAccount onAccountCreated={onAccountCreated} />;
      case 'portfolio-builder':
        return <PortfolioBuilder />;
      case 'csv-operations':
        return <CSVOperations />;
      default:
        return <Dashboard key={dashboardKey} />;
    }
  };

  return (
    <Layout 
      key={layoutKey}
      currentPage={currentPage} 
      onPageChange={setCurrentPage}
      onDataRefresh={onDataRefresh}
    >
      {renderCurrentPage()}
    </Layout>
  );
}

export default App;
