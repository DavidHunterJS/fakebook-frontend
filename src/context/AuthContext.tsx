// src/context/AuthContext.tsx
import React, { createContext, useReducer, useEffect, ReactNode, FC } from 'react';
import { isAxiosError } from 'axios';
import axiosInstance from '../utils/api'; // Assuming your axios instance is in utils/api
import { User } from '../types/user'; // Adjust path as needed

// Helper function to normalize user data (ensure it's consistent)
const normalizeUser = (userData: User | Partial<User> | Record<string, unknown> | null): User | null => {
  if (!userData) return null;

  const normalizedUser = { ...userData } as Partial<User>;

  if (!normalizedUser._id && 'id' in normalizedUser && typeof normalizedUser.id === 'string') {
    normalizedUser._id = normalizedUser.id;
  }

  if (!('firstName' in normalizedUser) && !normalizedUser.firstName) normalizedUser.firstName = '';
  if (!('lastName' in normalizedUser) && !normalizedUser.lastName) normalizedUser.lastName = '';
  if (!('username' in normalizedUser) && !normalizedUser.username && normalizedUser.email) {
    normalizedUser.username = normalizedUser.email.split('@')[0];
  }
  if (!('profilePicture' in normalizedUser) && !normalizedUser.profileImage) normalizedUser.profileImage = 'default-avatar.png';
  if (!('coverPhoto' in normalizedUser) && !normalizedUser.coverPhoto) normalizedUser.coverPhoto = 'default-cover.png';

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
    { type: 'LOADING' } 
  | { type: 'LOGIN_SUCCESS'; payload: { user: User | Record<string, unknown>; token: string } }
  | { type: 'REGISTER_SUCCESS'; payload: { user: User | Record<string, unknown>; token: string } }
  | { type: 'USER_LOADED'; payload: { user: User | Record<string, unknown>; token: string } }
  | { type: 'AUTH_ERROR'; payload?: string }
  | { type: 'LOGIN_FAIL'; payload: string }
  | { type: 'REGISTER_FAIL'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'PROFILE_UPDATED'; payload: { user: Partial<User> } };

// ✅ FIXED: Added authToken to the context type definition.
interface AuthContextType extends AuthState {
  authToken: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (firstName:string, lastName:string, username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserInContext: (updatedUserData: Partial<User>) => void;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  error: null,
};

const AuthContext = createContext<AuthContextType>({
  ...initialState,
  authToken: null, // Add to initial context value
  login: async () => Promise.reject(new Error('Login function not yet initialized.')),
  register: async () => {},
  logout: () => {},
  updateUserInContext: () => {},
});

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null };
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
        if (!state.user) return state;
        return {
            ...state,
            user: normalizeUser({ ...state.user, ...action.payload.user }),
        };
    case 'AUTH_ERROR':
    case 'LOGIN_FAIL':
    case 'REGISTER_FAIL':
    case 'LOGOUT':
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      return {
        ...initialState,
        loading: false,
        error: (action.type !== 'LOGOUT' && action.payload) ? action.payload : null,
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
      
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch({ type: 'AUTH_ERROR' });
        return;
      }

      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      try {
        const res = await axiosInstance.get('/auth/me');        
        dispatch({
          type: 'USER_LOADED',
          payload: { 
            user: res.data.user || res.data,
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
    if (isAxiosError(error)) {
      return error.response?.data?.message || error.message || 'An error occurred with the request';
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected error occurred';
  };

  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOADING' });
    try {
      const res = await axiosInstance.post('/auth/login', { email, password });
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', res.data.token);
      }
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data,
      });
      
      return res.data.user;
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
    dispatch({ type: 'PROFILE_UPDATED', payload: { user: updatedUserData } });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        // ✅ FIXED: Map the `token` from state to `authToken` for consumers.
        authToken: state.token,
        login,
        register,
        logout,
        updateUserInContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
