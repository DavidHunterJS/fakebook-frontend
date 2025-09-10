"use client";

import React, { useState, useEffect, useCallback, FC, useContext } from 'react';
import {
    Box, Typography, Paper, Divider, Avatar, List, ListItem, ListItemAvatar,
    ListItemText, Button, CircularProgress, Alert,
} from '@mui/material';
import AuthContext from '../../context/AuthContext';
import { getFullImageUrl } from '../../utils/imgUrl';

// --- Interfaces (no changes needed) ---
interface UserSuggestion {
    _id: string;
    firstName: string;
    username: string;
    profilePicture?: string;
    bio?: string;
}
interface ApiError { message: string; }
interface ActiveFriend {
    _id: string;
    firstName: string;
    username: string;
    profilePicture?: string;
    lastActive?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const RightSidebar: FC = () => {
    const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(true);
    const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
    const [sendingRequestId, setSendingRequestId] = useState<string | null>(null);

    const [activeFriends, setActiveFriends] = useState<ActiveFriend[]>([]);
    const [isLoadingActive, setIsLoadingActive] = useState<boolean>(true);
    const [activeError, setActiveError] = useState<string | null>(null);

    // Context now provides simpler state
    const { isAuthenticated, loading: authLoading } = useContext(AuthContext);

    // --- Effect to Fetch Data ---
    useEffect(() => {
        const fetchData = async <T,>(
            endpoint: string,
            setData: React.Dispatch<React.SetStateAction<T[]>>,
            setError: React.Dispatch<React.SetStateAction<string | null>>,
            setLoading: React.Dispatch<React.SetStateAction<boolean>>
        ) => {            
            setLoading(true);
            setError(null);
            try {
                // The browser automatically sends the session cookie with this request
                const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    credentials: 'include', 
                });
                if (!response.ok) {
                    const errorData: ApiError = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                    throw new Error(errorData.message);
                }
                const data = await response.json();
                // Assumes data has a key like 'suggestions' or 'activeFriends'
                const result = Object.values(data)[0];
                if (Array.isArray(result)) {
                    setData(result as T[]);
                } else {
                    // This handles cases where the API gives an unexpected response format
                    console.warn('API response did not contain a valid array:', data);
                    setData([]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data.');
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        if (authLoading) {
            // Wait for auth state to be resolved
            return;
        }

        if (isAuthenticated) {
            // If logged in, fetch data
            fetchData('/friends/suggestions?limit=5', setSuggestions, setSuggestionsError, setIsLoadingSuggestions);
            fetchData('/friends/active?limit=10', setActiveFriends, setActiveError, setIsLoadingActive);
        } else {
            // If not logged in, clear state
            setIsLoadingSuggestions(false);
            setSuggestions([]);
            setIsLoadingActive(false);
            setActiveFriends([]);
        }
    }, [isAuthenticated, authLoading]);


    const handleAddFriend = useCallback(async (userId: string) => {
        // No longer need to check for authToken
        if (!isAuthenticated) {
            setSuggestionsError('Authentication required to send request.');
            return;
        }
        setSendingRequestId(userId);
        try {
            const response = await fetch(`${API_BASE_URL}/friends/request/${userId}`, {
                method: 'POST',
                credentials: 'include', // Sends the session cookie
                // The Authorization header is now removed.
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                const errorData: ApiError = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                throw new Error(errorData.message);
            }
            // On success, remove the user from the suggestions list
            setSuggestions(prev => prev.filter(user => user._id !== userId));
        } catch (err) {
            setSuggestionsError(err instanceof Error ? err.message : 'Failed to send friend request.');
        } finally {
            setSendingRequestId(null);
        }
    }, [isAuthenticated]); // Dependency array updated

    // --- Rendering logic (renderSuggestions, renderActiveFriends) remains the same ---
    // No changes are needed in the JSX that renders the components.
    
    // (Your existing renderSuggestions and renderActiveFriends JSX goes here)

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
                {suggestionsError && <Alert severity="warning" sx={{ mb: 1 }}>{suggestionsError}</Alert>}
                {suggestions.map((user) => {
                    const imageUrl = getFullImageUrl(user.profilePicture, 'profile');
                    return (
                        <ListItem key={user._id} alignItems="flex-start" sx={{ px: 0, py: 1 }}>
                            <ListItemAvatar>
                                <Avatar alt={user.firstName} src={imageUrl} />
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
             return null;
        }
        if (!activeFriends.length) {
            return <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No friends currently active.</Typography>;
        }
        return (
            <List sx={{ p: 0 }}>
                {activeFriends.map((friend) => {
                    const imageUrl = getFullImageUrl(friend.profilePicture, 'profile');
                    return (
                        <ListItem key={friend._id} alignItems="center" sx={{ px: 0, py: 0.5 }}>
                            <ListItemAvatar sx={{ minWidth: 'auto', mr: 1.5 }}>
                                <Avatar sx={{ width: 32, height: 32 }} alt={friend.firstName} src={imageUrl} />
                            </ListItemAvatar>
                            <ListItemText primary={friend.firstName} primaryTypographyProps={{ variant: 'body2' }} />
                            <Box sx={{ width: 8, height: 8, bgcolor: 'success.main', borderRadius: '50%', ml: 1, boxShadow: '0 0 3px rgba(0,200,0,0.7)' }}/>
                        </ListItem>
                    );
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