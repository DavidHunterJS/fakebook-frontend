// src/hooks/usePosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { Post } from '../types/post';

export const useGetPosts = () => {
  return useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: async () => {
      const response = await api.get('/posts');
      
      const rawData: unknown = response.data;
      
      if (Array.isArray(rawData)) {
        return rawData as Post[];
      }
      
      if (typeof rawData === 'object' && rawData !== null) {
        if (
          'posts' in (rawData as Record<string, unknown>) && 
          Array.isArray((rawData as Record<string, unknown>).posts)
        ) {
          return (rawData as Record<string, unknown[]>).posts as Post[];
        }
        
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

export const useGetUserPosts = (userId: string | undefined) => {
  return useQuery<Post[]>({
    queryKey: ['posts', 'user', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const response = await api.get(`/posts/user/${userId}`);
      
      const rawData: unknown = response.data;
      
      if (Array.isArray(rawData)) {
        return rawData as Post[];
      }
      
      if (typeof rawData === 'object' && rawData !== null) {
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

export const useLikePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.post(`/posts/${postId}/like`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// ✅ START: CORRECTED UPDATE POST HOOK
// This interface now correctly expects the pre-built FormData.
interface UpdatePostPayload {
  postId: string;
  formData: FormData;
}

// This function now correctly sends the FormData with the right headers.
const updatePost = async ({ postId, formData }: UpdatePostPayload) => {
  const { data } = await api.put(`/posts/${postId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

// The hook itself uses the corrected function.
export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePost,
    onSuccess: () => {
      // Invalidate all post-related queries to refetch the latest data
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error) => {
      console.error("Error updating post:", error);
    }
  });
};
// ✅ END: CORRECTED UPDATE POST HOOK

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.delete(`/posts/${postId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};
