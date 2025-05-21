// src/context/NotificationContext.tsx
import React, { createContext, useReducer, useEffect, useContext, ReactNode } from 'react';
import api from '../utils/api';
import AuthContext from './AuthContext';
import {SocketContext} from './SocketContext';

// Types
export interface Notification {
  _id: string;
  recipient: string;
  sender?: {
    _id: string;
    username: string;
    profilePicture: string;
  };
  type: string;
  content: string;
  link: string;
  relatedId?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

type NotificationAction =
  | { type: 'FETCH_NOTIFICATIONS_REQUEST' }
  | { type: 'FETCH_NOTIFICATIONS_SUCCESS'; payload: { notifications: Notification[]; unreadCount: number } }
  | { type: 'FETCH_NOTIFICATIONS_FAILURE'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_READ' }
  | { type: 'UPDATE_UNREAD_COUNT'; payload: number };

interface NotificationContextType extends NotificationState {
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null
};

const NotificationContext = createContext<NotificationContextType>({
  ...initialState,
  fetchNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  refreshUnreadCount: async () => {}
});

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'FETCH_NOTIFICATIONS_REQUEST':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'FETCH_NOTIFICATIONS_SUCCESS':
      return {
        ...state,
        loading: false,
        notifications: action.payload.notifications,
        unreadCount: action.payload.unreadCount,
        error: null,
      };
    case 'FETCH_NOTIFICATIONS_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification._id === action.payload ? { ...notification, read: true } : notification
        ),
        unreadCount: state.unreadCount > 0 ? state.unreadCount - 1 : 0,
      };
    case 'MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({ ...notification, read: true })),
        unreadCount: 0,
      };
    case 'UPDATE_UNREAD_COUNT':
      return {
        ...state,
        unreadCount: action.payload,
      };
    default:
      return state;
  }
};

export const NotificationProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { isAuthenticated, user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  // Socket event listeners for real-time notifications
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    // Listen for new notifications
    const handleNewNotification = (notification: Notification) => {
      console.log('Real-time notification received:', notification);
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    };

    socket.on('notification', handleNewNotification);

    // Clean up on unmount
    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [socket, isAuthenticated]);

  // Fetch notifications once when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
    }
  }, [isAuthenticated, user?._id]);

  // Fetch notifications 
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    
    dispatch({ type: 'FETCH_NOTIFICATIONS_REQUEST' });
    
    try {
      const res = await api.get('/notifications', {
        params: { limit: 10 }  // Just fetch the most recent 10
      });
      
      dispatch({
        type: 'FETCH_NOTIFICATIONS_SUCCESS',
        payload: {
          notifications: res.data.notifications || [],
          unreadCount: res.data.unreadCount || 0
        }
      });
    } catch (err) {
      console.error('Error fetching notifications:', err);
      dispatch({ 
        type: 'FETCH_NOTIFICATIONS_FAILURE', 
        payload: err instanceof Error ? err.message : 'Failed to fetch notifications' 
      });
    }
  };

  // Mark a single notification as read
  const markAsRead = async (notificationId: string) => {
    if (!isAuthenticated) return;
    
    try {
      await api.put(`/notifications/${notificationId}/read`);
      dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!isAuthenticated) return;
    
    try {
      await api.put('/notifications/read-all');
      dispatch({ type: 'MARK_ALL_READ' });
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Refresh only the unread count
  const refreshUnreadCount = async () => {
    if (!isAuthenticated) return;
    
    try {
      const res = await api.get('/notifications/unread-count');
      if (res.data && typeof res.data.count === 'number') {
        dispatch({ type: 'UPDATE_UNREAD_COUNT', payload: res.data.count });
      }
    } catch (err) {
      console.error('Error refreshing unread count:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        ...state,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        refreshUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;