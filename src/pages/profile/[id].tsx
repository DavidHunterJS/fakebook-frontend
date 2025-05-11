import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
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
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import useAuth from '../../hooks/useAuth'; // Adjust path if needed
import api from '../../utils/api'; // Adjust path if needed
import { User } from '../../types/user'; // Adjust path if needed
import { Post } from '../../types/post'; // Adjust path if needed
import PostCard from '../../components/post/PostCard'; // Adjust path if needed
import {getFullImageUrl}  from '../../utils/imgUrl'; // Adjust the path as needed
// --- Helper to construct full image URLs ---
// const BACKEND_STATIC_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:5000';

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
}


const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user: currentUser, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [debug, setDebug] = useState<string[]>([]);

  // Simplified API request helper - now memoized with useCallback
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
  }, [setDebug]); // Add setDebug as a dependency

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
            setProfile(profileData);

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

  }, [id, currentUser, router, makeApiRequest]); // Added currentUser and router as dependencies

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFollowToggle = async () => {
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
  };

  if (loading) {
    return <Container sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Container>;
  }
  if (error && !profile) {
    return <Container sx={{ py: 8 }}><Alert severity="error" sx={{ mb: 3 }}>{error}</Alert></Container>;
  }
  if (!profile) {
    return <Container sx={{ py: 8 }}><Typography variant="h6" align="center">Profile could not be loaded.</Typography></Container>;
  }

  const isOwnProfile = currentUser && currentUser._id === profile._id;

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

  const profileAvatarUrl = getFullImageUrl(profile.profilePicture, 'profile');
  // --- ENSURE 'cover' (singular) IS PASSED AS TYPE FOR COVER PHOTOS ---
  const coverPhotoUrl = getFullImageUrl(profile.coverPhoto, 'cover');
  console.log(`[coverPhotoUrl] =  ${coverPhotoUrl}`);
  
  // -------------------------------------------------------------------

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
      <Box sx={{ display: tabValue === 1 ? 'block' : 'none' }}> {/* About Tab */} </Box>
      <Box sx={{ display: tabValue === 2 ? 'block' : 'none' }}> {/* Friends Tab */} </Box>
      <Box sx={{ display: tabValue === 3 ? 'block' : 'none' }}> {/* Photos Tab */} </Box>

      {process.env.NODE_ENV !== 'production' && ( <Paper sx={{ p: 2, mt: 3, maxHeight: 200, overflow: 'auto', fontSize: '0.7rem' }}> <Typography variant="subtitle2">Debug Info:</Typography> {debug.map((msg, i) => (<Typography key={i} variant="caption" display="block">{msg}</Typography>))} </Paper> )}
    </Container>
  );
};

export default ProfilePage;