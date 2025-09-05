import React, { useEffect, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { Box, Typography, Paper, Divider, Button, LinearProgress } from '@mui/material';
import { isAxiosError } from 'axios';

type LoginFormProps = {
  onLogin: (email: string, password: string) => void; // 'onLogin' is a function
  error: string;                                    // 'error' is a string
};

const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}`;

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // This is now an async function that performs a real API call
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError('');
    console.log(`Attempting login with: ${email}`);

    try {
      // Make the network request to your backend's login endpoint
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        // This is CRITICAL for sending the session cookie
        credentials: 'include',
      });

      const data = await response.json();

      // Check if the server responded with an error status (e.g., 401 Unauthorized)
      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      // If the request was successful, update the state
      setIsAuthenticated(true);

    } catch (err: unknown) { // 👈 2. Change type from 'any' to 'unknown'
      let errorMessage = 'An unexpected error occurred.';

      // 3. Check for different error types
      if (isAxiosError(err)) {
        // This is an error from an axios request
        // Safely access the server's specific error message if it exists
        errorMessage = err.response?.data?.message || err.message;
      } else if (err instanceof Error) {
        // This is a standard JavaScript error
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
    event.preventDefault(); // Correctly placed here to prevent page reload
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

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/dashboard'; 
    }
  }, [isAuthenticated]);

  const getLoadingMessage = () => {
    if (loading) return '🔐 Verifying credentials...';
    return '';
  };

  const handleGoogleLogin = () => {
    window.location.href = 'https://fakebook-backend-a2a77a290552.herokuapp.com/api/auth/google';;
  };

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
        
        {loading && (
          <Box sx={{ my: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>
              {getLoadingMessage()}
            </Typography>
          </Box>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        {/* Pass the login function and error state to the form */}
        <LoginForm onLogin={login} error={error} />
        
        <Divider sx={{ my: 2 }}>OR</Divider>

        <Button
          variant="outlined"
          fullWidth
          onClick={handleGoogleLogin}
          disabled={loading}
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
          Sign in with Google
        </Button>
        
        <Divider sx={{ my: 2 }} />

        <Button
          component="a"
          href="/register"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          disabled={loading}
          onClick={(e) => e.preventDefault()}
        >
          Create New Account
        </Button>
      </Paper>
    </Box>
  );
};

export default Login;