import React, { useState, useEffect, useContext } from 'react';
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
import AuthContext from '../../context/AuthContext'; // Using the shared context

// --- Type Definitions (no changes needed) ---
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

const REACTION_EMOJI_MAP: Record<ReactionType, string> = {
  like: '👍', love: '❤️', haha: '😂', wow: '😮', sad: '😢', angry: '😡', care: '🤗',
  clap: '👏', fire: '🔥', thinking: '🤔', celebrate: '🎉', mind_blown: '🤯',
  heart_eyes: '😍', laugh_cry: '😭', shocked: '😱', cool: '😎', party: '🥳', thumbs_down: '👎'
};

type ReactionCounts = Record<ReactionType, number>;

export const createDefaultReactionCounts = (): ReactionCounts => {
  const counts: Partial<ReactionCounts> = {};
  Object.values(REACTION_TYPES).forEach(type => { counts[type] = 0; });
  return counts as ReactionCounts;
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

  // ✅ FIX: Use AuthContext to check if the user is logged in
  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    const fetchReactions = async () => {
      // ✅ FIX: Check isAuthenticated instead of token
      if (!isAuthenticated) return;
      
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
        const response = await fetch(`${backendUrl}/api/posts/${postId}/reactions`, {
          // ✅ FIX: The browser automatically sends the cookie with this option
          credentials: 'include',
          // ✅ FIX: Removed the manual Authorization header
        });
        
        if (response.ok) {
          const data = await response.json();
          setCounts(data.counts || initialCounts);
          setUserReaction(data.userReaction || initialUserReaction);
        }
      } catch (error) {
        console.error("Error fetching reactions:", error);
      }
    };

    fetchReactions();
  }, [postId, isAuthenticated, initialCounts, initialUserReaction]); // ✅ FIX: Dependency updated

  const handleSelectReaction = async (type: ReactionType) => {
    if (isLoading || !isAuthenticated) return; // ✅ FIX: Check isAuthenticated
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
        credentials: 'include', // ✅ FIX: Added credentials for cookie sending
        // ✅ FIX: Removed the manual Authorization header
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
    if (isLoading || !userReaction || !isAuthenticated) return; // ✅ FIX: Check isAuthenticated
    setIsLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
      const response = await fetch(`${backendUrl}/api/posts/${postId}/reactions`, {
        method: 'DELETE',
        credentials: 'include', // ✅ FIX: Added credentials for cookie sending
        // ✅ FIX: Removed the manual Authorization header
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

  // --- No changes needed in the JSX rendering logic below ---

  const handleButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!userReaction) {
      setAnchorEl(event.currentTarget);
    } else {
      handleRemoveReaction();
    }
  };

  const handlePopoverClose = () => setAnchorEl(null);
  
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
          startIcon={<span>{REACTION_EMOJI_MAP[userReaction || 'like']}</span>}
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
          slotProps={{ paper: { sx: { p: 1, borderRadius: '50px' }}}}
        >
          <Stack direction="row" spacing={0.5}>
            {Object.values(REACTION_TYPES).map((type) => (
              <IconButton
                key={type}
                onClick={() => handleSelectReaction(type)}
                aria-label={`React with ${type}`}
                size="small"
                sx={{ '&:hover': { transform: 'scale(1.2)' } }}
              >
                <span>{REACTION_EMOJI_MAP[type]}</span>
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
                <span>{emoji}</span>
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
