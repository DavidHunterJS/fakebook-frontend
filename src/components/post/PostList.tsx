// src/components/post/PostList.tsx

import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import PostCard from './PostCard';
import { useGetPosts } from '../../hooks/usePosts'; // Assuming this hook fetches posts
import {
  Post,
  Comment, // Now correctly imported as Comment
  IReportReason, // Now correctly imported as IReportReason
  PostVisibility,
  PopulatedUser,
  MediaItem, // Now correctly imported as MediaItem
  IShare // Assuming IShare is needed if shares are objects
} from '../../types/post'; // Corrected import path based on tsconfig.json alias
import { User } from '../../types/user'; // User type for defaultUser

// Interface for raw comment objects if they are not fully populated
interface CommentObject {
  _id: string; // _id is now required, as per the fix
  text?: string;
  user?: string | Partial<PopulatedUser>; // Can be string ID or partial user
  likes?: string[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown; // Permissive for other unknown properties
}

// Interface for the raw data received directly from the API before normalization
// This allows for more flexible types than the strict 'Post' interface
interface ApiRawPost {
  _id?: string;
  text?: string;
  // Allow null or undefined items in the media array
  media?: (string | MediaItem | null | undefined)[];
  user?: string | Partial<User> | PopulatedUser;
  author?: string | Partial<User> | PopulatedUser;
  likes?: string[];
  // Allow comments to be string[] or CommentObject[] (for raw objects)
  comments?: (string | CommentObject)[];
  createdAt?: string;
  updatedAt?: string;
  visibility?: string;
  tags?: string[] | Partial<PopulatedUser>[]; // Tags can be string IDs or partial user objects
  reported?: boolean;
  // Allow shares to be number (count) or array (of any type for raw)
  shares?: number | string[] | Partial<IShare>[];
  // Allow reportReasons to be string[] (old) or partial IReportReason objects
  reportReasons?: (string | Partial<IReportReason>)[];
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

// Type guard to validate visibility strings against the enum
function isValidVisibility(value: string | undefined): value is keyof typeof PostVisibility {
  return value === 'public' || value === 'friends' || value === 'private';
}

// Type guard to check if an array of comments consists purely of string IDs
function isStringArrayOfComments(arr: (string | CommentObject)[]): arr is string[] {
  return arr.length === 0 || typeof arr[0] === 'string';
}

const PostList: React.FC = () => {
  const { data, isLoading, error } = useGetPosts();
  // Cast the raw data to ApiRawPost[] before mapping and normalizing
  const posts: Post[] = data
    ? (data as unknown as ApiRawPost[]).map(normalizePost)
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
        // Ensure post._id exists before rendering PostCard
        post._id ? <PostCard key={post._id} post={post} /> : null
      ))}
    </Box>
  );
};

