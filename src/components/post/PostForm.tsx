import React, { useState } from 'react';
import { Box, TextField, Button, Avatar, Paper, IconButton, CircularProgress } from '@mui/material'; // Added CircularProgress
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../utils/api'; // Assuming this is your configured axios instance
import useAuth from '../../hooks/useAuth'; // Adjust path if needed
import { useMutation, useQueryClient } from '@tanstack/react-query'; // Assuming v4+
import {getFullImageUrl}  from '../../utils/imgUrl'; // Adjust the path as needed


const validationSchema = Yup.object({
  // Allow empty text if an image is present
  text: Yup.string().when('hasImage', {
      is: false, // Only require text if hasImage is false
      then: (schema) => schema.required('Post content is required when no image is added'),
      otherwise: (schema) => schema.optional(), // Text is optional if image exists
  }),
  // Add a hidden field to help Yup
  hasImage: Yup.boolean(),
});


const PostForm = () => {
  const { user } = useAuth();
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Use your configured api instance
      const response = await api.post('/posts', data, {
         // Let browser set Content-Type for FormData
         headers: { 'Content-Type': undefined }
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate queries related to posts to refetch
      queryClient.invalidateQueries({ queryKey: ['posts'] }); // Adjust queryKey if needed
      formik.resetForm();
      setImage(null);
      setPreviewUrl(null);
      console.log('Post created successfully!');
    },
    onError: (error: unknown) => {
        console.error("Error creating post:", error);
        // Optionally set an error state to display to the user
        // setError(error.response?.data?.message || error.message || "Failed to create post.");
    }
  });

  const formik = useFormik({
    initialValues: {
      text: '',
      hasImage: false, // Initialize hidden field
    },
    validationSchema,
    onSubmit: (values) => {
      console.log("Submitting post...");
      const formData = new FormData();
      formData.append('text', values.text);
      if (image) {
        formData.append('media', image); // Key 'image' must match backend Multer field name
      }
      mutation.mutate(formData);
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      formik.setFieldValue('hasImage', true); // Update hidden field
    } else {
      setImage(null);
      setPreviewUrl(null);
      formik.setFieldValue('hasImage', false); // Update hidden field
    }
  };

  // Get the correct avatar URL
  const avatarUrl = user ? getFullImageUrl(user.profilePicture, 'profile') : getFullImageUrl();

  return (
    <Paper sx={{ p: 2, mb: 3 }}> {/* Wrap form in Paper for better visual separation */}
      <Box component="form" onSubmit={formik.handleSubmit}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}> {/* Align items start */}
        <Avatar
          key={`avatar-${user?._id || 'guest'}-${Date.now()}`}
          src={avatarUrl}
          alt={user?.username || 'User'}
          sx={{ width: 40, height: 40, mr: 2, mt: 1 }}
        />
          <TextField
            fullWidth
            id="text"
            name="text"
            placeholder={`What's on your mind, ${user?.firstName || user?.username || 'User'}?`} // Use firstName or username
            multiline
            minRows={3} // Slightly larger default size
            variant="outlined" // Use outlined variant
            value={formik.values.text}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur} // Add onBlur for better touched state handling
            error={formik.touched.text && Boolean(formik.errors.text)}
            helperText={formik.touched.text && formik.errors.text}
            sx={{ bgcolor: 'action.hover', borderRadius: 1 }} // Subtle background
          />
        </Box>

        {previewUrl && (
          <Box sx={{ mb: 2, position: 'relative', width: '100%', pt: '56.25%' /* 16:9 Aspect Ratio */ }}>
             {/* Using Box with background image for preview can be simpler than next/image fill */}
             <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url(${previewUrl})`,
                    backgroundSize: 'contain', // Use contain to see whole image
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                }}
             />
             {/* Optional: Add a button to remove the preview */}
             {/* <IconButton
                size="small"
                onClick={() => {
                    setImage(null);
                    setPreviewUrl(null);
                    formik.setFieldValue('hasImage', false);
                    // Reset the file input visually if possible (difficult across browsers)
                    const fileInput = document.getElementById('icon-button-file') as HTMLInputElement;
                    if (fileInput) fileInput.value = '';
                }}
                sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0, 0, 0, 0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)'} }}
                aria-label="Remove image"
             >
                <DeleteIcon fontSize="small" />
             </IconButton> */}
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> {/* Align items center */}
          <Box>
            <input
              accept="image/*" // Standard HTML accept attribute
              style={{ display: 'none' }}
              id="icon-button-file"
              type="file"
              onChange={handleImageChange}
            />
            <label htmlFor="icon-button-file">
              <IconButton color="primary" aria-label="upload picture" component="span">
                <PhotoCameraIcon />
              </IconButton>
            </label>
          </Box>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            // --- CORRECTION HERE ---
            disabled={mutation.isPending || (!formik.values.text && !image)} // Use isPending
            // --- END CORRECTION ---
            startIcon={mutation.isPending ? <CircularProgress size={20} color="inherit" /> : null} // Show spinner inside button
          >
            {mutation.isPending ? 'Posting...' : 'Post'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default PostForm;

