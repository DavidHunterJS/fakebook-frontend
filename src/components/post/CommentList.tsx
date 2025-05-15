import React from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Paper, 
  IconButton, 
  Menu, 
  MenuItem, 
  CircularProgress 
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { 
  Favorite as FavoriteIcon, 
  FavoriteBorder as FavoriteBorderIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon 
} from '@mui/icons-material';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../lib/axios';
import { Comment } from '../../types/comment';
import { User } from '../../types/user';
import useAuth from '../../hooks/useAuth';

interface CommentListProps {
  postId: string;
}

const CommentList: React.FC<CommentListProps> = ({ postId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const response = await axios.get(`/comments/post/${postId}`);
      // Log response for debugging
      console.log(`[CommentList] Comments response for post ${postId}:`, response.data);
      return response.data;
    }
  });

  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await axios.put(`/comments/${commentId}/like`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await axios.delete(`/comments/${commentId}`);
      return commentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center" sx={{ my: 2 }}>
        Error loading comments: {(error as Error).message}
      </Typography>
    );
  }

  // Handle different possible response structures
  let comments: Comment[] = [];
  
  if (data) {
    if (Array.isArray(data)) {
      // If data is directly an array
      comments = data;
    } else if (data.comments && Array.isArray(data.comments)) {
      // If comments are nested under a 'comments' property
      comments = data.comments;
    } else if (typeof data === 'object') {
      // Log unexpected structure for debugging
      console.error('[CommentList] Unexpected comments data structure:', data);
    }
  }

  // Now safely check if we have comments to display
  if (!comments || comments.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" align="center" sx={{ my: 2 }}>
        No comments yet. Be the first to comment!
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {comments.map((comment) => (
        <CommentItem 
          key={comment._id} 
          comment={comment} 
          onLike={() => likeCommentMutation.mutate(comment._id)}
          onDelete={() => deleteCommentMutation.mutate(comment._id)}
          currentUser={user}
        />
      ))}
    </Box>
  );
};

// Rest of your CommentItem component remains unchanged
interface CommentItemProps {
  comment: Comment;
  onLike: () => void;
  onDelete: () => void;
  currentUser: User | null;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onLike, onDelete, currentUser }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const commentUser = comment.user as User;
  
  // Handle case where comment.likes might be undefined
  const isLiked = currentUser && comment.likes ? comment.likes.includes(currentUser._id) : false;
  const isAuthor = currentUser && commentUser && commentUser._id === currentUser._id;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = () => {
    onDelete();
    handleMenuClose();
  };

  // Add null checks for commentUser
  if (!commentUser) {
    console.error('[CommentItem] Comment has no valid user:', comment);
    return (
      <Typography color="error">Invalid comment data</Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', mb: 2 }}>
      <Link href={`/profile/${commentUser._id}`} style={{ textDecoration: 'none' }}>
        <Avatar
          src={commentUser.profileImage || commentUser.profilePicture} // Handle both field names
          alt={commentUser.username}
          sx={{ width: 32, height: 32, mr: 1.5 }}
        />
      </Link>
      <Box sx={{ flexGrow: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            bgcolor: (theme) => theme.palette.grey[100],
            borderRadius: 3,
            position: 'relative',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Link href={`/profile/${commentUser._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Typography variant="subtitle2" component="span" sx={{ fontWeight: 'bold' }}>
                  {commentUser.username}
                </Typography>
              </Link>
              <Typography variant="body2" component="p" sx={{ wordBreak: 'break-word' }}>
                {comment.text}
              </Typography>
            </Box>
            {isAuthor && (
              <Box>
                <IconButton size="small" onClick={handleMenuOpen} sx={{ ml: 1, p: 0.5 }}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem dense onClick={handleDelete}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    Delete
                  </MenuItem>
                </Menu>
              </Box>
            )}
          </Box>
        </Paper>
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, mt: 0.5 }}>
          <Box 
            component="span" 
            sx={{ 
              fontSize: '0.75rem', 
              color: 'text.secondary',
              mr: 2,
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' },
            }}
            onClick={onLike}
          >
            {isLiked ? (
              <>
                <FavoriteIcon fontSize="inherit" color="error" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                Unlike
              </>
            ) : (
              <>
                <FavoriteBorderIcon fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                Like
              </>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </Typography>
          {comment.likes && comment.likes.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              <FavoriteIcon color="error" sx={{ fontSize: 12, mr: 0.5 }} />
              <Typography variant="caption" color="text.secondary">
                {comment.likes.length}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CommentList;