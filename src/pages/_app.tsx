import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import Layout from '../components/layout/Layout';
import { useRouter } from 'next/router';

// Create a client
const queryClient = new QueryClient();

// Create theme
const theme = createTheme({
  // Your theme settings...
});

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
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
    '/genimage'
  ];

  // Check if current path starts with /profile/ to match dynamic routes
  const isProfilePage = router.pathname.startsWith('/profile/');
  
  // Hide sidebars if the path is in noSidebarPaths OR it's a profile page
  const hideSidebars = noSidebarPaths.includes(router.pathname) || isProfilePage;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Layout hideHeader={hideHeader} hideSidebars={hideSidebars}>
              <Component {...pageProps} />
            </Layout>
          </ThemeProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default MyApp;