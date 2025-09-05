import React, { useEffect, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { Box, Typography, Paper, Divider, Button, LinearProgress } from '@mui/material';
import { isAxiosError } from 'axios';

type LoginFormProps = {
  onLogin: (email: string, password: string) => void;
  error: string;
};

const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}`;

// Add Google OAuth hook
const useGoogleAuth = () => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const loginWithGoogle = () => {
    if (!GOOGLE_CLIENT_ID) {
      setGoogleError('Google Client ID not configured');
      return;
    }

    setIsGoogleLoading(true);
    setGoogleError('');

    // Create Google OAuth URL
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: `${window.location.origin}/auth/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state: Math.random().toString(36).substring(7)
    });

    const googleAuthUrl = `https://accounts.google.com/oauth/authorize?${params.toString()}`;
    
    // Redirect to Google
    window.location.href = googleAuthUrl;
  };

  return {
    loginWithGoogle,
    isGoogleLoading,
    googleError
  };
};

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError('');
    console.log(`Attempting login with: ${email}`);

    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      setIsAuthenticated(true);

    } catch (err: unknown) {
      let errorMessage = 'An unexpected error occurred.';

      if (isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      console.error('Login failed:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { isAuthenticated, loading, error, login };
};

const LoginForm = ({ onLogin, error }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }
    onLogin(email, password);
  };

  return (
    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <input
        type="email"
        placeholder="Email Address"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
      />
      <input
        type="password"
        placeholder="Password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
      />
      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 1, mb: 1 }}
      >
        Sign In
      </Button>
    </Box>
  );
};

// --- Main Login Component ---

const Login = () => {
  const { 
    isAuthenticated, 
    loading, 
    error,
    login,
  } = useAuth();

  // Add Google OAuth hook
  const {
    loginWithGoogle,
    isGoogleLoading,
    googleError
  } = useGoogleAuth();

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/dashboard'; 
    }
  }, [isAuthenticated]);

  const getLoadingMessage = () => {
    if (loading) return '🔐 Verifying credentials...';
    if (isGoogleLoading) return '🔄 Redirecting to Google...';
    return '';
  };

  // Update the Google login handler
  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  // Show any Google-specific errors
  const displayError = error || googleError;
  const isAnyLoading = loading || isGoogleLoading;

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
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Welcome to Trippy.lol
        </Typography>
        <Typography variant="body1" color="textSecondary" gutterBottom>
          Connect with friends and the world around you
        </Typography>
        
        {isAnyLoading && (
          <Box sx={{ my: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>
              {getLoadingMessage()}
            </Typography>
          </Box>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        {/* Pass the combined error to the form */}
        <LoginForm onLogin={login} error={displayError} />
        
        <Divider sx={{ my: 2 }}>OR</Divider>

        <Button
          variant="outlined"
          fullWidth
          onClick={handleGoogleLogin}
          disabled={isAnyLoading}
          startIcon={<FcGoogle size={18} />}
          sx={{ 
            mt: 1, 
            mb: 2,
            textTransform: 'none',
            borderColor: '#dadce0',
            color: '#3c4043',
            '&:hover': {
              backgroundColor: '#f6f9fe',
              borderColor: '#d2e3fc',
            },
          }}
        >
          {isGoogleLoading ? 'Connecting to Google...' : 'Sign in with Google'}
        </Button>
        
        <Divider sx={{ my: 2 }} />

        <Button
          component="a"
          href="/register"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          disabled={isAnyLoading}
          onClick={(e) => e.preventDefault()}
        >
          Create New Account
        </Button>
      </Paper>
    </Box>
  );
};

export default Login;