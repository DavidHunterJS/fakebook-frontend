// frontend/__tests__/index.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from '../src/pages/index';
import { useRouter } from 'next/router';

const queryClient = new QueryClient();

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock useAuth
jest.mock('../src/hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseAuth = jest.requireMock('../src/hooks/useAuth').default;

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      pathname: '/',
      route: '/',
      query: {},
      asPath: '/',
    });
    
    // Default mock for unauthenticated state
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null
    });
  });

  it('renders the post creation form', () => {
    render(<Home />, { wrapper: TestWrapper });
    expect(screen.getByPlaceholderText(/What's on your mind/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /post/i })).toBeInTheDocument();
  });

  it('shows user avatar when authenticated', () => {
    // Update mock to return authenticated user
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { name: 'Test User', avatar: '/images/default-avatar.png' } // Match actual implementation
    });

    render(<Home />, { wrapper: TestWrapper });
    
    const avatar = screen.getByAltText('User');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', '/images/default-avatar.png'); // Updated to match actual src
  });

  it('shows loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: true,
    });

    render(<Home />, { wrapper: TestWrapper });
    
    // Updated to look for loading text instead of progressbar
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});