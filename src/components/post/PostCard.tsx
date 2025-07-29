import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardHeader, CardContent, CardActions, CardMedia, Button, Avatar, Typography, IconButton, Box, Menu, MenuItem, Divider, Modal, Stack } from '@mui/material';
import { Comment as CommentIcon, MoreVert as MoreVertIcon, Delete as DeleteIcon, Edit as EditIcon, Public as PublicIcon, People as PeopleIcon, Lock as LockIcon } from '@mui/icons-material';
import Link from 'next/link';
import { Post, PostVisibility } from '../../types/post'; // Assuming Post type includes reactionsSummary
import CommentForm from './CommentForm';
import CommentList from './CommentList';
import useAuth from '../../hooks/useAuth';
import { useDeletePost } from '../../hooks/usePosts';
import { getFullImageUrl } from '../../utils/imgUrl';
import PostForm from './PostForm';
import ReactionSelector from './ReactionSelector'; // Make sure the path is correct

interface PostCardProps {
  post: Post;
}

// This type should ideally be in a shared types file, but defining it here
// helps resolve the type error for this component.
type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

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
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const deleteMutation = useDeletePost();
  const { user: postUser } = post;
  const isAuthor = currentUser && postUser && postUser._id === currentUser._id;
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setMenuAnchorEl(event.currentTarget);
  const handleMenuClose = () => setMenuAnchorEl(null);
  const handleEditClick = () => { setIsEditModalOpen(true); handleMenuClose(); };
  const handleCloseModal = () => setIsEditModalOpen(false);
  const handleDeletePost = () => { if (!post._id) return; deleteMutation.mutate(post._id); handleMenuClose(); };
  const handleCommentClick = () => setShowComments(!showComments);

  if (!postUser) return <Card sx={{ mb: 3, p: 2 }}><Typography>Error loading post author.</Typography></Card>;

  const authorAvatarUrl = getFullImageUrl(postUser.profilePicture, 'profile');
  const postImageUrl = post.media?.[0]?.url ? getFullImageUrl(post.media[0].url, 'post') : null;

  const defaultCounts = {       like: 0,
      love: 0,
      haha: 0,
      wow: 0,
      sad: 0,
      angry: 0,
      care: 0,
      clap: 0,
      fire: 0,
      thinking: 0,
      celebrate: 0,
      mind_blown: 0,
      heart_eyes: 0,
      laugh_cry: 0,
      shocked: 0,
      cool: 0,
      party: 0,
      thumbs_down: 0 };
  const initialCounts = { ...defaultCounts, ...(post.reactionsSummary?.counts || {}) };
  
  // --- FIX: Use a type assertion to cast the string to the specific ReactionType ---
  // This tells TypeScript to trust that the string from the API will be one of the valid reaction types.
  const initialUserReaction = (post.reactionsSummary?.currentUserReaction as ReactionType) || null;

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        avatar={ <Link href={`/profile/${postUser._id}`} passHref legacyBehavior><Avatar src={authorAvatarUrl} alt={postUser.username} sx={{ cursor: 'pointer' }} component="a" /></Link> }
        action={ isAuthor && (<> <IconButton aria-label="settings" onClick={handleMenuOpen}> <MoreVertIcon /> </IconButton> <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}> <MenuItem onClick={handleEditClick}><EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit</MenuItem> <MenuItem onClick={handleDeletePost} disabled={deleteMutation.isPending}><DeleteIcon fontSize="small" sx={{ mr: 1 }} /> {deleteMutation.isPending ? 'Deleting...' : 'Delete'} </MenuItem> </Menu> </>)}
        title={ <Link href={`/profile/${postUser._id}`} passHref legacyBehavior><Typography variant="subtitle1" component="span" sx={{ fontWeight: 'bold', cursor: 'pointer', color: 'text.primary', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>{postUser.firstName ? `${postUser.firstName} ${postUser.lastName || ''}`.trim() : postUser.username}</Typography></Link> }
        subheader={ <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', fontSize: '0.875rem' }}>{post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'Unknown date'}<Typography component="span" sx={{ mx: 0.5 }}>·</Typography>{getVisibilityIcon(post.visibility)}</Box> }
      />
      {post.text && <CardContent sx={{ py: 1 }}><Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{post.text}</Typography></CardContent>}
      {postImageUrl && <CardMedia component="img" image={postImageUrl} alt="Post image" sx={{ maxHeight: 500, objectFit: 'contain', bgcolor: '#f0f0f0' }} />}
      
      <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ReactionSelector
          postId={post._id}
          initialCounts={initialCounts}
          initialUserReaction={initialUserReaction}
        />
        <Button 
          size="small" 
          startIcon={<CommentIcon />} 
          onClick={handleCommentClick} 
          sx={{ 
            textTransform: 'none', 
            color: 'text.secondary',
            minWidth: 'fit-content',
            p: 0.5,
            '&:hover': { 
              bgcolor: 'action.hover' 
            }
          }}
        >
          {post.commentsCount > 0 
            ? `${post.commentsCount} ${post.commentsCount === 1 ? 'comment' : 'comments'}`
            : 'Comment'
          }
        </Button>
      </Box>

      <Divider />

      {showComments && ( <Box sx={{ px: 2, pb: 2 }}> <Divider sx={{ my: 1 }} /> <CommentForm postId={post._id} /> <CommentList postId={post._id} /> </Box> )}
      
      <Modal open={isEditModalOpen} onClose={handleCloseModal}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: { xs: '90%', sm: 500 }, bgcolor: 'background.paper', boxShadow: 24, borderRadius: 2 }}>
          <PostForm postToEdit={post} dialogMode={true} onSubmitSuccess={handleCloseModal} />
        </Box>
      </Modal>
    </Card>
  );
};

export default PostCard;