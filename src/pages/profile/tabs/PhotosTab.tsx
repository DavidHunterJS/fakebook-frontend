import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Paper, Box, Typography, Button, CircularProgress, Alert,
  ImageList, ImageListItem, ImageListItemBar, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, useTheme, useMediaQuery
} from '@mui/material';
import {
  Image as ImageIcon, Favorite as LikeIcon,
  Comment as CommentIcon, Close as CloseIcon
} from '@mui/icons-material';

// --- Assumed correct paths from your original file ---
import api from '../../../utils/api';
// ✅ --- RESTORED: Importing your original, working function ---
import { getFullImageUrl } from '../../../utils/imgUrl'; 
import PostForm from '../../../components/post/PostForm';
import { Post, MediaItem } from '../../../types/post';
import { User } from '../../../types/user';

// --- Type definitions needed for this component ---
interface Profile extends User {
    _id: string;
    firstName: string;
    profilePicture?: string;
    coverPhoto?: string;
    updatedAt?: string;
    createdAt?: string;
}

interface Photo {
  _id: string;
  url: string;
  filename: string;
  caption?: string;
  createdAt: string;
  postId?: string;
  albumId?: string;
  likes?: number;
  comments?: number;
}

interface AlbumPhoto {
  _id?: string;
  filename: string;
  caption?: string;
  createdAt?: string;
  likes?: Array<string> | number;
  comments?: Array<string> | number;
}

interface ApiError {
  response?: { data?: { message?: string; }; };
  message?: string;
}

// --- Component Props ---
interface PhotosTabProps {
  profile: Profile;
  isOwnProfile: boolean;
  userPostsData: Post[]; // Receive posts data from the parent
  onDebugMessage: (message: string) => void;
}

