import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import Layout from '../components/layout/Layout';
import { useRouter } from 'next/router';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { GoogleAnalytics } from '@next/third-parties/google'



// Create a client
const queryClient = new QueryClient();

// Create theme
const theme = createTheme({
  // Your theme settings...
});

// Inner component that has access to auth context
function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  
  // ✅ FIX: Extract only the user ID. The authToken is no longer needed with session cookies.
  const userId = authContext.user?._id || null;
  
  // Define paths that should have header hidden
  const noHeaderPaths = ['/login', 
                          '/register', 
                          '/forgot-password', 
                          '/reset-password',
                          '/welcome',
                          '/',
                          '/pricing',
                          '/tos',
                          '/privacy',
                          '/subscription/success',
                          '/subscription/cancel',
                          '/blog',
                          '/blog/*'
                        ];
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
    '/workflows',
    '/pricing',
    '/checker',
    '/welcome',
    '/',
    '/tos',
    '/privacy',
    '/subscription/success',
    '/subscription/cancel',
    '/blog',
    '/blog/*'
  ];
  
  // Check if current path starts with /profile/ to match dynamic routes
  const isProfilePage = router.pathname.startsWith('/profile/');
  
  // Hide sidebars if the path is in noSidebarPaths OR it's a profile page
  const hideSidebars = noSidebarPaths.includes(router.pathname) || isProfilePage;
  
  return (
      <SocketProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Layout hideHeader={hideHeader} hideSidebars={hideSidebars}>
            <Component {...pageProps} userId={userId} />
          </Layout>
          <GoogleAnalytics gaId="G-JZF1QKEQMQ" />
        </ThemeProvider>
      </SocketProvider>
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
