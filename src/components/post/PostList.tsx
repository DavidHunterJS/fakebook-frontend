import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import PostCard from './PostCard';
import { useGetPosts } from '../../hooks/usePosts'; // Adjust path if needed
import { Post } from '../../types/post'; // Adjust path if needed
import { User } from '../../types/user'; // Adjust path if needed

const PostList: React.FC = () => {
  // Assuming useGetPosts returns { data: Post[], isLoading, error }
  // where 'data' is the array of posts directly.
  const { data, isLoading, error } = useGetPosts();

  // --- CORRECTION HERE ---
  // Directly use 'data' if it's the array, or default to empty array
  const posts: Post[] = data || [];
  // --- END CORRECTION ---

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    const errorMessage = (error as any)?.message || 'Error loading posts. Please try again later.';
    return (
      <Typography color="error" align="center" sx={{ my: 4 }}>
        {errorMessage}
      </Typography>
    );
  }

  // Check posts array directly
  if (!posts || posts.length === 0) {
    return (
      <Typography variant="body1" align="center" sx={{ my: 4 }}>
        No posts yet. Be the first to post something!
      </Typography>
    );
  }

  return (
    <Box>
      {posts.map(post => (
        // Ensure post has a unique _id for the key
        post._id ? <PostCard key={post._id} post={normalizePost(post)} /> : null
      ))}
    </Box>
  );
};

/**
 * Normalizes the raw post data received from the API to match the expected Post type,
 * especially handling the user and media fields.
 * @param rawPost - The raw post object from the API response.
 * @returns A normalized Post object suitable for the PostCard component.
 */
const normalizePost = (rawPost: any): Post => {
  const defaultUser: User = {
    _id: 'unknown',
    username: 'Unknown User',
    email: 'unknown@example.com',
    firstName: '',
    lastName: '',
    profilePicture: 'default-avatar.png'
  };

  let userObject: User;
  const apiUser = rawPost.user || rawPost.author;
  if (apiUser && typeof apiUser === 'object') {
    userObject = { ...defaultUser, ...apiUser };
  } else {
    userObject = defaultUser;
  }

  const imageFilename = (rawPost.media && Array.isArray(rawPost.media) && rawPost.media.length > 0)
    ? rawPost.media[0]
    : undefined;

  const normalized: Post = {
    _id: rawPost._id || `temp_${Math.random()}`,
    text: rawPost.text || '',
    media: rawPost.media || [],
    user: userObject,
    likes: rawPost.likes || [],
    comments: rawPost.comments || [],
    createdAt: rawPost.createdAt || new Date().toISOString(),
    updatedAt: rawPost.updatedAt || new Date().toISOString(),
    visibility: rawPost.visibility,
    tags: rawPost.tags,
    reported: rawPost.reported,
    shares: rawPost.shares,
    reportReasons: rawPost.reportReasons,
    likesCount: rawPost.likesCount,
    commentsCount: rawPost.commentsCount,
    isLiked: rawPost.isLiked,
    isSaved: rawPost.isSaved,
    image: imageFilename // Assign the extracted filename (or undefined)
  };

  return normalized;
};

export default PostList;
