import React, { useState } from 'react';
import { Box, TextField, Button, Avatar, Paper, IconButton, CircularProgress, Typography } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete'; // Added for removing images
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../utils/api';
import useAuth from '../../hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getFullImageUrl } from '../../utils/imgUrl';

// Add props interface
interface PostFormProps {
  initialMode?: 'text' | 'photo';
  disableTextOnly?: boolean;
  onSubmitSuccess?: () => void;
  customSubmitButtonText?: string;
  dialogMode?: boolean;
}

const PostForm: React.FC<PostFormProps> = ({
  initialMode = 'text',
  disableTextOnly = false,
  onSubmitSuccess,
  customSubmitButtonText,
  dialogMode = false,
}) => {
  const { user } = useAuth();
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Create a validation schema based on props
  const getValidationSchema = () => {
    if (disableTextOnly) {
      // For photo mode, require an image but text is optional
      return Yup.object({
        text: Yup.string(),
        hasImage: Yup.boolean().isTrue('Please select an image to upload'),
      });
    } else {
      // Default schema
      return Yup.object({
        text: Yup.string().when('hasImage', {
          is: false,
          then: (schema) => schema.required('Post content is required when no image is added'),
          otherwise: (schema) => schema.optional(),
        }),
        hasImage: Yup.boolean(),
      });
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.post('/posts', data, {
        headers: { 'Content-Type': undefined }
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate queries related to posts to refetch
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      
      // Additional queries to invalidate if in photo mode
      if (initialMode === 'photo') {
        queryClient.invalidateQueries({ queryKey: ['userPhotos'] });
      }
      
      formik.resetForm();
      setImage(null);
      setPreviewUrl(null);
      console.log('Post created successfully!');
      
      // Call the success callback if provided
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    },
    onError: (error: unknown) => {
      console.error("Error creating post:", error);
      // You could add error handling here
    }
  });

  const formik = useFormik({
    initialValues: {
      text: '',
      hasImage: initialMode === 'photo', // Initialize to true if in photo mode
    },
    validationSchema: getValidationSchema(),
    onSubmit: (values) => {
      console.log("Submitting post...");
      const formData = new FormData();
      formData.append('text', values.text);
      
      if (image) {
        formData.append('media', image);
      }
      
      // Add a flag for photo-only posts if needed by your API
      if (initialMode === 'photo') {
        formData.append('isPhotoPost', 'true');
      }
      
      mutation.mutate(formData);
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      formik.setFieldValue('hasImage', true);
    } else {
      setImage(null);
      setPreviewUrl(null);
      formik.setFieldValue('hasImage', false);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreviewUrl(null);
    formik.setFieldValue('hasImage', false);
    // Reset the file input
    const fileInput = document.getElementById('icon-button-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // Get the correct avatar URL
  const avatarUrl = user ? getFullImageUrl(user.profilePicture, 'profile') : getFullImageUrl();

  // Check if submit should be disabled
  const isSubmitDisabled = () => {
    if (mutation.isPending) return true;
    
    if (disableTextOnly) {
      // In photo mode, require an image
      return !image;
    } else {
      // In normal mode, require either text or image
      return !formik.values.text && !image;
    }
  };

  return (
    <Paper 
      sx={{ 
        p: 2, 
        mb: dialogMode ? 0 : 3,
        boxShadow: dialogMode ? 'none' : undefined
      }}
    >
      {initialMode === 'photo' && !dialogMode && (
        <Typography variant="h6" gutterBottom>
          Upload Photos
        </Typography>
      )}
      
      <Box component="form" onSubmit={formik.handleSubmit}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          {!dialogMode && (
            <Avatar
              key={`avatar-${user?._id || 'guest'}-${Date.now()}`}
              src={avatarUrl}
              alt={user?.username || 'User'}
              sx={{ width: 40, height: 40, mr: 2, mt: 1 }}
            />
          )}
          
          <TextField
            fullWidth
            id="text"
            name="text"
            placeholder={initialMode === 'photo' 
              ? 'Add a caption to your photo...' 
              : `What's on your mind, ${user?.firstName || user?.username || 'User'}?`}
            multiline
            minRows={initialMode === 'photo' ? 2 : 3}
            variant="outlined"
            value={formik.values.text}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.text && Boolean(formik.errors.text)}
            helperText={formik.touched.text && formik.errors.text}
            sx={{ bgcolor: 'action.hover', borderRadius: 1 }}
          />
        </Box>

        {/* Image preview section */}
        {previewUrl ? (
          <Box sx={{ mb: 2, position: 'relative', width: '100%', pt: '56.25%' }}>
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(${previewUrl})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            />
            <IconButton
              size="small"
              onClick={handleRemoveImage}
              sx={{ 
                position: 'absolute', 
                top: 8, 
                right: 8, 
                bgcolor: 'rgba(0, 0, 0, 0.5)', 
                color: 'white', 
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)'} 
              }}
              aria-label="Remove image"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          // Show a placeholder or upload prompt in photo mode
          initialMode === 'photo' && (
            <Box 
              sx={{ 
                mb: 2, 
                p: 4, 
                border: '2px dashed', 
                borderColor: 'divider',
                borderRadius: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main' }
              }}
              onClick={() => document.getElementById('icon-button-file')?.click()}
            >
              <PhotoCameraIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Click to select a photo to upload
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Supported formats: JPG, PNG, GIF
              </Typography>
              
              {/* Show validation error for photo if needed */}
              {formik.touched.hasImage && formik.errors.hasImage && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                  {formik.errors.hasImage}
                </Typography>
              )}
            </Box>
          )
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="icon-button-file"
              type="file"
              onChange={handleImageChange}
            />
            <label htmlFor="icon-button-file">
              <IconButton 
                color="primary" 
                aria-label="upload picture" 
                component="span"
                sx={{ 
                  bgcolor: initialMode === 'photo' ? 'action.selected' : undefined,
                  '&:hover': { bgcolor: initialMode === 'photo' ? 'action.hover' : undefined }
                }}
              >
                <PhotoCameraIcon />
              </IconButton>
            </label>
          </Box>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={isSubmitDisabled()}
            startIcon={mutation.isPending ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {mutation.isPending 
              ? 'Uploading...' 
              : customSubmitButtonText || (initialMode === 'photo' ? 'Upload Photo' : 'Post')}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default PostForm;