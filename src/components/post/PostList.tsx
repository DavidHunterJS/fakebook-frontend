import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import PostCard from './PostCard';
import { useGetPosts } from '../../hooks/usePosts';
import { Post, Comment, IReportReason, PostVisibility, PopulatedUser } from '../../types/post';
import { User } from '../../types/user';

interface CommentObject {
  _id: string;
  [key: string]: unknown;
}

interface RawPost {
  _id?: string;
  text?: string;
  media?: string[];
  user?: string | Partial<User>;
  author?: string | Partial<User>;
  likes?: string[];
  comments?: string[] | CommentObject[];
  createdAt?: string;
  updatedAt?: string;
  visibility?: string;
  tags?: string[] | Partial<PopulatedUser>[];
  reported?: boolean;
  shares?: number | string[];
  reportReasons?: string[] | Partial<IReportReason>[];
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

function isValidVisibility(value: string | undefined): value is keyof typeof PostVisibility {
  return value === 'public' || value === 'friends' || value === 'private';
}

function isStringArray(arr: (string | CommentObject)[]): arr is string[] {
  return arr.length === 0 || typeof arr[0] === 'string';
}

const PostList: React.FC = () => {
  // Cast the data to RawPost[] before mapping
  const { data, isLoading, error } = useGetPosts();
  const posts: Post[] = data 
    ? (data as unknown as RawPost[]).map(normalizePost) 
    : [];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    const errorMessage = (error as Error)?.message || 'Error loading posts. Please try again later.';
    return (
      <Typography color="error" align="center" sx={{ my: 4 }}>
        {errorMessage}
      </Typography>
    );
  }

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
        post._id ? <PostCard key={post._id} post={post} /> : null
      ))}
    </Box>
  );
};

const normalizePost = (rawPost: RawPost): Post => {
  const defaultUser: User = {
    _id: 'unknown',
    username: 'Unknown User',
    email: 'unknown@example.com',
    firstName: '',
    lastName: '',
    profilePicture: 'default-avatar.png'
  };

  // Handle user/author
  const apiUser = rawPost.user || rawPost.author;
  const userObject: User = apiUser && typeof apiUser === 'object' 
    ? { ...defaultUser, ...apiUser } 
    : defaultUser;

  // Handle media conversion from string[] to MediaItem[]
  const mediaItems = rawPost.media?.map(mediaString => ({
    url: getFullImageUrl(mediaString, 'post'),
    key: mediaString,
    type: mediaString.match(/\.(mp4|mov|avi)$/i) ? 'video' : 'image',
    originalFilename: mediaString.split('/').pop() || mediaString
  })) || [];

  // Handle visibility conversion to enum
  let visibility: PostVisibility;
  if (rawPost.visibility && isValidVisibility(rawPost.visibility)) {
    visibility = PostVisibility[rawPost.visibility.toUpperCase() as keyof typeof PostVisibility];
  } else {
    visibility = PostVisibility.PUBLIC;
  }

  // Handle tags conversion to PopulatedUser[]
  const tags: PopulatedUser[] = rawPost.tags
    ? rawPost.tags.map(tag => {
        if (typeof tag === 'string') {
          return {
            _id: tag,
            username: `user_${tag.substring(0, 4)}`,
            firstName: '',
            lastName: '',
            profilePicture: ''
          };
        } else {
          return {
            _id: tag._id || 'unknown',
            username: tag.username || `user_${tag._id?.substring(0, 4) || 'unknown'}`,
            firstName: tag.firstName || '',
            lastName: tag.lastName || '',
            profilePicture: tag.profilePicture || tag.profileImage || ''
          };
        }
      })
    : [];

  // Handle shares conversion
  const sharesArray = rawPost.shares !== undefined
    ? typeof rawPost.shares === 'number'
      ? Array(rawPost.shares).fill('')
      : Array.isArray(rawPost.shares)
        ? rawPost.shares
        : []
    : undefined;

  // Handle comments conversion
  let commentsValue: string[] | Comment[] = [];
  if (rawPost.comments && Array.isArray(rawPost.comments)) {
    commentsValue = isStringArray(rawPost.comments)
      ? rawPost.comments
      : rawPost.comments as unknown as Comment[];
  }

  // Handle report reasons conversion
  const reportReasonsValue = rawPost.reportReasons?.map(reason => {
    if (typeof reason === 'string') {
      return {
        reason,
        user: 'unknown',
        date: new Date()
      };
    } else {
      return {
        reason: reason.reason || '',
        user: reason.user || 'unknown',
        date: reason.date ? new Date(reason.date) : new Date()
      };
    }
  });

  return {
    _id: rawPost._id || `temp_${Math.random()}`,
    text: rawPost.text || '',
    media: mediaItems,
    user: userObject,
    likes: rawPost.likes || [],
    comments: commentsValue,
    createdAt: rawPost.createdAt || new Date().toISOString(),
    updatedAt: rawPost.updatedAt || new Date().toISOString(),
    visibility,
    tags,
    reported: rawPost.reported || false,
    shares: sharesArray,
    reportReasons: reportReasonsValue || [],
    likesCount: rawPost.likesCount || 0,
    commentsCount: rawPost.commentsCount || 0,
    isLiked: rawPost.isLiked || false,
    isSaved: rawPost.isSaved || false
  };
};

// Helper function to generate full image URLs
function getFullImageUrl(key: string, type: 'post' | 'profile'): string {
  return `https://your-bucket.s3.amazonaws.com/${type}/${key}`;
}

export default PostList;