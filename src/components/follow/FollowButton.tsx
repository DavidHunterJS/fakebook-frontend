import React, { useState, useEffect } from 'react';
import {
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  Box
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
} from '@mui/icons-material';
import api from '../../utils/api'; // Import your API utility
import { AxiosError } from 'axios';

interface FollowButtonProps {
  userId: string;
  initialFollowState?: boolean;
  onFollowChange?: (isFollowing: boolean, followersCount: number) => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'contained' | 'outlined' | 'text';
  showIcon?: boolean;
  fullWidth?: boolean;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  initialFollowState = false,
  onFollowChange,
  className = '',
  size = 'medium',
  variant = 'contained',
  showIcon = true,
  fullWidth = false
}) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  // Check initial follow status
  useEffect(() => {
    const checkFollowStatus = async () => {
      // ✅ --- FIX: Add a guard clause to prevent calls with an undefined userId ---
      if (!userId) {
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await api.get(`/follows/${userId}/status`);
        if (response.data.success) {
          setIsFollowing(response.data.data.isFollowing);
        }
      } catch (err) {
        // This error is expected if the user is not logged in or the API fails, so we can log it quietly.
        console.error('Could not verify follow status:', err);
      }
    };

    // This logic remains the same: only check status if the parent doesn't provide it.
    if (!initialFollowState) {
      checkFollowStatus();
    }
  }, [userId, initialFollowState]);

  const handleFollowToggle = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to follow users');
        setShowError(true);
        setIsLoading(false);
        return;
      }

      let response;
      if (isFollowing) {
        // Unfollow
        response = await api.delete(`/follows/${userId}`);
      } else {
        // Follow
        response = await api.post(`/follows/${userId}`);
      }

      if (response.data.success) {
        const newFollowingState = !isFollowing;
        setIsFollowing(newFollowingState);
        
        // Notify parent component of the change
        if (onFollowChange) {
          // The API response should ideally include the new followers count
          const newFollowersCount = response.data.followersCount || 0;
          onFollowChange(newFollowingState, newFollowersCount);
        }
      } else {
        setError(response.data.message || 'Failed to update follow status');
        setShowError(true);
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Network error. Please try again.';
      setError(errorMessage);
      setShowError(true);
      console.error('Follow toggle error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseError = () => {
    setShowError(false);
    setError(null);
  };

  const buttonText = isFollowing ? 'Following' : 'Follow';
  const buttonColor = isFollowing ? 'inherit' : 'primary';
  const buttonVariant = isFollowing ? 'outlined' : variant;

  const IconComponent = isFollowing ? PersonRemoveIcon : PersonAddIcon;

  return (
    <Box className={className}>
      <Tooltip title={isFollowing ? 'Click to unfollow' : 'Click to follow'}>
        <Button
          onClick={handleFollowToggle}
          disabled={isLoading}
          size={size}
          variant={buttonVariant}
          color={buttonColor}
          fullWidth={fullWidth}
          startIcon={
            isLoading ? (
              <CircularProgress size={16} />
            ) : showIcon ? (
              <IconComponent />
            ) : null
          }
          sx={{
            '&:hover': isFollowing ? {
              backgroundColor: 'error.light',
              color: 'error.contrastText',
              '& .MuiButton-startIcon': {
                color: 'error.contrastText'
              }
            } : undefined,
            transition: 'all 0.2s ease-in-out'
          }}
        >
          <Box 
            component="span" 
            sx={{ 
              position: 'relative',
              '&:hover .follow-text': isFollowing ? {
                opacity: 0
              } : undefined,
              '&:hover .unfollow-text': isFollowing ? {
                opacity: 1
              } : undefined
            }}
          >
            <Box 
              component="span" 
              className="follow-text"
              sx={{ 
                transition: 'opacity 0.2s ease-in-out',
                opacity: 1
              }}
            >
              {buttonText}
            </Box>
            {isFollowing && (
              <Box 
                component="span" 
                className="unfollow-text"
                sx={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  transition: 'opacity 0.2s ease-in-out',
                  opacity: 0
                }}
              >
                Unfollow
              </Box>
            )}
          </Box>
        </Button>
      </Tooltip>

      {/* Error Snackbar */}
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FollowButton;
