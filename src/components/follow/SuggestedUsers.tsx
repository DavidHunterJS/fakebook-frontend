import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  IconButton,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  useTheme,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import FollowButton from './FollowButton';
import api from '../../utils/api';
import { getFullImageUrl } from '../../utils/imgUrl'; // Import the utility function
import { AxiosError } from 'axios';

interface SuggestedUser {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
  followersCount: number;
  followingCount: number;
}

interface SuggestedUsersProps {
  limit?: number;
  className?: string;
  showTitle?: boolean;
  layout?: 'vertical' | 'horizontal';
}

const SuggestedUsers: React.FC<SuggestedUsersProps> = ({
  limit = 5,
  className = '',
  showTitle = true,
  layout = 'vertical'
}) => {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchSuggestedUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to see suggestions');
        return;
      }

      const response = await api.get(`/follows/suggestions?limit=${limit}`);

      if (response.data.success) {
        setUsers(response.data.data.suggestedUsers);
      } else {
        setError(response.data.message || 'Failed to fetch suggestions');
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Network error. Please try again.';
      setError(errorMessage);
      console.error('Error fetching suggested users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestedUsers();
  }, [limit]);

  const handleFollowChange = (userId: string, isNowFollowing: boolean) => {
    if (isNowFollowing) {
      // Remove user from suggestions after following
      setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
    }
  };

  const formatFollowerCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (error && !loading) {
    return (
      <Paper className={className} sx={{ p: 3, borderRadius: 2 }}>
        <Alert 
          severity="error" 
          action={
            <IconButton
              aria-label="retry"
              color="inherit"
              size="small"
              onClick={fetchSuggestedUsers}
            >
              <RefreshIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {error}
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper className={className} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      {showTitle && (
        <Box sx={{ p: 3, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <PersonAddIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Suggested for you
              </Typography>
            </Box>
            <Tooltip title="Refresh suggestions">
              <IconButton
                onClick={fetchSuggestedUsers}
                disabled={loading}
                size="small"
                sx={{
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'rotate(180deg)'
                  }
                }}
              >
                <RefreshIcon className={loading ? 'animate-spin' : ''} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}

      <Box sx={{ p: 3 }}>
        {loading && users.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Finding suggestions...
            </Typography>
          </Box>
        ) : users.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" textAlign="center">
              No suggestions available
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
              Try following more users to get better suggestions
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {users.map((user) => (
              <Grid 
                size={{xs:12,sm:layout === 'horizontal' ? 6 : 12, md:layout === 'horizontal' ? 4 : 12}}
                key={user._id}
              >
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardContent
                    sx={{
                      display: 'flex',
                      flexDirection: layout === 'horizontal' ? 'column' : 'row',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      '&:last-child': { pb: 2 }
                    }}
                  >
                    <Avatar
                      src={getFullImageUrl(user.profilePicture, 'profile')}
                      alt={`${user.firstName} ${user.lastName}`}
                      sx={{
                        width: layout === 'horizontal' ? 60 : 48,
                        height: layout === 'horizontal' ? 60 : 48,
                        border: '2px solid',
                        borderColor: 'divider'
                      }}
                    />
                    
                    <Box
                      sx={{
                        flex: 1,
                        textAlign: layout === 'horizontal' ? 'center' : 'left',
                        minWidth: 0
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold" noWrap>
                        {user.firstName} {user.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        @{user.username}
                      </Typography>
                      <Chip
                        label={`${formatFollowerCount(user.followersCount)} followers`}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 0.5, fontSize: '0.75rem' }}
                      />
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        width: layout === 'horizontal' ? '100%' : 'auto',
                        minWidth: layout === 'horizontal' ? 0 : 100
                      }}
                    >
                      <FollowButton
                        userId={user._id}
                        onFollowChange={(isFollowing) => handleFollowChange(user._id, isFollowing)}
                        size="small"
                        variant="contained"
                        showIcon={false}
                        fullWidth={layout === 'horizontal'}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Show more link if there might be more suggestions */}
        {users.length >= limit && (
          <Box display="flex" justifyContent="center" mt={3}>
            <Typography
              variant="body2"
              color="primary"
              sx={{
                cursor: 'pointer',
                textDecoration: 'underline',
                '&:hover': {
                  textDecoration: 'none'
                }
              }}
              onClick={fetchSuggestedUsers}
            >
              Show more suggestions
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default SuggestedUsers;