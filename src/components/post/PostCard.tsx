import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardHeader, CardContent, CardActions, CardMedia, Button, Avatar, Typography, IconButton, Box, Menu, MenuItem, Divider, Modal, Tooltip } from '@mui/material';
import { Favorite as FavoriteIcon, FavoriteBorder as FavoriteBorderIcon, Comment as CommentIcon, MoreVert as MoreVertIcon, Delete as DeleteIcon, Edit as EditIcon, Public as PublicIcon, People as PeopleIcon, Lock as LockIcon } from '@mui/icons-material';
import Link from 'next/link';
import { Post, PostVisibility } from '../../types/post';
import { User } from '../../types/user';
import CommentForm from './CommentForm';
import CommentList from './CommentList';
import useAuth from '../../hooks/useAuth';
import { useLikePost, useDeletePost } from '../../hooks/usePosts';
import { getFullImageUrl } from '../../utils/imgUrl';
import PostForm from './PostForm';

interface PostCardProps {
  post: Post;
}

const getVisibilityIcon = (visibility: PostVisibility) => {
  const iconStyle = { fontSize: 'inherit', verticalAlign: 'middle', mr: 0.5 };
  switch (visibility) {
    case PostVisibility.PUBLIC: return <PublicIcon sx={iconStyle} />;
    case PostVisibility.FRIENDS: return <PeopleIcon sx={iconStyle} />;
    case PostVisibility.PRIVATE: return <LockIcon sx={iconStyle} />;
    default: return <PublicIcon sx={iconStyle} />;
  }
};

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user: currentUser } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const likeMutation = useLikePost();
  const deleteMutation = useDeletePost();

  const postUser = post.user as User | undefined;

  const isLiked = currentUser && post.likes ? post.likes.includes(currentUser._id) : false;
  const isAuthor = currentUser && postUser && postUser._id === currentUser._id;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleEditClick = () => {
    setIsEditModalOpen(true);
    handleMenuClose();
  };

  const handleCloseModal = () => setIsEditModalOpen(false);

  const handleDeletePost = () => {
    if (!post._id) return;
    deleteMutation.mutate(post._id);
    handleMenuClose();
  };

  const handleLikeClick = () => {
    if (!post._id || !currentUser) return;
    likeMutation.mutate(post._id);
  };

  const handleCommentClick = () => setShowComments(!showComments);

  if (!postUser) return <Card sx={{ mb: 3, p: 2 }}><Typography>Error loading post author.</Typography></Card>;

  const authorAvatarUrl = postUser.profilePicture ? getFullImageUrl(postUser.profilePicture, 'profile') : '/images/default-avatar.png';
  const postImageUrl = (post.media && post.media.length > 0) ? getFullImageUrl(post.media[0].url, 'post') : null;

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        avatar={
          <Link href={`/profile/${postUser._id}`} passHref legacyBehavior>
            <Avatar src={authorAvatarUrl} alt={postUser.username || 'User Avatar'} sx={{ cursor: 'pointer' }} component="a" />
          </Link>
        }
        action={
          isAuthor && (
            <>
              <IconButton aria-label="settings" onClick={handleMenuOpen}>
                <MoreVertIcon />
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleEditClick}>
                  <EditIcon fontSize="small" sx={{ mr: 1 }} />
                  Edit
                </MenuItem>
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
            <Typography variant="subtitle1" component="span" sx={{ fontWeight: 'bold', cursor: 'pointer', color: 'text.primary', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
              {postUser.firstName ? `${postUser.firstName} ${postUser.lastName || ''}`.trim() : postUser.username}
            </Typography>
          </Link>
        }
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', fontSize: '0.875rem' }}>
            {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'Unknown date'}
            <Typography component="span" sx={{ mx: 0.5 }}>·</Typography>
            {getVisibilityIcon(post.visibility)}
          </Box>
        }
      />
      {post.text && <CardContent sx={{ py: 1 }}><Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{post.text}</Typography></CardContent>}
      {postImageUrl && <CardMedia component="img" image={postImageUrl} alt="Post image" sx={{ maxHeight: 500, objectFit: 'contain', bgcolor: '#f0f0f0' }} />}
      <CardContent sx={{ py: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary', fontSize: 14 }}>
          {(post.likes?.length ?? 0) > 0 && <Typography variant="body2">{post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}</Typography>}
          {(post.comments?.length ?? 0) > 0 && <Typography variant="body2">{post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}</Typography>}
        </Box>
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: 'space-around' }}>
        <Button size="small" startIcon={isLiked ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />} onClick={handleLikeClick} disabled={likeMutation.isPending || !currentUser} sx={{ textTransform: 'none', color: isLiked ? 'error.main' : 'text.secondary' }}>
          Like
        </Button>
        <Button size="small" startIcon={<CommentIcon />} onClick={handleCommentClick} sx={{ textTransform: 'none', color: 'text.secondary' }}>
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
      <Modal open={isEditModalOpen} onClose={handleCloseModal}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: { xs: '90%', sm: 500 }, bgcolor: 'background.paper', boxShadow: 24, borderRadius: 2 }}>
          <PostForm
            postToEdit={post}
            dialogMode={true}
            onSubmitSuccess={handleCloseModal}
          />
        </Box>
      </Modal>
    </Card>
  );
};

export default PostCard;