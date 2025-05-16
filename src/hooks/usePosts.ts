// src/hooks/usePosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { Post } from '../types/post';

export const useGetPosts = () => {
  return useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: async () => {
      const response = await api.get('/posts');
      
      // Extract posts from whatever format the API returns
      const rawData: unknown = response.data;
      
      if (Array.isArray(rawData)) {
        return rawData as Post[];
      }
      
      if (typeof rawData === 'object' && rawData !== null) {
        // Check for rawData.posts
        if (
          'posts' in (rawData as Record<string, unknown>) && 
          Array.isArray((rawData as Record<string, unknown>).posts)
        ) {
          return (rawData as Record<string, unknown[]>).posts as Post[];
        }
        
        // Check for rawData.data.posts
        if ('data' in (rawData as Record<string, unknown>)) {
          const nestedData = (rawData as Record<string, unknown>).data;
          
          if (
            typeof nestedData === 'object' && 
            nestedData !== null && 
            'posts' in (nestedData as Record<string, unknown>) && 
            Array.isArray((nestedData as Record<string, unknown>).posts)
          ) {
            return (nestedData as Record<string, unknown[]>).posts as Post[];
          }
        }
      }
      
      return [] as Post[];
    }
  });
};

// Add the useLikePost hook
export const useLikePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.post(`/posts/${postId}/like`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch posts data
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// Add the useDeletePost hook
export const useDeletePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.delete(`/posts/${postId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch posts data
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};
// Add this to your usePosts.ts file
export const useGetUserPosts = (userId: string | undefined) => {
  return useQuery<Post[]>({
    queryKey: ['posts', 'user', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const response = await api.get(`/posts/user/${userId}`);
      
      // Extract posts from whatever format the API returns
      const rawData: unknown = response.data;
      
      if (Array.isArray(rawData)) {
        return rawData as Post[];
      }
      
      if (typeof rawData === 'object' && rawData !== null) {
        // Check for rawData.posts
        if (
          'posts' in (rawData as Record<string, unknown>) && 
          Array.isArray((rawData as Record<string, unknown>).posts)
        ) {
          return (rawData as Record<string, unknown[]>).posts as Post[];
        }
      }
      
      return [] as Post[];
    },
    enabled: !!userId
  });
};