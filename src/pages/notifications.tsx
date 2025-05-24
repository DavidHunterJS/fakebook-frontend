// pages/notifications/index.tsx

import React from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
  Button,
  Snackbar,
  Alert,
  IconButton
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/router';
import Link from 'next/link';

// --- NEW IMPORTS ---
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../lib/axios'; // Your Axios instance
import { INotification, NotificationType } from '../types/notification'; // Your notification types
import { getFullImageUrl } from '../utils/imgUrl'; // Your image utility
import useAuth from '../hooks/useAuth'; // To get the current user for sender avatars
import {
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

import { alpha, useTheme } from '@mui/material/styles';
// --- END NEW IMPORTS ---


const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<'success' | 'error'>('success');

  // --- FETCH NOTIFICATIONS ---
  const { data, isLoading, error } = useQuery({
    queryKey: ['userNotifications'],
    queryFn: async () => {
      if (!isAuthenticated) return { notifications: [], unreadCount: 0, pagination: {} };
      try {
        const response = await axios.get('/notifications');
        return response.data; // Expected: { notifications: INotification[], unreadCount: number, pagination: {} }
      } catch (error) {
        console.error('Failed to fetch unread notification count:', error);
        return { notifications: [], unreadCount: 0, pagination: {} }; // Return empty data on error
      }
    },
    enabled: isAuthenticated, // Only fetch if authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
    refetchOnMount: 'always', // Always refetch when navigating to this page
  });

  const notificationList: INotification[] = data?.notifications || [];
  const unreadCount: number = data?.unreadCount || 0;

  // --- NEW: MARK AS READ MUTATION ---
  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await axios.put(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userNotifications'] }); // Invalidate notifications list
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] }); // Invalidate header count
      setSnackbarMessage('Notification marked as read!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    },
    onError: (err) => {
      console.error('Failed to mark notification as read:', err);
      setSnackbarMessage('Failed to mark notification as read.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    },
  });

  // --- NEW: MARK ALL AS READ MUTATION ---
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await axios.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
      setSnackbarMessage('All notifications marked as read!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    },
    onError: (err) => {
      console.error('Failed to mark all notifications as read:', err);
      setSnackbarMessage('Failed to mark all notifications as read.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    },
  });

  // --- NEW: DELETE NOTIFICATION MUTATION ---
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await axios.delete(`/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
      setSnackbarMessage('Notification deleted!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    },
    onError: (err) => {
      console.error('Failed to delete notification:', err);
      setSnackbarMessage('Failed to delete notification.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    },
  });


  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary" align="center">
            Please log in to view your notifications.
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, borderRadius: 2, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h6" color="error" align="center">
            Error loading notifications: {(error as Error).message}
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Helper function to get notification icon based on type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.FRIEND_REQUEST: return <PeopleIcon color="primary" />;
      case NotificationType.FRIEND_ACCEPT: return <PeopleIcon color="success" />;
      case NotificationType.POST_LIKE: return <CheckCircleIcon sx={{ color: 'red' }} />;
      case NotificationType.POST_COMMENT: return <NotificationsIcon color="info" />;
      case NotificationType.COMMENT_LIKE: return <CheckCircleIcon sx={{ color: 'red' }} />;
      case NotificationType.COMMENT_REPLY: return <NotificationsIcon color="info" />;
      case NotificationType.MENTION: return <PersonIcon color="secondary" />;
      case NotificationType.SYSTEM: return <NotificationsIcon color="warning" />;
      default: return <NotificationsIcon />;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Notifications ({unreadCount} unread)
          </Typography>
          <Button
            variant="outlined"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending || unreadCount === 0}
          >
            Mark All as Read
          </Button>
        </Box>

        {notificationList.length === 0 ? (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 4 }}>
            You have no notifications yet.
          </Typography>
        ) : (
          <List>
            {notificationList.map((notification) => (
              <React.Fragment key={notification._id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    px: 0,
                    py: 1.5,
                    bgcolor: notification.read ? 'background.paper' : alpha(theme.palette.primary.light, 0.05),
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                      bgcolor: notification.read ? alpha(theme.palette.action.hover, 0.05) : alpha(theme.palette.primary.light, 0.1),
                    },
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                      // Navigate to link first
                      if (notification.link) {
                          router.push(notification.link);
                      }
                      // Then mark as read (optimistically or after navigation)
                      if (!notification.read) {
                          markReadMutation.mutate(notification._id);
                      }
                  }}
                >
                  {/* Sender Avatar */}
                  <Avatar
                    // --- FIX: Check if notification.sender is an object before accessing properties ---
                    alt={typeof notification.sender === 'object' && notification.sender !== null ? notification.sender.username : 'System'}
                    src={typeof notification.sender === 'object' && notification.sender !== null && notification.sender.profilePicture
                         ? getFullImageUrl(notification.sender.profilePicture, 'profile')
                         : '/images/default-avatar.png'
                    }
                    sx={{ mt: 0.5, mr: 2, width: 40, height: 40 }}
                  >
                    {/* Fallback to icon if no sender avatar (i.e., sender is a string ID or null) */}
                    {(typeof notification.sender !== 'object' || notification.sender === null) && getNotificationIcon(notification.type)}
                  </Avatar>

                  <ListItemText
                    primary={
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}
                      >
                        {/* --- FIX: Check if notification.sender is an object and not null --- */}
                        {typeof notification.sender === 'object' && notification.sender !== null && (
                            <Link href={`/profile/${notification.sender._id}`} passHref legacyBehavior>
                                <Typography component="span" variant="body2" fontWeight="bold" sx={{ mr: 0.5, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                                    {notification.sender.username}
                                </Typography>
                            </Link>
                        )}
                        {notification.content}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        sx={{ display: 'block' }}
                        component="span"
                        variant="caption"
                        color="text.secondary"
                      >
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </Typography>
                    }
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                    {!notification.read && (
                      <IconButton
                        edge="end"
                        aria-label="mark as read"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent ListItem onClick
                          markReadMutation.mutate(notification._id);
                        }}
                        size="small"
                        sx={{ mr: 0.5 }}
                      >
                        <CheckCircleIcon color="primary" fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent ListItem onClick
                        deleteNotificationMutation.mutate(notification._id);
                      }}
                      size="small"
                    >
                      <DeleteIcon color="action" fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItem>
                <Divider component="li" variant="inset" sx={{ ml: '72px' }} />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NotificationsPage;