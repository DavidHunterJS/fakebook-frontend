// src/pages/saved.tsx

import React from 'react';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { useGetSavedPosts } from '../hooks/usePosts';
import PostCard from '../components/post/PostCard'; // Assuming this is the corr/components/post/PostCard
const SavedPostsPage = () => {
  const { data: posts, isLoading, isError, error } = useGetSavedPosts();

  const renderContent = () => {
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (isError) {
      // It's better to cast error to Error type to safely access message
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return <Alert severity="error">Error fetching posts: {errorMessage}</Alert>;
    }

    if (!posts || posts.length === 0) {
      return <Typography>You haven&apos;t saved any posts yet.</Typography>;
    }

    return (
      <Box>
        {posts.map(post => (
          <PostCard key={post._id} post={post} />
        ))}
      </Box>
    );
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Saved Posts
      </Typography>
      {renderContent()}
    </Container>
  );
};

export default SavedPostsPage;