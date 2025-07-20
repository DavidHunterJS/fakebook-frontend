import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, TextField, Button, Avatar, Paper, IconButton, 
  CircularProgress, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogContent, DialogTitle 
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import PublicIcon from '@mui/icons-material/Public';
import PeopleIcon from '@mui/icons-material/People';
import LockIcon from '@mui/icons-material/Lock';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../utils/api';
import useAuth from '../../hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getFullImageUrl } from '../../utils/imgUrl';
import { Post, PostVisibility } from '../../types/post';
import { useUpdatePost } from '../../hooks/usePosts';
import ImageGenerator from '../ImageGenerator'; // Adjust path as needed

const defaultAvatarFilename = 'default-avatar.png';

interface PostFormProps {
  formId?: string;
  postToEdit?: Post;
  initialMode?: 'text' | 'photo';
  onSubmitSuccess?: () => void;
  customSubmitButtonText?: string;
  dialogMode?: boolean;
}

const PostForm: React.FC<PostFormProps> = ({
  formId,
  postToEdit,
  initialMode = 'text',
  onSubmitSuccess,
  customSubmitButtonText,
  dialogMode = false,
}) => {
  const { user } = useAuth();
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const queryClient = useQueryClient();
  const isEditMode = !!postToEdit;

  const fileInputId = useMemo(() => `icon-button-file-${formId || Math.random().toString(36).substring(2, 9)}`, [formId]);

  const getValidationSchema = () => {
    return Yup.object({
      text: Yup.string().when('hasImage', {
        is: false,
        then: (schema) => schema.required('Post text is required when no image is added'),
        otherwise: (schema) => schema.optional(),
      }),
      hasImage: Yup.boolean(),
      visibility: Yup.string().oneOf(Object.values(PostVisibility)).required(),
    });
  };

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (initialMode === 'photo') {
        queryClient.invalidateQueries({ queryKey: ['userPhotos'] });
      }
      formik.resetForm();
      setImage(null);
      setPreviewUrl(null);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    },
    onError: (error: unknown) => {
      console.error("Error creating post:", error);
    }
  });

  const updateMutation = useUpdatePost();

  const formik = useFormik({
    initialValues: {
      text: postToEdit?.text || '',
      hasImage: !!postToEdit?.media?.[0]?.url,
      visibility: postToEdit?.visibility || PostVisibility.PUBLIC,
    },
    validationSchema: getValidationSchema(),
    onSubmit: (values) => {
      const formData = new FormData();
      formData.append('text', values.text);
      formData.append('visibility', values.visibility);

      if (isEditMode) {
        if (image) formData.append('files', image);
        formData.append('shouldRemoveImage', String(shouldRemoveImage));
        updateMutation.mutate({ postId: postToEdit._id, formData }, { onSuccess: () => { if (onSubmitSuccess) onSubmitSuccess(); }});
      } else {
        if (image) formData.append('files', image);
        if (initialMode === 'photo') formData.append('isPhotoPost', 'true');
        createMutation.mutate(formData);
      }
    }
  });

  useEffect(() => {
    if (isEditMode && postToEdit.media?.[0]?.url) {
      setPreviewUrl(getFullImageUrl(postToEdit.media[0].url, 'post'));
      setShouldRemoveImage(false);
    } else {
      setPreviewUrl(null);
    }
  }, [postToEdit, isEditMode]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      formik.setFieldValue('hasImage', true);
      setShouldRemoveImage(false);
    }
  };

  const handleAiImageSelected = (file: File) => {
    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    formik.setFieldValue('hasImage', true);
    setShouldRemoveImage(false);
    setIsGeneratorOpen(false);
  };
  
  const handleRemoveImage = () => {
    if (isEditMode && postToEdit?.media?.[0]?.url) {
      setShouldRemoveImage(true);
    }
    setImage(null);
    setPreviewUrl(null);
    formik.setFieldValue('hasImage', false);
    const fileInput = document.getElementById(fileInputId) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const avatarUrl = user ? getFullImageUrl(user.profilePicture, 'profile') : getFullImageUrl(defaultAvatarFilename, 'profile');
  const mutation = isEditMode ? updateMutation : createMutation;

  return (
    <>
      <Paper sx={{ p: 2, mb: dialogMode ? 0 : 3, boxShadow: dialogMode ? 'none' : undefined }}>
        <Box component="form" onSubmit={formik.handleSubmit}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            {!dialogMode && (
              <Avatar src={avatarUrl} alt={user?.username || 'User'} sx={{ width: 40, height: 40, mr: 2, mt: 1 }} />
            )}
            <TextField
              fullWidth
              id="text"
              name="text"
              placeholder={`What's on your mind, ${user?.firstName || 'User'}?`}
              multiline
              minRows={3}
              variant="outlined"
              value={formik.values.text}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.text && Boolean(formik.errors.text)}
              helperText={formik.touched.text && formik.errors.text}
              sx={{ bgcolor: 'action.hover', borderRadius: 1 }}
            />
          </Box>

          {previewUrl && (
            <Box sx={{ mb: 2, position: 'relative', width: '100%', pt: '56.25%' }}>
              <Box
                sx={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundImage: `url(${previewUrl})`,
                  backgroundSize: 'contain', backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat', borderRadius: 1, border: '1px solid',
                  borderColor: 'divider'
                }}
              />
              <IconButton
                size="small"
                onClick={handleRemoveImage}
                sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0, 0, 0, 0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)'} }}
                aria-label="Remove image"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Box>
              <input accept="image/*" style={{ display: 'none' }} id={fileInputId} type="file" onChange={handleImageChange} />
              <label htmlFor={fileInputId}>
                <IconButton color="primary" aria-label="upload picture" component="span">
                  <PhotoCameraIcon />
                </IconButton>
              </label>
              {/* ✅ ADDED: AI Generator Button */}
              <IconButton color="secondary" aria-label="generate with ai" onClick={() => setIsGeneratorOpen(true)}>
                <AutoAwesomeIcon />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="visibility-select-label" sx={{ display: 'none' }}>Visibility</InputLabel>
                <Select
                  labelId="visibility-select-label"
                  id="visibility"
                  name="visibility"
                  value={formik.values.visibility}
                  onChange={formik.handleChange}
                  renderValue={(selectedValue) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {selectedValue === PostVisibility.PUBLIC && <PublicIcon fontSize="small" />}
                      {selectedValue === PostVisibility.FRIENDS && <PeopleIcon fontSize="small" />}
                      {selectedValue === PostVisibility.PRIVATE && <LockIcon fontSize="small" />}
                      {selectedValue.charAt(0).toUpperCase() + selectedValue.slice(1)}
                    </Box>
                  )}
                >
                  <MenuItem value={PostVisibility.PUBLIC}><PublicIcon sx={{ mr: 1 }} /> Public</MenuItem>
                  <MenuItem value={PostVisibility.FRIENDS}><PeopleIcon sx={{ mr: 1 }} /> Friends</MenuItem>
                  <MenuItem value={PostVisibility.PRIVATE}><LockIcon sx={{ mr: 1 }} /> Private</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={mutation.isPending || !formik.isValid || (isEditMode && !formik.dirty)}
                startIcon={mutation.isPending ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {mutation.isPending 
                  ? 'Saving...' 
                  : isEditMode
                  ? 'Save Changes'
                  : customSubmitButtonText || 'Post'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
      
      {/* ✅ ADDED: AI Generator Dialog */}
<Dialog 
  open={isGeneratorOpen} 
  onClose={() => setIsGeneratorOpen(false)} 
  maxWidth="sm" 
  fullWidth
>
  <DialogTitle sx={{ 
    m: 0, 
    p: 2, 
    bgcolor: 'primary.main', 
    color: 'white' 
    }}>
      AI Image Generator
      <IconButton
        aria-label="close"
        onClick={() => setIsGeneratorOpen(false)}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    
    <DialogContent dividers>
      <ImageGenerator onImageSelect={handleAiImageSelected} />
    </DialogContent>
  </Dialog>

    </>
  );
};

export default PostForm;