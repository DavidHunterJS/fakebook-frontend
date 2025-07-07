import React from 'react';
import { Typography, Container, Paper } from '@mui/material';
import withAdminAuth from '../../components/auth/withAdminAuth';
import UserManagement from '../../components/admin/UserManagement';

const AdminDashboard = () => {
  // This page is now protected by the HOC.
  // You can start building your admin-specific UI here.
  // For example, add components for user management, analytics, etc.

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography>
          Welcome, Admin! Here you can manage users, view reports, and see site analytics.
        </Typography>
      </Paper>
      <UserManagement />
    </Container>
  );
};

// Wrap your component with the admin protection HOC
export default withAdminAuth(AdminDashboard);