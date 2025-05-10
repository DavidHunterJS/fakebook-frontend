import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  CardMedia,
  Button, // Import Button
  Avatar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Comment as CommentIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { Post } from '../../types/post'; // Adjust path if needed
import { User } from '../../types/user'; // Adjust path if needed, ensure User includes profilePicture
import CommentForm from './CommentForm';
import CommentList from './CommentList';
import useAuth from '../../hooks/useAuth'; // Adjust path if needed
import { useLikePost, useDeletePost } from '../../hooks/usePosts'; // Adjust path if needed
import {getFullImageUrl}  from '../../utils/imgUrl'; // Adjust the path as needed



interface PostCardProps {
  // Ensure Post type includes:
  // - _id: string;
  // - user: User | string; // Ideally populated User object
  // - text?: string;
  // - media?: string[]; // <-- Changed from image: string to media: string[]
  // - likes: string[];
  // - comments: any[]; // Or a Comment type array
  // - createdAt: string | Date;
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user: currentUser } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const likeMutation = useLikePost();
  const deleteMutation = useDeletePost();

  const postUser = post.user as User | undefined;

  const isLiked = currentUser && post.likes ? post.likes.includes(currentUser._id) : false;
  const isAuthor = currentUser && postUser && postUser._id === currentUser._id;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeletePost = () => {
    if (!post._id) return;
    deleteMutation.mutate(post._id);
    handleMenuClose();
  };

  const handleLikeClick = () => {
     if (!post._id || !currentUser) return;
    likeMutation.mutate(post._id);
  };

  const handleCommentClick = () => {
    setShowComments(!showComments);
  };

  if (!postUser) {
    console.warn("PostCard rendering without valid post user:", post);
    return <Card sx={{ mb: 3, p: 2 }}><Typography>Error loading post author.</Typography></Card>;
  }

  const authorAvatarUrl = getFullImageUrl(postUser.profilePicture, 'profile');

  // --- CORRECTION FOR POST IMAGE ---
  // Get the first image filename from the 'media' array
  const postImageFilename = (post.media && post.media.length > 0) ? post.media[0] : null;
  // Generate the URL using the filename from the media array
  const postImageUrl = postImageFilename ? getFullImageUrl(postImageFilename, 'post') : null;
  console.log(`[PostCard] Rendering post ${post._id}. Media array: ${JSON.stringify(post.media)}. First image filename: "${postImageFilename}". Generated URL: "${postImageUrl}"`);
  // --- END CORRECTION ---

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        avatar={
          <Link href={`/profile/${postUser._id}`} passHref legacyBehavior>
            <Avatar
              src={authorAvatarUrl}
              alt={postUser.username || 'User Avatar'}
              sx={{ cursor: 'pointer' }}
              component="a"
            />
          </Link>
        }
        action={
          isAuthor && (
            <>
              <IconButton aria-label="settings" onClick={handleMenuOpen}>
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleDeletePost} disabled={deleteMutation.isPending}>
                  <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </MenuItem>
              </Menu>
            </>
          )
        }
        title={
          <Link href={`/profile/${postUser._id}`} passHref legacyBehavior>
            <Typography
              variant="subtitle1"
              component="span"
              sx={{ fontWeight: 'bold', cursor: 'pointer', color: 'text.primary', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              {postUser.firstName ? `${postUser.firstName} ${postUser.lastName || ''}`.trim() : postUser.username}
            </Typography>
          </Link>
        }
        subheader={post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'Unknown date'}
      />
      {post.text && (
        <CardContent sx={{ py: 1 }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{post.text}</Typography>
        </CardContent>
      )}
      {/* Render CardMedia only if postImageUrl is not null */}
      {postImageUrl && (
        <CardMedia
          component="img"
          image={postImageUrl} // Use the generated full URL
          alt="Post image"
          sx={{ maxHeight: 500, objectFit: 'contain', bgcolor: '#f0f0f0' }}
        />
      )}
      <CardContent sx={{ py: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            color: 'text.secondary',
            fontSize: 14
          }}
        >
          {(post.likes?.length ?? 0) > 0 && (
            <Typography variant="body2">
              {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
            </Typography>
          )}
          {(post.comments?.length ?? 0) > 0 && (
            <Typography variant="body2">
              {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
            </Typography>
          )}
        </Box>
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: 'space-around' }}>
        <Button
            size="small"
            startIcon={isLiked ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
            onClick={handleLikeClick}
            disabled={likeMutation.isPending || !currentUser}
            sx={{ textTransform: 'none', color: isLiked ? 'error.main' : 'text.secondary' }}
        >
            Like
        </Button>
        <Button
            size="small"
            startIcon={<CommentIcon />}
            onClick={handleCommentClick}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
        >
            Comment
        </Button>
      </CardActions>

      {showComments && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Divider sx={{ my: 1 }} />
          <CommentForm postId={post._id} />
          <CommentList postId={post._id} />
        </Box>
      )}
    </Card>
  );
};

export default PostCard;
