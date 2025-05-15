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
  response?: {
    data?: {
      message?: string;
    };
  };
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

  console.log('[EditProfilePage] User from useAuth():', user, 'AuthLoading:', authLoading);

  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '', lastName: '', username: '', email: '', bio: '', location: '',
  });

  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null);

  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingProfilePic, setLoadingProfilePic] = useState(false);
  const [loadingCoverPhoto, setLoadingCoverPhoto] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    console.log('[EditProfilePage] useEffect triggered. User from context:', user);
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
      });

      const currentProfilePicValue = user.profilePicture;
      const generatedProfilePicUrl = getFullImageUrl(currentProfilePicValue, 'profile');
      console.log(`[EditProfilePage] useEffect - User Profile Pic Value (from context): "${currentProfilePicValue}", Generated URL for preview: "${generatedProfilePicUrl}"`);
      setProfilePicturePreview(generatedProfilePicUrl);

      const currentCoverPhotoValue = user.coverPhoto;
      const generatedCoverPhotoUrl = getFullImageUrl(currentCoverPhotoValue, 'cover'); // Type is 'cover'
      console.log(`[EditProfilePage] useEffect - User Cover Photo Value (from context): "${currentCoverPhotoValue}", Generated URL for preview: "${generatedCoverPhotoUrl}"`);
      setCoverPhotoPreview(generatedCoverPhotoUrl);
    } else {
        console.log('[EditProfilePage] useEffect - User is null, resetting previews to default.');
        setProfilePicturePreview(getFullImageUrl(undefined, 'profile'));
        setCoverPhotoPreview(getFullImageUrl(undefined, 'cover'));
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
      console.log(`[EditProfilePage] handleFileChange - ${fileType} selected:`, file);
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
    } else {
      console.log(`[EditProfilePage] handleFileChange - ${fileType} cleared.`);
      if (fileType === 'profilePicture') {
        setProfilePictureFile(null);
        setProfilePicturePreview(getFullImageUrl(user?.profilePicture, 'profile'));
      } else {
        setCoverPhotoFile(null);
        setCoverPhotoPreview(getFullImageUrl(user?.coverPhoto, 'cover'));
      }
    }
  };

  // FIXED: Handle submit details function with improved bio handling
  const handleSubmitDetails = async (e: FormEvent) => {
    e.preventDefault();
    setLoadingDetails(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Log what we're sending for debugging
      console.log('[EditProfilePage] handleSubmitDetails - Sending data:', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio,
        location: formData.location
      });
      
      // Only send the fields that should be updated
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio || '',  // Ensure bio is a string, even if empty
        location: formData.location || ''  // Ensure location is a string, even if empty
      };
      
      // Make the API call
      const res = await api.put('/users/profile', updateData, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
      });
      
      // Log what we got back
      console.log('[EditProfilePage] handleSubmitDetails - Response:', res.data);
      
      // Update the user in context
      updateUserInContext(res.data);
      setSuccessMessage('Profile details updated successfully!');
    } catch (err: unknown) {
      // Enhanced error logging
      const error = err as ApiError;
      console.error('[EditProfilePage] handleSubmitDetails - Error:', err);
      
      // Log more details if available
      if ((err as any).response) {
        console.error('[EditProfilePage] handleSubmitDetails - Response data:', (err as any).response.data);
        console.error('[EditProfilePage] handleSubmitDetails - Status:', (err as any).response.status);
      }
      
      setError(error.response?.data?.message || error.message || 'Failed to update profile details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUploadImage = async (
    type: 'profilePicture' | 'coverPhoto',
    file: File | null,
    setLoadingState: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    console.log(`[EditProfilePage] handleUploadImage - Attempting to upload for type "${type}". File object:`, file);

    if (!file) {
      setError(`No ${type === 'profilePicture' ? 'profile picture' : 'cover photo'} selected. Please choose a file first.`);
      console.error(`[EditProfilePage] handleUploadImage - Frontend check failed: File object is null for type "${type}".`);
      return;
    }

    setLoadingState(true);
    setError(null);
    setSuccessMessage(null);

    const uploadFormData = new FormData();
    uploadFormData.append(type, file, file.name);

    console.log(`[EditProfilePage] handleUploadImage - FormData to be sent for type "${type}":`);
    for (const [key, value] of uploadFormData.entries()) {
      console.log(`  FormData Entry - ${key}:`, value);
    }

    const endpoint = type === 'profilePicture' ? '/users/profile/picture' : '/users/profile/cover';

    try {
      const res = await api.post(endpoint, uploadFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
          // No need to set Content-Type for FormData - browser will set it with boundary
          // 'Content-Type': 'multipart/form-data', 
        },
      });

      console.log(`[EditProfilePage] handleUploadImage - Response for ${type}:`, res.data);

      if (type === 'profilePicture') {
        if (res.data.profilePicture) {
            updateUserInContext({ profilePicture: res.data.profilePicture });
        }
        setProfilePicturePreview(res.data.profilePictureUrl || getFullImageUrl(res.data.profilePicture, 'profile'));
        setProfilePictureFile(null);
      } else if (type === 'coverPhoto') {
        if (res.data.coverPhoto) {
            updateUserInContext({ coverPhoto: res.data.coverPhoto });
        }
        setCoverPhotoPreview(res.data.coverPhotoUrl || getFullImageUrl(res.data.coverPhoto, 'cover')); // Type is 'cover'
        setCoverPhotoFile(null);
      }
      setSuccessMessage(`${type === 'profilePicture' ? 'Profile picture' : 'Cover photo'} updated successfully!`);
    } catch (err: unknown) {
      const error = err as ApiError;
      console.error(`[EditProfilePage] handleUploadImage - Error during API call for type "${type}":`, err);
      setError(error.response?.data?.message || error.message || `Failed to upload ${type}.`);
    } finally {
      setLoadingState(false);
    }
  };

  if (authLoading || !user) {
    console.log('[EditProfilePage] Auth loading or user not available, showing spinner.');
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  const finalAvatarSrc = profilePicturePreview || getFullImageUrl(user.profilePicture, 'profile');
  const finalCoverSrc = coverPhotoPreview || getFullImageUrl(user.coverPhoto, 'cover'); // Type is 'cover'
  console.log(`[EditProfilePage] Rendering. Final Avatar Src: "${finalAvatarSrc}", User Profile Pic from context: "${user.profilePicture}"`);
  console.log(`[EditProfilePage] Rendering. Final Cover Src: "${finalCoverSrc}", User Cover Photo from context: "${user.coverPhoto}"`);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
          Edit Profile
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar
            src={finalAvatarSrc}
            alt={user.username || 'User Avatar'}
            sx={{ width: 150, height: 150, margin: '0 auto 16px', border: '3px solid', borderColor: 'primary.main' }}
          />
          
          {/* Custom file upload for profile picture - improved to hide redundant elements */}
          <input
            type="file"
            id="profile-picture-upload"
            accept="image/*"
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'profilePicture')}
            style={{ display: 'none' }} // Completely hide the input
          />
          
          <Button
            variant="outlined"
            component="label"
            startIcon={<PhotoCamera />}
            disabled={loadingProfilePic}
            onClick={() => document.getElementById('profile-picture-upload')?.click()}
          >
            Change Profile Picture
          </Button>
          
          {profilePictureFile && (
            <Button
              variant="contained"
              onClick={() => handleUploadImage('profilePicture', profilePictureFile, setLoadingProfilePic)}
              disabled={loadingProfilePic || !profilePictureFile}
              sx={{ ml: 2 }}
              startIcon={loadingProfilePic ? <CircularProgress size={20} color="inherit"/> : <SaveIcon />}
            >
              Upload Picture
            </Button>
          )}
        </Box>
        <Divider sx={{my: 2}} />

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h6" gutterBottom>Cover Photo</Typography>
          <Box
            sx={{
              width: '100%',
              height: 200,
              border: '2px dashed grey',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              backgroundImage: `url(${finalCoverSrc})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: (coverPhotoPreview || (user.coverPhoto && user.coverPhoto !== 'default-cover.png')) ? 'transparent' : 'text.secondary',
              borderRadius: 1,
            }}
          >
            {!(coverPhotoPreview || (user.coverPhoto && user.coverPhoto !== 'default-cover.png')) && "No Cover Photo / Preview"}
          </Box>
          
          {/* Custom file upload for cover photo - improved to hide redundant elements */}
          <input
            type="file"
            id="cover-photo-upload"
            accept="image/*"
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'coverPhoto')}
            style={{ display: 'none' }} // Completely hide the input
          />
          
          <Button
            variant="outlined"
            component="label"
            startIcon={<PhotoCamera />}
            disabled={loadingCoverPhoto}
            onClick={() => document.getElementById('cover-photo-upload')?.click()}
          >
            Change Cover Photo
          </Button>
          
          {coverPhotoFile && (
            <Button
              variant="contained"
              onClick={() => handleUploadImage('coverPhoto', coverPhotoFile, setLoadingCoverPhoto)}
              disabled={loadingCoverPhoto || !coverPhotoFile}
              sx={{ ml: 2 }}
              startIcon={loadingCoverPhoto ? <CircularProgress size={20} color="inherit"/> : <SaveIcon />}
            >
              Upload Cover
            </Button>
          )}
        </Box>
        <Divider sx={{my: 2}} />

        <Typography variant="h6" gutterBottom sx={{mt: 3}}>Profile Details</Typography>
        <Box component="form" onSubmit={handleSubmitDetails} noValidate sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            {/* Keep using size prop as in your original code */}
            <Grid size={{xs:12, sm:6}}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="firstName"
                label="First Name"
                name="firstName"
                autoComplete="given-name"
                value={formData.firstName}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{xs:12, sm:6}} >
              <TextField
                margin="normal"
                required
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                autoComplete="family-name"
                value={formData.lastName}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{xs:12}} >
              <TextField
                margin="normal"
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                disabled
              />
            </Grid>
            <Grid size={{xs:12}} >
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={formData.email}
                disabled
              />
            </Grid>
            <Grid size={{xs:12}} >
              <TextField
                margin="normal"
                fullWidth
                id="bio"
                label="Bio"
                name="bio"
                multiline
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                inputProps={{ maxLength: 500 }} // Add max length
              />
            </Grid>
            <Grid size={{xs:12}} >
              <TextField
                margin="normal"
                fullWidth
                id="location"
                label="Location"
                name="location"
                autoComplete="address-level2"
                value={formData.location}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loadingDetails}
            startIcon={loadingDetails ? <CircularProgress size={20} color="inherit"/> : <SaveIcon />}
          >
            Save Profile Details
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default EditProfilePage;