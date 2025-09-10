import React, { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Paper, Divider, Button, LinearProgress, TextField, Alert, CircularProgress } from '@mui/material';
import AuthContext from '../context/AuthContext'; // Adjust path to your AuthContext

// --- Child Components for Forms ---

const MagicLinkForm = () => {
  const { loginWithMagicLink, loading, error } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) {
      setValidationError('Please enter your email address.');
      return;
    }
    setValidationError('');
    setIsSuccess(false);
    
    try {
      await loginWithMagicLink(email);
      setIsSuccess(true); // Show success message on successful API call
    } catch (e) {
      // The context will already be setting its own error state, 
      // which we display below. No need to set it again here.
      console.error(e);
    }
  };

  if (isSuccess) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="h6" color="success.main" sx={{ mb: 2 }}>
          ✅ Email Link Sent!
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Check your email for a secure login link. It will expire in 15 minutes.
        </Typography>
      </Box>
    );
  }

  return (
    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <TextField
        type="email"
        label="Email Address"
        required
        fullWidth
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        sx={{ mb: 2 }}
        variant="outlined"
        error={!!validationError}
        helperText={validationError}
        disabled={loading}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={loading}
        sx={{ mt: 1, mb: 1 }}
      >
        {loading ? 'Sending...' : 'Send Email Link'}
      </Button>
    </Box>
  );
};


// --- Main Login Component ---

const LoginPage = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const router = useRouter();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);
  
  // Don't render anything if we're authenticated and about to redirect
  if (isAuthenticated) {
    return (
       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
         <CircularProgress />
       </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 450,
          textAlign: 'center',
          borderRadius: 2,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Welcome to ComplinceKit
        </Typography>
        <Typography variant="body1" color="textSecondary" gutterBottom>
          Placeholder
        </Typography>
        
        {loading && <LinearProgress sx={{ my: 2 }} />}
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" sx={{ mb: 2 }}>Sign In</Typography>
        
        {/* For now, we only have Magic Link, so no toggle is needed.
            If you add back password login, you can re-add the toggle here. */}
        
        <MagicLinkForm />
        

      </Paper>
    </Box>
  );
};

export default LoginPage;
