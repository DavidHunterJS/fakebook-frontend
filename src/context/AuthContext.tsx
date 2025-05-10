// src/context/AuthContext.tsx
import React, { createContext, useReducer, useEffect, ReactNode, FC } from 'react';
import { isAxiosError } from 'axios';
import axiosInstance from '../utils/api'; // Assuming your axios instance is in utils/api
import { User } from '../types/user'; // Adjust path as needed

// Define API error interface
interface ApiError {
  response?: {
    data?: {
      message?: string;
      errors?: Record<string, string>;
    };
  };
  message?: string;
}

// Helper function to normalize user data (ensure it's consistent)
const normalizeUser = (userData: User | Partial<User> | Record<string, unknown> | null): User | null => {
  // console.log('Raw user data for normalization:', userData);
  if (!userData) return null;

  const normalizedUser = { ...userData } as Partial<User>;

  if (!normalizedUser._id && 'id' in normalizedUser && typeof normalizedUser.id === 'string') {
    normalizedUser._id = normalizedUser.id;
  }

  // Ensure essential fields have default values if missing, but only if they are not being partially updated
  if (!('firstName' in normalizedUser) && !normalizedUser.firstName) normalizedUser.firstName = '';
  if (!('lastName' in normalizedUser) && !normalizedUser.lastName) normalizedUser.lastName = '';
  if (!('username' in normalizedUser) && !normalizedUser.username && normalizedUser.email) {
    normalizedUser.username = normalizedUser.email.split('@')[0];
  }
  // Don't override profilePicture/coverPhoto with defaults if they are being explicitly set to empty or are already set
  if (!('profilePicture' in normalizedUser) && !normalizedUser.profileImage) normalizedUser.profileImage = 'default-avatar.png';
  if (!('coverPhoto' in normalizedUser) && !normalizedUser.coverPhoto) normalizedUser.coverPhoto = 'default-cover.png';

  // console.log('Normalized user data:', normalizedUser);
  return normalizedUser as User;
};

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: { user: User | Record<string, unknown>; token: string } }
  | { type: 'REGISTER_SUCCESS'; payload: { user: User | Record<string, unknown>; token: string } }
  | { type: 'USER_LOADED'; payload: { user: User | Record<string, unknown>; token: string } }
  | { type: 'AUTH_ERROR'; payload?: string } // Optional payload for specific auth errors
  | { type: 'LOGIN_FAIL'; payload: string }
  | { type: 'REGISTER_FAIL'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'PROFILE_UPDATED'; payload: { user: Partial<User> } }; // For profile updates

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (firstName:string, lastName:string, username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserInContext: (updatedUserData: Partial<User>) => void; // To update user after profile edit
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true, // Start with loading true to load user
  error: null,
};

const AuthContext = createContext<AuthContextType>({
  ...initialState,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUserInContext: () => {},
});

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        user: normalizeUser(action.payload.user),
        token: action.payload.token,
        loading: false,
        error: null,
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', action.payload.token);
      }
      return {
        ...state,
        isAuthenticated: true,
        user: normalizeUser(action.payload.user),
        token: action.payload.token,
        loading: false,
        error: null,
      };
    case 'PROFILE_UPDATED':
        if (!state.user) return state; // Should not happen if user is logged in
        return {
            ...state,
            // Merge existing user data with the updated fields
            user: normalizeUser({ ...state.user, ...action.payload.user }),
        };
    case 'AUTH_ERROR':
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        // Use payload if provided, otherwise set error to null
        error: action.payload || null,
      };
    case 'LOGIN_FAIL':
    case 'REGISTER_FAIL':
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        // Use payload if available, otherwise a generic message
        error: action.payload || 'An error occurred',
      };
    case 'LOGOUT':
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      return {
        ...initialState, // Reset to initial state, but keep loading false
        loading: false,
      };
    default:
      return state;
  }
};

export const AuthProvider: FC<{children: ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const loadUser = async () => {
      if (typeof window === 'undefined') {
        dispatch({ type: 'AUTH_ERROR', payload: 'Cannot load user on server.' });
        return;
      }
      
      // Check if we're on an auth page where no token is expected
      const isAuthPage = () => {
        const path = window.location.pathname;
        return path === '/login' || path === '/register' || path === '/forgot-password';
      };
      
      const token = localStorage.getItem('token');
      if (!token) {
        // Don't set an error message for auth pages
        if (!isAuthPage()) {
          dispatch({ type: 'AUTH_ERROR', payload: 'No token found.' });
        } else {
          // Just set loading to false without an error for auth pages
          dispatch({ type: 'AUTH_ERROR' }); // No payload means no error message
        }
        return;
      }

      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      try {
        const res = await axiosInstance.get('/auth/me');
        console.log('User data from API (/auth/me) on load:', res.data);
        
        dispatch({
          type: 'USER_LOADED',
          payload: { 
            user: res.data.user || res.data, // Backend might return { user: ... } or user directly
            token: token
          },
        });
      } catch (err: unknown) {
        console.error('Error loading user in AuthProvider:', err);
        delete axiosInstance.defaults.headers.common['Authorization'];
        dispatch({ type: 'AUTH_ERROR', payload: 'Failed to load user session.' });
      }
    };

    loadUser();
  }, []);

  const extractErrorMessage = (error: unknown): string => {
    if (isAxiosError(error)) { // Use the imported isAxiosError
      return error.response?.data?.message || error.message || 'An error occurred with the request';
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected error occurred';
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await axiosInstance.post('/auth/login', { email, password });
      
      // Set token in localStorage and axios headers
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', res.data.token);
      }
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      
      // Dispatch login success to update state
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data,
      });
      
      // Force a full page reload after login
      if (typeof window !== 'undefined') {
        // Small delay to ensure state is saved
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
      
      return res.data;
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err);
      dispatch({ type: 'LOGIN_FAIL', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const register = async (firstName: string, lastName: string, username: string, email: string, password: string) => {
    try {
      const res = await axiosInstance.post('/auth/register', { firstName, lastName, username, email, password });
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: res.data,
      });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err);
      dispatch({ type: 'REGISTER_FAIL', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    delete axiosInstance.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' });
  };

  const updateUserInContext = (updatedUserData: Partial<User>) => {
    console.log("AuthContext: Updating user with data:", updatedUserData);
    dispatch({ type: 'PROFILE_UPDATED', payload: { user: updatedUserData } });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateUserInContext, // Provide this function to consumers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;