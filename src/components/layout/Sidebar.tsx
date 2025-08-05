// src/components/Sidebar.tsx

import React from 'react';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper } from '@mui/material';
import {
  Home as HomeIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  Bookmark as BookmarkIcon,
  Build as BuildIcon,

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
          
          {/* --- ✅ UPDATED THIS SECTION --- */}
          <ListItem disablePadding>
            <Link href="/saved" style={{ textDecoration: 'none', width: '100%', color: 'inherit' }}>
              <ListItemButton sx={{ borderRadius: 1, mb: 1 }}>
                <ListItemIcon>
                  <BookmarkIcon />
                </ListItemIcon>
                <ListItemText primary="Saved" />
              </ListItemButton>
            </Link>
          </ListItem>
          
          <ListItem disablePadding>
            <Link href="/aitoolbox" style={{ textDecoration: 'none', width: '100%', color: 'inherit' }}>
              <ListItemButton sx={{ borderRadius: 1, mb: 1 }}>
                <ListItemIcon>
                  <BuildIcon />
                </ListItemIcon>
                <ListItemText primary="AI Toolbox" />
              </ListItemButton>
            </Link>
          </ListItem>
        </List>
      </Box>
    </Paper>
  );
};

export default Sidebar;