import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import { SignalProtocolProvider } from '../context/SignalContext';
import Layout from '../components/layout/Layout';
import { useRouter } from 'next/router';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

// Create a client
const queryClient = new QueryClient();

// Create theme
const theme = createTheme({
  // Your theme settings...
});

// Wrapper component to access auth context for Signal
function SignalWrapper({ children }: { children: React.ReactNode }) {
  const { token, user } = useContext(AuthContext);
  
  return (
    <SignalProtocolProvider 
      authToken={token} 
      userId={user?._id || null}  // Remove the user?.id fallback
    >
      {children}
    </SignalProtocolProvider>
  );
}

// Inner component that has access to auth context
function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  
  // Extract user and token from your auth context
  const userId = authContext.user?._id || null;  // Remove the user?.id fallback
  const authToken = authContext.token || null;
  
  // Define paths that should have header hidden
  const noHeaderPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
  const hideHeader = noHeaderPaths.includes(router.pathname);
  
  // Define paths that should have sidebars hidden
  const noSidebarPaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/friends',
    '/settings/profile',
    '/aitoolbox',
    '/signal-test' // Add our test page
  ];
  
  // Check if current path starts with /profile/ to match dynamic routes
  const isProfilePage = router.pathname.startsWith('/profile/');
  
  // Hide sidebars if the path is in noSidebarPaths OR it's a profile page
  const hideSidebars = noSidebarPaths.includes(router.pathname) || isProfilePage;
  
  return (
    <SignalWrapper>
      <SocketProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Layout hideHeader={hideHeader} hideSidebars={hideSidebars}>
            <Component {...pageProps} userId={userId} authToken={authToken} />
          </Layout>
        </ThemeProvider>
      </SocketProvider>
    </SignalWrapper>
  );
}

function MyApp(props: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent {...props} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default MyApp;