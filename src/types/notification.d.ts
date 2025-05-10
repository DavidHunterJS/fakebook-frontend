import { User } from './user';

export interface Notification {
  _id: string;
  type: 'LIKE' | 'COMMENT' | 'FRIEND_REQUEST' | 'FRIEND_ACCEPT';
  sender: User | string;
  recipient: User | string;
  post?: string;
  comment?: string;
  read: boolean;
  createdAt: string;
}