import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import PostCard from './PostCard';
import { useGetPosts } from '../../hooks/usePosts';
import {
  Post,
  Comment,
  IReportReason,
  PostVisibility,
  PopulatedUser,
  MediaItem,
  IShare,
  ReactionSummary // --- Import ReactionSummary ---
} from '../../types/post';
import { User } from '../../types/user';

interface CommentObject {
  _id: string;
  text?: string;
  user?: string | Partial<PopulatedUser>;
  likes?: string[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

// Updated to include the new reactionsSummary field
interface ApiRawPost {
  _id?: string;
  text?: string;
  media?: (string | MediaItem | null | undefined)[];
  user?: string | Partial<User> | PopulatedUser;
  author?: string | Partial<User> | PopulatedUser;
  comments?: (string | CommentObject)[];
  createdAt?: string;
  updatedAt?: string;
  visibility?: string;
  tags?: string[] | Partial<PopulatedUser>[];
  reported?: boolean;
  shares?: number | string[] | Partial<IShare>[];
  reportReasons?: (string | Partial<IReportReason>)[];
  commentsCount?: number;
  isSaved?: boolean;
  // --- NEW: Add reactionsSummary to the raw post type ---
  reactionsSummary?: ReactionSummary;
  // --- DEPRECATED: Kept for normalization but removed from final Post object ---
  likes?: string[];
  likesCount?: number;
  isLiked?: boolean;
}

function isValidVisibility(value: string | undefined): value is keyof typeof PostVisibility {
  return value === 'public' || value === 'friends' || value === 'private';
}

function isStringArrayOfComments(arr: (string | CommentObject)[]): arr is string[] {
  return arr.length === 0 || typeof arr[0] === 'string';
}

const PostList: React.FC = () => {
  const { data, isLoading, error } = useGetPosts();
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
        post._id ? <PostCard key={post._id} post={post} /> : null
      ))}
    </Box>
  );
};

