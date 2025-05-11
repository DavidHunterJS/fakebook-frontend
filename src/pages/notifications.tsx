// pages/notifications/index.tsx

import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';

const NotificationsPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Notifications
        </Typography>
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" align="center">
            This page is under construction. Notifications will be available soon.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotificationsPage;