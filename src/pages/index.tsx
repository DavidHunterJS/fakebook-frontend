// src/pages/index.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, CircularProgress } from '@mui/material';
import PostForm from '../components/post/PostForm';
import PostList from '../components/post/PostList';
import useAuth from '../hooks/useAuth';
import ComplianceChecker from './checker';
import DebugPanel from '../components/DebugPanel';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/welcome');
    }
  }, [isAuthenticated, loading, router]);

  // Show loading state while auth is being determined
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // Don't render main content if not authenticated (prevents flash during redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Render main page content only when authenticated
  return (
    <>
      <Box sx={{ maxWidth: 680, mx: 'auto' }}>
        <ComplianceChecker />
      </Box>
      {process.env.NODE_ENV === 'development' && <DebugPanel />}
    </>
  );
}

// Server-side rendering
export async function getServerSideProps() {
  return {
    props: {},
  };
}