// Helper function to normalize raw API post data into the strict 'Post' interface
const normalizePost = (rawPost: ApiRawPost): Post => {
  const defaultUser: User = {
    _id: 'unknown_id',
    username: 'Unknown User',
    email: 'unknown@example.com',
    firstName: 'Unknown',
    lastName: 'User',
    profilePicture: 'default-avatar.png'
  };

  const apiUser = rawPost.user || rawPost.author;
  const userObject: PopulatedUser = apiUser && typeof apiUser === 'object' && '_id' in apiUser
    ? {
        _id: apiUser._id || defaultUser._id,
        username: (apiUser as PopulatedUser).username || defaultUser.username,
        firstName: (apiUser as PopulatedUser).firstName || defaultUser.firstName,
        lastName: (apiUser as PopulatedUser).lastName || defaultUser.lastName,
        profilePicture: (apiUser as PopulatedUser).profilePicture || (apiUser as PopulatedUser).profileImage || defaultUser.profilePicture
      }
    : {
        _id: defaultUser._id,
        username: defaultUser.username,
        firstName: defaultUser.firstName,
        lastName: defaultUser.lastName,
        profilePicture: defaultUser.profilePicture
      };

  const mediaItems: MediaItem[] = rawPost.media?.map(media => {
    if (media === null || typeof media === 'undefined') {
      return null;
    }
    if (typeof media === 'object' && 'key' in media) {
      return media as MediaItem;
    }
    const mediaString = media as string;
    return {
      url: getFullImageUrl(mediaString, 'post'),
      key: mediaString,
      type: mediaString.match(/\.(mp4|mov|avi|webm)$/i) ? 'video' : 'image',
      originalFilename: mediaString.split('/').pop() || mediaString
    };
  }).filter(Boolean) as MediaItem[] || [];

  let visibility: PostVisibility;
  if (rawPost.visibility && isValidVisibility(rawPost.visibility)) {
    visibility = PostVisibility[rawPost.visibility.toUpperCase() as keyof typeof PostVisibility];
  } else {
    visibility = PostVisibility.PUBLIC;
  }

  const tags: PopulatedUser[] = rawPost.tags
    ? rawPost.tags.map(tag => {
        if (typeof tag === 'string') {
          return {
            _id: tag,
            username: `user_${tag.substring(0, 8)}`,
            firstName: '', lastName: '', profilePicture: ''
          };
        } else {
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

  const sharesArray: IShare[] = rawPost.shares !== undefined
    ? typeof rawPost.shares === 'number'
      ? Array(rawPost.shares).fill({ user: 'unknown_share_user', date: new Date() } as IShare)
      : Array.isArray(rawPost.shares)
        ? rawPost.shares.map(share => {
            if (typeof share === 'object' && share !== null && 'user' in share && 'date' in share) {
              let shareDate: Date;
              if (typeof share.date === 'string') {
                shareDate = new Date(share.date);
              } else if (share.date instanceof Date) {
                shareDate = share.date;
              } else {
                shareDate = new Date();
              }
              return {
                user: share.user || 'unknown_share_user',
                date: shareDate
              } as IShare;
            }
            return { user: 'unknown_share_user', date: new Date() } as IShare;
          })
        : []
    : [];

  let commentsValue: (string | Comment)[] = [];
  if (rawPost.comments && Array.isArray(rawPost.comments)) {
    if (isStringArrayOfComments(rawPost.comments)) {
      commentsValue = rawPost.comments;
    } else {
      commentsValue = rawPost.comments.map(comment => {
        const rawComment = comment as CommentObject;
        return {
          _id: rawComment._id || 'unknown_comment_id',
          text: rawComment.text ?? '',
          user: rawComment.user ?? 'unknown_comment_user',
          likes: rawComment.likes ?? [],
          createdAt: rawComment.createdAt ?? new Date().toISOString(),
          updatedAt: rawComment.updatedAt ?? new Date().toISOString()
        } as Comment;
      });
    }
  }

  const reportReasonsValue: IReportReason[] = rawPost.reportReasons?.map(reason => {
    if (typeof reason === 'string') {
      return {
        reason,
        user: 'unknown_reporter',
        date: new Date()
      } as IReportReason;
    } else if (typeof reason === 'object' && reason !== null && 'reason' in reason) {
      return {
        reason: reason.reason || '',
        user: (reason as Partial<IReportReason>).user || 'unknown_reporter',
        date: (reason.date ? new Date(reason.date as string) : new Date())
      } as IReportReason;
    }
    return {
      reason: 'unknown_reason',
      user: 'unknown_reporter',
      date: new Date()
    } as IReportReason;
  }) || [];

  // --- FIX: Normalize the new reactionsSummary field ---
  const reactionsSummaryValue: ReactionSummary = rawPost.reactionsSummary 
    ? {
        counts: rawPost.reactionsSummary.counts || {},
        currentUserReaction: rawPost.reactionsSummary.currentUserReaction || null
      }
    : { // Fallback if the whole summary object is missing from the API response
        counts: {},
        currentUserReaction: null
      };

  // Return the normalized Post object, matching the updated Post type
  return {
    _id: rawPost._id || `temp_${Math.random()}`,
    text: rawPost.text || '',
    media: mediaItems,
    user: userObject,
    comments: commentsValue,
    createdAt: rawPost.createdAt || new Date().toISOString(),
    updatedAt: rawPost.updatedAt || new Date().toISOString(),
    visibility,
    tags,
    reported: rawPost.reported || false,
    shares: sharesArray,
    reportReasons: reportReasonsValue,
    commentsCount: rawPost.commentsCount || 0,
    isSaved: rawPost.isSaved || false,
    // --- FIX: Use the new reactionsSummary instead of the old fields ---
    reactionsSummary: reactionsSummaryValue,
  };
};

function getFullImageUrl(key: string, type: 'post' | 'profile'): string {
  const baseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || 'http://localhost:5000/uploads';
  return `${baseUrl}/${type}/${key}`;
}

export default PostList;
