import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Box, Typography, Paper, Divider, Button, LinearProgress, Alert } from '@mui/material';
import useAuth from '../hooks/useAuth';
import LoginForm from '../components/auth/LoginForm';
import { NextPageWithLayout } from '../types/next';
import DemoCredentials from '../components/DemoCredentials';

const Login: NextPageWithLayout = () => {
  const { 
    isAuthenticated, 
    loading, 
    signalInitialized, 
    signalLoading, 
    signalError,
    retrySignalInit 
  } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Determine current loading state
  const getLoadingMessage = () => {
    if (loading) return '🔐 Signing you in...';
    if (signalLoading) return '🔒 Setting up encryption...';
    if (signalInitialized) return '✅ Ready!';
    return '';
  };

  const isLoading = loading || signalLoading;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 64px)',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 450,
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to Fakebook
        </Typography>
        <Typography variant="body1" color="textSecondary" gutterBottom>
          Connect with friends and the world around you
        </Typography>
        
        {/* Show loading progress during authentication and Signal setup */}
        {isLoading && (
          <Box sx={{ my: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>
              {getLoadingMessage()}
            </Typography>
          </Box>
        )}
        
        {/* Show Signal error with retry option */}
        {signalError && !signalLoading && (
          <Alert 
            severity="warning" 
            sx={{ my: 2 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={retrySignalInit}
              >
                Retry
              </Button>
            }
          >
            Encryption setup failed. You can still use the app, but messages won't be encrypted.
          </Alert>
        )}
        
        <Divider sx={{ my: 2 }} />
        <DemoCredentials />
        <LoginForm />
        <Divider sx={{ my: 2 }} />
        <Button
          component={Link}
          href="/register"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          disabled={isLoading}
        >
          Create New Account
        </Button>
      </Paper>
    </Box>
  );
};

// Set layout properties for this page
Login.hideSidebars = true;
export default Login;