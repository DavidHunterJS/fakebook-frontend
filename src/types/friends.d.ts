// types/friend.ts
export enum FriendshipStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    DECLINED = 'declined',
    BLOCKED = 'blocked'
  }
  
  export interface FriendUser {
    _id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    name?: string; // Some endpoints return name instead of first/last name
    profileImage?: string;
    profilePicture?: string;
    bio?: string;
  }
  
  export interface Friendship {
    _id: string;
    requester: FriendUser | string;
    recipient: FriendUser | string;
    status: FriendshipStatus;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface PaginationData {
    total: number;
    page: number;
    pages: number;
  }