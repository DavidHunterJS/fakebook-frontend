import React from 'react';
import { Box, TextField, Avatar, Button } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../lib/axios';
import useAuth from '../../hooks/useAuth';

interface CommentFormProps {
  postId: string;
}

const validationSchema = Yup.object({
  text: Yup.string().required('Comment cannot be empty'),
});

const CommentForm: React.FC<CommentFormProps> = ({ postId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (commentData: { text: string }) => {
      const response = await axios.post(`/comments/${postId}`, commentData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      formik.resetForm();
    },
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

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mb: 3, mt: 1 }}>
      <Box sx={{ display: 'flex' }}>
        <Avatar
          src={user.profileImage}
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
    </Box>
  );
};

export default CommentForm;