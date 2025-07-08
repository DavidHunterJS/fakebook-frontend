import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import { User } from '../../../types/user';
import { getUserById } from '../../../services/adminService';
import withAdminAuth from '../../../components/auth/withAdminAuth';
import {getFullImageUrl} from '../../../utils/imgUrl';




const UserDetailPage = () => {
  const router = useRouter();
  const { userId } = router.query;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof userId === 'string') {
      const fetchUser = async () => {
        try {
          setLoading(true);
          const userData = await getUserById(userId);
          
          setUser(userData);
        } catch (err) {
          setError('Failed to fetch user details.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    }
  }, [userId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
  }

  if (!user) {
    return <Alert severity="warning" sx={{ m: 4 }}>User not found.</Alert>;
  }

  const imageUrl = getFullImageUrl(user.profilePicture, 'profile');
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            src={imageUrl}
            alt={`${user.firstName} ${user.lastName}`}
            sx={{ width: 80, height: 80, mr: 2 }}
          />
          <Box>
            <Typography variant="h4" component="h1">
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              @{user.username}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* ✅ Alternative approach using Box with flexbox */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {/* First section */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>User Information</Typography>
            <Typography><strong>Email:</strong> {user.email}</Typography>
            <Typography><strong>Role:</strong> {user.role}</Typography>
            <Typography><strong>Status:</strong> {user.isActive ? 'Active' : 'Inactive'}</Typography>
            <Typography><strong>Bio:</strong> {user.bio || 'N/A'}</Typography>
            <Typography><strong>Location:</strong> {user.location || 'N/A'}</Typography>
          </Box>

          {/* Second section */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>Friends ({user.friends?.length || 0})</Typography>
            <List dense>
              {user.friends && user.friends.length > 0 ? (
                user.friends.map((friend: User) => {
                console.log(friend);
                  return (
                    <ListItem key={friend._id}>
                      <ListItemAvatar>
                        <Avatar src={getFullImageUrl(friend.profilePicture, 'profile')} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${friend.firstName} ${friend.lastName}`}
                        secondary={`@${friend.username}`}
                      />
                    </ListItem>
                  );
                })
              ) : (
                <Typography>No friends to display.</Typography>
              )}
            </List>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default withAdminAuth(UserDetailPage);