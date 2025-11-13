// src/components/BlogLayout.tsx
import type { FC, ReactNode } from 'react';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import {
  AppBar,
  Box,
  Button,
  Container,
  CssBaseline,
  Toolbar,
  Typography,
} from '@mui/material';

// --- Reusable Style Objects from your page ---
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

interface BlogLayoutProps {
  children: ReactNode;
}

const BlogLayout: FC<BlogLayoutProps> = ({ children }) => {
  const router = useRouter();

  // Simplified nav for the blog.
  // We'll link back to the main site.
  // You can add the full auth logic from ComplianceKitPage here if needed.

  return (
    <>
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
              {/* <Button
                onClick={() => router.push('/blog')}
                sx={btnNeomorph}
              >
                Blog
              </Button> */}
              <Button
                onClick={() => router.push('/')} // Or /login
                sx={btnPrimary}
              >
                Get Started
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Container maxWidth="lg" sx={{ py: 6, px: 2 }}>
          {children}
        </Container>
      </Box>
    </>
  );
};

export default BlogLayout;