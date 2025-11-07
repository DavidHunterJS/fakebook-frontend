// pages/pricing.tsx

import type { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// Import MUI Components
import {
  AppBar,
  Box,
  Button,
  Container,
  CssBaseline,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Toolbar,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';

// Import an icon for the list
import CheckIcon from '@mui/icons-material/Check';

// --- Reusable Style Objects ---
const btnBase = {
  padding: '0.8rem 2rem',
  borderRadius: '50px',
  fontWeight: 600,
  transition: 'all 0.3s ease',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
  textTransform: 'none',
};

const btnNeomorph = {
  ...btnBase,
  background: '#e6f7f5',
  color: '#1e3a8a',
  boxShadow: '8px 8px 16px #c4d9d6, -8px -8px 16px #ffffff',
  '&:hover': {
    background: '#e6f7f5',
    boxShadow: '4px 4px 8px #c4d9d6, -4px -4px 8px #ffffff',
  },
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};

const btnPrimary = {
  ...btnBase,
  background: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)',
  color: 'white',
  boxShadow: '8px 8px 16px #c4d9d6, -8px -8px 16px #ffffff',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '10px 10px 20px #c4d9d6, -10px -10px 20px #ffffff',
  },
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none',
  },
};

// --- The Pricing Page Component ---
const PricingPage: NextPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Call your auth endpoint to check if user is authenticated
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include', // Important: sends cookies with request
      });

      setIsAuthenticated(response.ok);
    } catch (err) {
      console.error('Auth check failed:', err);
      setIsAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

// Handle subscription purchase
  const handleSubscribe = async (tier: 'Basic' | 'Pro') => {
    setError(null);
    
    // Check if user is logged in
    if (!isAuthenticated) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/pricing&tier=${tier}`);
      return;
    }

    setLoading(tier);

    try {
      // Call your backend to create checkout session
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: sends session cookie
        body: JSON.stringify({ tier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: unknown) { // <-- FIX: Changed 'any' to 'unknown'
      console.error('Subscription error:', err);
      
      // Type-safe error handling
      let message = 'Failed to start subscription. Please try again.';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      }
      
      setError(message);
      setLoading(null);
    }
  };

  // Handle free signup
  const handleFreeSignup = () => {
    if (!isAuthenticated) {
      router.push('/');
    } else {
      router.push('/');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setIsAuthenticated(false);
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <>
      <Head>
        <title>Pricing - ComplianceKit</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <CssBaseline />

      <Box
        sx={{
          minHeight: '100vh',
          background: '#e6f7f5',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          lineHeight: 1.6,
        }}
      >
        {/* NAV SECTION */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            background: '#e6f7f5',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          }}
        >
          <Toolbar sx={{ padding: '1.5rem 3rem' }}>
            {/* Logo */}
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#2563eb',
                cursor: 'pointer',
              }}
              onClick={() => router.push('/')}
            >
              Compliance
              <Typography
                component="span"
                sx={{ fontSize: '1.8rem', fontWeight: 700, color: '#14b8a6' }}
              >
                Kit
              </Typography>
            </Typography>

            {/* Nav Buttons */}
            <Box sx={{ display: 'flex', gap: '1rem' }}>
              {checkingAuth ? (
                <CircularProgress size={24} sx={{ color: '#14b8a6' }} />
              ) : isAuthenticated ? (
                <>
                  <Button onClick={() => router.push('/login')} sx={btnNeomorph}>
                    Login
                  </Button>
                  <Button onClick={handleLogout} sx={btnPrimary}>
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => router.push('/login')} sx={btnNeomorph}>
                    Log In
                  </Button>
                  <Button onClick={() => router.push('/signup')} sx={btnPrimary}>
                    Start Free Trial
                  </Button>
                </>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        {/* ERROR ALERT */}
        {error && (
          <Container maxWidth="lg" sx={{ mt: 2 }}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Container>
        )}

        {/* HEADER SECTION */}
        <Container maxWidth="lg" sx={{ textAlign: 'center', py: 6, px: 2 }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              color: '#1e3a8a',
              mb: '1rem',
              lineHeight: 1.2,
              fontWeight: 800,
            }}
          >
            Simple, Honest Pricing
          </Typography>
          <Typography
            variant="h6"
            component="p"
            sx={{
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              color: '#475569',
              mb: '3rem',
              maxWidth: '700px',
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            Start free, upgrade when you need to. No hidden fees, no surprises. Credits roll over—never lose what you paid for.
          </Typography>
        </Container>

        {/* PRICING CARDS */}
        <Container maxWidth="lg" sx={{ margin: '0 auto 4rem', padding: '0 2rem 4rem' }}>
          <Grid container spacing={4} justifyContent="center">
            {/* FREE TIER */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  background: '#e6f7f5',
                  borderRadius: '30px',
                  padding: '2.5rem',
                  boxShadow: '12px 12px 24px #c4d9d6, -12px -12px 24px #ffffff',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    color: '#1e3a8a',
                    mb: '0.5rem',
                  }}
                >
                  Free Forever
                </Typography>
                <Typography
                  sx={{
                    fontSize: '3rem',
                    fontWeight: 800,
                    color: '#14b8a6',
                    mb: '0.5rem',
                  }}
                >
                  $0
                </Typography>
                <Typography
                  sx={{
                    color: '#64748b',
                    mb: '2rem',
                    fontSize: '1rem',
                  }}
                >
                  Perfect to get started
                </Typography>

                <List sx={{ mb: 'auto' }}>
                  {[
                    '10 image checks (lifetime)',
                    '3 image fixes (lifetime)',
                    'No credit card required',
                    'Email gate only',
                  ].map((item) => (
                    <ListItem
                      key={item}
                      sx={{
                        padding: '0.8rem 0',
                        color: '#334155',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 'auto', marginRight: '0.8rem' }}>
                        <CheckIcon sx={{ color: '#14b8a6' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={item}
                        primaryTypographyProps={{
                          fontSize: '0.95rem',
                        }}
                      />
                    </ListItem>
                  ))}
                </List>

                <Button
                  onClick={handleFreeSignup}
                  sx={{
                    ...btnNeomorph,
                    width: '100%',
                    marginTop: '1.5rem',
                    padding: '0.9rem 0',
                  }}
                >
                  Get Started Free
                </Button>
              </Paper>
            </Grid>

            {/* BASIC TIER - HIGHLIGHTED */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  background: '#e6f7f5',
                  borderRadius: '30px',
                  padding: '2.5rem',
                  boxShadow: '20px 20px 40px #c4d9d6, -20px -20px 40px #ffffff',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: '2px solid #14b8a6',
                  '&::before': {
                    content: '"POPULAR"',
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                    color: 'white',
                    padding: '0.4rem 1.5rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    color: '#1e3a8a',
                    mb: '0.5rem',
                  }}
                >
                  Basic
                </Typography>
                <Typography
                  sx={{
                    fontSize: '3rem',
                    fontWeight: 800,
                    color: '#14b8a6',
                    mb: '0',
                  }}
                >
                  $49
                </Typography>
                <Typography
                  sx={{
                    color: '#64748b',
                    mb: '2rem',
                    fontSize: '1rem',
                  }}
                >
                  per month
                </Typography>

                <List sx={{ mb: 'auto' }}>
                  {[
                    '50 checks per month',
                    '25 fixes per month',
                    'Unused credits roll over',
                    'Cap: 200 checks / 100 fixes',
                    'Email support',
                    'Cancel anytime',
                  ].map((item) => (
                    <ListItem
                      key={item}
                      sx={{
                        padding: '0.8rem 0',
                        color: '#334155',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 'auto', marginRight: '0.8rem' }}>
                        <CheckIcon sx={{ color: '#14b8a6' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={item}
                        primaryTypographyProps={{
                          fontSize: '0.95rem',
                          fontWeight: item.includes('Cap:') ? 400 : 500,
                          color: item.includes('Cap:') ? '#64748b' : '#334155',
                        }}
                      />
                    </ListItem>
                  ))}
                </List>

                <Button
                  onClick={() => handleSubscribe('Basic')}
                  disabled={loading !== null}
                  sx={{
                    ...btnPrimary,
                    width: '100%',
                    marginTop: '1.5rem',
                    padding: '0.9rem 0',
                    background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                  }}
                >
                  {loading === 'Basic' ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  ) : (
                    'Get Basic'
                  )}
                </Button>
              </Paper>
            </Grid>

            {/* PRO TIER */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  background: '#e6f7f5',
                  borderRadius: '30px',
                  padding: '2.5rem',
                  boxShadow: '12px 12px 24px #c4d9d6, -12px -12px 24px #ffffff',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    color: '#1e3a8a',
                    mb: '0.5rem',
                  }}
                >
                  Pro
                </Typography>
                <Typography
                  sx={{
                    fontSize: '3rem',
                    fontWeight: 800,
                    color: '#1e3a8a',
                    mb: '0',
                  }}
                >
                  $99
                </Typography>
                <Typography
                  sx={{
                    color: '#64748b',
                    mb: '2rem',
                    fontSize: '1rem',
                  }}
                >
                  per month
                </Typography>

                <List sx={{ mb: 'auto' }}>
                  {[
                    '150 checks per month',
                    '75 fixes per month',
                    'Unused credits roll over',
                    'Cap: 500 checks / 250 fixes',
                    'Priority support',
                    'Cancel anytime',
                  ].map((item) => (
                    <ListItem
                      key={item}
                      sx={{
                        padding: '0.8rem 0',
                        color: '#334155',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 'auto', marginRight: '0.8rem' }}>
                        <CheckIcon sx={{ color: '#14b8a6' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={item}
                        primaryTypographyProps={{
                          fontSize: '0.95rem',
                          fontWeight: item.includes('Cap:') ? 400 : 500,
                          color: item.includes('Cap:') ? '#64748b' : '#334155',
                        }}
                      />
                    </ListItem>
                  ))}
                </List>

                <Button
                  onClick={() => handleSubscribe('Pro')}
                  disabled={loading !== null}
                  sx={{
                    ...btnPrimary,
                    width: '100%',
                    marginTop: '1.5rem',
                    padding: '0.9rem 0',
                  }}
                >
                  {loading === 'Pro' ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  ) : (
                    'Get Pro'
                  )}
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Container>

        {/* FAQ OR BOTTOM CTA SECTION */}
        <Container maxWidth="md" sx={{ textAlign: 'center', pb: 6 }}>
          <Paper
            elevation={0}
            sx={{
              background: '#e6f7f5',
              boxShadow:
                'inset 6px 6px 12px #c4d9d6, inset -6px -6px 12px #ffffff',
              borderRadius: '20px',
              padding: '2rem',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: '#14b8a6',
                borderRadius: '20px 20px 0 0',
              },
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: '#1e3a8a',
                fontWeight: 700,
                mb: '1rem',
              }}
            >
              Questions about pricing?
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#475569',
                mb: '1.5rem',
              }}
            >
              You only pay when you need to fix images. Credits roll over monthly so you never lose what you paid for.
            </Typography>
            <Button
              onClick={handleFreeSignup}
              sx={{
                ...btnPrimary,
                padding: '1rem 2.5rem',
              }}
            >
              Start Free - No Credit Card
            </Button>
          </Paper>
        </Container>
      </Box>
    </>
  );
};

export default PricingPage;