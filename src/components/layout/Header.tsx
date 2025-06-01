import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Badge,
  Divider,
  Menu,
  MenuItem,
  InputBase,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  Menu as MenuIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import Link from 'next/link';
import useAuth from '../../hooks/useAuth'; // Adjust path if needed
import { getFullImageUrl } from '../../utils/imgUrl';

// --- NEW IMPORTS ---
import { useQuery } from '@tanstack/react-query';
import axios from '../../lib/axios'; // Your Axios instance
// --- END NEW IMPORTS ---

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // --- NEW: FETCH UNREAD NOTIFICATION COUNT ---
  const { data: unreadCountData } = useQuery({
    queryKey: ['unreadNotificationsCount'],
    queryFn: async () => {
      // Only fetch if authenticated
      if (!isAuthenticated) return { count: 0 };
      try {
        const response = await axios.get('/notifications/unread-count');
        return response.data; // Expected format: { count: number }
      } catch (error) {
        console.error('Failed to fetch unread notification count:', error);
        return { count: 0 }; // Return 0 on error
      }
    },
    // The query should only run if the user is authenticated
    enabled: isAuthenticated,
    // Refetch interval to keep the count updated (e.g., every 30 seconds)
    refetchInterval: 30000,
    // Refetch when the window regains focus (user returns to tab)
    refetchOnWindowFocus: true,
    // Keep data fresh when component remounts or query key changes
    staleTime: 5000, // Data is fresh for 5 seconds
  });

  const unreadCount = unreadCountData?.count || 0;
  // --- END NEW ---

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    router.push('/login'); // Redirect to login after logout
  };

  const menuId = 'primary-search-account-menu';
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      id={menuId}
      keepMounted
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <MenuItem onClick={() => {
        handleMenuClose();
        if (!user || !user._id) {
          console.error('User ID is missing for profile navigation:', user);
          router.push('/dashboard'); // Fallback route
          return;
        }
        router.push(`/profile/${user._id}`);
      }}>Profile</MenuItem>
      <MenuItem onClick={handleLogout}>Logout</MenuItem>
    </Menu>
  );

  const drawer = (
    <div>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
         <Avatar
            src={getFullImageUrl(user?.profilePicture, 'profile')}
            alt={user?.username}
            sx={{ width: 40, height: 40 }}
         />
         <Typography variant="subtitle1">{user?.firstName || user?.username}</Typography>
      </Box>
      <Divider />
      <List>
        <ListItem disablePadding>
          <Link href="/" passHref legacyBehavior>
            <ListItemButton component="a">
              <ListItemIcon><HomeIcon /></ListItemIcon>
              <ListItemText primary="Home" />
            </ListItemButton>
          </Link>
        </ListItem>

        <ListItem disablePadding>
          {user && user._id ? (
            <Link href={`/profile/${user._id}`} passHref legacyBehavior>
              <ListItemButton component="a">
                <ListItemIcon><PersonIcon /></ListItemIcon>
                <ListItemText primary="Profile" />
              </ListItemButton>
            </Link>
          ) : (
            <ListItemButton disabled>
              <ListItemIcon><PersonIcon /></ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItemButton>
          )}
        </ListItem>

        <ListItem disablePadding>
          <Link href="/friends" passHref legacyBehavior>
            <ListItemButton component="a">
              <ListItemIcon><PeopleIcon /></ListItemIcon>
              <ListItemText primary="Friends" />
            </ListItemButton>
          </Link>
        </ListItem>
        {/* Add other navigation items here */}
        <Divider sx={{ my: 1 }} />
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          {isAuthenticated && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ display: { xs: 'none', sm: 'block' }, cursor: 'pointer' }}
            onClick={() => router.push('/')}
          >
            Fakebook 🚧 Under Construction 🚧
          </Typography>
          {isAuthenticated && user && (
            <>
              <Search>
                <SearchIconWrapper>
                  <SearchIcon />
                </SearchIconWrapper>
                <StyledInputBase
                  placeholder="Search…"
                  inputProps={{ 'aria-label': 'search' }}
                />
              </Search>
              <Box sx={{ flexGrow: 1 }} />
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
                <Link href="/notifications" passHref legacyBehavior>
                  <IconButton color="inherit" component="a">
                    {/* --- UPDATED BADGE CONTENT --- */}
                    <Badge badgeContent={unreadCount} color="error">
                      <NotificationsIcon />
                    </Badge>
                    {/* --- END UPDATED BADGE CONTENT --- */}
                  </IconButton>
                </Link>
                <IconButton
                  edge="end"
                  aria-label="account of current user"
                  aria-controls={menuId}
                  aria-haspopup="true"
                  onClick={handleProfileMenuOpen}
                  color="inherit"
                >
                  <Avatar
                    key={`header-avatar-${user?._id || 'guest'}-${Date.now()}`}
                    src={getFullImageUrl(user?.profilePicture, 'profile')}
                    alt={user?.username || 'User Avatar'}
                    sx={{ width: 32, height: 32 }}
                  />
                </IconButton>
              </Box>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        {drawer}
      </Drawer>
      {renderMenu}
    </Box>
  );
};

export default Header;