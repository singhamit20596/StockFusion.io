import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

const GrowwCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Groww login...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        // Check for errors from Groww
        if (error) {
          throw new Error(error);
        }

        // Verify state parameter for security
        const storedState = localStorage.getItem('growwAuthState');
        if (!state || state !== storedState) {
          throw new Error('Invalid state parameter - possible CSRF attack');
        }

        // Check if we have an authorization code
        if (!code) {
          throw new Error('No authorization code received');
        }

        // Send success message to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'GROWW_LOGIN_SUCCESS',
            authCode: code,
            state: state
          }, window.location.origin);
          
          setStatus('success');
          setMessage('Login successful! You can close this window.');
          
          // Auto-close after 2 seconds
          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          // Fallback for same-window navigation
          localStorage.setItem('growwAuthStatus', 'success');
          localStorage.setItem('growwAuthCode', code);
          
          // Redirect back to the main app
          window.location.href = '/add-account';
        }

      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Login failed');
        
        // Send error message to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'GROWW_LOGIN_ERROR',
            error: err.message
          }, window.location.origin);
          
          // Auto-close after 3 seconds
          setTimeout(() => {
            window.close();
          }, 3000);
        }
      } finally {
        // Clean up stored state
        localStorage.removeItem('growwAuthState');
      }
    };

    handleCallback();
  }, []);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      padding={3}
      bgcolor="background.default"
    >
      <Box textAlign="center" maxWidth={400}>
        {status === 'loading' && (
          <>
            <CircularProgress size={60} color="primary" />
            <Typography variant="h6" mt={2} color="text.primary">
              Processing Groww Login
            </Typography>
            <Typography variant="body2" mt={1} color="text.secondary">
              Please wait while we verify your authentication...
            </Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: 'success.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 2
              }}
            >
              <Typography variant="h4" color="white">
                ✓
              </Typography>
            </Box>
            <Typography variant="h6" color="success.main">
              Login Successful!
            </Typography>
            <Typography variant="body2" mt={1} color="text.secondary">
              {message}
            </Typography>
          </>
        )}

        {status === 'error' && (
          <>
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle1">
                Login Failed
              </Typography>
              <Typography variant="body2">
                {message}
              </Typography>
            </Alert>
            <Typography variant="body2" color="text.secondary">
              This window will close automatically in a few seconds.
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
};

export default GrowwCallback;
