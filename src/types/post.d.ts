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

export interface Comment {
  _id: string;
  text: string;
  user: PopulatedUser | string; // User can be populated or just an ID
  post: string; // ID of the parent post
  likes: string[]; // User IDs who liked the comment
  createdAt: string;
  updatedAt: string;
  replies?: PopulatedReply[]; // If replies are populated as well
  reported?: boolean;
  reportReasons?: IReportReason[];
}


// --- Post Interfaces (Based on your backend model and controller output) ---

export interface IReportReason {
  user: User['_id'];
  reason: string;
  date: Date;
}

export interface IShare {
  user: User['_id'];
  date: Date;
}

// In your types/post.ts file
export enum PostVisibility {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private'
}

export interface Post {
  _id: string;
  user: PopulatedUser;
  text: string;
  media?: MediaItem[]; // <-- FIX: Changed from string[] to MediaItem[]
  visibility: PostVisibility;
  likes: string[];
  comments: string[] | Comment[];
  tags: PopulatedUser[];
  reported: boolean;
  reportReasons: IReportReason[];
  createdAt: string;
  updatedAt: string;

  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;

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




