// src/types/user.ts
export interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  email?: string;
  profileImage?: string;
  profilePicture?: string;
  coverPhoto?: string;
  coverPhotoUrl?: string;
  bio?: string;
  followers?: string[];
  following?: string[];
  createdAt?: string;
  updatedAt?: string;
  location?: string;
  role?: string;
  isActive?: boolean;
  friends?: User[];
  googleId?: string;
  authProvider: 'local' | 'google';
  isOAuthUser: boolean;
  subscriptionStatus?: string;
  
}