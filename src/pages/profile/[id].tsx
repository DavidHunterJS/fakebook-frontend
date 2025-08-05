import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useMediaQuery, useTheme } from '@mui/material';
import { useGetUserPosts } from '../../hooks/usePosts'; // Ensure this path is correct
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
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Image as ImageIcon,
  Favorite as LikeIcon,
  Comment as CommentIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import useAuth from '../../hooks/useAuth'; // Adjust path if needed
import api from '../../utils/api'; // Adjust path if needed
import { User } from '../../types/user'; // Adjust path if needed
import { Post, MediaItem } from '../../types/post'; // Adjust path if needed
import {getFullImageUrl}  from '../../utils/imgUrl'; // Adjust the path as needed

// NEW FOLLOW SYSTEM IMPORTS
import FollowButton from '../../components/follow/FollowButton';
import ProfileStats from '../../components//follow/ProfileStats';
import SuggestedUsers from '../../components/follow/SuggestedUsers';
import FollowersList from '../../components/follow/FollowersList';
import AboutTab from  './tabs/AboutTab';
import PostsTab from './tabs/PostsTab';
import FriendsTab from './tabs/FriendsTab';
import PhotosTab from './tabs/PhotosTab'

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

// Add a suggested friends interface
interface SuggestedFriend extends User {
  mutualFriendsCount?: number;
  isRequested?: boolean;
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
  // Follow system counts
  followersCount?: number;
  followingCount?: number;
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

interface AlbumPhoto {
  _id?: string;
  filename: string;
  caption?: string;
  createdAt?: string;
  likes?: Array<string> | number;
  comments?: Array<string> | number;
}
const ProfilePage: React.FC = () => {
  // Hooks must be called inside the component and at the top level
  const [listOpen, setListOpen] = useState<'followers' | 'following' | null>(null);
  const router = useRouter();
  const { id } = router.query; // 'id' is now correctly scoped
  const { user: currentUser, isAuthenticated } = useAuth();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // React Query hook to fetch user posts (for the "Posts" tab)
  const {
    data: userPostsData = [], // Renamed to avoid conflict
    isLoading: userPostsLoading, // Renamed to avoid conflict
  } = useGetUserPosts(typeof id === 'string' ? id : undefined);

  // State variables - grouped by functionality
  // Profile and loading states
  const [isOwnProfile, setIsOwnProfile] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  // This 'posts' state is managed by fetchProfileAndPosts/fetchUserPosts
  // It might be for 'recentPosts' or a different set of posts than userPostsData
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true); // General page loading
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
  const [photosData, setPhotosData] = useState<Photo[]>([]);
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

