import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Popover,
  Stack,
  Typography,
  IconButton,
  Avatar,
  AvatarGroup,
} from '@mui/material';
import useAuth from '../../hooks/useAuth'; // Adjust the path if necessary

// --- Type Definitions ---
const REACTION_TYPES = {
  LIKE: 'like', 
  LOVE: 'love', 
  HAHA: 'haha', 
  WOW: 'wow', 
  SAD: 'sad', 
  ANGRY: 'angry',
  CARE: 'care',
  CLAP: 'clap',
  FIRE: 'fire',
  THINKING: 'thinking',
  CELEBRATE: 'celebrate',
  MIND_BLOWN: 'mind_blown',
  HEART_EYES: 'heart_eyes',
  LAUGH_CRY: 'laugh_cry',
  SHOCKED: 'shocked',
  COOL: 'cool',
  PARTY: 'party',
  THUMBS_DOWN: 'thumbs_down'
} as const;
type ReactionType = typeof REACTION_TYPES[keyof typeof REACTION_TYPES];

// Keep emoji for cases where they work (like the button)
const REACTION_EMOJI_MAP: Record<ReactionType, string> = {
  like: '👍',
  love: '❤️', 
  haha: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😡',
  care: '🤗',
  clap: '👏',
  fire: '🔥',
  thinking: '🤔',
  celebrate: '🎉',
  mind_blown: '🤯',
  heart_eyes: '😍',
  laugh_cry: '😭',
  shocked: '😱',
  cool: '😎',
  party: '🥳',
  thumbs_down: '👎'
};

type ReactionCounts = Record<ReactionType, number>;

// Helper function to create default reaction counts
export const createDefaultReactionCounts = (): ReactionCounts => {
  const counts: ReactionCounts = {} as ReactionCounts;
  Object.values(REACTION_TYPES).forEach(type => {
    counts[type] = 0;
  });
  return counts;
};

interface ReactionApiResponse {
  message: string;
  reaction: { _id: string; postId: string; userId: string; type: ReactionType; };
  counts: ReactionCounts;
}
interface RemoveReactionApiResponse {
  message: string;
  counts: ReactionCounts;
}
interface ReactionSelectorProps {
  postId: string;
  initialCounts?: ReactionCounts;
  initialUserReaction: ReactionType | null;
}

const ReactionSelector: React.FC<ReactionSelectorProps> = ({
  postId,
  initialCounts = createDefaultReactionCounts(),
  initialUserReaction,
}) => {
  const [counts, setCounts] = useState<ReactionCounts>(initialCounts);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(initialUserReaction);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const { token } = useAuth();

  // Fetch initial reaction data on mount
  useEffect(() => {
    const fetchReactions = async () => {
      if (!token) return;
      
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
        const response = await fetch(`${backendUrl}/api/posts/${postId}/reactions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Assuming your API returns { counts: {...}, userReaction: 'like'|null }
          setCounts(data.counts || initialCounts);
          setUserReaction(data.userReaction || initialUserReaction);
        }
      } catch (error) {
        console.error("Error fetching reactions:", error);
        // Fall back to initial values on error
        setCounts(initialCounts);
        setUserReaction(initialUserReaction);
      }
    };

    fetchReactions();
  }, [postId, token, initialCounts, initialUserReaction]);

  const handleSelectReaction = async (type: ReactionType) => {
    if (isLoading || !token) return;
    setIsLoading(true);
    setAnchorEl(null);

    if (type === userReaction) {
        await handleRemoveReaction();
        return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
      const response = await fetch(`${backendUrl}/api/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type }),
      });
      if (!response.ok) throw new Error('Failed to update reaction');
      const data: ReactionApiResponse = await response.json();
      setCounts(data.counts);
      setUserReaction(data.reaction.type);
    } catch (error) {
      console.error("Error updating reaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveReaction = async () => {
    if (isLoading || !userReaction || !token) return;
    setIsLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
      const response = await fetch(`${backendUrl}/api/posts/${postId}/reactions`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to remove reaction');
      const data: RemoveReactionApiResponse = await response.json();
      setCounts(data.counts);
      setUserReaction(null);
    } catch (error) {
      console.error("Error removing reaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!userReaction) {
      setAnchorEl(event.currentTarget);
    } else {
      handleRemoveReaction();
    }
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };
  
  const getTopReactions = () => Object.entries(counts).filter(([, count]) => count > 0).sort(([, a], [, b]) => b - a).slice(0, 3).map(([type]) => ({ type: type as ReactionType, emoji: REACTION_EMOJI_MAP[type as ReactionType] }));
  const totalReactions = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const topReactions = getTopReactions();

  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <Box>
        <Button
          variant={userReaction ? "contained" : "outlined"}
          color={userReaction ? "primary" : "inherit"}
          disabled={isLoading}
          onClick={handleButtonClick}
          startIcon={
            <span style={{ 
              fontSize: '16px',
              fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif"
            }}>
              {REACTION_EMOJI_MAP[userReaction || 'like']}
            </span>
          }
          sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}
        >
          {userReaction || 'Like'}
        </Button>
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handlePopoverClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          slotProps={{
            paper: {
              sx: { 
                p: 1, 
                borderRadius: '50px',
                overflow: 'visible',
                minHeight: '50px',
                display: 'flex',
                alignItems: 'center'
              }
            }
          }}
        >
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minHeight: '40px' }}>
            {Object.values(REACTION_TYPES).map((type) => (
              <IconButton
                key={type}
                onClick={() => handleSelectReaction(type)}
                aria-label={`React with ${type}`}
                size="small"
                sx={{
                  color: 'transparent !important',
                  transition: 'transform 0.15s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.2)',
                    backgroundColor: 'rgba(0,0,0,0.04)'
                  },
                  '& span': {
                    color: 'initial !important',
                    opacity: '1 !important',
                    filter: 'none !important'
                  },
                  '& .MuiTouchRipple-root': {
                    color: 'rgba(0, 0, 0, 0.1) !important'
                  },
                  '& .MuiTouchRipple-child': {
                    backgroundColor: 'rgba(0, 0, 0, 0.1) !important'
                  },
                  '& .MuiTouchRipple-rippleVisible': {
                    backgroundColor: 'rgba(0, 0, 0, 0.1) !important'
                  }
                }}
              >
                <span style={{ 
                  fontSize: '18px',
                  fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif",
                  color: 'initial',
                  opacity: 1,
                  filter: 'none'
                }}>
                  {REACTION_EMOJI_MAP[type]}
                </span>
              </IconButton>
            ))}
          </Stack>
        </Popover>
      </Box>
      {totalReactions > 0 && (
        <Stack direction="row" alignItems="center" spacing={1}>
          <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.75rem' } }}>
            {topReactions.map(({ type, emoji }) => (
              <Avatar key={type} sx={{ bgcolor: 'transparent' }}>
                <span style={{ 
                  fontSize: '12px',
                  fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif"
                }}>
                  {emoji}
                </span>
              </Avatar>
            ))}
          </AvatarGroup>
          <Typography variant="body2" color="text.secondary">{totalReactions}</Typography>
        </Stack>
      )}
    </Stack>
  );
};

export default ReactionSelector;