import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import { useMediaQuery, useTheme } from '@mui/material';
import {
  Container,
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  TextField,
  Grid, // Added for the friends grid
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Person as PersonIcon, // Added for empty friends display
  Image as ImageIcon, 
  Favorite as LikeIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import useAuth from '../../hooks/useAuth'; // Adjust path if needed
import api from '../../utils/api'; // Adjust path if needed
import { User } from '../../types/user'; // Adjust path if needed
import { Post } from '../../types/post'; // Adjust path if needed
import PostCard from '../../components/post/PostCard'; // Adjust path if needed
import {getFullImageUrl}  from '../../utils/imgUrl'; // Adjust the path as needed

// Define a type for API errors
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  config?: {
    url?: string;
  };
  message?: string;
}

// --- Helper to check if a string looks like a MongoDB ObjectId ---
const isLikelyObjectIdString = (id: string): boolean => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};
// --- End Helper ---

// Extend the User type to include isFollowing property
interface FriendUser extends User {
  isFollowing?: boolean;
}

// Interface for profile data
interface Profile extends User {
  bio?: string;
  followers?: string[];
  following?: string[];
  recentPosts?: Post[];
  relationshipStatus?: {
    isOwnProfile?: boolean;
    isFriend?: boolean;
    hasSentRequest?: boolean;
    hasReceivedRequest?: boolean;
    isFollowing?: boolean;
  };
  friendCount?: number;
  mutualFriends?: User[];
  privacyRestricted?: boolean;
  // Additional fields for About tab
  location?: string;
  birthday?: string;
  joinedDate?: string;
  education?: string;
  work?: string;
  website?: string;
  phone?: string;
  // Friends data
  friends?: FriendUser[];
}

