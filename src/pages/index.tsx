import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Paper } from '@mui/material';
import PostForm from '../components/post/PostForm';
import PostList from '../components/post/PostList';
import useAuth from '../hooks/useAuth';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <>
      <Box sx={{ maxWidth: 680, mx: 'auto' }}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <PostForm />
        </Paper>
        <PostList />
      </Box>
    </>
  );
}

// Server-side rendering
export async function getServerSideProps() {
  return {
    props: {}, // will be passed to the page component as props
  };
}