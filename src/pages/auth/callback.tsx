// pages/auth/callback.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';

const AuthCallback = () => {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      const { code, error, state } = router.query;

      console.log('🔍 Step 3: Callback page loaded');
      console.log('🔍 URL params:', router.query);
      console.log('🔍 Auth code received:', !!code);  

      if (error) {
        console.error('OAuth error:', error);
        setStatus('error');
        setMessage(`Authentication failed: ${error}`);
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      if (!code || typeof code !== 'string') {
        console.error('No authorization code received');
        setStatus('error');
        setMessage('No authorization code received');
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      try {
        setMessage('Exchanging authorization code...');
        
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
        const response = await fetch(`${BACKEND_URL}/api/auth/google/exchange`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ code, state })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Authentication successful:', data);
          
          // Store user data if needed
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
          if (data.token) {
            localStorage.setItem('token', data.token);
          }

          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          setTimeout(() => router.push('/dashboard'), 1500);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Backend authentication failed:', response.status, errorData);
          setStatus('error');
          setMessage(`Authentication failed: ${errorData.message || 'Server error'}`);
          setTimeout(() => router.push('/login'), 3000);
        }
      } catch (error) {
        console.error('Error during authentication:', error);
        setStatus('error');
        setMessage('Network error during authentication');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    if (router.isReady) {
      handleCallback();
    }
    console.log('🔍 Step 4: Sending code to backend...');
  }, [router]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
        fontFamily: 'sans-serif',
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
        {status === 'loading' && (
          <>
            <CircularProgress size={60} sx={{ mb: 2, color: '#4285F4' }} />
          </>
        )}
        
        {status === 'success' && (
          <Box sx={{ color: '#34A853', fontSize: '4rem', mb: 2 }}>✅</Box>
        )}
        
        {status === 'error' && (
          <Box sx={{ color: '#EA4335', fontSize: '4rem', mb: 2 }}>❌</Box>
        )}
        
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          {status === 'loading' && 'Authenticating...'}
          {status === 'success' && 'Success!'}
          {status === 'error' && 'Authentication Failed'}
        </Typography>
        
        <Typography variant="body1" color="textSecondary">
          {message}
        </Typography>

        {status === 'error' && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Redirecting to login page in a few seconds...
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default AuthCallback;