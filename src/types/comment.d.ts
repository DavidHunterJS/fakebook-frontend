import { User } from './user';

export interface Comment {
  _id: string;
  user: User | string;
  post: string;
  text: string;
  likes: string[];
  createdAt: string;
  updatedAt: string;
}