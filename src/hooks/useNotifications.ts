// src/hooks/useNotifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../lib/axios';
import useAuth from './useAuth';

// Hook to manage all notification data and actions
export const useNotifications = (options: { limit?: number } = {}) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { limit } = options;

  // 1. Fetching Notifications
  const { data, isLoading, error } = useQuery({
    // Add limit to the queryKey so different limits are cached separately
    queryKey: ['userNotifications', limit], 
    queryFn: async () => {
      // Build the URL with an optional limit parameter
      const url = limit ? `/notifications?limit=${limit}` : '/notifications';
      const response = await axios.get(url);
      return response.data;
    },
    enabled: isAuthenticated, // Only run if logged in
  });

  // 2. Mark as Read Mutation
  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => axios.put(`/notifications/${notificationId}/read`),
    onSuccess: () => {
      // Invalidate all queries related to notifications to refetch
      queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
    },
  });

  // 3. Mark All as Read Mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => axios.put('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
    },
  });

  // 4. Delete Notification Mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => axios.delete(`/notifications/${notificationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
    },
  });

  // Return everything a component might need
  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    error,
    markAsRead: markReadMutation.mutate,
    markAllAsRead: markAllReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    isMarkingAllRead: markAllReadMutation.isPending,
  };
};