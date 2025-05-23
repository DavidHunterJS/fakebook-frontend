"use client";

import React, { useState, useEffect, useCallback, FC, useContext } from 'react';
import {
    Box,
    Typography,
    Paper,
    Divider,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Button,
    CircularProgress,
    Alert,
} from '@mui/material';
import AuthContext from '../../context/AuthContext'; // Adjust path if needed
import {getFullImageUrl} from '../../utils/imgUrl';

// --- Define Interfaces ---
interface UserSuggestion {
    _id: string;
    firstName: string;
    username: string;
    profilePicture?: string; // Expecting profilePicture from API
    // profileImage?: string; // Keep if API might send either, normalize later
    bio?: string;
}

interface ApiError {
    message: string;
}

interface SuggestionsApiResponse {
    suggestions: UserSuggestion[];
}


interface ActiveFriend {
    _id: string;
    firstName: string;
    username: string;
    profilePicture?: string; // Expecting profilePicture from API
    // profileImage?: string;
    lastActive?: string;
}

interface ActiveFriendsApiResponse {
    activeFriends: ActiveFriend[];
}

// --- API Base URL ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Ensure this points to backend

// --- Image URL Helper ---
// Ensure NEXT_PUBLIC_BACKEND_BASE_URL is set in your .env.local (e.g., http://localhost:5000)
// const BACKEND_STATIC_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

// const getFullImageUrl = (filenameOrUrl?: string, type: 'profile' | 'cover' = 'profile'): string => {
//     const defaultProfilePic = '/images/default-avatar.png'; // Path in frontend public/images

//     if (!filenameOrUrl) {
//         return defaultProfilePic; // Always return default for profile if no filename
//     }
//     const trimmedInput = filenameOrUrl.trim();
//     if (trimmedInput.startsWith('http://') || trimmedInput.startsWith('https://')) {
//         return trimmedInput; // Already a full URL
//     }
//     if (trimmedInput === 'default-avatar.png') {
//         return defaultProfilePic;
//     }
//     // Construct full URL to image served by the BACKEND
//     // Ensure pathSegment matches your backend static serving setup
//     const pathSegment = type === 'cover' ? 'covers' : type; // Use 'covers' for cover type
//     return `${BACKEND_STATIC_URL}/uploads/${pathSegment}/${trimmedInput}`;
// };