const PhotosTab: React.FC<PhotosTabProps> = ({ profile, isOwnProfile, userPostsData, onDebugMessage }) => {
  const router = useRouter();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // State is now local to the PhotosTab component
  const [photosData, setPhotosData] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [photosInitialized, setPhotosInitialized] = useState(false);
  const [photoUploadOpen, setPhotoUploadOpen] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Fetch photos function, adapted to use props
  const fetchPhotos = useCallback(async () => {
    if (!profile) return;
    onDebugMessage('[PhotosTab] Initializing photos fetch.');
    setLoadingPhotos(true);
    setPhotosError(null);

    try {
      let postsForMedia: Post[] = [];
      if (userPostsData && userPostsData.length > 0) {
        postsForMedia = userPostsData;
        onDebugMessage(`[PhotosTab] Using ${userPostsData.length} posts from parent for media extraction.`);
      } else {
        onDebugMessage(`[PhotosTab] Parent post data is empty, fetching posts for user ${profile._id}.`);
        const postsResponse = await api.get(`/posts/user/${profile._id}`);
        postsForMedia = postsResponse.data?.posts || postsResponse.data || [];
        onDebugMessage(`[PhotosTab] Manually fetched ${postsForMedia.length} posts.`);
      }

      const photosFromPosts: Photo[] = postsForMedia.flatMap(post =>
        (post.media || []).map((mediaItem: MediaItem) => ({
          _id: `${post._id}-${mediaItem.key || mediaItem.url}`,
          url: getFullImageUrl(mediaItem.key || mediaItem.url, 'post'),
          filename: mediaItem.originalFilename || mediaItem.key || mediaItem.url,
          caption: post.text?.substring(0, 100) || '',
          createdAt: post.createdAt || new Date().toISOString(),
          postId: post._id,
          likes: Object.values(post.reactionsSummary?.counts || {}).reduce((sum, count) => sum + count, 0),
          comments: post.comments?.length || 0,
        }))
      );

      let photosFromAlbums: Photo[] = [];
      try {
        const albumsResponse = await api.get(`/users/${profile._id}/albums`);
        if (albumsResponse?.data?.albums) {
          photosFromAlbums = albumsResponse.data.albums.flatMap((album: any) =>
            (album.photos || []).map((photo: AlbumPhoto) => ({
              _id: photo._id || `album-${album._id}-${photo.filename}`,
              url: getFullImageUrl(photo.filename, 'post'),
              filename: photo.filename,
              caption: photo.caption || album.title || '',
              createdAt: (photo.createdAt || album.createdAt || new Date().toISOString()) as string,
              albumId: album._id,
              likes: typeof photo.likes === 'number' ? photo.likes : (photo.likes?.length || 0),
              comments: typeof photo.comments === 'number' ? photo.comments : (photo.comments?.length || 0),
            }))
          );
          onDebugMessage(`[PhotosTab] Extracted ${photosFromAlbums.length} photos from albums.`);
        }
      } catch (e) {
        onDebugMessage(`[PhotosTab] Could not fetch albums (this might be expected).`);
      }

      const profilePhotos: Photo[] = [];
      // ✅ --- RESTORED: Using the exact same logic as the original file ---
      if (profile.profilePicture && profile.profilePicture !== 'default-avatar.png') {
        profilePhotos.push({
          _id: `profile-${profile._id}`, url: getFullImageUrl(profile.profilePicture, 'profile'),
          filename: profile.profilePicture, caption: 'Profile Picture', createdAt: (profile.updatedAt || profile.createdAt || new Date().toISOString())
        });
      }
      if (profile.coverPhoto && profile.coverPhoto !== 'default-cover.png') {
        profilePhotos.push({
          _id: `cover-${profile._id}`, url: getFullImageUrl(profile.coverPhoto, 'cover'),
          filename: profile.coverPhoto, caption: 'Cover Photo', createdAt: (profile.updatedAt || profile.createdAt || new Date().toISOString())
        });
      }
      
      const allPhotos = [...profilePhotos, ...photosFromPosts, ...photosFromAlbums];
      allPhotos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setPhotosData(allPhotos);
      onDebugMessage(`[PhotosTab] Found a total of ${allPhotos.length} photos.`);

    } catch (error) {
      const err = error as ApiError;
      const errMsg = err.response?.data?.message || err.message || 'Failed to load photos.';
      console.error('Error fetching photos:', err);
      setPhotosError(errMsg);
      onDebugMessage(`[PhotosTab] Error fetching photos: ${errMsg}`);
    } finally {
      setLoadingPhotos(false);
      setPhotosInitialized(true);
    }
  }, [profile, userPostsData, onDebugMessage]);

  useEffect(() => {
    if (!photosInitialized) {
      fetchPhotos();
    }
  }, [photosInitialized, fetchPhotos]);

  const getGridCols = useCallback(() => (isSmallScreen ? 2 : isMediumScreen ? 3 : 4), [isSmallScreen, isMediumScreen]);
  const handlePhotoClick = useCallback((photo: Photo) => {
    if (photo.postId) router.push(`/posts/${photo.postId}`);
    else if (photo.albumId) router.push(`/album/${photo.albumId}`);
    else window.open(photo.url, '_blank');
  }, [router]);
  
  const handleOpenPhotoUpload = useCallback(() => setPhotoUploadOpen(true), []);
  const handleClosePhotoUpload = useCallback(() => {
    setPhotoUploadOpen(false);
    if (uploadSuccess) {
      setPhotosInitialized(false);
      setUploadSuccess(false);
    }
  }, [uploadSuccess]);

  const handleUploadSuccess = useCallback(() => {
    setUploadSuccess(true);
    onDebugMessage('[PhotosTab] Photo upload successful, will refresh.');
    setTimeout(() => handleClosePhotoUpload(), 1500);
  }, [handleClosePhotoUpload, onDebugMessage]);

  return (
    <>
      <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Photos</Typography>
          {isOwnProfile && (
            <Button variant="outlined" startIcon={<ImageIcon />} onClick={handleOpenPhotoUpload}>
              Upload Photos
            </Button>
          )}
        </Box>

        {photosError && <Alert severity="error" sx={{ mb: 3 }}>{photosError}</Alert>}

        {loadingPhotos ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : photosData.length > 0 ? (
          <ImageList variant="masonry" cols={getGridCols()} gap={8}>
            {photosData.map((photo) => (
              <ImageListItem key={photo._id} onClick={() => handlePhotoClick(photo)} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.9 } }}>
                <img
                  src={photo.url} alt={photo.caption || 'Photo'} loading="lazy"
                  style={{ borderRadius: 8, display: 'block', width: '100%', height: 'auto' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/EEE/31343C?text=Photo+Error'; }}
                />
                <ImageListItemBar
                  title={photo.caption}
                  subtitle={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}><LikeIcon fontSize="small" sx={{ mr: 0.5 }} />{photo.likes || 0}</Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}><CommentIcon fontSize="small" sx={{ mr: 0.5 }} />{photo.comments || 0}</Box>
                    </Box>
                  }
                  sx={{ borderBottomLeftRadius: 8, borderBottomRightRadius: 8, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)' }}
                />
              </ImageListItem>
            ))}
          </ImageList>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, textAlign: 'center', bgcolor: 'background.default', borderRadius: 1 }}>
            <ImageIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {isOwnProfile ? 'You have no photos yet' : `${profile.firstName} has no photos to display`}
            </Typography>
            {isOwnProfile && (
              <Button variant="contained" startIcon={<ImageIcon />} sx={{ mt: 2 }} onClick={handleOpenPhotoUpload}>
                Upload Your First Photo
              </Button>
            )}
          </Box>
        )}
      </Paper>

      <Dialog open={photoUploadOpen} onClose={handleClosePhotoUpload} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Upload Photos
          <IconButton edge="end" color="inherit" onClick={handleClosePhotoUpload} aria-label="close"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {uploadSuccess && <Alert severity="success" sx={{ mb: 2 }}>Upload successful! Refreshing photos...</Alert>}
          <PostForm
            initialMode="photo" disableTextOnly={true}
            onSubmitSuccess={handleUploadSuccess}
            customSubmitButtonText="Upload Photo" dialogMode={true}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePhotoUpload} color="primary">{uploadSuccess ? 'Done' : 'Cancel'}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PhotosTab;
