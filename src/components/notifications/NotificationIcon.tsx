// src/components/notifications/NotificationIcon.tsx
import React, { useState } from 'react';
import { IconButton, Badge } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationDropdown from './NotificationDropdown';
import { INotification } from '../../types/notification';

const NotificationIcon = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  
  // Use the hook to get data for the dropdown (e.g., limit to 10)
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead,
    deleteNotification
  } = useNotifications({ limit: 10 });
  
  const unreadNotifications = notifications.filter((n: INotification )=> !n.read);
  
  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const isOpen = Boolean(anchorEl);

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <NotificationDropdown
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        notifications={unreadNotifications}
        isLoading={isLoading}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDeleteNotification={deleteNotification}
      />
    </>
  );
};

export default NotificationIcon;