import api from '../utils/api';

interface PostUpdateData {
  text?: string;
  visibility?: 'public' | 'friends' | 'private';
}

/**
 * Updates a specific post by its ID.
 * @param postId The ID of the post to update.
 * @param postData An object containing the new text and/or visibility.
 * @returns The updated post object from the server.
 */
export const updatePost = async (postId: string, postData: PostUpdateData) => {
  try {
    const response = await api.put(`/posts/${postId}`, postData);
    return response.data;
  } catch (error) {
    // Log the error and re-throw it so the component can handle it
    console.error('Failed to update post:', error);
    throw error;
  }
};