// src/types/post.ts

// Adjust path if needed based on where your main User interface is defined
import { User } from './user'; // Assuming 'User' here is the full populated User interface

// --- Core Interfaces used across Post and Comment ---

export interface PopulatedUser {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string; // S3 key
  profileImage?: string; // S3 key (alternative or legacy)
}

export interface MediaItem {
  url: string;
  key: string;
  type: string; // e.g., 'image', 'video'
  originalFilename?: string;
}

export interface PopulatedReply {
  _id: string;
  user: PopulatedUser;
  text: string;
  likes: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Comment {
  _id: string;
  text: string;
  user: PopulatedUser | string;
  post: string;
  likes: string[];
  createdAt: string;
  updatedAt: string;
  replies?: PopulatedReply[];
  reported?: boolean;
  reportReasons?: IReportReason[];
}


// --- Post Interfaces (Based on your backend model and controller output) ---

export interface IReportReason {
  user: User['_id'] | string;
  reason: string;
  date: Date | string;
}

export interface IShare {
  user: User['_id'];
  date: Date;
}

export enum PostVisibility {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private'
}

// --- NEW: Define the structure for the reaction summary from your API ---
export interface ReactionSummary {
  counts: Record<string, number>; // e.g., { love: 5, like: 12, haha: 2 }
  currentUserReaction: string | null; // The logged-in user's reaction, or null
}

export interface Post {
  _id: string;
  user: PopulatedUser;
  text: string;
  media?: MediaItem[];
  visibility: PostVisibility;
  // --- REMOVED: These are now replaced by reactionsSummary ---
  // likes: string[];
  // likesCount: number;
  // isLiked: boolean;
  comments: (string | Comment)[];
  tags: PopulatedUser[];
  reported: boolean;
  reportReasons: IReportReason[];
  createdAt: string;
  updatedAt: string;
  
  // Aggregated/calculated fields from backend
  commentsCount: number;
  isSaved: boolean;
  
  // --- NEW: Add the reaction summary to the Post type ---
  reactionsSummary?: ReactionSummary;

  // Optional fields from your Post model (if not always returned)
  pinned?: boolean;
  originalPost?: string;
  sharedFrom?: string;
  shares?: IShare[];
}

export interface PostsResponse {
  posts: Post[];
  pagination?: {
      total?: number;
      page?: number;
      pages?: number;
  };
}