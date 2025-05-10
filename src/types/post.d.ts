// src/types/post.ts
import { User } from './user'; // Adjust path if needed

// Define the structure for a Comment if not already defined elsewhere
// If you have a more detailed Comment type, use that instead of 'any' below
export interface Comment {
  _id: string;
  text: string;
  user: User | string; // Can be populated or just ID
  post: string; // ID of the parent post
  createdAt: string | Date;
  updatedAt: string | Date;
  // Add other comment fields if necessary
}

// Define the main Post interface
export interface Post {
  _id: string;
  user: User | string; // Populated User object or user ID string
  text?: string;
  media?: string[];   // Array of image/video filenames or URLs
  image?: string;     // Optional: Primarily used by frontend after extracting from media[0]
  likes: string[];    // Array of user IDs who liked the post
  comments: Comment[] | string[]; // Array of Comment objects or comment IDs
  visibility?: 'public' | 'friends' | 'private'; // Post visibility
  tags?: string[];    // Optional array of tags
  reported?: boolean; // Optional flag if the post is reported
  shares?: string[];  // Optional array of user IDs who shared, or Share objects
  reportReasons?: any[]; // Optional array for report details
  createdAt: string | Date;
  updatedAt: string | Date;

  // Optional fields often added during processing/aggregation
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;  // Specific to the viewing user
  isSaved?: boolean;  // Specific to the viewing user

  // Include legacy fields if needed for compatibility during transition
  content?: string; // If sometimes used instead of 'text'
  author?: User | string; // If sometimes used instead of 'user'
}

// Interface for API responses containing multiple posts (e.g., feed)
export interface PostsResponse {
  posts: Post[];
  pagination?: { // Make pagination optional
      total?: number;
      page?: number;
      pages?: number;
  };
  // Add other potential response fields if needed
}


