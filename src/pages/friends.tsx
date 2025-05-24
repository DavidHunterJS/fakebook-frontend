// pages/friends.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Button,
  Avatar,
  Card,
  CardContent,
  CardActions,
  Grid,
  Alert,
  Pagination,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment
} from '@mui/material';
// import Grid from '@mui/material/Unstable_Grid2';
import {
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Check as AcceptIcon,
  Close as DeclineIcon,
  Block as BlockIcon,
  Search as SearchIcon,
  PersonSearch as PersonSearchIcon,
  Close // Added the missing import for the Close icon
} from '@mui/icons-material';
import useAuth from '../hooks/useAuth';
import api from '../utils/api';
import { getFullImageUrl } from '../utils/imgUrl';

// Define types for friend data
interface FriendUser {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  name?: string; // Some endpoints return name instead of first/last name
  profileImage?: string;
  profilePicture?: string;
  bio?: string;
}

interface Friendship {
  _id: string;
  requester: FriendUser | string;
  recipient: FriendUser | string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  total: number;
  page: number;
  pages: number;
}

enum FriendTab {
  FRIENDS = 0,
  REQUESTS = 1,
  SENT = 2,
  SUGGESTIONS = 3,
  BLOCKED = 4
}

// Define an interface for API errors
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const FriendsPage: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // State
  const [activeTab, setActiveTab] = useState<FriendTab>(FriendTab.FRIENDS);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<Friendship[]>([]);
  const [suggestions, setSuggestions] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    pages: 1
  });

  // Helper to handle API errors
  const handleApiError = useCallback((error: ApiError, fallbackMessage: string) => {
    console.error(error);
    if (error.response?.data?.message) {
      setError(error.response.data.message);
    } else if (error.message) {
      setError(error.message);
    } else {
      setError(fallbackMessage);
    }
    setLoading(false);
  }, []);

  // Fetch functions for each tab - wrap each in useCallback
  const fetchFriends = useCallback(async (page: number = 1) => {
    try {
      const response = await api.get(`/friends?page=${page}&limit=10`);
      if (response.data && response.data.friends) {
        setFriends(response.data.friends);
        setPagination(response.data.pagination || { total: 0, page: 1, pages: 1 });
      }
    } catch (error) {
      handleApiError(error as ApiError, 'Failed to load friends');
    }
  }, [handleApiError]);

  const fetchPendingRequests = useCallback(async (page: number = 1) => {
    try {
      const response = await api.get(`/friends/requests/pending?page=${page}&limit=10`);
      if (response.data && response.data.requests) {
        setPendingRequests(response.data.requests);
        setPagination(response.data.pagination || { total: 0, page: 1, pages: 1 });
      }
    } catch (error) {
      handleApiError(error as ApiError, 'Failed to load friend requests');
    }
  }, [handleApiError]);

  const fetchSentRequests = useCallback(async (page: number = 1) => {
    try {
      const response = await api.get(`/friends/requests/sent?page=${page}&limit=10`);
      if (response.data && response.data.requests) {
        setSentRequests(response.data.requests);
        setPagination(response.data.pagination || { total: 0, page: 1, pages: 1 });
      }
    } catch (error) {
      handleApiError(error as ApiError, 'Failed to load sent requests');
    }
  }, [handleApiError]);

  const fetchSuggestions = useCallback(async () => {
    try {
      const response = await api.get('/friends/suggestions?limit=20');
      if (response.data && response.data.suggestions) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      handleApiError(error as ApiError, 'Failed to load friend suggestions');
    }
  }, [handleApiError]);

  const fetchBlockedUsers = useCallback(async (page: number = 1) => {
    try {
      const response = await api.get(`/friends/blocked?page=${page}&limit=10`);
      if (response.data && response.data.blockedUsers) {
        setBlockedUsers(response.data.blockedUsers);
        setPagination(response.data.pagination || { total: 0, page: 1, pages: 1 });
      }
    } catch (error) {
      handleApiError(error as ApiError, 'Failed to load blocked users');
    }
  }, [handleApiError]);

  // Function to load data for the current tab
  const loadTabData = useCallback(async (tab: FriendTab, page: number = 1) => {
    try {
      setLoading(true);

      switch (tab) {
        case FriendTab.FRIENDS:
          await fetchFriends(page);
          break;
        case FriendTab.REQUESTS:
          await fetchPendingRequests(page);
          break;
        case FriendTab.SENT:
          await fetchSentRequests(page);
          break;
        case FriendTab.SUGGESTIONS:
          await fetchSuggestions();
          break;
        case FriendTab.BLOCKED:
          await fetchBlockedUsers(page);
          break;
      }
    } catch (error) {
      handleApiError(error as ApiError, 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [fetchFriends, fetchPendingRequests, fetchSentRequests, fetchSuggestions, fetchBlockedUsers, handleApiError]);

  // --- NEW useEffect for URL Query Parameter ---
  useEffect(() => {
    if (router.isReady) {
      const tabParam = router.query.tab as string; // Get the 'tab' query parameter
      if (tabParam) {
        switch (tabParam) {
          case 'friends':
            setActiveTab(FriendTab.FRIENDS);
            break;
          case 'requests':
            setActiveTab(FriendTab.REQUESTS);
            break;
          case 'sent':
            setActiveTab(FriendTab.SENT);
            break;
          case 'suggestions':
            setActiveTab(FriendTab.SUGGESTIONS);
            break;
          case 'blocked':
            setActiveTab(FriendTab.BLOCKED);
            break;
          default:
            setActiveTab(FriendTab.FRIENDS); // Default if unrecognized
        }
      }
    }
  }, [router.isReady, router.query]); // Depend on router.isReady and router.query

  // Load data based on active tab
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/login');
      return;
    }

    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);
    setCurrentPage(1);

    loadTabData(activeTab, 1);
  }, [isAuthenticated, authLoading, activeTab, loadTabData, router]); // `activeTab` is a dependency here

  // Action functions
  const handleSendFriendRequest = useCallback(async (userId: string) => {
    try {
      await api.post(`/friends/request/${userId}`);
      // Refresh the current tab data
      await loadTabData(activeTab);
      // Also refresh suggestions if we're on that tab
      if (activeTab === FriendTab.SUGGESTIONS) {
        await fetchSuggestions();
      }
    } catch (error) {
      handleApiError(error as ApiError, 'Failed to send friend request');
    }
  }, [activeTab, fetchSuggestions, handleApiError, loadTabData]);

  const handleAcceptRequest = useCallback(async (userId: string) => {
    try {
      await api.put(`/friends/accept/${userId}`);
      await fetchPendingRequests();
      // Also refresh the friends list
      await fetchFriends();
    } catch (error) {
      handleApiError(error as ApiError, 'Failed to accept friend request');
    }
  }, [fetchFriends, fetchPendingRequests, handleApiError]);

  const handleDeclineRequest = useCallback(async (userId: string) => {
    try {
      await api.put(`/friends/decline/${userId}`);
      await fetchPendingRequests();
    } catch (error) {
      handleApiError(error as ApiError, 'Failed to decline friend request');
    }
  }, [fetchPendingRequests, handleApiError]);

  const handleCancelRequest = useCallback(async (userId: string) => {
    try {
      await api.delete(`/friends/cancel/${userId}`);
      await fetchSentRequests();
    } catch (error) {
      handleApiError(error as ApiError, 'Failed to cancel friend request');
    }
  }, [fetchSentRequests, handleApiError]);

  const handleRemoveFriend = useCallback(async (userId: string) => {
    try {
      await api.delete(`/friends/${userId}`);
      await fetchFriends();
    } catch (error) {
      handleApiError(error as ApiError, 'Failed to remove friend');
    }
  }, [fetchFriends, handleApiError]);

  const handleBlockUser = useCallback(async (userId: string) => {
    try {
      await api.put(`/friends/block/${userId}`);
      // Refresh all relevant lists
      if (activeTab === FriendTab.FRIENDS) await fetchFriends();
      if (activeTab === FriendTab.REQUESTS) await fetchPendingRequests();
      if (activeTab === FriendTab.SENT) await fetchSentRequests();
      await fetchBlockedUsers();
    } catch (error) {
      handleApiError(error as ApiError, 'Failed to block user');
    }
  }, [activeTab, fetchBlockedUsers, fetchFriends, fetchPendingRequests, fetchSentRequests, handleApiError]);

  const handleUnblockUser = useCallback(async (userId: string) => {
    try {
      await api.put(`/friends/unblock/${userId}`);
      await fetchBlockedUsers();
    } catch (error) {
      handleApiError(error as ApiError, 'Failed to unblock user');
    }
  }, [fetchBlockedUsers, handleApiError]);

  // Add this inside your component after fetching friends
  console.log('First friend data structure:', friends.length > 0 ? JSON.stringify(friends[0], null, 2) : 'No friends');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue as FriendTab);
    // Update the URL to reflect the currently selected tab
    const tabName = Object.keys(FriendTab)[Object.values(FriendTab).indexOf(newValue as FriendTab)]?.toLowerCase();
    if (tabName) {
        router.push(`/friends?tab=${tabName}`, undefined, { shallow: true });
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    loadTabData(activeTab, page);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSearch = () => {
    // Implement search functionality
    console.log('Searching for:', searchQuery);
    // You could add a search endpoint or filter the existing data
  };

  // View profile function
  const viewProfile = useCallback((userId: string) => {
    router.push(`/profile/${userId}`);
  }, [router]);

  // Helper function to get user display name
  const getUserName = useCallback((user: FriendUser): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.name) {
      return user.name;
    } else {
      return user.username || 'Unknown User';
    }
  }, []);

  // Helper function to get profile image URL
  const getProfileImage = useCallback((user: FriendUser): string => {
    if (!user) return '/images/default-avatar.png';

    // Check if we have a profile picture value
    const profilePic = user.profilePicture || user.profileImage;
    console.log(`[profilePic] ${profilePic}`);

    // If no profile picture, return default
    if (!profilePic || profilePic === 'default-avatar.png') {
      console.log(`User ${user.username}: Using default avatar`);
      return '/images/default-avatar.png';
    }

    // Use the centralized getFullImageUrl function
    const imageUrl = getFullImageUrl(profilePic, 'profile');
    console.log(`User ${user.username}: Using getFullImageUrl: ${imageUrl}`);
    return imageUrl;
  }, []);

  // UI Components for different tabs
  const renderFriendsTab = () => {
    if (friends.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          You don&apos;t have any friends yet. Check out the Suggestions tab to find people to connect with!
        </Alert>
      );
    }

    return (
      <>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {friends.map((friend) => (
            <Grid size={{xs:12, sm:6, md:4}} key={friend._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                <Avatar
                  src={getProfileImage(friend)}
                  alt={getUserName(friend)}
                  sx={{ width: 60, height: 60, mr: 2 }}
                  onError={(e) => {
                    // If image fails to load, fallback to default avatar
                    console.error(`Failed to load avatar for ${friend.username}, using default`);
                    (e.target as HTMLImageElement).src = '/images/default-avatar.png';
                  }}
                />
                  <Box>
                    <Typography variant="h6" component="div">
                      {getUserName(friend)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{friend.username}
                    </Typography>
                  </Box>
                </Box>

                <CardContent sx={{ flexGrow: 1, pt: 0 }}>
                  <Typography variant="body2" color="text.secondary">
                    {friend.bio || 'No bio available'}
                  </Typography>
                </CardContent>

                <CardActions>
                  <Button size="small" onClick={() => viewProfile(friend._id)}>
                    View Profile
                  </Button>
                  <Box sx={{ flexGrow: 1 }} />
                  <Tooltip title="Remove Friend">
                    <IconButton
                      color="default"
                      onClick={() => handleRemoveFriend(friend._id)}
                      size="small"
                    >
                      <PersonRemoveIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Block User">
                    <IconButton
                      color="default"
                      onClick={() => handleBlockUser(friend._id)}
                      size="small"
                    >
                      <BlockIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {pagination.pages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={pagination.pages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </>
    );
  };

  const renderRequestsTab = () => {
    if (pendingRequests.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          You don&apos;t have any pending friend requests.
        </Alert>
      );
    }

    return (
      <>
        <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
          Friend Requests ({pagination.total})
        </Typography>

        <Grid container spacing={2}>
          {pendingRequests.map((request) => {
            // Make sure requester is a FriendUser object
            const requester = typeof request.requester === 'string'
              ? null
              : request.requester as FriendUser;

            if (!requester) return null; // Skip if data is malformed

            return (
              <Grid
              size={{xs:12, sm:6, md:4}} key={request._id} // Required key for rendering lists in React
              >
                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    src={getProfileImage(requester)}
                    alt={getUserName(requester)}
                    sx={{ width: 50, height: 50, mr: 2 }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body1">
                      {getUserName(requester)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{requester.username}
                    </Typography>
                  </Box>
                  <Box>
                    <Tooltip title="Accept">
                      <IconButton
                        color="success"
                        onClick={() => handleAcceptRequest(requester._id)}
                      >
                        <AcceptIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Decline">
                      <IconButton
                        color="error"
                        onClick={() => handleDeclineRequest(requester._id)}
                      >
                        <DeclineIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View Profile">
                      <IconButton onClick={() => viewProfile(requester._id)}>
                        <PersonSearchIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {pagination.pages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={pagination.pages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </>
    );
  };

  const renderSentRequestsTab = () => {
    if (sentRequests.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          You haven&apos;t sent any friend requests.
        </Alert>
      );
    }

    // Debug sent requests data
    console.log('Sent requests data:', sentRequests);

    return (
      <>
        <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
          Sent Requests ({pagination.total})
        </Typography>

        <Grid container spacing={2}>
          {sentRequests.map((request) => {
            // Make sure recipient is a FriendUser object
            const recipient = typeof request.recipient === 'string'
              ? null
              : request.recipient as FriendUser;

            if (!recipient) {
              console.log('Invalid recipient for request:', request);
              return null; // Skip if data is malformed
            }

            // Debug individual recipient
            console.log('Request recipient:', recipient);
            console.log('Recipient profile image:', recipient.profileImage || recipient.profilePicture);

            return (
              <Grid size={{xs:12,sm:6}}key={request._id}>
                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    src={getProfileImage(recipient)}
                    alt={getUserName(recipient)}
                    sx={{ width: 50, height: 50, mr: 2 }}
                    onError={(e) => {
                      // If image fails to load, fallback to default avatar
                      console.error(`Failed to load avatar for ${recipient.username}, using default`);
                      (e.target as HTMLImageElement).src = '/images/default-avatar.png';
                    }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body1">
                      {getUserName(recipient)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{recipient.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Sent: {new Date(request.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Tooltip title="Cancel Request">
                      <IconButton
                        color="warning"
                        onClick={() => handleCancelRequest(recipient._id)}
                      >
                        <Close />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View Profile">
                      <IconButton onClick={() => viewProfile(recipient._id)}>
                        <PersonSearchIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {pagination.pages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={pagination.pages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </>
    );
  };

  const renderSuggestionsTab = () => {
    if (suggestions.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No friend suggestions available at the moment.
        </Alert>
      );
    }

    return (
      <>
        <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
          People You May Know
        </Typography>

        <Grid container spacing={3}>
          {suggestions.map((suggestion) => (
            <Grid size={{xs:12,sm:6,md:4}} key={suggestion._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    src={getProfileImage(suggestion)}
                    alt={getUserName(suggestion)}
                    sx={{ width: 60, height: 60, mr: 2 }}
                  />
                  <Box>
                    <Typography variant="h6" component="div">
                      {getUserName(suggestion)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{suggestion.username}
                    </Typography>
                  </Box>
                </Box>

                <CardContent sx={{ flexGrow: 1, pt: 0 }}>
                  <Typography variant="body2" color="text.secondary">
                    {suggestion.bio || 'No bio available'}
                  </Typography>
                </CardContent>

                <CardActions>
                  <Button
                    startIcon={<PersonAddIcon />}
                    variant="contained"
                    size="small"
                    onClick={() => handleSendFriendRequest(suggestion._id)}
                  >
                    Add Friend
                  </Button>
                  <Box sx={{ flexGrow: 1 }} />
                  <Button
                    size="small"
                    onClick={() => viewProfile(suggestion._id)}
                  >
                    View Profile
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={fetchSuggestions}
          >
            Refresh Suggestions
          </Button>
        </Box>
      </>
    );
  };

  const renderBlockedTab = () => {
    if (blockedUsers.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          You haven&apos;t blocked any users.
        </Alert>
      );
    }

    return (
      <>
        <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
          Blocked Users ({pagination.total})
        </Typography>

        <Grid container spacing={2}>
          {blockedUsers.map((block) => {
            // Make sure recipient is a FriendUser object
            const recipient = typeof block.recipient === 'string'
              ? null
              : block.recipient as FriendUser;

            if (!recipient) return null; // Skip if data is malformed

            return (
              <Grid size={{xs:12,sm:6}} key={block._id}>
                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    src={getProfileImage(recipient)}
                    alt={getUserName(recipient)}
                    sx={{ width: 50, height: 50, mr: 2 }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body1">
                      {getUserName(recipient)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{recipient.username}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    onClick={() => handleUnblockUser(recipient._id)}
                  >
                    Unblock
                  </Button>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {pagination.pages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={pagination.pages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </>
    );
  };

  // Main render
  if (authLoading) {
    return (
      <Container sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirect is handled in useEffect
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Friends
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <TextField
            placeholder="Search friends"
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mr: 1 }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            size="medium"
          >
            Search
          </Button>
        </Box>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Friends" value={FriendTab.FRIENDS} />
          <Tab label="Requests" value={FriendTab.REQUESTS} />
          <Tab label="Sent" value={FriendTab.SENT} />
          <Tab label="Suggestions" value={FriendTab.SUGGESTIONS} />
          <Tab label="Blocked" value={FriendTab.BLOCKED} />
        </Tabs>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {activeTab === FriendTab.FRIENDS && renderFriendsTab()}
            {activeTab === FriendTab.REQUESTS && renderRequestsTab()}
            {activeTab === FriendTab.SENT && renderSentRequestsTab()}
            {activeTab === FriendTab.SUGGESTIONS && renderSuggestionsTab()}
            {activeTab === FriendTab.BLOCKED && renderBlockedTab()}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default FriendsPage;