// src/components/notifications/NotificationDropdown.tsx

import React from 'react';
import {
  Popover, Box, Typography, List, ListItem, ListItemText, Avatar,
  Divider, Button, CircularProgress, ListItemButton, IconButton,
} from '@mui/material';
// --- NEW: Import the icons for the buttons ---
import {
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { formatDistanceToNow } from 'date-fns';
import { INotification, NotificationType } from '../../types/notification';
import { getFullImageUrl } from '../../utils/imgUrl';   

interface NotificationDropdownProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  notifications: INotification[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  open, anchorEl, onClose, notifications, isLoading, onMarkAsRead, onMarkAllAsRead, onDeleteNotification // --- FIX: Add onDeleteNotification to props ---
}) => {
  const router = useRouter();

  const handleItemClick = (notification: INotification) => {
    let targetLink = notification.link;
    if (notification.type === NotificationType.FRIEND_REQUEST) {
      targetLink = '/friends?tab=requests';
    }
    
    if (targetLink) {
      router.push(targetLink);
    }

    if (!notification.read) {
      onMarkAsRead(notification._id);
    }
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      PaperProps={{ sx: { width: 380, mt: 1.5, borderRadius: 2, bgcolor: 'background.paper' } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>Notifications</Typography>
        <Button size="small" onClick={onMarkAllAsRead}>Mark all as read</Button>
      </Box>
      <Divider />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : notifications.length === 0 ? (
        <Typography sx={{ p: 3, color: 'text.secondary' }}>No new notifications.</Typography>
      ) : (
        <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
          {notifications.map((n) => (
            <ListItem
              key={n._id}
              disablePadding
              sx={{ bgcolor: n.read ? 'transparent' : 'action.hover' }}
              // --- NEW: Add secondaryAction to hold the buttons ---
              secondaryAction={
                <Box>
                  {/* Show "Mark as Read" button only if the notification is unread */}
                  {!n.read && (
                    <IconButton
                      edge="end"
                      size="small"
                      aria-label="mark as read"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevents the main item's click event
                        onMarkAsRead(n._id);
                      }}
                    >
                      <CheckCircleIcon fontSize="small" color="primary" />
                    </IconButton>
                  )}
                  {/* The Delete button */}
                  <IconButton
                    edge="end"
                    size="small"
                    aria-label="delete"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevents the main item's click event
                      onDeleteNotification(n._id);
                    }}
                  >
                    <DeleteIcon fontSize="small" color="action" />
                  </IconButton>
                </Box>
              }
            >
              <ListItemButton 
                onClick={() => handleItemClick(n)} 
                // --- NEW: Add padding to make space for the buttons ---
                sx={{ pr: 12 }} 
              >
                <Avatar
                  src={n.sender && typeof n.sender === 'object' ? getFullImageUrl(n.sender.profilePicture, 'profile') : ''}
                  sx={{ mt: 0.5, mr: 2 }}
                />
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: n.read ? 400 : 600 }}>
                      {n.sender && typeof n.sender === 'object' && (
                        <Box component="span" sx={{ fontWeight: 600 }}>
                          {n.sender.username}
                        </Box>
                      )}
                      {' '}{n.content}
                    </Typography>
                  }
                  secondary={formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}

      <Divider />
      <Box sx={{ p: 1, textAlign: 'center' }}>
        <Link href="/notifications" passHref>
          <Button fullWidth onClick={onClose}>View All Notifications</Button>
        </Link>
      </Box>
    </Popover>
  );
};

export default NotificationDropdown;