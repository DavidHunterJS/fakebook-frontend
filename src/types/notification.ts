// types/notification.d.ts

// Import User type from your user definition
// Make sure the path is correct relative to this file
import { User } from './user'; // Assuming 'User' is the main User interface and 'user.d.ts' is where it's defined

// Define the comprehensive NotificationType enum as used in your backend service
export enum NotificationType {
  FRIEND_REQUEST = 'friend_request',
  FRIEND_ACCEPT = 'friend_accept',
  POST_LIKE = 'post_like',
  POST_COMMENT = 'post_comment',
  COMMENT_LIKE = 'comment_like',
  COMMENT_REPLY = 'comment_reply',
  MENTION = 'mention',
  SYSTEM = 'system'
}

// Define the comprehensive INotification interface
// This matches the structure that your backend controllers are sending
export interface INotification {
  _id: string;
  recipient: string | User; // Recipient is typically just an ID on the document, but could be populated
  sender: string | User | null; // Sender is populated by your backend, so it can be a User object or null
  type: NotificationType; // Use the comprehensive enum
  read: boolean;
  content: string; // The message displayed in the notification
  link: string; // The URL to navigate to when clicking the notification
  relatedId?: string; // ID of the related entity (post, comment, reply, etc.)
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// You can keep these if you're using them for state management,
// but they are not strictly part of the API response interface
export interface NotificationState {
  notifications: INotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}