import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import PostCard from './PostCard';
import { useGetPosts } from '../../hooks/usePosts'; // Adjust path if needed
import { Post, Comment, ReportReason } from '../../types/post'; // Added ReportReason import
import { User } from '../../types/user'; // Adjust path if needed

// Define a generic object type for when we don't know the exact structure
interface CommentObject {
  _id: string;
  [key: string]: unknown; // Allows any other properties but requires _id
}

// Define a more accurate interface for the raw post data
interface RawPost {
  _id?: string;
  text?: string;
  media?: string[];
  user?: string | Partial<User>;
  author?: string | Partial<User>;
  likes?: string[];
  comments?: string[] | CommentObject[]; // Replace any[] with CommentObject[]
  createdAt?: string;
  updatedAt?: string;
  visibility?: string;
  tags?: string[];
  reported?: boolean;
  shares?: number | string[]; // Updated to match both possible types
  reportReasons?: string[] | Partial<ReportReason>[]; // Updated to handle both string and ReportReason
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

// Type guard to check if a string is a valid visibility value
function isValidVisibility(value: string | undefined): value is "public" | "friends" | "private" {
  return value === "public" || value === "friends" || value === "private";
}

// Type guard to check if comments are strings
function isStringArray(arr: (string | CommentObject)[]): arr is string[] {
  return arr.length === 0 || typeof arr[0] === 'string';
}

const PostList: React.FC = () => {
  const { data, isLoading, error } = useGetPosts();
  const posts: Post[] = data || [];

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
        post._id ? <PostCard key={post._id} post={normalizePost(post as unknown as RawPost)} /> : null
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
const normalizePost = (rawPost: RawPost): Post => {
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

  // Ensure visibility is one of the allowed values
  let validVisibility: "public" | "friends" | "private" | undefined;
  if (rawPost.visibility && isValidVisibility(rawPost.visibility)) {
    validVisibility = rawPost.visibility;
  } else {
    validVisibility = "public"; // Default to public if invalid or undefined
  }

  // Handle shares - convert number to string array if needed
  let sharesArray: string[] | undefined;
  if (rawPost.shares !== undefined) {
    if (typeof rawPost.shares === 'number') {
      // Convert number to a string array with that many empty strings
      // Or you might want to handle this differently based on your app's logic
      sharesArray = Array(rawPost.shares).fill('');
    } else if (Array.isArray(rawPost.shares)) {
      // Already an array, assume it's string[]
      sharesArray = rawPost.shares;
    } else {
      // Default case
      sharesArray = [];
    }
  } else {
    sharesArray = undefined;
  }

  // Handle comments based on what type they are
  let commentsValue: string[] | Comment[] = [];
  if (rawPost.comments && Array.isArray(rawPost.comments)) {
    if (isStringArray(rawPost.comments)) {
      // If they're string IDs
      commentsValue = rawPost.comments;
    } else {
      // Try to convert them to the correct Comment type
      try {
        commentsValue = rawPost.comments as unknown as Comment[];
      } catch (e) {
        console.error('Error converting comments:', e);
        commentsValue = [];
      }
    }
  }

  // Convert string reasons to ReportReason objects
  let reportReasonsValue: ReportReason[] | undefined;
  if (rawPost.reportReasons && Array.isArray(rawPost.reportReasons)) {
    reportReasonsValue = rawPost.reportReasons.map(reason => {
      if (typeof reason === 'string') {
        // Convert string to ReportReason object
        return {
          reason: reason
        };
      } else {
        // Already a ReportReason object
        return reason as ReportReason;
      }
    });
  } else {
    reportReasonsValue = undefined;
  }

  const normalized: Post = {
    _id: rawPost._id || `temp_${Math.random()}`,
    text: rawPost.text || '',
    media: rawPost.media || [],
    user: userObject,
    likes: rawPost.likes || [],
    comments: commentsValue,
    createdAt: rawPost.createdAt || new Date().toISOString(),
    updatedAt: rawPost.updatedAt || new Date().toISOString(),
    visibility: validVisibility,
    tags: rawPost.tags,
    reported: rawPost.reported,
    shares: sharesArray,
    reportReasons: reportReasonsValue,
    likesCount: rawPost.likesCount,
    commentsCount: rawPost.commentsCount,
    isLiked: rawPost.isLiked,
    isSaved: rawPost.isSaved,
    image: imageFilename
  };

  return normalized;
};

export default PostList;