// Helper function to normalize raw API post data into the strict 'Post' interface
const normalizePost = (rawPost: ApiRawPost): Post => {
  // Default User object for cases where user data is incomplete or missing
  const defaultUser: User = {
    _id: 'unknown_id', // Must be a string ID
    username: 'Unknown User',
    email: 'unknown@example.com',
    firstName: 'Unknown',
    lastName: 'User',
    profilePicture: 'default-avatar.png' // Default avatar
  };

  // Normalize user/author data to a PopulatedUser object
  const apiUser = rawPost.user || rawPost.author;
  const userObject: PopulatedUser = apiUser && typeof apiUser === 'object' && '_id' in apiUser
    ? {
        _id: apiUser._id || defaultUser._id,
        username: (apiUser as PopulatedUser).username || defaultUser.username,
        firstName: (apiUser as PopulatedUser).firstName || defaultUser.firstName,
        lastName: (apiUser as PopulatedUser).lastName || defaultUser.lastName,
        profilePicture: (apiUser as PopulatedUser).profilePicture || (apiUser as PopulatedUser).profileImage || defaultUser.profilePicture
      }
    : { // If not an object or missing _id, use default user values
        _id: defaultUser._id,
        username: defaultUser.username,
        firstName: defaultUser.firstName,
        lastName: defaultUser.lastName,
        profilePicture: defaultUser.profilePicture
      };

  // Normalize media items to MediaItem[]
  const mediaItems: MediaItem[] = rawPost.media?.map(media => {
    // Explicitly check for null/undefined before processing each media item
    if (media === null || typeof media === 'undefined') {
      return null; // Return nulls to be filtered out
    }
    // If media is already a MediaItem object, use it directly
    if (typeof media === 'object' && 'key' in media) {
      return media as MediaItem; // Assert to MediaItem
    }
    // Otherwise, assume it's a string (old format) and convert
    const mediaString = media as string; // Guaranteed to be a string here
    return {
      url: getFullImageUrl(mediaString, 'post'), // Assuming getFullImageUrl handles S3 keys
      key: mediaString,
      type: mediaString.match(/\.(mp4|mov|avi|webm)$/i) ? 'video' : 'image', // Added webm for video
      originalFilename: mediaString.split('/').pop() || mediaString
    };
  }).filter(Boolean) as MediaItem[] || []; // Filter out nulls and assert final type

  // Normalize visibility string to PostVisibility enum
  let visibility: PostVisibility;
  if (rawPost.visibility && isValidVisibility(rawPost.visibility)) {
    visibility = PostVisibility[rawPost.visibility.toUpperCase() as keyof typeof PostVisibility];
  } else {
    visibility = PostVisibility.PUBLIC; // Default to PUBLIC if invalid or missing
  }

  // Normalize tags to PopulatedUser[]
  const tags: PopulatedUser[] = rawPost.tags
    ? rawPost.tags.map(tag => {
        if (typeof tag === 'string') { // If tag is just an ID string
          return {
            _id: tag,
            username: `user_${tag.substring(0, 8)}`, // Generate a simple username
            firstName: '', lastName: '', profilePicture: ''
          };
        } else { // If tag is a partial PopulatedUser object
          return {
            _id: tag._id || 'unknown_tag_id',
            username: tag.username || `user_${tag._id?.substring(0, 8) || 'unknown'}`,
            firstName: tag.firstName || '',
            lastName: tag.lastName || '',
            profilePicture: tag.profilePicture || tag.profileImage || ''
          };
        }
      })
    : [];

  // Normalize shares to IShare[]
  const sharesArray: IShare[] = rawPost.shares !== undefined
    ? typeof rawPost.shares === 'number'
      ? Array(rawPost.shares).fill({ user: 'unknown_share_user', date: new Date() } as IShare) // Fill with valid IShare objects if count is given
      : Array.isArray(rawPost.shares)
        ? rawPost.shares.map(share => { // Map raw shares to IShare
            if (typeof share === 'object' && share !== null && 'user' in share && 'date' in share) {
              let shareDate: Date;
              if (typeof share.date === 'string') {
                shareDate = new Date(share.date); // If it's a string, parse it
              } else if (share.date instanceof Date) {
                shareDate = share.date; // If it's already a Date object, use it directly
              } else {
                shareDate = new Date(); // Fallback if unexpected type or undefined
              }

              return {
                user: share.user || 'unknown_share_user', // Ensure user is a string ID
                date: shareDate // Use the determined Date object
              } as IShare;
            }
            return { user: 'unknown_share_user', date: new Date() } as IShare; // Fallback for malformed shares
          })
        : []
    : []; // Default to empty array if shares is undefined

  // Normalize comments to (string | Comment)[]
  let commentsValue: (string | Comment)[] = [];
  if (rawPost.comments && Array.isArray(rawPost.comments)) {
    // If all items are strings, keep as string[]
    if (isStringArrayOfComments(rawPost.comments)) {
      commentsValue = rawPost.comments;
    } else {
      // If some items are objects, assume they are 'Comment' objects (potentially partial)
      commentsValue = rawPost.comments.map(comment => {
        // Here, we leverage the optional properties on CommentObject
        // and use nullish coalescing (??) for defaults
        const rawComment = comment as CommentObject; // Assert to CommentObject here to access properties
        return {
          _id: rawComment._id || 'unknown_comment_id',
          text: rawComment.text ?? '', // Safely access with ??
          user: rawComment.user ?? 'unknown_comment_user', // Safely access with ??
          likes: rawComment.likes ?? [], // Safely access with ??
          createdAt: rawComment.createdAt ?? new Date().toISOString(), // Safely access with ??
          updatedAt: rawComment.updatedAt ?? new Date().toISOString() // Safely access with ??
        } as Comment; // Explicitly cast to Comment
      });
    }
  }


  // Normalize report reasons to IReportReason[]
  const reportReasonsValue: IReportReason[] = rawPost.reportReasons?.map(reason => {
    // If raw reason is a string (just the reason text)
    if (typeof reason === 'string') {
      return {
        reason,
        user: 'unknown_reporter', // Provide a default string ID for user
        date: new Date() // Provide a default date
      } as IReportReason; // Explicitly cast to IReportReason
    } else if (typeof reason === 'object' && reason !== null && 'reason' in reason) {
      // If raw reason is a partial IReportReason object, ensure all fields are present
      return {
        reason: reason.reason || '',
        user: (reason as Partial<IReportReason>).user || 'unknown_reporter', // Ensure user is string ID
        date: (reason.date ? new Date(reason.date as string) : new Date()) // Ensure date is Date object
      } as IReportReason; // Explicitly cast to IReportReason
    }
    // Fallback for unexpected types in rawPost.reportReasons (shouldn't happen if API is consistent)
    return {
      reason: 'unknown_reason',
      user: 'unknown_reporter',
      date: new Date()
    } as IReportReason;
  }) || []; // Default to empty array if no report reasons or map results in undefined


  // Return the normalized Post object
  return {
    _id: rawPost._id || `temp_${Math.random()}`, // Ensure _id is always present
    text: rawPost.text || '', // Ensure text is always present (empty string if missing)
    media: mediaItems, // Normalized media items
    user: userObject, // Normalized user object
    likes: rawPost.likes || [], // Ensure likes is always an array
    comments: commentsValue, // Normalized comments
    createdAt: rawPost.createdAt || new Date().toISOString(), // Ensure createdAt is always a string
    updatedAt: rawPost.updatedAt || new Date().toISOString(), // Ensure updatedAt is always a string
    visibility, // Normalized visibility
    tags, // Normalized tags
    reported: rawPost.reported || false, // Default to false
    shares: sharesArray, // Normalized shares
    reportReasons: reportReasonsValue, // Normalized report reasons
    likesCount: rawPost.likesCount || 0, // Default to 0
    commentsCount: rawPost.commentsCount || 0, // Default to 0
    isLiked: rawPost.isLiked || false, // Default to false
    isSaved: rawPost.isSaved || false // Default to false
  };
};

// Helper function to generate full image URLs
// This function should ideally be in a shared utility file (e.g., utils/imgUrl.ts)
// and imported from there. Keeping it here for compilation.
function getFullImageUrl(key: string, type: 'post' | 'profile'): string {
  // Replace with your actual S3 bucket URL or local serving URL
  const baseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || 'http://localhost:5000/uploads'; // Adjust as needed
  return `${baseUrl}/${type}/${key}`;
}

export default PostList;