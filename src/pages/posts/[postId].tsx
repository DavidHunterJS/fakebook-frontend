// pages/posts/[postId].tsx

import React from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Paper,
  Typography,
  CircularProgress,
  Box,
  Avatar,
  IconButton,
  Link as MuiLink,
  Divider,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

import axiosInstance from '@/lib/axios';
import type { AxiosError } from 'axios';

import { getFullImageUrl } from '../../utils/imgUrl';
import useAuth from '../../hooks/useAuth';
// --- NEW IMPORTS FOR COMMENTS ---
import CommentForm from '../../components/post/CommentForm';
import CommentList from '../../components/post/CommentList';
// --- END NEW IMPORTS ---

// --- IMPORTANT: PERMISSIVE TYPES (Refine this later!) ---
// These types are currently permissive to ensure compilation.
// After verifying everything works, you should refine these to be strict
// based on your actual backend API response for a single post.

// Re-using PopulatedUser from your backend's Post model, but making fields optional for permissiveness
export interface PermissivePopulatedUser {
    _id?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    profileImage?: string;
    // Removed [key: string]: any; - if other properties are used, they must be added explicitly
}

export interface PermissiveMediaItem {
    url?: string;
    key?: string;
    type?: string;
    originalFilename?: string;
    // Removed [key: string]: any; - if other properties are used, they must be added explicitly
}

// This 'Post' interface is designed to match *anything* coming from the API.
// If this compiles, the issue is definitively a type mismatch.
export interface PermissivePost {
    _id?: string;
    user?: PermissivePopulatedUser;
    text?: string;
    media?: PermissiveMediaItem[];
    visibility?: string;
    likes?: string[];
    comments?: string[];
    tags?: PermissivePopulatedUser[];
    reported?: boolean;
    reportReasons?: unknown[]; // Changed from any[] to unknown[]
    createdAt?: string;
    updatedAt?: string;
    likesCount?: number;
    commentsCount?: number;
    isLiked?: boolean;
    isSaved?: boolean;
    shares?: unknown[]; // Changed from any[] to unknown[]
    pinned?: boolean;
    originalPost?: string; // Mongoose ObjectId string
    sharedFrom?: string; // Mongoose ObjectId string
    // Removed [key: string]: any; - if other properties are used, they must be added explicitly
}

// --- END PERMISSIVE TYPES ---


// --- Helper for AxiosError Type Assertions ---
const isAxiosErrorType = (e: unknown): e is AxiosError => {
  return (e as AxiosError).isAxiosError !== undefined;
};



// --- PostContent Component ---
interface PostContentProps {
  post: PermissivePost;
  currentUser: PermissivePopulatedUser | null;
}

