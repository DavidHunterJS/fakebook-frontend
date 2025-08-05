// pages/settings/profile.tsx
import React, { useState, useEffect, ChangeEvent, FormEvent, FC } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Avatar,
  Grid,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { PhotoCamera, Save as SaveIcon } from '@mui/icons-material';
import useAuth from '../../hooks/useAuth'; // Adjust path as needed
import api from '../../utils/api'; // Your configured axios instance
import { getFullImageUrl } from '../../utils/imgUrl';

// Define a type for API errors
interface ApiError {
  response?: { data?: { message?: string; }; };
  message?: string;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  bio: string;
  location: string;
}

const EditProfilePage: FC = () => {
  const { user, token, updateUserInContext, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '', lastName: '', username: '', email: '', bio: '', location: '',
  });

  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false); // Single loading state for the main save button
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

 useEffect(() => {
  console.log('useEffect triggered, user:', user);
  if (user) {
    console.log('Setting form data...');
    console.log('user.coverPhoto:', user.coverPhoto);
    console.log('user.coverPhotoUrl:', user);
    
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      email: user.email || '',
      bio: user.bio || '',
      location: user.location || '',
    });
    
    setProfilePicturePreview(getFullImageUrl(user.profilePicture, 'profile'));
    
    const coverPhotoUrl = getFullImageUrl(user.coverPhoto, 'cover');
    console.log('Cover photo URL from getFullImageUrl:', coverPhotoUrl);
    setCoverPhotoPreview(coverPhotoUrl);
   }
  }, [user]); 

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    fileType: 'profilePicture' | 'coverPhoto'
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (fileType === 'profilePicture') {
          setProfilePictureFile(file);
          setProfilePicturePreview(reader.result as string);
        } else {
          setCoverPhotoFile(file);
          setCoverPhotoPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- UNIFIED SUBMIT FUNCTION ---
  // --- DEBUG VERSION OF handleSubmit ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // This object will accumulate all successful updates.
      let accumulatedUpdates = {};

      // Step 1: Upload Profile Picture if a new one is selected.
      if (profilePictureFile) {
        console.log('Uploading new profile picture...');
        const picFormData = new FormData();
        picFormData.append('profilePicture', profilePictureFile);
        const picRes = await api.post('/users/profile/picture', picFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        accumulatedUpdates = { ...accumulatedUpdates, ...picRes.data };
        setProfilePictureFile(null);
      }

      // Step 2: Upload Cover Photo if a new one is selected.
      if (coverPhotoFile) {
        const coverFormData = new FormData();
        coverFormData.append('coverPhoto', coverPhotoFile);
        const coverRes = await api.post('/users/profile/cover', coverFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        accumulatedUpdates = { ...accumulatedUpdates, ...coverRes.data };
        setCoverPhotoFile(null);
      }

      // Step 3: Update text details.
      console.log('Updating profile text details...');
      await api.put('/users/profile', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio || '',
        location: formData.location || '',
      });
      
      // Construct the final update manually
      const finalUpdates = {
        ...user, // Start with current user data
        ...accumulatedUpdates, // Apply any image updates
        // Apply form data updates
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio || '',
        location: formData.location || '',
      };


      // Step 4: Update the user context with the final, merged data.
      updateUserInContext(finalUpdates);
      setSuccessMessage('Profile updated successfully!');

    } catch (err: unknown) {
      const error = err as ApiError;
      console.error('Failed to update profile:', err);
      setError(error.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
          Edit Profile
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
        {successMessage && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* --- Profile Picture Section --- */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar
              src={profilePicturePreview || undefined}
              alt={user.username || 'User Avatar'}
              sx={{ width: 150, height: 150, margin: '0 auto 16px', border: '3px solid', borderColor: 'primary.main' }}
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<PhotoCamera />}
            >
              Change Profile Picture
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'profilePicture')}
              />
            </Button>
          </Box>
          <Divider sx={{ my: 2 }} />

          {/* --- Cover Photo Section --- */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h6" gutterBottom>Cover Photo</Typography>
            <Box
              sx={{
                width: '100%', height: 200, border: '2px dashed grey',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2,
                backgroundImage: `url(${coverPhotoPreview || ''})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                color: 'transparent', borderRadius: 1,
              }}
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<PhotoCamera />}
            >
              Change Cover Photo
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'coverPhoto')}
              />
            </Button>
          </Box>
          <Divider sx={{ my: 2 }} />

          {/* --- Profile Details Section --- */}
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Profile Details</Typography>
          <Grid container spacing={2}>
            <Grid size={{xs:12, sm:6}}>
              <TextField fullWidth label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
            </Grid>
            <Grid size={{xs:12, sm:6}}>
              <TextField fullWidth label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
            </Grid>
            <Grid size={{xs:12}}>
              <TextField fullWidth label="Username" name="username" value={formData.username} disabled />
            </Grid>
            <Grid size={{xs:12}}>
              <TextField fullWidth label="Email Address" name="email" value={formData.email} disabled />
            </Grid>
            <Grid size={{xs:12}}>
              <TextField fullWidth label="Bio" name="bio" multiline rows={4} value={formData.bio} onChange={handleChange} placeholder="Tell us about yourself..." />
            </Grid>
            <Grid size={{xs:12}}>
              <TextField fullWidth label="Location" name="location" value={formData.location} onChange={handleChange} />
            </Grid>
          </Grid>

          {/* --- SINGLE SAVE BUTTON --- */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          >
            Save All Changes
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default EditProfilePage;
