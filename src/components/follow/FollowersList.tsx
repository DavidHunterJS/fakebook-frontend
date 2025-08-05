import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  Divider,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import FollowButton from './FollowButton';
import api from '../../utils/api'; // Import your API utility
import { AxiosError } from 'axios';

interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
  followersCount: number;
  followingCount: number;
}

interface FollowersListProps {
  userId: string;
  type: 'followers' | 'following';
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
}

const FollowersList: React.FC<FollowersListProps> = ({
  userId,
  type,
  isOpen,
  onClose,
  currentUserId
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });

  const title = type === 'followers' ? 'Followers' : 'Following';

  // Fetch users
  const fetchUsers = async (page = 1, search = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (search) {
        params.append('search', search);
      }

      const response = await api.get(`/follows/${userId}/${type}?${params.toString()}`);

      if (response.data.success) {
        if (page === 1) {
          setUsers(response.data.data[type]);
        } else {
          setUsers(prev => [...prev, ...response.data.data[type]]);
        }
        setPagination(response.data.data.pagination);
      } else {
        setError(response.data.message || 'Failed to load users');
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Network error occurred';
      console.error(`Error fetching ${type}:`, err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setUsers([]);
      setSearchTerm('');
      setError(null);
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  const handleFollowChange = (targetUserId: string, newState: boolean) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user._id === targetUserId
          ? { ...user, followersCount: user.followersCount + (newState ? 1 : -1) }
          : user
      )
    );
  };

  const loadMore = () => {
    if (pagination.hasNext && !loading) {
      fetchUsers(pagination.currentPage + 1);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh', maxHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <PeopleIcon />
            <Typography variant="h6">
              {title} ({pagination.totalCount})
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Search Field */}
        <TextField
          fullWidth
          placeholder={`Search ${type}...`}
          value={searchTerm}
          onChange={handleSearchChange}
          margin="dense"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Users List */}
        {loading && users.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading {type}...
            </Typography>
          </Box>
        ) : filteredUsers.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {searchTerm 
                ? `No ${type} match your search`
                : `No ${type} yet`
              }
            </Typography>
          </Box>
        ) : (
          <List sx={{ width: '100%' }}>
            {filteredUsers.map((user, index) => (
              <React.Fragment key={user._id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar 
                      src={user.profilePicture || '/default-avatar.png'}
                      alt={`${user.firstName} ${user.lastName}`}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight="medium">
                        {user.firstName} {user.lastName}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          @{user.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.followersCount} followers • {user.followingCount} following
                        </Typography>
                      </Box>
                    }
                  />
                  {currentUserId && user._id !== currentUserId && (
                    <ListItemSecondaryAction>
                      <FollowButton
                        userId={user._id}
                        onFollowChange={(newState) => handleFollowChange(user._id, newState)}
                        size="small"
                        variant="outlined"
                        showIcon={false}
                      />
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
                {index < filteredUsers.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Load More Button */}
        {pagination.hasNext && (
          <Box display="flex" justifyContent="center" mt={2}>
            <Button
              onClick={loadMore}
              disabled={loading}
              variant="text"
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              {loading ? 'Loading...' : 'Load More'}
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FollowersList;