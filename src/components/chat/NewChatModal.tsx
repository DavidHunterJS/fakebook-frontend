import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Button,
  Box,
  Chip,
  InputAdornment,
  IconButton,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Search,
  PersonAdd,
  Group,
  Close
} from '@mui/icons-material';
import { getProfileImageUrl } from '../../utils/imgUrl';
import axios, {AxiosInstance} from 'axios';

interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  isOnline?: boolean;
}
interface SearchedUser {
  _id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  profileImage?: string; // Including the alternative property
  isOnline?: boolean;
}
interface NewChatModalProps {
  open: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
  currentUser: User;
  axiosInstance: AxiosInstance;
}

const NewChatModal: React.FC<NewChatModalProps> = ({
  open,
  onClose,
  onConversationCreated,
  currentUser,
  axiosInstance
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  // Load user's friends when modal opens
  useEffect(() => {
    if (open) {
      loadFriends();
    }
  }, [open]);

  // Search users when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Helper function to get full image URL
  const getImageUrl = (profilePicture: string | undefined) => {
    return getProfileImageUrl(profilePicture);
  };

  const loadFriends = async () => {
    try {
      // First try to get populated friends
      const response = await axiosInstance.get('/auth/me');
      const userData = response.data.user || response.data;
      
      if (userData.friends && Array.isArray(userData.friends)) {
        // Check if friends are populated (objects) or just IDs (strings)
        if (userData.friends.length > 0 && typeof userData.friends[0] === 'string') {
          // Friends are just IDs, need to fetch the user objects
          const friendsResponse = await axiosInstance.post('/users/by-ids', {
            userIds: userData.friends
          });
          const friendsData = friendsResponse.data.users || friendsResponse.data;
          setFriends(friendsData);
          setSearchResults(friendsData);
        } else if (userData.friends.length > 0 && typeof userData.friends[0] === 'object') {
          // Friends are already populated
          setFriends(userData.friends);
          setSearchResults(userData.friends);
        } else {
          // Empty friends array
          setFriends([]);
          setSearchResults([]);
        }
      } else {
        setFriends([]);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      // Fallback: empty results, user can search instead
      setFriends([]);
      setSearchResults([]);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      // Search for users by name or username
      const response = await axiosInstance.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
      const users = response.data.users || response.data;
      
      // Filter out current user and ensure users have required fields
      const filteredUsers = users
        .filter((user: User) => user._id !== currentUser._id)
        .map((user: SearchedUser) => ({
          _id: user._id,
          username: user.username || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          profilePicture: user.profilePicture || user.profileImage,
          isOnline: user.isOnline || false
        }));
      
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Failed to search users');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleUserSelect = (user: User) => {
    if (selectedUsers.find(u => u._id === user._id)) {
      // User already selected, remove them
      setSelectedUsers(prev => prev.filter(u => u._id !== user._id));
    } else {
      // Add user to selection
      setSelectedUsers(prev => [...prev, user]);
      
      // If this is the first user and we're not in group mode, auto-enable group for multiple
      if (selectedUsers.length === 1 && !isGroup) {
        setIsGroup(true);
      }
    }
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    if (isGroup && !groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const participantIds = selectedUsers.map(user => user._id);
      
      const conversationData = {
        participantIds,
        type: isGroup ? 'group' : 'direct',
        ...(isGroup && { name: groupName.trim() }),
      };

      const response = await axiosInstance.post('/conversations', conversationData);
      
      if (response.data.conversation?._id) {
        const conversationId = response.data.conversation._id;
        onConversationCreated(conversationId);
        setTimeout(() => handleClose(), 300);
      } else {
        throw new Error('Invalid response from server');
      }
      
    } catch (error: unknown) { // Use unknown for type safety
      console.error('❌ Error creating conversation:', error);

      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        console.error('📊 Error response:', errorData);

        if (error.response?.status === 400) {
          // Safely check for properties on the data object
          if (errorData && typeof errorData.conversationId === 'string') {
            console.log('ℹ️ Conversation already exists, using existing ID:', errorData.conversationId);
            onConversationCreated(errorData.conversationId);
            setTimeout(() => handleClose(), 300);
            return;
          }
          if (errorData && typeof errorData.message === 'string') {
            setError(errorData.message);
            return;
          }
          setError('An invalid request was made.');
        } else if (error.response?.status === 500) {
          setError('A server error occurred. Please try again later.');
        } else {
          setError('An unknown error occurred.');
        }
      } else if (error instanceof Error) {
        // Handle non-Axios errors (e.g., network issues)
        setError(error.message);
      } else {
        // Handle truly unexpected errors
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
    setIsGroup(false);
    setGroupName('');
    setError('');
    onClose();
  };

  const displayUsers = searchQuery ? searchResults : friends;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">New Chat</Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Search Field */}
        <TextField
          fullWidth
          placeholder="Search for friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: searching ? (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ) : null
          }}
        />

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Selected ({selectedUsers.length}):
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {selectedUsers.map(user => (
                <Chip
                  key={user._id}
                  label={`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unknown'}
                  onDelete={() => handleUserSelect(user)}
                  avatar={
                    <Avatar sx={{ width: 24, height: 24 }}>
                      <img 
                        src={getImageUrl(user.profilePicture)} 
                        alt={user.firstName || 'User'}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover' 
                        }}
                        onError={(e) => {
                          // Fallback to initials
                          const img = e.currentTarget;
                          const parent = img.parentElement;
                          if (parent) {
                            img.style.display = 'none';
                            parent.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-weight: bold; font-size: 10px; color: white; background-color: #1976d2;">${(user.firstName?.charAt(0) || user.username?.charAt(0) || 'U').toUpperCase()}</div>`;
                          }
                        }}
                      />
                    </Avatar>
                  }
                  sx={{
                    '& .MuiChip-avatar': {
                      border: '1px solid',
                      borderColor: 'divider'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Group Options */}
        {selectedUsers.length > 1 && (
          <Box sx={{ mb: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Group />
              <Typography variant="subtitle2">Group Chat Settings</Typography>
            </Box>
            
            <TextField
              fullWidth
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => {
                setGroupName(e.target.value);
                setIsGroup(true);
              }}
              size="small"
            />
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* User List */}
        <Typography variant="subtitle2" gutterBottom>
          {searchQuery ? 'Search Results' : 'Your Friends'}
        </Typography>
        
        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
          {displayUsers.length === 0 ? (
            <Box textAlign="center" py={3}>
              <Typography variant="body2" color="text.secondary">
                {searchQuery 
                  ? searching 
                    ? 'Searching...' 
                    : 'No users found'
                  : 'Start typing to search for users'
                }
              </Typography>
            </Box>
          ) : (
            displayUsers.map((user, index) => {
              // Handle case where user might be a string ID instead of object
              if (typeof user === 'string') {
                return (
                  <ListItem key={user}>
                    <ListItemText 
                      primary="Loading..."
                      secondary={`User ID: ${user}`}
                    />
                  </ListItem>
                );
              }
              
              const isSelected = selectedUsers.find(u => u._id === user._id);
              
              // Add safety checks for user properties
              const firstName = user.firstName || '';
              const lastName = user.lastName || '';
              const username = user.username || 'unknown';
              
              return (
                <ListItem
                  key={user._id || index}
                  onClick={() => handleUserSelect(user)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'primary.light' : 'transparent',
                    '&:hover': {
                      backgroundColor: isSelected ? 'primary.light' : 'action.hover'
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ width: 40, height: 40 }}>
                      <img 
                        src={getImageUrl(user.profilePicture)} 
                        alt={`${firstName} ${lastName}`}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          borderRadius: '50%'
                        }}
                        onError={(e) => {
                          // Hide broken image and show initials instead
                          const img = e.currentTarget;
                          const parent = img.parentElement;
                          if (parent) {
                            img.style.display = 'none';
                            parent.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-weight: bold; font-size: 14px; color: white; background-color: #1976d2; border-radius: 50%;">${firstName.charAt(0)}${lastName.charAt(0)}</div>`;
                          }
                        }}
                      />
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2">
                          {`${firstName} ${lastName}`.trim() || username}
                        </Typography>
                        {user.isOnline && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: 'success.main'
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        @{username}
                        {user.isOnline && (
                          <Typography component="span" variant="caption" color="success.main" sx={{ ml: 1 }}>
                            • Online
                          </Typography>
                        )}
                      </Typography>
                    }
                  />
                  
                  {isSelected && (
                    <PersonAdd color="primary" />
                  )}
                </ListItem>
              );
            })
          )}
        </List>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleCreateConversation}
          variant="contained"
          disabled={selectedUsers.length === 0 || loading || (isGroup && !groupName.trim())}
          startIcon={loading ? <CircularProgress size={16} /> : <PersonAdd />}
        >
          {loading 
            ? 'Creating...' 
            : isGroup 
              ? 'Create Group' 
              : 'Start Chat'
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewChatModal;