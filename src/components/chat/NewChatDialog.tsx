// components/Chat/NewChatDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  InputAdornment,
  Fade,
  CircularProgress,
  useTheme,
  alpha,
  Tabs,
  Tab
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Close as CloseIcon,
  Add as AddIcon
} from '@mui/icons-material';
import {getFullImageUrl} from '../../utils/imgUrl'; 

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  isOnline?: boolean;
}

interface NewChatDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateConversation: (type: 'direct' | 'group', participants: string[], title?: string) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

const NewChatDialog: React.FC<NewChatDialogProps> = ({ open, onClose, onCreateConversation }) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers(searchQuery);
    } else {
      loadUsers();
    }
  }, [searchQuery]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/users?limit=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.users) {
        const formattedUsers = data.users.map((user: any) => ({
          id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          isOnline: user.isOnline || false
        }));
        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.users) {
        const formattedUsers = data.users.map((user: any) => ({
          id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          isOnline: user.isOnline || false
        }));
        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: User) => {
    if (tabValue === 0) {
      onCreateConversation('direct', [user.id]);
      handleClose();
    } else {
      if (!selectedUsers.find(u => u.id === user.id)) {
        setSelectedUsers([...selectedUsers, user]);
      }
    }
  };

  const handleUserRemove = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleCreateGroup = () => {
    if (selectedUsers.length === 0) return;
    onCreateConversation(
      'group', 
      selectedUsers.map(u => u.id),
      groupTitle.trim() || undefined
    );
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedUsers([]);
    setGroupTitle('');
    setTabValue(0);
    onClose();
  };

  const getUserFullName = (user: User) => `${user.firstName} ${user.lastName}`;

  const filteredUsers = users.filter(user => 
    !selectedUsers.find(selected => selected.id === user.id)
  );

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '60vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6" component="div">
          Start New Chat
        </Typography>
        <IconButton 
          onClick={handleClose}
          sx={{ color: 'white' }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="fullWidth"
        >
          <Tab 
            icon={<PersonIcon />} 
            label="Direct Message" 
            iconPosition="start"
          />
          <Tab 
            icon={<GroupIcon />} 
            label="Group Chat" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {/* Search Bar */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Direct Message Tab */}
          <Box sx={{ height: 400, overflow: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : filteredUsers.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 3 }}>
                <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography color="text.secondary">
                  {searchQuery ? 'No users found' : 'No users available'}
                </Typography>
              </Box>
            ) : (
              <List>
                {filteredUsers.map((user, index) => (
                  <Fade key={user.id} in timeout={300 + index * 50}>
                    <ListItem disablePadding>
                      <ListItemButton
                        onClick={() => handleUserSelect(user)}
                        sx={{
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1)
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            // ✅ FIX #1: Use getFullImageUrl for the user list
                            src={user.profilePicture ? getFullImageUrl(user.profilePicture, 'profile') : undefined}
                            sx={{
                              background: 'linear-gradient(135deg, #4ecdc4, #44a08d)',
                              position: 'relative'
                            }}
                          >
                            {user.firstName[0]}{user.lastName[0]}
                            {user.isOnline && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  bottom: 0,
                                  right: 0,
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  backgroundColor: '#4ade80',
                                  border: '2px solid white'
                                }}
                              />
                            )}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={getUserFullName(user)}
                          secondary={`@${user.username}`}
                          primaryTypographyProps={{ fontWeight: 600 }}
                        />
                      </ListItemButton>
                    </ListItem>
                  </Fade>
                ))}
              </List>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Group Chat Tab */}
          <Box>
            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected ({selectedUsers.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedUsers.map(user => (
                    <Chip
                      key={user.id}
                      avatar={
                        <Avatar 
                          // ✅ FIX #2: Use getFullImageUrl for the selected user chips
                          src={user.profilePicture ? getFullImageUrl(user.profilePicture, 'profile') : undefined} 
                          sx={{ width: 24, height: 24 }}
                        >
                          {user.firstName[0]}
                        </Avatar>
                      }
                      label={getUserFullName(user)}
                      onDelete={() => handleUserRemove(user.id)}
                      size="small"
                      sx={{
                        '& .MuiChip-deleteIcon': {
                          fontSize: 16
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Group Title Input */}
            {selectedUsers.length > 0 && (
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <TextField
                  fullWidth
                  label="Group Title (Optional)"
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  size="small"
                  placeholder="Enter group name..."
                />
              </Box>
            )}

            {/* Users List */}
            <Box sx={{ height: selectedUsers.length > 0 ? 250 : 400, overflow: 'auto' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : filteredUsers.length === 0 ? (
                <Box sx={{ textAlign: 'center', p: 3 }}>
                  <GroupIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary">
                    {searchQuery ? 'No users found' : 'No users available'}
                  </Typography>
                </Box>
              ) : (
                <List>
                  {filteredUsers.map((user, index) => (
                    <Fade key={user.id} in timeout={300 + index * 50}>
                      <ListItem disablePadding>
                        <ListItemButton
                          onClick={() => handleUserSelect(user)}
                          sx={{
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.1)
                            }
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              // ✅ FIX #3: Use getFullImageUrl for the group chat user list
                              src={user.profilePicture ? getFullImageUrl(user.profilePicture, 'profile') : undefined}
                              sx={{
                                background: 'linear-gradient(135deg, #4ecdc4, #44a08d)',
                                position: 'relative'
                              }}
                            >
                              {user.firstName[0]}{user.lastName[0]}
                              {user.isOnline && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    backgroundColor: '#4ade80',
                                    border: '2px solid white'
                                  }}
                                />
                              )}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={getUserFullName(user)}
                            secondary={`@${user.username}`}
                            primaryTypographyProps={{ fontWeight: 600 }}
                          />
                          <IconButton size="small" color="primary">
                            <AddIcon />
                          </IconButton>
                        </ListItemButton>
                      </ListItem>
                    </Fade>
                  ))}
                </List>
              )}
            </Box>
          </Box>
        </TabPanel>
      </DialogContent>

      {tabValue === 1 && selectedUsers.length > 0 && (
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleCreateGroup}
            variant="contained"
            startIcon={<GroupIcon />}
            sx={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8, #6b46c1)',
              }
            }}
          >
            Create Group ({selectedUsers.length})
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default NewChatDialog;