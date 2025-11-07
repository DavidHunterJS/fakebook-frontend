// pages/compliance-kit.tsx

import type { NextPage } from 'next';
import Head from 'next/head';

// Import MUI Components
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
} from '@mui/material';

// Import an icon for the list
import CheckIcon from '@mui/icons-material/Check';

// --- Reusable Style Objects (from your original CSS) ---
// We define these as objects to reuse them in the `sx` prop
// This is a common pattern to keep the JSX clean.

const btnBase = {
  padding: '0.8rem 2rem',
  borderRadius: '50px',
  fontWeight: 600,
  transition: 'all 0.3s ease',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
  textTransform: 'none', // Prevent MUI's default ALL CAPS
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
};

// --- The Page Component ---

const ComplianceKitPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>ComplianceKit - Stop Getting Your Amazon Listings Suppressed</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      {/* CssBaseline resets browser defaults, similar to your '*' reset */}
      <CssBaseline />

      {/* We use a Box as the main container with the background color */}
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
          elevation={0} // We use `elevation={0}` to apply our own custom shadow
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
              }}
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
              <Button href="/login" sx={btnNeomorph}>
                Log In
              </Button>
              <Button href="#" sx={btnPrimary}>
                Start Free Trial
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* HERO SECTION */}
        <Container maxWidth="lg" sx={{ textAlign: 'center', py: 6, px: 2 }}>
          <Chip
            label="✓ Stay Compliant, Stay Selling"
            sx={{
              background: '#e6f7f5',
              boxShadow: '6px 6px 12px #c4d9d6, -6px -6px 12px #ffffff',
              color: '#14b8a6',
              padding: '0.5rem 1.5rem',
              borderRadius: '25px',
              fontWeight: 600,
              fontSize: '0.9rem',
              height: 'auto',
              mb: 2,
              '& .MuiChip-label': {
                padding: 0,
              },
            }}
          />
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.2rem', md: '3.5rem' },
              color: '#1e3a8a',
              mb: '1.5rem',
              lineHeight: 1.2,
              fontWeight: 800,
            }}
          >
            Stop Getting Your Amazon Listings Suppressed
          </Typography>
          <Typography
            variant="h6"
            component="p"
            sx={{
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              color: '#475569',
              mb: '2rem',
              maxWidth: '700px',
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            Check and fix product images for Amazon compliance in seconds. Pure white backgrounds, 85% fill, no violations. Built by an Amazon seller who got tired of listing suppressions.
          </Typography>

          {/* Pain Card */}
          <Paper
            elevation={0}
            sx={{
              background: '#e6f7f5',
              boxShadow:
                'inset 6px 6px 12px #c4d9d6, inset -6px -6px 12px #ffffff',
              borderRadius: '20px',
              padding: '2rem',
              margin: '3rem auto',
              maxWidth: '650px',
              textAlign: 'left',
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
              component="strong"
              sx={{
                color: '#14b8a6',
                fontSize: '1.2rem',
                filter: 'drop-shadow(0 0 8px rgba(20, 184, 166, 0.3))',
              }}
            >
              Sound familiar?
            </Typography>
            <Typography variant="body1" sx={{ color: '#334155', mt: '0.5rem' }}>
              You upload a product image to Amazon, listing goes live, then BAM—suppressed for image violations you didn&apos;t even see. Non-compliant background, wrong dimensions, or failed the white background test.
            </Typography>
          </Paper>

          {/* CTA Section */}
          <Box sx={{ margin: '3rem 0' }}>
            <Button
              href="#"
              sx={{
                ...btnPrimary,
                fontSize: '1.3rem',
                padding: '1.2rem 3rem',
              }}
            >
              Get Started - Free Forever
            </Button>
            <Typography
              sx={{
                marginTop: '1.5rem',
                color: '#64748b',
                fontSize: '0.95rem',
              }}
            >
              Join Amazon sellers who never get suppressed again
            </Typography>
          </Box>
        </Container>

        {/* FEATURES SECTION */}
        <Container maxWidth="lg" sx={{ padding: '4rem 2rem' }}>
          <Typography
            variant="h2"
            sx={{
              textAlign: 'center',
              fontSize: '2.5rem',
              mb: '3rem',
              color: '#1e3a8a',
              fontWeight: 800,
            }}
          >
            Everything You Need
          </Typography>
          
          <Grid container spacing={4}>
            {[
              {
                emoji: '⚡',
                title: 'Instant Image Checking',
                desc: "Upload your product image and see exactly what's wrong. Red dots show every non-compliant pixel instantly.",
              },
              {
                emoji: '🔧',
                title: 'Fix in One Click',
                desc: 'Replace your background with pure white (RGB 255,255,255). Ensure 85% product fill. Download your compliant image immediately.',
              },
              {
                emoji: '✅',
                title: 'Amazon Compliant',
                desc: "Meet all Amazon image requirements: white background, proper dimensions, no text overlays, no borders.",
              },
              {
                emoji: '👁️',
                title: 'Before/After Preview',
                desc: 'See your original image and the compliant version side-by-side. Know exactly what changed and why.',
              },
              {
                emoji: '💳',
                title: 'Credit System',
                desc: 'Pay only for what you use. Check images for free, fix when you need to. Credits roll over monthly—never lose what you paid for.',
              },
              {
                emoji: '🛒',
                title: 'Built for Sellers',
                desc: 'Created by an Amazon seller who understands the pain of multi-state compliance.',
              },
            ].map((feature) => (
              <Grid size={{xs:12,sm:6,md:4}} key={feature.title}>
                <Card
                  elevation={0}
                  sx={{
                    background: '#e6f7f5',
                    padding: '2.5rem',
                    borderRadius: '30px',
                    boxShadow:
                      '12px 12px 24px #c4d9d6, -12px -12px 24px #ffffff',
                    transition: 'all 0.3s ease',
                    height: '100%',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow:
                        '15px 15px 30px #c4d9d6, -15px -15px 30px #ffffff, 0 0 25px rgba(20, 184, 166, 0.15)',
                    },
                  }}
                >
                  <CardContent sx={{ padding: 0 }}>
                    <Box
                      sx={{
                        width: '70px',
                        height: '70px',
                        background: '#e6f7f5',
                        boxShadow:
                          'inset 4px 4px 8px #c4d9d6, inset -4px -4px 8px #ffffff',
                        borderRadius: '20px',
                        mb: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                      }}
                    >
                      {feature.emoji}
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        color: '#1e3a8a',
                        mb: '0.8rem',
                        fontSize: '1.3rem',
                        fontWeight: 600,
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: '#475569', lineHeight: 1.7 }}
                    >
                      {feature.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* PRICING SECTION */}
        <Container maxWidth="lg" sx={{ margin: '4rem auto', padding: '0 2rem 4rem' }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: '2.5rem',
              mb: '3rem',
              textAlign: 'center',
              color: '#1e3a8a',
              fontWeight: 800,
            }}
          >
            Simple, Honest Pricing
          </Typography>

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
                  href="#"
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

            {/* BASIC TIER - NOW HIGHLIGHTED */}
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
                  href="#"
                  sx={{
                    ...btnPrimary,
                    width: '100%',
                    marginTop: '1.5rem',
                    padding: '0.9rem 0',
                    background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                  }}
                >
                  Start Free Trial
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
                    color: '#14b8a6',
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
                  href="#"
                  sx={{
                    ...btnPrimary,
                    width: '100%',
                    marginTop: '1.5rem',
                    padding: '0.9rem 0',
                  }}
                >
                  Start Free Trial
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

export default ComplianceKitPage;