interface Photo {
  _id: string;
  url: string;
  filename: string;
  caption?: string;
  createdAt: string;
  postId?: string;
  albumId?: string;
  likes?: number;
  comments?: number;
}

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user: currentUser, isAuthenticated } = useAuth();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // State variables - grouped by functionality
  // Profile and loading states
  const [isOwnProfile, setIsOwnProfile] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [debug, setDebug] = useState<string[]>([]);
  
  // Friends data
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const [friendsInitialized, setFriendsInitialized] = useState(false);
  
  // Photos data
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [photosInitialized, setPhotosInitialized] = useState(false);
  
  // Bio editing state
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);
  
  // Basic info editing state
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [basicInfoValues, setBasicInfoValues] = useState({
    firstName: '',
    lastName: '',
    location: ''
  });
  const [savingBasicInfo, setSavingBasicInfo] = useState(false);
  const [basicInfoError, setBasicInfoError] = useState<string | null>(null);
  
  // Work and Education editing state
  const [isEditingWorkEdu, setIsEditingWorkEdu] = useState(false);
  const [workEduValues, setWorkEduValues] = useState({
    work: '',
    education: ''
  });
  const [savingWorkEdu, setSavingWorkEdu] = useState(false);
  const [workEduError, setWorkEduError] = useState<string | null>(null);

  // API request helper - memoized with useCallback
  const makeApiRequest = useCallback(async (url: string, method: 'get' | 'post' | 'put' | 'delete' = 'get', data?: unknown) => {
    const addDebug = (msg: string) => { console.log(msg); setDebug(prev => [...prev, msg]); };
    addDebug(`Attempting ${method.toUpperCase()} request to relative path: ${url}`);
    try {
        let response;
        switch(method) {
            case 'post': response = await api.post(url, data); break;
            case 'put': response = await api.put(url, data); break;
            case 'delete': response = await api.delete(url); break;
            case 'get':
            default: response = await api.get(url); break;
        }
        addDebug(`API request succeeded. Full URL: ${response.config.url}`);
        return response;
    } catch (err: unknown) {
        const error = err as ApiError;
        const fullUrl = error.config?.url;
        const errMsg = error.response?.data?.message || error.message || 'API request failed';
        const status = error.response?.status || 'No Status';
        addDebug(`API request failed. Full URL: ${fullUrl || url} - Status: ${status}, Message: ${errMsg}`);
        if (error.response?.data) {
            addDebug(`Error Response Body: ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }
  }, []);

  // Fetch friends function
  const fetchFriends = useCallback(async () => {
    if (!profile || typeof id !== 'string') return;
    
    // Check if we already have processed friends data
    if (friendsInitialized && friends.length > 0) {
      setDebug(prev => [...prev, `Friends already initialized (${friends.length} friends), skipping fetch`]);
      return;
    }
    
    // Check if the profile has embedded friends data first
    const profileFriends = profile.friends;
    if (profileFriends && Array.isArray(profileFriends) && profileFriends.length > 0) {
      setDebug(prev => [...prev, `Using ${profileFriends.length} friends already loaded in profile data`]);
      
      // Process the existing friends data
      const friendsList = profileFriends as FriendUser[];
      
      if (currentUser) {
        const friendsWithFollowingStatus = friendsList.map(friend => {
          if (friend.isFollowing !== undefined) return friend;
          
          // Check if this friend is in the current user's following list
          const isFollowing = currentUser.following && Array.isArray(currentUser.following) ? 
            currentUser.following.some(followedId => String(followedId) === String(friend._id)) : 
            false;
          
          return { ...friend, isFollowing };
        });
        
        setFriends(friendsWithFollowingStatus);
      } else {
        setFriends(friendsList);
      }
      
      setFriendsInitialized(true); // Mark as initialized
      return; // Exit early since we already have the data
    }
    
    // Only now set loading, since we know we need to fetch
    setLoadingFriends(true);
    setFriendsError(null);
    
    try {
      // APPROACH 1: If viewing own profile, use the working friends endpoint from friends page
      if (currentUser && profile._id === currentUser._id) {
        setDebug(prev => [...prev, `Fetching own friends from /friends endpoint`]);
        
        try {
          const response = await makeApiRequest('/friends');
          if (response?.data && response.data.friends) {
            const friendsData = response.data.friends;
            setDebug(prev => [...prev, `Found ${friendsData.length} friends via /friends endpoint`]);
            
            setFriends(friendsData);
            setFriendsInitialized(true);
            setLoadingFriends(false);
            return;
          }
        } catch (e) {
          setDebug(prev => [...prev, `Failed to get friends from /friends endpoint, trying alternative`]);
        }
      }
      
      // APPROACH 2: Try /users/:id endpoint which might include friends
      try {
        setDebug(prev => [...prev, `Trying to get user profile with friends using /users/${id}`]);
        const response = await makeApiRequest(`/users/${id}`);
        
        if (response?.data) {
          const userData = response.data;
          if (userData.friends && Array.isArray(userData.friends) && userData.friends.length > 0) {
            setDebug(prev => [...prev, `Found ${userData.friends.length} friends in user data`]);
            
            // Process friends data
            if (currentUser) {
              const friendsWithFollowingStatus = userData.friends.map((friend: FriendUser) => {
                if (friend.isFollowing !== undefined) return friend;
                
                const isFollowing = currentUser.following && Array.isArray(currentUser.following) ? 
                  currentUser.following.some(followedId => String(followedId) === String(friend._id)) : 
                  false;
                
                return { ...friend, isFollowing };
              });
              
              setFriends(friendsWithFollowingStatus);
            } else {
              setFriends(userData.friends);
            }
            
            setFriendsInitialized(true);
            setLoadingFriends(false);
            return;
          }
        }
      } catch (e) {
        setDebug(prev => [...prev, `Failed to get user profile with friends included`]);
      }
      
      // APPROACH 3: For other users, try the mutual friends endpoint
      if (currentUser && profile._id !== currentUser._id) {
        try {
          setDebug(prev => [...prev, `Trying to get mutual friends using /friends/mutual/${id}`]);
          const response = await makeApiRequest(`/friends/mutual/${id}`);
          
          if (response?.data) {
            const mutualFriends = Array.isArray(response.data) ? response.data : 
                                (response.data.friends || []);
            
            if (mutualFriends.length >= 0) {
              setDebug(prev => [...prev, `Found ${mutualFriends.length} mutual friends`]);
              
              // Process mutual friends data
              if (currentUser) {
                const friendsWithFollowingStatus = mutualFriends.map((friend: FriendUser) => {
                  if (friend.isFollowing !== undefined) return friend;
                  
                  const isFollowing = currentUser.following && Array.isArray(currentUser.following) ? 
                    currentUser.following.some(followedId => String(followedId) === String(friend._id)) : 
                    false;
                  
                  return { ...friend, isFollowing };
                });
                
                setFriends(friendsWithFollowingStatus);
              } else {
                setFriends(mutualFriends);
              }
              
              setFriendsInitialized(true);
              setLoadingFriends(false);
              return;
            }
          }
        } catch (e) {
          setDebug(prev => [...prev, `Failed to get mutual friends`]);
        }
      }
      
      // If we couldn't get friends data, set empty array
      setDebug(prev => [...prev, 'No friends data found from any endpoint']);
      setFriends([]);
      setFriendsInitialized(true);
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Error fetching friends:', err);
      setFriendsError(err.response?.data?.message || err.message || 'Failed to load friends.');
      setDebug(prev => [...prev, `Error fetching friends: ${err.message}`]);
      
      // Still mark as initialized to prevent constant retries
      setFriends([]);
      setFriendsInitialized(true);
    } finally {
      setLoadingFriends(false);
    }
  }, [id, profile, makeApiRequest, currentUser, friendsInitialized, friends.length]);

  // Fetch photos function
  const fetchPhotos = useCallback(async () => {
    if (!profile || typeof id !== 'string') return;
    
    // Check if we already have processed photos data
    if (photosInitialized && photos.length > 0) {
      setDebug(prev => [...prev, `Photos already initialized (${photos.length} photos), skipping fetch`]);
      return;
    }
    
    // Set loading state
    setLoadingPhotos(true);
    setPhotosError(null);
    
    try {
      // Try to fetch photos from user's posts first
      setDebug(prev => [...prev, `Fetching photos from user posts for ID: ${id}`]);
      
      // Attempt to fetch posts with media if we don't already have them
      let postsWithMedia = posts;
      if (!posts.length) {
        try {
          const postsResponse = await makeApiRequest(`/posts/user/${id}`);
          if (postsResponse?.data?.posts || Array.isArray(postsResponse?.data)) {
            postsWithMedia = postsResponse.data.posts || postsResponse.data;
          }
        } catch (e) {
          setDebug(prev => [...prev, `Error fetching posts for photos: ${(e as Error).message}`]);
        }
      }
      
      // Extract media from posts
      const photosFromPosts: Photo[] = [];
      
      if (postsWithMedia.length > 0) {
        // Process each post to extract media
        postsWithMedia.forEach(post => {
          if (post.media && Array.isArray(post.media) && post.media.length > 0) {
            // Add each media item as a photo
            post.media.forEach((mediaFilename: string) => {
              photosFromPosts.push({
                _id: `${post._id}-${mediaFilename}`, // Create a unique ID
                url: getFullImageUrl(mediaFilename, 'post'),
                filename: mediaFilename,
                caption: post.content?.substring(0, 100) || '',
                createdAt: post.createdAt || new Date().toISOString(),
                postId: post._id,
                likes: post.likes?.length || 0,
                comments: post.comments?.length || 0
              });
            });
          }
        });
        
        setDebug(prev => [...prev, `Extracted ${photosFromPosts.length} photos from posts`]);
      }
      
      // Try to fetch user's albums if available
      let photosFromAlbums: Photo[] = [];
      try {
        const albumsResponse = await makeApiRequest(`/users/${id}/albums`);
        if (albumsResponse?.data?.albums && Array.isArray(albumsResponse.data.albums)) {
          const albums = albumsResponse.data.albums;
          
          // Process each album to extract photos
          for (const album of albums) {
            if (album.photos && Array.isArray(album.photos) && album.photos.length > 0) {
              // Add each photo from the album
              album.photos.forEach((photo: any) => {
                photosFromAlbums.push({
                  _id: photo._id || `album-${album._id}-${photo.filename}`,
                  url: getFullImageUrl(photo.filename, 'post'),
                  filename: photo.filename,
                  caption: photo.caption || album.title || '',
                  createdAt: (photo.createdAt || album.createdAt || new Date().toISOString()) as string,
                  albumId: album._id,
                  likes: photo.likes?.length || 0,
                  comments: photo.comments?.length || 0
                });
              });
            }
          }
          
          setDebug(prev => [...prev, `Extracted ${photosFromAlbums.length} photos from albums`]);
        }
      } catch (e) {
        // Albums endpoint might not exist, just log and continue
        setDebug(prev => [...prev, `Error fetching albums (might not be implemented): ${(e as Error).message}`]);
      }
      
      // Try to fetch profile and cover photos
      const profilePhotos: Photo[] = [];
      
      if (profile.profilePicture && profile.profilePicture !== 'default-avatar.png') {
        profilePhotos.push({
          _id: `profile-${profile._id}`,
          url: getFullImageUrl(profile.profilePicture, 'profile'),
          filename: profile.profilePicture,
          caption: 'Profile Picture',
          createdAt: (profile.updatedAt || profile.createdAt || new Date().toISOString()) as string,
        });
      }
      
      if (profile.coverPhoto && profile.coverPhoto !== 'default-cover.png') {
        profilePhotos.push({
          _id: `cover-${profile._id}`,
          url: getFullImageUrl(profile.coverPhoto, 'cover'),
          filename: profile.coverPhoto,
          caption: 'Cover Photo',
          createdAt: (profile.updatedAt || profile.createdAt || new Date().toISOString()) as string,
        });
      }
      
      setDebug(prev => [...prev, `Added ${profilePhotos.length} profile/cover photos`]);
      
      // Combine all photos
      const allPhotos = [...profilePhotos, ...photosFromPosts, ...photosFromAlbums];
      
      // Sort photos by date (newest first)
      allPhotos.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      if (allPhotos.length === 0) {
        setDebug(prev => [...prev, 'No photos found for this user']);
      } else {
        setDebug(prev => [...prev, `Found a total of ${allPhotos.length} photos`]);
      }
      
      // Update state
      setPhotos(allPhotos);
      setPhotosInitialized(true);
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Error fetching photos:', err);
      setPhotosError(err.response?.data?.message || err.message || 'Failed to load photos.');
      setDebug(prev => [...prev, `Error fetching photos: ${err.message}`]);
    } finally {
      setLoadingPhotos(false);
    }
  }, [id, profile, posts, makeApiRequest, photosInitialized, photos.length]);

  // Get grid columns function
  const getGridCols = useCallback(() => {
    if (isSmallScreen) return 2; // 2 columns on small screens
    if (isMediumScreen) return 3; // 3 columns on medium screens
    return 4; // 4 columns on large screens
  }, [isSmallScreen, isMediumScreen]);

  // Photo click handler
  const handlePhotoClick = useCallback((photo: Photo) => {
    // If photo is from a post, navigate to the post
    if (photo.postId) {
      router.push(`/post/${photo.postId}`);
    } 
    // If photo is from an album, navigate to the album
    else if (photo.albumId) {
      router.push(`/album/${photo.albumId}`);
    }
    // Otherwise, maybe open a modal to view the photo
    else {
      // You could implement a modal here
      window.open(photo.url, '_blank');
    }
  }, [router]);

  // Handle following a friend
  const handleFollowFriend = useCallback(async (friendId: string) => {
    if (!isAuthenticated || !currentUser) return;
    
    try {
      await makeApiRequest(`/users/${friendId}/follow`, 'post');
      setDebug(prev => [...prev, `Successfully followed user ${friendId}`]);
      
      // Update the friends list to show the new following status
      setFriends(prevFriends => 
        prevFriends.map(friend => 
          friend._id === friendId 
            ? { ...friend, isFollowing: true } 
            : friend
        )
      );
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Error following friend:', err);
      setDebug(prev => [...prev, `Error following friend ${friendId}: ${err.message}`]);
    }
  }, [isAuthenticated, currentUser, makeApiRequest, setDebug]);
  
  // Handle unfollowing a friend
  const handleUnfollowFriend = useCallback(async (friendId: string) => {
    if (!isAuthenticated || !currentUser) return;
    
    try {
      await makeApiRequest(`/users/${friendId}/unfollow`, 'post');
      setDebug(prev => [...prev, `Successfully unfollowed user ${friendId}`]);
      
      // Update the friends list to show the new following status
      setFriends(prevFriends => 
        prevFriends.map(friend => 
          friend._id === friendId 
            ? { ...friend, isFollowing: false } 
            : friend
        )
      );
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Error unfollowing friend:', err);
      setDebug(prev => [...prev, `Error unfollowing friend ${friendId}: ${err.message}`]);
    }
  }, [isAuthenticated, currentUser, makeApiRequest, setDebug]);

  // Handle bio save
  const handleSaveBio = useCallback(async () => {
    if (!currentUser || !profile) return;
    
    setSavingBio(true);
    setBioError(null);
    
    try {
      // Using the correct endpoint for updating user profile
      await makeApiRequest('/users/profile', 'put', { bio: bioValue });
      setDebug(prev => [...prev, `Bio updated successfully to: ${bioValue}`]);
      
      // Update the local profile state with new bio
      setProfile(prevProfile => {
        if (!prevProfile) return null;
        return { ...prevProfile, bio: bioValue };
      });
      
      // Exit edit mode
      setIsEditingBio(false);
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Error updating bio:', err);
      setBioError(err.response?.data?.message || err.message || 'Failed to update bio.');
      setDebug(prev => [...prev, `Error updating bio: ${err.response?.data?.message || err.message || 'Failed to update bio.'}`]);
    } finally {
      setSavingBio(false);
    }
  }, [currentUser, profile, bioValue, makeApiRequest, setDebug]);

  // Handle cancel bio edit
  const handleCancelEditBio = useCallback(() => {
    setIsEditingBio(false);
    setBioValue(profile?.bio || '');
    setBioError(null);
  }, [profile?.bio]);
  
  // Handle save basic info
  const handleSaveBasicInfo = useCallback(async () => {
    if (!currentUser || !profile) return;
    
    setSavingBasicInfo(true);
    setBasicInfoError(null);
    
    try {
      await makeApiRequest('/users/profile', 'put', basicInfoValues);
      setDebug(prev => [...prev, `Basic info updated successfully: ${JSON.stringify(basicInfoValues)}`]);
      
      // Update the local profile state with new values
      setProfile(prevProfile => {
        if (!prevProfile) return null;
        return { ...prevProfile, ...basicInfoValues };
      });
      
      // Exit edit mode
      setIsEditingBasicInfo(false);
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Error updating basic info:', err);
      setBasicInfoError(err.response?.data?.message || err.message || 'Failed to update information.');
      setDebug(prev => [...prev, `Error updating basic info: ${err.response?.data?.message || err.message || 'Failed to update information.'}`]);
    } finally {
      setSavingBasicInfo(false);
    }
  }, [currentUser, profile, basicInfoValues, makeApiRequest, setDebug]);
  
  // Handle cancel basic info edit
  const handleCancelEditBasicInfo = useCallback(() => {
    setIsEditingBasicInfo(false);
    // Reset to profile values
    if (profile) {
      setBasicInfoValues({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        location: profile.location || ''
      });
    }
    setBasicInfoError(null);
  }, [profile]);
  
  // Handle save work and education
  const handleSaveWorkEdu = useCallback(async () => {
    if (!currentUser || !profile) return;
    
    setSavingWorkEdu(true);
    setWorkEduError(null);
    
    try {
      await makeApiRequest('/users/profile', 'put', workEduValues);
      setDebug(prev => [...prev, `Work and education updated successfully: ${JSON.stringify(workEduValues)}`]);
      
      // Update the local profile state with new values
      setProfile(prevProfile => {
        if (!prevProfile) return null;
        return { ...prevProfile, ...workEduValues };
      });
      
      // Exit edit mode
      setIsEditingWorkEdu(false);
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Error updating work and education:', err);
      setWorkEduError(err.response?.data?.message || err.message || 'Failed to update work and education.');
      setDebug(prev => [...prev, `Error updating work and education: ${err.response?.data?.message || err.message || 'Failed to update work and education.'}`]);
    } finally {
      setSavingWorkEdu(false);
    }
  }, [currentUser, profile, workEduValues, makeApiRequest, setDebug]);
  
  // Handle cancel work and education edit
  const handleCancelEditWorkEdu = useCallback(() => {
    setIsEditingWorkEdu(false);
    // Reset to profile values
    if (profile) {
      setWorkEduValues({
        work: profile.work || '',
        education: profile.education || ''
      });
    }
    setWorkEduError(null);
  }, [profile]);

  // Handle tab change
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  // Handle follow toggle
  const handleFollowToggle = useCallback(async () => {
    if (!isAuthenticated || typeof id !== 'string' || !profile || !currentUser) return;

    const isCurrentlyFollowing = isFollowing;
    const endpoint = isCurrentlyFollowing ? `/users/${id}/unfollow` : `/users/${id}/follow`;

    try {
      await makeApiRequest(endpoint, 'post');
      setIsFollowing(!isCurrentlyFollowing);
      setProfile(prevProfile => {
        if (!prevProfile) return null;
        const currentFollowers = prevProfile.followers || [];
        let updatedFollowers: string[];
        if (isCurrentlyFollowing) {
            updatedFollowers = currentFollowers.filter(followerId => String(followerId) !== currentUser._id);
        } else {
            updatedFollowers = [...new Set([...currentFollowers, currentUser._id])];
        }
        const updatedRelationshipStatus = prevProfile.relationshipStatus
          ? { ...prevProfile.relationshipStatus, isFollowing: !isCurrentlyFollowing }
          : undefined;
        return { ...prevProfile, followers: updatedFollowers, relationshipStatus: updatedRelationshipStatus };
      });
    } catch (followErr: unknown) {
      const err = followErr as ApiError;
      console.error('Error toggling follow:', err);
      setError(err.response?.data?.message || err.message || 'Follow action failed.');
    }
  }, [isAuthenticated, id, profile, currentUser, isFollowing, makeApiRequest]);

  // Process friends data when tab changes
  useEffect(() => {
    if (tabValue === 2 && !friendsInitialized && !loadingFriends) {
      fetchFriends();
    }
  }, [tabValue, fetchFriends, loadingFriends, friendsInitialized]);

  // Process photos data when tab changes
  useEffect(() => {
    if (tabValue === 3 && !photosInitialized && !loadingPhotos) {
      fetchPhotos();
    }
  }, [tabValue, fetchPhotos, photosInitialized, loadingPhotos]);

  // Update isOwnProfile when either profile or currentUser changes
  useEffect(() => {
    if (profile && currentUser) {
      setIsOwnProfile(currentUser._id === profile._id);
    } else {
      setIsOwnProfile(null);
    }
  }, [profile, currentUser]);

  useEffect(() => {
    // Handle invalid ID logic
    if (router.isReady && (!id || id === 'undefined')) {
      console.log('Invalid profile ID:', id);
      if (currentUser?._id) {
        router.replace(`/profile/${currentUser._id}`);
      } else {
        router.replace('/dashboard');
      }
      return;
    }

    const fetchProfileAndPosts = async () => {
      if (typeof id !== 'string' || !router.isReady) return;

      setLoading(true);
      setError(null);
      setProfile(null);
      setPosts([]);
      setIsFollowing(false);
      setFriendsInitialized(false); // Reset friends initialization status when loading a new profile
      setDebug(prev => [...prev, `Starting profile fetch for ID/Username: ${id}`]);

      try {
        const isLikelyId = isLikelyObjectIdString(id);
        const profileEndpoint = isLikelyId
            ? `/users/${id}`
            : `/users/profile/${id}`;

        setDebug(prev => [...prev, `Using relative profile endpoint: ${profileEndpoint}`]);
        const profileResponse = await makeApiRequest(profileEndpoint);
        
        if (profileResponse?.data) {
        const profileData: Profile = profileResponse.data.profile || profileResponse.data;
        setDebug(prev => [...prev, `Profile data received: Keys - ${Object.keys(profileData).join(', ')}`]);
        
        // Process friends data from profile response BEFORE setting the profile
        // Use hasOwnProperty to avoid TypeScript errors
        const hasFriends = Object.prototype.hasOwnProperty.call(profileData, 'friends') && 
                          profileData.friends !== null && 
                          Array.isArray(profileData.friends) && 
                          profileData.friends.length > 0;
        
        if (hasFriends) {
          const friendsList = profileData.friends as FriendUser[];
          setDebug(prev => [...prev, `Processing ${friendsList.length} friends from profile data`]);
          
          if (currentUser) {
            const friendsWithFollowingStatus = friendsList.map(friend => {
              if (friend.isFollowing !== undefined) return friend;
              
              // Check if this friend is in the current user's following list
              const isFollowing = currentUser.following && Array.isArray(currentUser.following) ? 
                currentUser.following.some(followedId => String(followedId) === String(friend._id)) : 
                false;
              
              return { ...friend, isFollowing };
            });
            
            setFriends(friendsWithFollowingStatus);
          } else {
            setFriends(friendsList);
          }
          
          setFriendsInitialized(true); // Mark friends as initialized
        }
          
          // Now set the profile data
          setProfile(profileData);
          
          // Initialize form values
          setBioValue(profileData.bio || '');
          setBasicInfoValues({
            firstName: profileData.firstName || '',
            lastName: profileData.lastName || '',
            location: profileData.location || ''
          });
          setWorkEduValues({
            work: profileData.work || '',
            education: profileData.education || ''
          });

          if (currentUser && profileData.followers && Array.isArray(profileData.followers)) {
            const isCurrentlyFollowing = profileData.followers.some(followerId => String(followerId) === currentUser._id);
            setIsFollowing(isCurrentlyFollowing);
            setDebug(prev => [...prev, `Set following status from followers array: ${isCurrentlyFollowing}`]);
          }
          else if (profileData.relationshipStatus?.isFollowing !== undefined) {
            setIsFollowing(profileData.relationshipStatus.isFollowing);
            setDebug(prev => [...prev, `Set following status from relationshipStatus: ${profileData.relationshipStatus?.isFollowing}`]);
          }

          if (profileData.recentPosts && Array.isArray(profileData.recentPosts)) {
            setDebug(prev => [...prev, `Using recentPosts from profile response: ${profileData.recentPosts?.length} posts found`]);
            setPosts(profileData.recentPosts);
          } else if (!profileData.privacyRestricted) {
            await fetchUserPosts();
          }
        } else {
          throw new Error('Profile data not found in API response.');
        }
      } catch (error: unknown) {
        const err = error as ApiError;
        console.error('Error fetching profile:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load profile data.');
        setProfile(null);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserPosts = async () => {
      if (typeof id !== 'string') return;
      try {
        const postsEndpoint = `/posts/user/${id}`;
        setDebug(prev => [...prev, `Fetching posts separately from relative endpoint: ${postsEndpoint}`]);
        const postsResponse = await makeApiRequest(postsEndpoint);
        const postsData = postsResponse?.data?.posts || (Array.isArray(postsResponse?.data) ? postsResponse.data : []);
        setDebug(prev => [...prev, `Found ${postsData.length} posts separately.`]);
        setPosts(postsData);
      } catch (error: unknown) {
        const err = error as ApiError;
        setDebug(prev => [...prev, `Error fetching posts separately: ${err.message}`]);
        setPosts([]);
      }
    };

    fetchProfileAndPosts();

  }, [id, currentUser, router, makeApiRequest]);

  if (loading) {
    return <Container sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Container>;
  }
  if (error && !profile) {
    return <Container sx={{ py: 8 }}><Alert severity="error" sx={{ mb: 3 }}>{error}</Alert></Container>;
  }
  if (!profile) {
    return <Container sx={{ py: 8 }}><Typography variant="h6" align="center">Profile could not be loaded.</Typography></Container>;
  }

  if (profile.privacyRestricted && !isOwnProfile) {
     return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
             <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
                <Avatar src={getFullImageUrl(profile.profilePicture, 'profile')} alt={profile.username} sx={{ width: 100, height: 100, margin: '0 auto 16px' }} />
                <Typography variant="h5">{profile.firstName} {profile.lastName}</Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>@{profile.username}</Typography>
                <Typography variant="body1" sx={{mt: 2}}>This profile is private.</Typography>
                {isAuthenticated && !isOwnProfile && ( <Button variant={isFollowing ? "outlined" : "contained"} startIcon={<PersonAddIcon />} onClick={handleFollowToggle} sx={{ mt: 2 }}> {isFollowing ? 'Unfollow' : 'Follow'} </Button> )}
             </Paper>
        </Container>
     );
  }

  // Calculate these after all hooks have been called
  const profileAvatarUrl = getFullImageUrl(profile.profilePicture, 'profile');
  const coverPhotoUrl = getFullImageUrl(profile.coverPhoto, 'cover');
  console.log(`[coverPhotoUrl] =  ${coverPhotoUrl}`);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
        <Box sx={{ height: 250, width: '100%', position: 'relative', bgcolor: 'grey.300', overflow: 'hidden' }}>
          {profile.coverPhoto && profile.coverPhoto !== 'default-cover.png' && (
            <Image
              src={coverPhotoUrl}
              alt={`${profile.username}'s cover photo`}
              fill
              style={{
                objectFit: 'cover',
                objectPosition: 'center'
              }}
              onError={(e) => {
                console.error("Error loading cover image:", e);
                // We can't directly manipulate style in Next.js Image component like with img
                // Instead, you might need to set a state to conditionally render the image
              }}
          />
          )}
        </Box>

        <Box sx={{ px: 4, pb: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'center', md: 'flex-end' }, position: 'relative' }}>
          <Avatar src={profileAvatarUrl} alt={profile.username} sx={{ width: 150, height: 150, border: '4px solid', borderColor: 'background.paper', marginTop: '-75px', boxShadow: 2, mr: { md: 3 } }} />
          <Box sx={{ flex: 1, mt: { xs: 2, md: 0 }, textAlign: { xs: 'center', md: 'left' } }}>
            <Typography variant="h4" component="h1" gutterBottom> {profile.firstName} {profile.lastName} </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom> @{profile.username} </Typography>
            {profile.bio && <Typography variant="body1" sx={{ mt: 1 }}>{profile.bio}</Typography>}
            <Box sx={{ display: 'flex', mt: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <Typography variant="body2" sx={{ mr: 3 }}> <strong>{profile.followers?.length ?? 0}</strong> followers </Typography>
              <Typography variant="body2"> <strong>{profile.following?.length ?? 0}</strong> following </Typography>
            </Box>
          </Box>
          <Box sx={{ mt: { xs: 2, md: 0 }, display: 'flex', alignItems: 'center' }}>
            {isAuthenticated && ( isOwnProfile ? ( <Button variant="contained" startIcon={<EditIcon />} onClick={() => router.push('/settings/profile')}> Edit Profile </Button> ) : ( <Button variant={isFollowing ? "outlined" : "contained"} startIcon={<PersonAddIcon />} onClick={handleFollowToggle}> {isFollowing ? 'Unfollow' : 'Follow'} </Button> ) )}
          </Box>
        </Box>
      </Paper>

      {error && <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ borderRadius: 2, mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Posts" /> <Tab label="About" /> <Tab label="Friends" /> <Tab label="Photos" />
        </Tabs>
      </Paper>

      {/* Posts Tab */}
      <Box sx={{ display: tabValue === 0 ? 'block' : 'none' }}>
        {posts.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ width: { xs: '100%', md: '33.33%' }, order: { xs: 2, md: 1 } }}>
              <Paper sx={{ p: 3, borderRadius: 2, position: 'sticky', top: 80 }}>
                <Typography variant="h6" gutterBottom>Intro</Typography>
                {profile.bio ? ( <Typography variant="body2">{profile.bio}</Typography> ) : ( <Typography variant="body2" color="text.secondary">No bio available</Typography> )}
                {isOwnProfile && ( <Button fullWidth variant="outlined" sx={{ mt: 2 }} onClick={() => router.push('/settings/profile')}> Edit Details </Button> )}
              </Paper>
            </Box>
            <Box sx={{ width: { xs: '100%', md: '66.67%' }, order: { xs: 1, md: 2 } }}>
              {posts.map((post) => ( <PostCard key={post._id} post={post} /> ))}
            </Box>
          </Box>
        ) : (
          <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}> <Typography variant="body1" color="text.secondary">No posts to display.</Typography> </Paper>
        )}
      </Box>

      {/* About Tab */}
      <Box sx={{ display: tabValue === 1 ? 'block' : 'none' }}>
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            {/* Left sidebar for navigation within About section */}
            <Box sx={{ width: { xs: '100%', md: '30%' } }}>
              <Typography variant="h6" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                About
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                <Button 
                  variant="text" 
                  sx={{ 
                    justifyContent: 'flex-start',
                    px: 2,
                    py: 1,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' },
                    bgcolor: 'action.selected'
                  }}
                >
                  Overview
                </Button>
                <Button 
                  variant="text" 
                  sx={{ 
                    justifyContent: 'flex-start',
                    px: 2,
                    py: 1,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  Work and Education
                </Button>
                <Button 
                  variant="text" 
                  sx={{ 
                    justifyContent: 'flex-start',
                    px: 2,
                    py: 1,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  Contact and Basic Info
                </Button>
                <Button 
                  variant="text" 
                  sx={{ 
                    justifyContent: 'flex-start',
                    px: 2,
                    py: 1,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  Details About {profile.firstName}
                </Button>
              </Box>
            </Box>
            
            {/* Right content area */}
            <Box sx={{ width: { xs: '100%', md: '70%' } }}>
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Bio</Typography>
                  {isOwnProfile && !isEditingBio && (
                    <Button 
                      variant="outlined" 
                      size="small" 
                      startIcon={<EditIcon />}
                      onClick={() => setIsEditingBio(true)}
                    >
                      Edit
                    </Button>
                  )}
                </Box>
                
                {isEditingBio ? (
                  <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSaveBio(); }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={bioValue}
                      onChange={(e) => setBioValue(e.target.value)}
                      placeholder="Tell people about yourself..."
                      variant="outlined"
                      error={!!bioError}
                      helperText={bioError}
                      sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Button 
                        variant="text" 
                        onClick={handleCancelEditBio}
                        disabled={savingBio}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="contained" 
                        type="submit"
                        disabled={savingBio}
                        startIcon={savingBio ? <CircularProgress size={16} /> : null}
                      >
                        Save
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <>
                    {profile.bio ? (
                      <Typography variant="body1">{profile.bio}</Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        {isOwnProfile ? 'Add a bio to tell people more about yourself' : 'No bio available'}
                      </Typography>
                    )}
                  </>
                )}
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Basic Information</Typography>
                  {isOwnProfile && !isEditingBasicInfo && (
                    <Button 
                      variant="outlined" 
                      size="small" 
                      startIcon={<EditIcon />}
                      onClick={() => setIsEditingBasicInfo(true)}
                    >
                      Edit
                    </Button>
                  )}
                </Box>
                
                {isEditingBasicInfo ? (
                  <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSaveBasicInfo(); }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                      <TextField
                        label="First Name"
                        value={basicInfoValues.firstName}
                        onChange={(e) => setBasicInfoValues(prev => ({ ...prev, firstName: e.target.value }))}
                        fullWidth
                        variant="outlined"
                        required
                      />
                      <TextField
                        label="Last Name"
                        value={basicInfoValues.lastName}
                        onChange={(e) => setBasicInfoValues(prev => ({ ...prev, lastName: e.target.value }))}
                        fullWidth
                        variant="outlined"
                        required
                      />
                    </Box>
                    
                    <TextField
                      label="Location"
                      value={basicInfoValues.location}
                      onChange={(e) => setBasicInfoValues(prev => ({ ...prev, location: e.target.value }))}
                      fullWidth
                      variant="outlined"
                      placeholder="Where do you live?"
                      sx={{ mb: 2 }}
                    />
                    
                    {/* Username (display only) */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mr: 1 }}>Username:</Typography>
                      <Typography variant="body1">@{profile.username}</Typography>
                      <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>(cannot be changed)</Typography>
                    </Box>
                    
                    {basicInfoError && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {basicInfoError}
                      </Alert>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Button 
                        variant="text" 
                        onClick={handleCancelEditBasicInfo}
                        disabled={savingBasicInfo}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="contained" 
                        type="submit"
                        disabled={savingBasicInfo}
                        startIcon={savingBasicInfo ? <CircularProgress size={16} /> : null}
                      >
                        Save
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr' }, gap: '12px', alignItems: 'start' }}>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: '120px' }}>
                      Name:
                    </Typography>
                    <Typography variant="body1">
                      {profile.firstName} {profile.lastName}
                    </Typography>
                    
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: '120px' }}>
                      Username:
                    </Typography>
                    <Typography variant="body1">
                      @{profile.username}
                    </Typography>
                    
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: '120px' }}>
                      Location:
                    </Typography>
                    <Typography variant="body1">
                      {profile.location || (isOwnProfile ? 'Add your location' : 'No location provided')}
                    </Typography>
                    
                    {profile.birthday && (
                      <>
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: '120px' }}>
                          Birthday:
                        </Typography>
                        <Typography variant="body1">
                          {new Date(profile.birthday).toLocaleDateString()}
                        </Typography>
                      </>
                    )}
                    
                    {profile.joinedDate && (
                      <>
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: '120px' }}>
                          Joined:
                        </Typography>
                        <Typography variant="body1">
                          {new Date(profile.createdAt || profile.joinedDate).toLocaleDateString()}
                        </Typography>
                      </>
                    )}
                  </Box>
                )}
              </Paper>
              
              {/* Work and Education Section */}
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Work and Education</Typography>
                  {isOwnProfile && !isEditingWorkEdu && (
                    <Button 
                      variant="outlined" 
                      size="small" 
                      startIcon={<EditIcon />}
                      onClick={() => setIsEditingWorkEdu(true)}
                    >
                      {!profile.work && !profile.education ? 'Add' : 'Edit'}
                    </Button>
                  )}
                </Box>
                
                {isEditingWorkEdu ? (
                  <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSaveWorkEdu(); }}>
                    <TextField
                      label="Work"
                      value={workEduValues.work}
                      onChange={(e) => setWorkEduValues(prev => ({ ...prev, work: e.target.value }))}
                      fullWidth
                      variant="outlined"
                      placeholder="Where do you work?"
                      sx={{ mb: 2 }}
                    />
                    
                    <TextField
                      label="Education"
                      value={workEduValues.education}
                      onChange={(e) => setWorkEduValues(prev => ({ ...prev, education: e.target.value }))}
                      fullWidth
                      variant="outlined"
                      placeholder="Where did you study?"
                      sx={{ mb: 2 }}
                    />
                    
                    {workEduError && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {workEduError}
                      </Alert>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Button 
                        variant="text" 
                        onClick={handleCancelEditWorkEdu}
                        disabled={savingWorkEdu}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="contained" 
                        type="submit"
                        disabled={savingWorkEdu}
                        startIcon={savingWorkEdu ? <CircularProgress size={16} /> : null}
                      >
                        Save
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  !profile.education && !profile.work ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {isOwnProfile ? 'Add your work and education information' : 'No work or education information available'}
                    </Typography>
                  ) : (
                    <>
                      {profile.work && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                            Work
                          </Typography>
                          <Typography variant="body1">
                            {profile.work}
                          </Typography>
                        </Box>
                      )}
                      
                      {profile.education && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                            Education
                          </Typography>
                          <Typography variant="body1">
                            {profile.education}
                          </Typography>
                        </Box>
                      )}
                    </>
                  )
                )}
              </Paper>
              
              {/* Contact Information */}
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Contact Information</Typography>
                  {isOwnProfile && (
                    <Button variant="outlined" size="small" startIcon={<EditIcon />}>
                      Edit
                    </Button>
                  )}
                </Box>
                
                {!profile.email && !profile.website && !profile.phone ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {isOwnProfile ? 'Add your contact information' : 'No contact information available'}
                  </Typography>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr' }, gap: '12px', alignItems: 'start' }}>
                    {profile.email && (
                      <>
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: '120px' }}>
                          Email:
                        </Typography>
                        <Typography variant="body1">
                          {profile.email}
                        </Typography>
                      </>
                    )}
                    
                    {profile.phone && (
                      <>
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: '120px' }}>
                          Phone:
                        </Typography>
                        <Typography variant="body1">
                          {profile.phone}
                        </Typography>
                      </>
                    )}
                    
                    {profile.website && (
                      <>
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: '120px' }}>
                          Website:
                        </Typography>
                        <Typography variant="body1" component="a" href={profile.website} target="_blank" rel="noopener noreferrer" sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                          {profile.website}
                        </Typography>
                      </>
                    )}
                  </Box>
                )}
              </Paper>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Friends Tab */}
      <Box sx={{ display: tabValue === 2 ? 'block' : 'none' }}>
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">Friends</Typography>
            {isOwnProfile && (
              <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={() => router.push('/friends/find')}>
                Find Friends
              </Button>
            )}
          </Box>
          
          {friendsError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {friendsError}
            </Alert>
          )}
          
          {loadingFriends ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : friendsInitialized && friends.length > 0 ? (
            <Grid container spacing={2}>
              {friends.map((friend) => (
                <Grid size={{xs:12,sm:6,md:4,lg:3}} key={friend._id}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      height: '100%', 
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 3
                      }
                    }}
                  >
                    <Avatar 
                      src={getFullImageUrl(friend.profilePicture, 'profile')} 
                      alt={friend.username}
                      sx={{ width: 80, height: 80, mb: 1 }}
                      onClick={() => router.push(`/profile/${friend._id}`)}
                      style={{ cursor: 'pointer' }}
                    />
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 'bold', 
                        textAlign: 'center',
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                      onClick={() => router.push(`/profile/${friend._id}`)}
                    >
                      {friend.firstName} {friend.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                      @{friend.username}
                    </Typography>
                    
                    {isAuthenticated && currentUser?._id !== friend._id && (
                      <Button 
                        variant={friend.isFollowing ? "outlined" : "contained"} 
                        size="small" 
                        startIcon={<PersonAddIcon />}
                        fullWidth
                        onClick={() => friend.isFollowing ? handleUnfollowFriend(friend._id) : handleFollowFriend(friend._id)}
                      >
                        {friend.isFollowing ? 'Unfollow' : 'Follow'}
                      </Button>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : friendsInitialized ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              py: 6, 
              textAlign: 'center',
              bgcolor: 'background.default',
              borderRadius: 1
            }}>
              <PersonIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {isOwnProfile ? 'You have no friends yet' : `${profile.firstName} has no friends yet`}
              </Typography>
              {isOwnProfile && (
                <Button 
                  variant="contained" 
                  startIcon={<PersonAddIcon />} 
                  sx={{ mt: 2 }}
                  onClick={() => router.push('/friends/find')}
                >
                  Find Friends
                </Button>
              )}
            </Box>
          ) : (
            // Add this fallback to cover the gap between initializing and loading
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </Paper>
      </Box>

      {/* Photos Tab */}
      <Box sx={{ display: tabValue === 3 ? 'block' : 'none' }}>
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">Photos</Typography>
            {isOwnProfile && (
              <Button 
                variant="outlined" 
                startIcon={<ImageIcon />} 
                onClick={() => router.push('/photos/upload')}
              >
                Upload Photos
              </Button>
            )}
          </Box>
          
          {photosError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {photosError}
            </Alert>
          )}
          
          {loadingPhotos ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : photos.length > 0 ? (
            <ImageList 
              variant="masonry" 
              cols={getGridCols()} 
              gap={8}
            >
              {photos.map((photo) => (
                <ImageListItem 
                  key={photo._id} 
                  onClick={() => handlePhotoClick(photo)}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.9,
                      transform: 'scale(1.02)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Photo'}
                    loading="lazy"
                    style={{ borderRadius: 8 }}
                    onError={(e) => {
                      console.error(`Failed to load image: ${photo.url}`);
                      (e.target as HTMLImageElement).src = '/images/placeholder-image.png';
                    }}
                  />
                  <ImageListItemBar
                    title={photo.caption}
                    subtitle={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LikeIcon fontSize="small" sx={{ mr: 0.5 }} />
                          {photo.likes || 0}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CommentIcon fontSize="small" sx={{ mr: 0.5 }} />
                          {photo.comments || 0}
                        </Box>
                      </Box>
                    }
                    sx={{ borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              py: 6, 
              textAlign: 'center',
              bgcolor: 'background.default',
              borderRadius: 1
            }}>
              <ImageIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {isOwnProfile ? 'You have no photos yet' : `${profile.firstName} has no photos yet`}
              </Typography>
              {isOwnProfile && (
                <Button 
                  variant="contained" 
                  startIcon={<ImageIcon />} 
                  sx={{ mt: 2 }}
                  onClick={() => router.push('/photos/upload')}
                >
                  Upload Photos
                </Button>
              )}
            </Box>
          )}
        </Paper>
      </Box>

      {process.env.NODE_ENV !== 'production' && ( <Paper sx={{ p: 2, mt: 3, maxHeight: 200, overflow: 'auto', fontSize: '0.7rem' }}> <Typography variant="subtitle2">Debug Info:</Typography> {debug.map((msg, i) => (<Typography key={i} variant="caption" display="block">{msg}</Typography>))} </Paper> )}
    </Container>
  );
};

export default ProfilePage;