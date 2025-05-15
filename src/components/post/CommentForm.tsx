import React from 'react';
import { Box, TextField, Avatar, Button } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../lib/axios'; // Keep your original import
import { AxiosError } from 'axios'; // Import only the type from axios
import useAuth from '../../hooks/useAuth';
import { getFullImageUrl } from '../../utils/imgUrl';

interface CommentFormProps {
  postId: string;
}

// Define error response type
interface ErrorResponse {
  message: string;
  [key: string]: unknown;
}

const validationSchema = Yup.object({
  text: Yup.string().required('Comment cannot be empty'),
});

const CommentForm: React.FC<CommentFormProps> = ({ postId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (commentData: { text: string }) => {
      // FIXED: Changed endpoint and added postId to the request body
      console.log(`[CommentForm] Submitting comment for post ${postId}:`, commentData);
      
      const response = await axios.post('/comments', {
        postId: postId,  // Include postId in the request body
        text: commentData.text
      });
      
      console.log(`[CommentForm] Comment submission response:`, response.data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      formik.resetForm();
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.error(`[CommentForm] Error posting comment:`, error);
      if (error.response) {
        console.error(`[CommentForm] Server responded with:`, {
          status: error.response.status,
          data: error.response.data
        });
      }
    }
  });

  const formik = useFormik({
    initialValues: {
      text: '',
    },
    validationSchema,
    onSubmit: (values) => {
      mutation.mutate({ text: values.text });
    },
  });

  if (!user) return null;

  // Get proper profile image URL using your utility function
  const profileImageUrl = user.profilePicture ? 
    getFullImageUrl(user.profilePicture, 'profile') : 
    user.profileImage || '/images/default-avatar.png';

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mb: 3, mt: 1 }}>
      <Box sx={{ display: 'flex' }}>
        <Avatar
          src={profileImageUrl}
          alt={user.username}
          sx={{ width: 36, height: 36, mr: 1.5 }}
        />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <TextField
            id="text"
            name="text"
            placeholder="Write a comment..."
            multiline
            minRows={1}
            maxRows={4}
            fullWidth
            size="small"
            value={formik.values.text}
            onChange={formik.handleChange}
            error={formik.touched.text && Boolean(formik.errors.text)}
            helperText={formik.touched.text && formik.errors.text}
            sx={{ mb: 1 }}
            InputProps={{
              sx: {
                borderRadius: 3,
                bgcolor: (theme) => theme.palette.grey[100],
              },
            }}
          />
          {formik.values.text && (
            <Box sx={{ alignSelf: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                size="small"
                disabled={mutation.isPending}
                sx={{ borderRadius: 2 }}
              >
                {mutation.isPending ? 'Posting...' : 'Post'}
              </Button>
            </Box>
          )}
        </Box>
      </Box>
      {mutation.error && (
        <Box sx={{ color: 'error.main', mt: 1, fontSize: '0.875rem' }}>
          Failed to post comment. Please try again.
        </Box>
      )}
    </Box>
  );
};

export default CommentForm;