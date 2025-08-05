import React from 'react';
import { Box, Typography, Link, SxProps, Theme } from '@mui/material';

// Define the props interface for the component
interface ProfileStatsProps {
  followersCount: number;
  followingCount: number;
  // Add the new click handler props to the interface
  onFollowersClick: () => void;
  onFollowingClick: () => void;
  // These props are no longer needed here if the logic is handled in the parent
  // userId: string; 
  // currentUserId?: string;
  // onStatsUpdate: (newStats: { followersCount: number; followingCount: number }) => void;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({
  followersCount,
  followingCount,
  onFollowersClick,
  onFollowingClick,
}) => {
  // Common styles for the clickable links
  const linkStyles: SxProps<Theme> = {
    color: 'text.primary',
    textDecoration: 'none',
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, mt: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
      <Box onClick={onFollowersClick} sx={linkStyles}>
        <Typography component="span" fontWeight="bold">
          {followersCount}
        </Typography>
        <Typography component="span" color="text.secondary" ml={0.5}>
          Followers
        </Typography>
      </Box>

      <Box onClick={onFollowingClick} sx={linkStyles}>
        <Typography component="span" fontWeight="bold">
          {followingCount}
        </Typography>
        <Typography component="span" color="text.secondary" ml={0.5}>
          Following
        </Typography>
      </Box>
    </Box>
  );
};

export default ProfileStats;
