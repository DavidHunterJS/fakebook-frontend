import React from 'react';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper } from '@mui/material';
import {
  Home as HomeIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  Bookmark as BookmarkIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import useAuth from '../../hooks/useAuth';

const Sidebar = () => {
  const { user } = useAuth();

  return (
    <Paper sx={{ position: 'sticky', top: 70 }}>
      <Box sx={{ p: 2 }}>
        <List>
          <ListItem disablePadding>
            <Link href="/" style={{ textDecoration: 'none', width: '100%', color: 'inherit' }}>
              <ListItemButton sx={{ borderRadius: 1, mb: 1 }}>
                <ListItemIcon>
                  <HomeIcon />
                </ListItemIcon>
                <ListItemText primary="Home" />
              </ListItemButton>
            </Link>
          </ListItem>
          
          <ListItem disablePadding>
            <Link href={`/profile/${user?._id}`} style={{ textDecoration: 'none', width: '100%', color: 'inherit' }}>
              <ListItemButton sx={{ borderRadius: 1, mb: 1 }}>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="Profile" />
              </ListItemButton>
            </Link>
          </ListItem>
          
          <ListItem disablePadding>
            <Link href="/friends" style={{ textDecoration: 'none', width: '100%', color: 'inherit' }}>
              <ListItemButton sx={{ borderRadius: 1, mb: 1 }}>
                <ListItemIcon>
                  <PeopleIcon />
                </ListItemIcon>
                <ListItemText primary="Friends" />
              </ListItemButton>
            </Link>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton sx={{ borderRadius: 1, mb: 1 }}>
              <ListItemIcon>
                <BookmarkIcon />
              </ListItemIcon>
              <ListItemText primary="Saved" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton sx={{ borderRadius: 1, mb: 1 }}>
              <ListItemIcon>
                <EventIcon />
              </ListItemIcon>
              <ListItemText primary="Events" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Paper>
  );
};

export default Sidebar;