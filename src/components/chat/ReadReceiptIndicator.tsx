import React from 'react';
import { Box, Avatar, Tooltip, AvatarGroup, Typography } from '@mui/material';
import { getProfileImageUrl } from '../../utils/imgUrl';

interface ReadBy {
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  readAt: Date;
}

interface ReadReceiptIndicatorProps {
  readBy: ReadBy[];
  conversationType: 'direct' | 'group';
  // Add these props to filter out the sender
  senderId: string;
  currentUserId: string;
}

export const ReadReceiptIndicator: React.FC<ReadReceiptIndicatorProps> = ({ 
  readBy, 
  conversationType,
  senderId,
  currentUserId
}) => {
  // Filter out the sender from the readBy list
  // Only show receipts from OTHER users who have read the message
  const othersWhoRead = readBy.filter(receipt => 
    receipt.userId && 
    receipt.userId._id !== senderId && 
    receipt.userId._id !== currentUserId
  );

  if (!othersWhoRead || othersWhoRead.length === 0) {
    return null;
  }

  // For direct chats, show a simple "Read" text
  if (conversationType === 'direct') {
    return (
      <Typography 
        variant="caption" 
        sx={{ 
          color: 'primary.main', 
          fontWeight: 'bold', 
          ml: 1,
          fontSize: '0.75rem'
        }}
      >
        Read
      </Typography>
    );
  }

  // For group chats, show the avatars
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
      <Typography 
        variant="caption" 
        sx={{ 
          color: 'text.secondary', 
          mr: 0.5,
          fontSize: '0.7rem'
        }}
      >
        Read by
      </Typography>
      <AvatarGroup
        max={3}
        sx={{
          '& .MuiAvatar-root': {
            width: 18,
            height: 18,
            fontSize: '0.6rem',
            border: '1px solid white'
          }
        }}
      >
        {othersWhoRead.map(receipt => (
          <Tooltip
            key={receipt.userId._id}
            title={`${receipt.userId.firstName} ${receipt.userId.lastName} • ${new Date(receipt.readAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}`}
            placement="top"
          >
            <Avatar 
              src={getProfileImageUrl(receipt.userId.profilePicture)}
              sx={{
                bgcolor: 'primary.light'
              }}
            >
              {receipt.userId.firstName?.[0]}
            </Avatar>
          </Tooltip>
        ))}
      </AvatarGroup>
    </Box>
  );
};