// --- Component ---
const RightSidebar: FC = () => {
    // --- State ---
    const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(true);
    const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
    const [sendingRequestId, setSendingRequestId] = useState<string | null>(null);

    const [activeFriends, setActiveFriends] = useState<ActiveFriend[]>([]);
    const [isLoadingActive, setIsLoadingActive] = useState<boolean>(true);
    const [activeError, setActiveError] = useState<string | null>(null);

    // --- Context ---
    const {
        token: authToken,
        isAuthenticated,
        loading: authLoading
    } = useContext(AuthContext);

    // --- Effect to Fetch Data ---
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!authToken) {
                setSuggestionsError("Authentication required for suggestions.");
                setIsLoadingSuggestions(false);
                setSuggestions([]);
                return;
            }
            setIsLoadingSuggestions(true);
            setSuggestionsError(null);
            try {
                // Ensure your backend /api/friends/suggestions returns profilePicture
                const response = await fetch(`${API_BASE_URL}/friends/suggestions?limit=5`, {
                    headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                });
                if (!response.ok) {
                    const errorData: ApiError = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                    throw new Error(errorData.message);
                }
                const data: SuggestionsApiResponse = await response.json();
                console.log("[RightSidebar] Suggestions data received:", data.suggestions); // Log received data
                setSuggestions(data.suggestions || []);
            } catch (err) {
                setSuggestionsError(err instanceof Error ? err.message : 'Failed to load suggestions.');
                setSuggestions([]);
            } finally {
                setIsLoadingSuggestions(false);
            }
        };

        const fetchActiveFriends = async () => {
            if (!authToken) {
                setActiveError("Authentication required for active friends.");
                setIsLoadingActive(false);
                setActiveFriends([]);
                return;
            }
            setIsLoadingActive(true);
            setActiveError(null);
            try {
                // Ensure your backend /api/friends/active returns profilePicture
                const response = await fetch(`${API_BASE_URL}/friends/active?limit=10`, {
                    headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                });
                if (!response.ok) {
                    const errorData: ApiError = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                    throw new Error(errorData.message);
                }
                const data: ActiveFriendsApiResponse = await response.json();
                 console.log("[RightSidebar] Active friends data received:", data.activeFriends); // Log received data
                setActiveFriends(data.activeFriends || []);
            } catch (err) {
                setActiveError(err instanceof Error ? err.message : 'Failed to load active friends.');
                setActiveFriends([]);
            } finally {
                setIsLoadingActive(false);
            }
        };

        if (authLoading) {
            setIsLoadingSuggestions(true);
            setIsLoadingActive(true);
            return;
        }

        if (isAuthenticated && authToken) {
            fetchSuggestions();
            fetchActiveFriends();
        } else {
            setIsLoadingSuggestions(false);
            setSuggestions([]);
            setIsLoadingActive(false);
            setActiveFriends([]);
        }
    }, [isAuthenticated, authToken, authLoading]);


    const handleAddFriend = useCallback(async (userId: string) => {
        if (!isAuthenticated || !authToken) {
            setSuggestionsError('Authentication required to send request.');
            return;
        }
        setSendingRequestId(userId);
        try {
            const response = await fetch(`${API_BASE_URL}/friends/request/${userId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                const errorData: ApiError = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                throw new Error(errorData.message);
            }
            setSuggestions(prev => prev.filter(user => user._id !== userId));
        } catch (err) {
            setSuggestionsError(err instanceof Error ? err.message : 'Failed to send friend request.');
        } finally {
            setSendingRequestId(null);
        }
    }, [authToken, isAuthenticated]);


    const renderSuggestions = () => {
        if (isLoadingSuggestions) {
            return <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress size={24} /></Box>;
        }
        if (suggestionsError && !suggestions.length) {
            return <Alert severity="error" sx={{ mt: 1 }}>{suggestionsError}</Alert>;
        }
        if (!isAuthenticated) {
             return <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Please log in to see suggestions.</Typography>;
        }
        if (!suggestions.length) {
            return <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No new suggestions.</Typography>;
        }
        return (
            <List sx={{ p: 0 }}>
                {/* Show non-critical errors without replacing list */}
                {suggestionsError && <Alert severity="warning" sx={{ mb: 1 }}>{suggestionsError}</Alert>}
                {suggestions.map((user) => {
                    // --- CORRECTION HERE ---
                    const imageUrl = getFullImageUrl(user.profilePicture, 'profile');
                    // Log the URL being used for each suggestion
                    // console.log(`[Suggestion] User: ${user.username}, Image Filename: ${user.profilePicture}, Final URL: ${imageUrl}`);
                    return (
                        <ListItem key={user._id} alignItems="flex-start" sx={{ px: 0, py: 1 }}>
                            <ListItemAvatar>
                                <Avatar
                                    alt={user.firstName}
                                    src={imageUrl} // Use the generated full URL
                                />
                            </ListItemAvatar>
                            <ListItemText
                                primary={user.firstName || 'User'}
                                secondary={user.username ? `@${user.username}` : ''}
                                primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                                secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                            />
                            <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleAddFriend(user._id)}
                                disabled={sendingRequestId === user._id || !isAuthenticated}
                                sx={{ ml: 1, whiteSpace: 'nowrap', alignSelf: 'center', height: '30px', fontSize: '0.75rem' }}
                            >
                                {sendingRequestId === user._id ? <CircularProgress size={16} color="inherit" /> : 'Add'}
                            </Button>
                        </ListItem>
                    );
                    // --- END CORRECTION ---
                })}
            </List>
        );
    };

    const renderActiveFriends = () => {
        if (isLoadingActive) {
            return <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress size={24} /></Box>;
        }
        if (activeError) {
            return <Alert severity="error" sx={{ mt: 1 }}>{activeError}</Alert>;
        }
        if (!isAuthenticated) {
             return null; // Don't show if not logged in
        }
        if (!activeFriends.length) {
            return <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No friends currently active.</Typography>;
        }
        return (
            <List sx={{ p: 0 }}>
                {activeFriends.map((friend) => {
                    // --- CORRECTION HERE ---
                    const imageUrl = getFullImageUrl(friend.profilePicture, 'profile');
                     // Log the URL being used for each active friend
                    // console.log(`[ActiveFriend] User: ${friend.username}, Image Filename: ${friend.profilePicture}, Final URL: ${imageUrl}`);
                    return (
                        <ListItem key={friend._id} alignItems="center" sx={{ px: 0, py: 0.5 }}>
                            <ListItemAvatar sx={{ minWidth: 'auto', mr: 1.5 }}>
                                <Avatar
                                    sx={{ width: 32, height: 32 }}
                                    alt={friend.firstName}
                                    src={imageUrl} // Use the generated full URL
                                />
                            </ListItemAvatar>
                            <ListItemText
                                primary={friend.firstName}
                                primaryTypographyProps={{ variant: 'body2' }}
                            />
                            <Box sx={{ width: 8, height: 8, bgcolor: 'success.main', borderRadius: '50%', ml: 1, boxShadow: '0 0 3px rgba(0,200,0,0.7)' }}/>
                        </ListItem>
                    );
                    // --- END CORRECTION ---
                })}
            </List>
        );
    };

    return (
        <Paper
            elevation={0}
            variant="outlined"
            sx={{
                position: 'sticky', top: { xs: 60, md: 70 },
                maxHeight: { xs: 'none', md: 'calc(100vh - 90px)' },
                overflowY: 'auto',
                '&::-webkit-scrollbar': { display: 'none' },
                msOverflowStyle: 'none', scrollbarWidth: 'none',
                border: 'none', bgcolor: 'background.paper'
            }}
        >
            <Box sx={{ p: { xs: 1.5, md: 2 } }}>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold', mb: 1 }}>
                    Friend Suggestions
                </Typography>
                <Divider sx={{ mb: 1 }} />
                {renderSuggestions()}

                {isAuthenticated && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold', mb: 1 }}>
                            Active Friends
                        </Typography>
                        {renderActiveFriends()}
                    </>
                )}
            </Box>
        </Paper>
    );
};

export default RightSidebar;
