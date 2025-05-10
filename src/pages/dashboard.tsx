// pages/dashboard.tsx
import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Typography, Container, Box, Paper } from '@mui/material';
import AuthContext from '../context/AuthContext';

const Dashboard = () => {
  const { isAuthenticated, user, loading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5">Loading...</Typography>
      </Container>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to your Dashboard!
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Your Account Information
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography>
              <strong>Email:</strong> {user.email}
            </Typography>
            {user.firstName && (
              <Typography>
                <strong>Name:</strong> {user.firstName} {user.lastName}
              </Typography>
            )}
            {user.username && (
              <Typography>
                <strong>Username:</strong> @{user.username}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Dashboard;