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

// Define a type for API errors
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

// Define image types as a union type
type ImageType = 'profile' | 'cover' | 'post';

// Define a mapping of image types to their folder paths
const TYPE_TO_FOLDER_MAP: Record<ImageType, string> = {
  profile: 'profile',
  cover: 'covers', // IMPORTANT: Using 'covers' (plural)
  post: 'posts'
};

// Define a mapping of image types to their default image paths
const DEFAULT_IMAGE_MAP: Record<ImageType, string> = {
  profile: '/images/default-avatar.png',
  cover: '/images/default-cover.png',
  post: '/images/default-post-placeholder.png'
};

// Define default names that should be mapped to default images
const DEFAULT_FILENAMES = new Set(['default-avatar.png', 'default-cover.png']);

// Backend static URL from environment
const BACKEND_STATIC_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:5000';

/**
 * Generates a full URL for an image based on its type and filename
 * 
 * @param filenameOrUrl - The filename or URL of the image
 * @param type - The type of image (profile, cover, or post)
 * @returns The full URL of the image
 */
export const getFullImageUrl = (filenameOrUrl?: string, type: ImageType = 'profile'): string => {
  // If no filename is provided, return the default image for the specified type
  if (!filenameOrUrl) {
    return DEFAULT_IMAGE_MAP[type];
  }

  // Trim any whitespace from the input
  const trimmedInput = filenameOrUrl.trim();
  
  // If the input is already a URL, return it directly
  if (trimmedInput.startsWith('http://') || trimmedInput.startsWith('https://')) {
    return trimmedInput;
  }
  
  // If the input is a default filename, return the corresponding default image
  if (DEFAULT_FILENAMES.has(trimmedInput)) {
    return DEFAULT_IMAGE_MAP[type === 'profile' ? 'profile' : 'cover'];
  }

  // Get the correct folder path for the image type
  const folderPath = TYPE_TO_FOLDER_MAP[type];
  
  // Log for debugging
  if (type === 'cover') {
    console.log(`Using "${folderPath}" (plural) for folder path of cover image`);
  }
  
  // Construct the full URL with a cache-busting timestamp
  const cacheBuster = `t=${Date.now()}`;
  const fullUrl = `${BACKEND_STATIC_URL}/uploads/${folderPath}/${trimmedInput}?${cacheBuster}`;
  
  // Log details for debugging
  console.log(`[getFullImageUrl profile settings] Type: "${type}", FolderPath: "${folderPath}", Final URL: "${fullUrl}"`);
  
  return fullUrl;
};

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

  const handleSubmitDetails = async (e: FormEvent) => {
    e.preventDefault();
    setLoadingDetails(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await api.put('/users/profile', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      updateUserInContext(res.data);
      setSuccessMessage('Profile details updated successfully!');
    } catch (err: unknown) {
      // Cast err to ApiError type before accessing its properties
      const error = err as ApiError;
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
          'Content-Type': undefined,
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