  // Photo upload state
  const [photoUploadOpen, setPhotoUploadOpen] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

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
  }, []); // setDebug is stable, so often omitted. Add if linting requires.

  // Handle sending a friend request
  const handleSendFriendRequest = useCallback(async (userId: string) => {
    if (!isAuthenticated || !currentUser) return;
    
    try {
      await makeApiRequest(`/friends/request/${userId}`, 'post');
      setDebug(prev => [...prev, `Friend request sent to user ${userId}`]);
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Error sending friend request:', err);
      setDebug(prev => [...prev, `Error sending friend request to ${userId}: ${err.message}`]);
    }
  }, [isAuthenticated, currentUser, makeApiRequest]);

  // Fetch friends function
  const fetchFriends = useCallback(async () => {
    if (!profile || typeof id !== 'string') return;

    if (friendsInitialized && friends.length > 0) {
      setDebug(prev => [...prev, `Friends already initialized (${friends.length} friends), skipping fetch`]);
      return;
    }

    const profileFriends = profile.friends;
    if (profileFriends && Array.isArray(profileFriends) && profileFriends.length > 0) {
      setDebug(prev => [...prev, `Using ${profileFriends.length} friends already loaded in profile data`]);
      const friendsList = profileFriends as FriendUser[];
      if (currentUser) {
        const friendsWithFollowingStatus = friendsList.map(friend => {
          if (friend.isFollowing !== undefined) return friend;
          const isFollowing = currentUser.following && Array.isArray(currentUser.following) ?
            currentUser.following.some(followedId => String(followedId) === String(friend._id)) :
            false;
          return { ...friend, isFollowing };
        });
        setFriends(friendsWithFollowingStatus);
      } else {
        setFriends(friendsList);
      }
      setFriendsInitialized(true);
      return;
    }

    setLoadingFriends(true);
    setFriendsError(null);
    try {
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
          const error = e as Error;
          setDebug(prev => [...prev, `Failed to get friends from /friends endpoint, trying alternative: ${error.message}`]);
        }
      }

      try {
        setDebug(prev => [...prev, `Trying to get user profile with friends using /users/${id}`]);
        const response = await makeApiRequest(`/users/${id}`);
        if (response?.data) {
          const userData = response.data;
          if (userData.friends && Array.isArray(userData.friends) && userData.friends.length > 0) {
            setDebug(prev => [...prev, `Found ${userData.friends.length} friends in user data`]);
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
        const error = e as Error;
        setDebug(prev => [...prev, `Failed to get user profile with friends included: ${error.message}`]);
      }

      if (currentUser && profile._id !== currentUser._id) {
        try {
          setDebug(prev => [...prev, `Trying to get mutual friends using /friends/mutual/${id}`]);
          const response = await makeApiRequest(`/friends/mutual/${id}`);
          if (response?.data) {
            const mutualFriends = Array.isArray(response.data) ? response.data :
                                  (response.data.friends || []);
            if (mutualFriends.length >= 0) {
              setDebug(prev => [...prev, `Found ${mutualFriends.length} mutual friends`]);
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
          const error = e as Error;
          setDebug(prev => [...prev, `Failed to get mutual friends: ${error.message}`]);
        }
      }
      setDebug(prev => [...prev, 'No friends data found from any endpoint']);
      setFriends([]);
      setFriendsInitialized(true);
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Error fetching friends:', err);
      setFriendsError(err.response?.data?.message || err.message || 'Failed to load friends.');
      setDebug(prev => [...prev, `Error fetching friends: ${err.message}`]);
      setFriends([]);
      setFriendsInitialized(true);
    } finally {
      setLoadingFriends(false);
    }
  }, [id, profile, makeApiRequest, currentUser, friendsInitialized, friends.length]);

  // Fetch photos function
  const fetchPhotos = useCallback(async () => {
    if (!profile || typeof id !== 'string') return;
    if (photosInitialized && photosData.length > 0) {
      setDebug(prev => [...prev, `Photos already initialized (${photosData.length} photos), skipping fetch`]);
      return;
    }
    setLoadingPhotos(true);
    setPhotosError(null);
    try {
      setDebug(prev => [...prev, `Fetching photos from user posts for ID: ${id}`]);
      let postsForMedia = posts; // Use the 'posts' state which might contain recentPosts
      if (!postsForMedia.length) { // If 'posts' state is empty, try fetching all user posts
        try {
          // Use userPostsData from useGetUserPosts if available and populated
          if(userPostsData && userPostsData.length > 0) {
            postsForMedia = userPostsData;
             setDebug(prev => [...prev, `Using ${userPostsData.length} posts from useGetUserPosts for media extraction`]);
          } else {
             // Fallback to manual fetch if useGetUserPosts hasn't loaded or is empty
            const postsResponse = await makeApiRequest(`/posts/user/${id}`);
            if (postsResponse?.data?.posts || Array.isArray(postsResponse?.data)) {
                postsForMedia = postsResponse.data.posts || postsResponse.data;
                setDebug(prev => [...prev, `Fetched ${postsForMedia.length} posts manually for media extraction`]);
            }
          }
        } catch (e) {
          const error = e as Error;
          setDebug(prev => [...prev, `Error fetching posts for photos: ${error.message}`]);
        }
      }

      const photosFromPosts: Photo[] = [];
      if (postsForMedia.length > 0) {
          postsForMedia.forEach(post => {
            // Check if post.media exists and is an array with items
            if (post.media && Array.isArray(post.media) && post.media.length > 0) {
              post.media.forEach((mediaItem: MediaItem) => { 
                photosFromPosts.push({
                  _id: `${post._id}-${mediaItem.key || mediaItem.url}`, 
                  url: getFullImageUrl(mediaItem.key || mediaItem.url, 'post'), 
                  filename: mediaItem.originalFilename || mediaItem.key || mediaItem.url,
                  caption: post.text?.substring(0, 100) || '',
                  createdAt: post.createdAt || new Date().toISOString(),
                  postId: post._id,
                  // --- FIX IS HERE ---
                  // Calculate total reactions by summing the values in the 'counts' object
                  likes: Object.values(post.reactionsSummary?.counts || {}).reduce((sum, count) => sum + count, 0),
                  comments: post.comments?.length || 0
                });
              });
            }
          });
        }

      const photosFromAlbums: Photo[] = [];
      try {
        const albumsResponse = await makeApiRequest(`/users/${id}/albums`);
        if (albumsResponse?.data?.albums && Array.isArray(albumsResponse.data.albums)) {
          const albums = albumsResponse.data.albums;
          for (const album of albums) {
            if (album.photos && Array.isArray(album.photos) && album.photos.length > 0) {
              album.photos.forEach((photo: AlbumPhoto) => {
                photosFromAlbums.push({
                  _id: photo._id || `album-${album._id}-${photo.filename}`,
                  url: getFullImageUrl(photo.filename, 'post'),
                  filename: photo.filename,
                  caption: photo.caption || album.title || '',
                  createdAt: (photo.createdAt || album.createdAt || new Date().toISOString()) as string,
                  albumId: album._id,
                  likes: typeof photo.likes === 'number' ? photo.likes : photo.likes?.length || 0,
                  comments: typeof photo.comments === 'number' ? photo.comments : photo.comments?.length || 0
                });
              });
            }
          }
          setDebug(prev => [...prev, `Extracted ${photosFromAlbums.length} photos from albums`]);
        }
      } catch (e) {
        const error = e as Error;
        setDebug(prev => [...prev, `Error fetching albums (might not be implemented): ${error.message}`]);
      }

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
      // Assuming 'coverPhoto' exists on your Profile type
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

      const allPhotos = [...profilePhotos, ...photosFromPosts, ...photosFromAlbums];
      allPhotos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (allPhotos.length === 0) {
        setDebug(prev => [...prev, 'No photos found for this user']);
      } else {
        setDebug(prev => [...prev, `Found a total of ${allPhotos.length} photos`]);
      }
      setPhotosData(allPhotos);
      setPhotosInitialized(true);
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Error fetching photos:', err);
      setPhotosError(err.response?.data?.message || err.message || 'Failed to load photos.');
      setDebug(prev => [...prev, `Error fetching photos: ${err.message}`]);
    } finally {
      setLoadingPhotos(false);
    }
  }, [id, profile, posts, userPostsData, makeApiRequest, photosInitialized, photosData.length]);

  // Get grid columns function
  const getGridCols = useCallback(() => {
    if (isSmallScreen) return 2;
    if (isMediumScreen) return 3;
    return 4;
  }, [isSmallScreen, isMediumScreen]);

  // Photo click handler
  const handlePhotoClick = useCallback((photo: Photo) => {
    if (photo.postId) {
      router.push(`/posts/${photo.postId}`);
    }
    else if (photo.albumId) {
      router.push(`/album/${photo.albumId}`);
    }
    else {
      window.open(photo.url, '_blank');
    }
  }, [router]);

  // Handle bio save
  const handleSaveBio = useCallback(async () => {
    if (!currentUser || !profile) return;
    setSavingBio(true);
    setBioError(null);
    try {
      await makeApiRequest('/users/profile', 'put', { bio: bioValue });
      setDebug(prev => [...prev, `Bio updated successfully to: ${bioValue}`]);
      setProfile(prevProfile => {
        if (!prevProfile) return null;
        return { ...prevProfile, bio: bioValue };
      });
      setIsEditingBio(false);
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Error updating bio:', );
      setBioError(err.response?.data?.message || err.message || 'Failed to update bio.');
      setDebug(prev => [...prev, `Error updating bio: ${err.response?.data?.message || err.message || 'Failed to update bio.'}`]);
    } finally {
      setSavingBio(false);
    }
  }, [currentUser, profile, bioValue, makeApiRequest]);

  // Handle cancel bio edit
  const handleCancelEditBio = useCallback(() => {
    setIsEditingBio(false);
    setBioValue(profile?.bio || '');
    setBioError(null);
  }, [profile]);

  // Handle save basic info
  const handleSaveBasicInfo = useCallback(async () => {
    if (!currentUser || !profile) return;
    setSavingBasicInfo(true);
    setBasicInfoError(null);
    try {
      await makeApiRequest('/users/profile', 'put', basicInfoValues);
      setDebug(prev => [...prev, `Basic info updated successfully: ${JSON.stringify(basicInfoValues)}`]);
      setProfile(prevProfile => {
        if (!prevProfile) return null;
        return { ...prevProfile, ...basicInfoValues };
      });
      setIsEditingBasicInfo(false);
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Error updating basic info:', err);
      setBasicInfoError(err.response?.data?.message || err.message || 'Failed to update information.');
      setDebug(prev => [...prev, `Error updating basic info: ${err.response?.data?.message || err.message || 'Failed to update information.'}`]);
    } finally {
      setSavingBasicInfo(false);
    }
  }, [currentUser, profile, basicInfoValues, makeApiRequest]);

  // Handle cancel basic info edit
  const handleCancelEditBasicInfo = useCallback(() => {
    setIsEditingBasicInfo(false);
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
      setProfile(prevProfile => {
        if (!prevProfile) return null;
        return { ...prevProfile, ...workEduValues };
      });
      setIsEditingWorkEdu(false);
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('Error updating work and education:', err);
      setWorkEduError(err.response?.data?.message || err.message || 'Failed to update work and education.');
      setDebug(prev => [...prev, `Error updating work and education: ${err.response?.data?.message || err.message || 'Failed to update work and education.'}`]);
    } finally {
      setSavingWorkEdu(false);
    }
  }, [currentUser, profile, workEduValues, makeApiRequest]);

  // Handle cancel work and education edit
  const handleCancelEditWorkEdu = useCallback(() => {
    setIsEditingWorkEdu(false);
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

  // Handle opening the photo upload dialog
  const handleOpenPhotoUpload = useCallback(() => {
    setPhotoUploadOpen(true);
    setUploadSuccess(false);
  }, []);

  // Handle closing the photo upload dialog
  const handleClosePhotoUpload = useCallback(() => {
    setPhotoUploadOpen(false);
    
    // If upload was successful, refresh the photos
    if (uploadSuccess) {
      setPhotosInitialized(false);
      fetchPhotos();
    }
  }, [uploadSuccess, fetchPhotos]);

// Handle successful upload
  const handleUploadSuccess = useCallback(() => {
    setUploadSuccess(true);
    setDebug(prev => [...prev, 'Photo upload successful']);
  
    // Automatically close the dialog after a short delay
    setTimeout(() => {
      setPhotoUploadOpen(false);
      setPhotosInitialized(false); // Reset photos to trigger a refresh
      fetchPhotos(); // Refresh photos
    }, 1500); // 1.5 second delay to show the success message
  }, [fetchPhotos]);

  // Process friends data when tab changes
  useEffect(() => {
    if (tabValue === 2 && profile) {
      if (!friendsInitialized && !loadingFriends) {
        fetchFriends();
      }
    }
  }, [
    tabValue, 
    profile, 
    fetchFriends, 
    loadingFriends, 
    friendsInitialized
  ]);

  // Process photos data when tab changes
  useEffect(() => {
    if (tabValue === 3 && profile && !photosInitialized && !loadingPhotos) { // Ensure profile is loaded
      fetchPhotos();
    }
  }, [tabValue, profile, fetchPhotos, photosInitialized, loadingPhotos]);

  // Update isOwnProfile when either profile or currentUser changes
  useEffect(() => {
    if (profile && currentUser) {
      setIsOwnProfile(currentUser._id === profile._id);
    } else {
      setIsOwnProfile(null); // Set to null or false if either is not available
    }
  }, [profile, currentUser]);

  useEffect(() => {
    if (router.isReady && (!id || id === 'undefined')) {
      console.log('Invalid profile ID:', id);
      if (currentUser?._id) {
        router.replace(`/profile/${currentUser._id}`);
      } else {
        router.replace('/dashboard'); // Or your login page
      }
      return;
    }

    const fetchProfileData = async () => { // Renamed from fetchProfileAndPosts to be more specific
      if (typeof id !== 'string' || !router.isReady) return;

      setLoading(true);
      setError(null);
      setProfile(null);
      setPosts([]); // Reset local posts state
      setIsFollowing(false);
      setFriendsInitialized(false); // Reset on new profile load
      setPhotosInitialized(false); // Reset on new profile load
      setDebug(prev => [...prev, `Starting profile fetch for ID/Username: ${id}`]);

      try {
        const isLikelyId = isLikelyObjectIdString(id);
        const profileEndpoint = isLikelyId
            ? `/users/${id}`
            : `/users/profile/${id}`;

        setDebug(prev => [...prev, `Using relative profile endpoint: ${profileEndpoint}`]);
        const profileResponse = await makeApiRequest(profileEndpoint);

        if (profileResponse?.data) {
            const profileDataResult: Profile = profileResponse.data.profile || profileResponse.data;
            setDebug(prev => [...prev, `Profile data received: Keys - ${Object.keys(profileDataResult).join(', ')}`]);

            // Process friends data from profile response BEFORE setting the profile
            const currentProfileFriends = profileDataResult.friends;
            if (currentProfileFriends && Array.isArray(currentProfileFriends) && currentProfileFriends.length > 0) {
              const friendsList = currentProfileFriends as FriendUser[];
              setDebug(prev => [...prev, `Processing ${friendsList.length} friends from profile data`]);
              if (currentUser) {
                const friendsWithFollowingStatus = friendsList.map(friend => {
                  if (friend.isFollowing !== undefined) return friend;
                  const isFollowingVal = currentUser.following && Array.isArray(currentUser.following) ?
                    currentUser.following.some(followedId => String(followedId) === String(friend._id)) :
                    false;
                  return { ...friend, isFollowing: isFollowingVal };
                });
                setFriends(friendsWithFollowingStatus);
              } else {
                setFriends(friendsList);
              }
              setFriendsInitialized(true);
            } else {
                setFriends([]); // Clear friends if not in profile data
                setFriendsInitialized(false); // And ensure it tries to fetch if tab is active
            }

            setProfile(profileDataResult); // Set profile after friends processing

            setBioValue(profileDataResult.bio || '');
            setBasicInfoValues({
              firstName: profileDataResult.firstName || '',
              lastName: profileDataResult.lastName || '',
              location: profileDataResult.location || ''
            });
            setWorkEduValues({
              work: profileDataResult.work || '',
              education: profileDataResult.education || ''
            });

            if (currentUser && profileDataResult.followers && Array.isArray(profileDataResult.followers)) {
                const isCurrentlyFollowing = profileDataResult.followers.some((followerId: string) => String(followerId) === currentUser._id);
                setIsFollowing(isCurrentlyFollowing);
                setDebug(prev => [...prev, `Set following status from followers array: ${isCurrentlyFollowing}`]);
            }
            else if (profileDataResult.relationshipStatus?.isFollowing !== undefined) {
                setIsFollowing(profileDataResult.relationshipStatus.isFollowing);
                setDebug(prev => [...prev, `Set following status from relationshipStatus: ${profileDataResult.relationshipStatus?.isFollowing}`]);
            }

            // Handle recentPosts for display (e.g., in an intro section or if useGetUserPosts is not for the main list)
            if (profileDataResult.recentPosts && Array.isArray(profileDataResult.recentPosts)) {
                setDebug(prev => [...prev, `Using recentPosts from profile response: ${profileDataResult.recentPosts?.length} posts found`]);
                setPosts(profileDataResult.recentPosts); // Sets the local 'posts' state
            } else if (!profileDataResult.privacyRestricted && !userPostsData.length) {
                // If no recent posts and privacy not restricted, and useGetUserPosts hasn't loaded posts,
                // you might still want a separate fetch for specific posts or rely on useGetUserPosts.
                // For now, this else if is less critical if useGetUserPosts handles the main list.
                 setDebug(prev => [...prev, `No recent posts in profile, will rely on useGetUserPosts or fetchUserPosts if needed.`]);
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

    fetchProfileData();
  }, [id, currentUser, router.isReady, makeApiRequest, userPostsData.length]); // Removed router from deps, added router.isReady

  // Conditional Renders for loading/error states
  if (loading) { // General page loading
    return <Container sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Container>;
  }
  if (error && !profile) { // If error and no profile, show error
    return <Container sx={{ py: 8 }}><Alert severity="error" sx={{ mb: 3 }}>{error}</Alert></Container>;
  }
  if (!profile) { // If no profile after loading (and no error shown above), show generic message
    return <Container sx={{ py: 8 }}><Typography variant="h6" align="center">Profile could not be loaded.</Typography></Container>;
  }

  // Privacy Restricted View
  if (profile.privacyRestricted && !isOwnProfile) {
     return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
             <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
                <Avatar src={getFullImageUrl(profile.profilePicture, 'profile')} alt={profile.username} sx={{ width: 100, height: 100, margin: '0 auto 16px' }} />
                <Typography variant="h5">{profile.firstName} {profile.lastName}</Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>@{profile.username}</Typography>
                <Typography variant="body1" sx={{mt: 2}}>This profile is private.</Typography>
                {isAuthenticated && !isOwnProfile && (
                  <FollowButton
                    userId={profile._id}
                    initialFollowState={isFollowing}
                    onFollowChange={(newState) => setIsFollowing(newState)}
                    size="medium"
                    variant="contained"
                    className="mt-2"
                  />
                )}
             </Paper>
        </Container>
     );
  }

  // Derived variables for rendering (safe to call now as profile is guaranteed)
  const profileAvatarUrl = getFullImageUrl(profile.profilePicture, 'profile');
  const coverPhotoUrl = getFullImageUrl(profile.coverPhoto, 'cover');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
        <Box sx={{ height: 250, width: '100%', position: 'relative', bgcolor: 'grey.300', overflow: 'hidden' }}>
          {profile.coverPhoto && profile.coverPhoto !== 'default-cover.png' && (
            <Image
              src={coverPhotoUrl}
              alt={`${profile.username}'s cover photo`}
              fill
              style={{ objectFit: 'cover', objectPosition: 'center' }}
              priority // Consider adding priority for LCP elements
              onError={(e) => { console.error("Error loading cover image:", e); (e.target as HTMLImageElement).style.display = 'none';}}
              // unoptimized={true}
            />
          )}
        </Box>
        <Box sx={{ px: 4, pb: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'center', md: 'flex-end' }, position: 'relative' }}>
          <Avatar src={profileAvatarUrl} alt={profile.username} sx={{ width: 150, height: 150, border: '4px solid', borderColor: 'background.paper', marginTop: '-75px', boxShadow: 2, mr: { md: 3 } }} />
          <Box sx={{ flex: 1, mt: { xs: 2, md: 0 }, textAlign: { xs: 'center', md: 'left' } }}>
            <Typography variant="h4" component="h1" gutterBottom> {profile.firstName} {profile.lastName} </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom> @{profile.username} </Typography>
            {profile.bio && <Typography variant="body1" sx={{ mt: 1 }}>{profile.bio}</Typography>}
            
            {/* REPLACED: Old follower count display with new ProfileStats component */}
            <ProfileStats
              followersCount={profile.followersCount || profile.followers?.length || 0}
              followingCount={profile.followingCount || profile.following?.length || 0}
              onFollowersClick={() => setListOpen('followers')}
              onFollowingClick={() => setListOpen('following')}
            />
          </Box>
          
          {/* REPLACED: Old follow button with new FollowButton component */}
          <Box sx={{ mt: { xs: 2, md: 0 }, display: 'flex', alignItems: 'center' }}>
            {isAuthenticated && ( 
              isOwnProfile ? ( 
                <Button variant="contained" startIcon={<EditIcon />} onClick={() => router.push('/settings/profile')}> 
                  Edit Profile 
                </Button> 
              ) : ( 
                <FollowButton
                  userId={profile._id}
                  initialFollowState={isFollowing}
                  onFollowChange={(newFollowState, newFollowersCount) => {
                    setIsFollowing(newFollowState);
                    // Update profile followers count if needed
                    setProfile(prevProfile => {
                      if (!prevProfile) return null;
                      const currentFollowers = prevProfile.followers || [];
                      let updatedFollowers: string[];
                      if (newFollowState) {
                        updatedFollowers = [...new Set([...currentFollowers, currentUser?._id || ''])];
                      } else {
                        updatedFollowers = currentFollowers.filter((followerId: string) => 
                          String(followerId) !== currentUser?._id
                        );
                      }
                      return { 
                        ...prevProfile, 
                        followers: updatedFollowers,
                        followersCount: updatedFollowers.length,
                        relationshipStatus: { 
                          ...prevProfile.relationshipStatus, 
                          isFollowing: newFollowState 
                        }
                      };
                    });
                  }}
                  size="medium"
                  variant="contained"
                  className=""
                />
              ) 
            )}
          </Box>
        </Box>
      </Paper>

      {error && <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ borderRadius: 2, mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Posts" /> <Tab label="About" /> <Tab label="Friends" /> <Tab label="Photos" />
        </Tabs>
      </Paper>

      {/* Posts Tab - Using data from useGetUserPosts */}
      <Box sx={{ display: tabValue === 0 ? 'block' : 'none' }}>
        <PostsTab
          profile={profile}
          isOwnProfile={isOwnProfile || false}
          userPostsData={userPostsData}
          userPostsLoading={userPostsLoading}
          onDebugMessage={(message) => {
            setDebug(prev => [...prev, message]);
          }}
        />
      </Box>

      {/* About Tab */}
      <Box sx={{ display: tabValue === 1 ? 'block' : 'none' }}>
        <AboutTab
          profile={profile}
          isOwnProfile={isOwnProfile || false}
          onProfileUpdate={(updatedFields) => {
            setProfile(prevProfile => {
              if (!prevProfile) return null;
              return { ...prevProfile, ...updatedFields };
            });
          }}
          onDebugMessage={(message) => {
            setDebug(prev => [...prev, message]);
          }}
        />
      </Box>
      {/* Friends Tab */}
      <Box sx={{ display: tabValue === 2 ? 'block' : 'none' }}>
        <FriendsTab
          profile={profile}
          isOwnProfile={isOwnProfile || false}
          onDebugMessage={(message) => {
              setDebug(prev => [...prev, message]);
          }}
        />
      </Box>
      {/* Photos Tab */}
      <Box sx={{ display: tabValue === 3 ? 'block' : 'none' }}>
        <PhotosTab
          profile={profile}
          isOwnProfile={isOwnProfile || false}
          userPostsData={userPostsData} // Pass the posts data down
          onDebugMessage={(message) => {
            setDebug(prev => [...prev, message]);
          }}
        />
      </Box>

      {process.env.NODE_ENV !== 'production' && ( 
        <Paper sx={{ p: 2, mt: 3, maxHeight: 200, overflow: 'auto', fontSize: '0.7rem' }}> 
          <Typography variant="subtitle2">Debug Info:</Typography> 
          {debug.map((msg, i) => (
            <Typography key={i} variant="caption" display="block">{msg}</Typography>
          ))} 
        </Paper> 
      )}
        {profile && listOpen && (
        <FollowersList
          userId={profile._id}
          type={listOpen}
          isOpen={!!listOpen}
          onClose={() => setListOpen(null)}
          currentUserId={currentUser?._id}
        />
      )}
    </Container>
  );
};

export default ProfilePage;