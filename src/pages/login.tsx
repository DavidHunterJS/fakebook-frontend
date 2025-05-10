import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Box, Typography, Paper, Divider, Button } from '@mui/material';
import useAuth from '../hooks/useAuth';
import LoginForm from '../components/auth/LoginForm';
import { NextPageWithLayout } from '../types/next'; // Import the custom type

const Login: NextPageWithLayout = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

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
        <Divider sx={{ my: 2 }} />
        <LoginForm />
        <Divider sx={{ my: 2 }} />
        <Button
          component={Link}
          href="/register"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
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