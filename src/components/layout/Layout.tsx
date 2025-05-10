import React from 'react';
import { Box, Container } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import useAuth from '../../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
  hideSidebars?: boolean;
  hideHeader?: boolean; // Add this new prop
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  hideSidebars = false,
  hideHeader = false // Default to showing the header
}) => {
  const { isAuthenticated } = useAuth();

  return (
    <Box>
      {!hideHeader && <Header />} {/* Only render the Header if hideHeader is false */}
      {isAuthenticated && !hideSidebars ? (
        <Container maxWidth="lg" sx={{ mt: 2, display: 'flex' }}>
          <Box sx={{ width: 280, display: { xs: 'none', md: 'block' }, mr: 2 }}>
            <Sidebar />
          </Box>
          <Box sx={{ flexGrow: 1 }}>{children}</Box>
          <Box sx={{ width: 280, display: { xs: 'none', md: 'block' }, ml: 2 }}>
            <RightSidebar />
          </Box>
        </Container>
      ) : (
        <Container maxWidth="lg" sx={{ mt: 2 }}>
          {children}
        </Container>
      )}
    </Box>
  );
};

export default Layout;