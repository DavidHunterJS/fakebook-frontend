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
  // Add any other user fields that are populated (e.g., email, avatar, etc.)
}

export interface MediaItem { // THIS IS THE CORRECT TYPE FOR MEDIA ITEMS
  url: string;
  key: string;
  type: string; // e.g., 'image', 'video'
  originalFilename?: string;
}

export interface PopulatedReply {
  _id: string;
  user: PopulatedUser; // Populated user who made the reply
  text: string;
  likes: string[]; // User IDs who liked the reply
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Comment { // Exported as 'Comment' for CommentList.tsx
  _id: string;
  text: string;
  user: PopulatedUser | string; // User can be populated or just an ID
  post: string; // ID of the parent post
  likes: string[]; // User IDs who liked the comment
  createdAt: string;
  updatedAt: string;
  replies?: PopulatedReply[]; // If replies are populated as well
  reported?: boolean;
  reportReasons?: IReportReason[]; // Now explicitly IReportReason[]
}


// --- Post Interfaces (Based on your backend model and controller output) ---

export interface IReportReason { // Exported as 'IReportReason'
  user: User['_id'] | string; // FIX: user can be an ObjectId or string ID
  reason: string;
  date: Date | string; // FIX: date can be Date object or string
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

export interface Post {
  _id: string;
  user: PopulatedUser; // Assumed populated by API
  text: string; // Assumed required based on model, can be empty string
  media?: MediaItem[]; // <-- Corrected to MediaItem[]
  visibility: PostVisibility; // Use the enum
  likes: string[]; // Array of user IDs who liked the post (unpopulated)
  comments: string[] | Comment[]; // Array of comment IDs (unpopulated) OR Comment[] if populated
  tags: PopulatedUser[]; // Assumed populated by API
  reported: boolean; // Flag if the post is reported
  reportReasons: IReportReason[]; // Array of report reason objects
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string

  // Aggregated/calculated fields from backend
  likesCount: number;
  commentsCount: number;
  isLiked: boolean; // Specific to the viewing user
  isSaved: boolean; // Specific to the viewing user

  // Optional fields from your Post model (if not always returned)
  pinned?: boolean;
  originalPost?: string; // Assuming it's an ID string
  sharedFrom?: string; // Assuming it's an ID string
  shares?: IShare[]; // Array of share objects
}

export interface PostsResponse {
  posts: Post[];
  pagination?: {
      total?: number;
      page?: number;
      pages?: number;
  };
}