const PostContent: React.FC<PostContentProps> = ({ post }) => {
  const postAuthor = post.user;
  const postAuthorProfileLink = `/profile/${postAuthor?._id}`;

  const postAuthorAvatarSrc =
    postAuthor?.profilePicture || postAuthor?.profileImage
      ? getFullImageUrl(postAuthor.profilePicture || postAuthor.profileImage!, 'profile')
      : '/images/default-avatar.png';

  const displayPostText = post.text && post.text.trim() !== "" && post.text !== "Post with media";

  return (
    <Paper sx={{ p: 4, borderRadius: 2 }}>
      {/* Post Header: Author Info and Timestamp */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <MuiLink href={postAuthorProfileLink} sx={{ textDecoration: 'none', color: 'inherit' }}>
          <Avatar src={postAuthorAvatarSrc} alt={postAuthor?.username} sx={{ width: 48, height: 48, mr: 2 }} />
        </MuiLink>
        <Box>
          <MuiLink href={postAuthorProfileLink} sx={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {postAuthor?.firstName && postAuthor?.lastName
                ? `${postAuthor.firstName} ${postAuthor.lastName}`
                : postAuthor?.username}
            </Typography>
          </MuiLink>
          <Typography variant="body2" color="text.secondary">
            {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'N/A'}
          </Typography>
        </Box>
      </Box>

      {/* Post Text */}
      {displayPostText && (
        <Typography variant="body1" sx={{ mb: post.media && post.media.length > 0 ? 2 : 0 }}>
          {post.text}
        </Typography>
      )}

      {/* Post Media */}
      {post.media && post.media.length > 0 && (
        <Box sx={{ mt: 2, mb: 2 }}>
          {post.media.map((mediaItem: PermissiveMediaItem, index: number) => (
            <Box key={index} sx={{ mb: 1, '&:last-child': { mb: 0 } }}>
              {mediaItem.type === 'image' && mediaItem.key && ( // Check for key
                <img
                  src={getFullImageUrl(mediaItem.key, 'post')}
                  alt={mediaItem.originalFilename || `Post image ${index + 1}`}
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
                />
              )}
              {mediaItem.type === 'video' && mediaItem.key && ( // Check for key
                <video controls style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}>
                  <source src={getFullImageUrl(mediaItem.key, 'post')} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <Box sx={{ my: 2 }}>
          <Typography variant="body2" color="text.secondary" component="span">
            Tagged:{' '}
          </Typography>
          {post.tags.map((tag: PermissivePopulatedUser, index: number) => (
            <React.Fragment key={tag?._id || index}>
              <MuiLink href={`/profile/${tag?._id}`} sx={{ textDecoration: 'none', color: 'primary.main', fontWeight: 'bold' }}>
                @{tag?.username}
              </MuiLink>
              {index < post.tags!.length - 1 && ', '}
            </React.Fragment>
          ))}
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Engagement Stats and Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            {post.likesCount || 0} Likes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {post.commentsCount || 0} Comments
          </Typography>
        </Box>

        <Box>
          <IconButton color="primary">
            {post.isLiked ? <FavoriteIcon sx={{ color: 'red' }} /> : <FavoriteBorderIcon />}
          </IconButton>
          <IconButton color="primary">
            <ChatBubbleOutlineIcon />
          </IconButton>
          <IconButton color="primary">
            {post.isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          </IconButton>
          <IconButton color="primary">
            <ShareIcon />
          </IconButton>
        </Box>
      </Box>

      {/* --- COMMENT SECTION INTEGRATION --- */}
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 2 }}>
        Comments
      </Typography>

      {/* Only render CommentForm and CommentList if post._id is available */}
      {post._id && (
        <>
          <CommentForm postId={post._id} />
          <CommentList postId={post._id} />
        </>
      )}
      {/* --- END COMMENT SECTION INTEGRATION --- */}

    </Paper>
  );
};


// --- Main Page Component ---
const SinglePostPage: React.FC = () => {
  const router = useRouter();
  const { postId } = router.query;
  const { user: currentUser, isAuthenticated } = useAuth();

const { data, isLoading, error } = useQuery<PermissivePost, Error>({
  queryKey: ['post', postId],
  queryFn: async () => {
    try {
      if (!postId) throw new Error('Post ID missing');
      const response = await axiosInstance.get<PermissivePost>(
        `/posts/${Array.isArray(postId) ? postId[0] : postId}`
      );
      return response.data;
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (isAxiosErrorType(axiosErr) && (axiosErr.response?.status === 404 || axiosErr.response?.status === 403)) {
        router.push('/404');
      }
      throw err; // Re-throw to let react-query handle it
    }
  },
  enabled: !!postId && !!isAuthenticated,
  retry: 1
});

  return (
    <React.Fragment>
      {isLoading && (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper sx={{ p: 4, borderRadius: 2, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Paper>
        </Container>
      )}

      {error && (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="h6" color="error" align="center">
              Error loading post: {error.message}. Please try again later.
            </Typography>
          </Paper>
        </Container>
      )}

      {!isLoading && !error && (!data || !data._id) && ( // Ensure data is loaded but is empty/invalid
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="h6" color="text.secondary" align="center">
              Post not found or you do not have permission to view it.
            </Typography>
          </Paper>
        </Container>
      )}

      {!isLoading && !error && data && data._id && ( // Only render PostContent if data is valid
        <Container maxWidth="md" sx={{ py: 4 }}>
          <PostContent post={data} currentUser={currentUser as PermissivePopulatedUser | null} />
        </Container>
      )}
    </React.Fragment>
  );
};

export default SinglePostPage;