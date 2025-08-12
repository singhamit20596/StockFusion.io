import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AddAccount from './components/AddAccount';
import PortfolioBuilder from './components/PortfolioBuilder';

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
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'add-account':
        return <AddAccount />;
      case 'portfolio-builder':
        return <PortfolioBuilder />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
          {renderCurrentPage()}
        </Layout>
      </Box>
    </ThemeProvider>
  );
}

export default App;
