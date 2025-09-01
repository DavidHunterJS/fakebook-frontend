// src/context/AuthContext.tsx
import React, { createContext, useReducer, useEffect, ReactNode, FC } from 'react';
import { isAxiosError } from 'axios';
import axiosInstance from '../utils/api';
import { User } from '../types/user';

// Helper function to normalize user data
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
  authMethod: 'token' | 'session' | null; // Track authentication method
}

type AuthAction =
    { type: 'LOADING' } 
  | { type: 'LOGIN_SUCCESS'; payload: { user: User | Record<string, unknown>; token: string } }
  | { type: 'REGISTER_SUCCESS'; payload: { user: User | Record<string, unknown>; token: string } }
  | { type: 'USER_LOADED'; payload: { user: User | Record<string, unknown>; token?: string; authMethod?: 'token' | 'session' } }
  | { type: 'AUTH_ERROR'; payload?: string }
  | { type: 'LOGIN_FAIL'; payload: string }
  | { type: 'REGISTER_FAIL'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'PROFILE_UPDATED'; payload: { user: Partial<User> } };

interface AuthContextType extends AuthState {
  authToken: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (firstName:string, lastName:string, username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserInContext: (updatedUserData: Partial<User>) => void;
  refetchUser: () => Promise<void>; // Add method to refetch user
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  error: null,
  authMethod: null,
};

const AuthContext = createContext<AuthContextType>({
  ...initialState,
  authToken: null,
  login: async () => Promise.reject(new Error('Login function not yet initialized.')),
  register: async () => {},
  logout: () => {},
  updateUserInContext: () => {},
  refetchUser: async () => {},
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
        token: action.payload.token || null,
        authMethod: action.payload.authMethod || (action.payload.token ? 'token' : 'session'),
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
        authMethod: 'token',
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


  const loadUser = async () => {
    if (typeof window === 'undefined') {
      dispatch({ type: 'AUTH_ERROR', payload: 'Cannot load user on server.' });
      return;
    }    
    // 1. Prioritize token-based authentication
    const token = localStorage.getItem('token');

    console.log("Found Token in localStorage:", token);
    
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      console.log("Axios header set:", axiosInstance.defaults.headers.common['Authorization']);

      try {
        // Use a single, consistent endpoint for fetching the user
        const tokenResponse = await axiosInstance.get('/auth/current'); 
        
        if (tokenResponse.data && (tokenResponse.data.user || tokenResponse.data)) {
          dispatch({
            type: 'USER_LOADED',
            payload: { 
              user: tokenResponse.data.user || tokenResponse.data,
              token: token,
              authMethod: 'token'
            },
          });
          return; // Success, stop here
        }
      } catch (tokenError) {
        console.log('Token auth failed, cleaning up and checking for session...' + tokenError);
        localStorage.removeItem('token'); // The token is invalid, remove it
        delete axiosInstance.defaults.headers.common['Authorization'];
      }
    }

    // 2. If no token, THEN try to load user from a session (for OAuth)
    try {
      const sessionResponse = await axiosInstance.get('/auth/current', {
        withCredentials: true,
      });
      
      if (sessionResponse.data && sessionResponse.data.user) {
        dispatch({
          type: 'USER_LOADED',
          payload: { 
            user: sessionResponse.data.user,
            authMethod: 'session'
          },
        });
        return; // Success, stop here
      }
    } catch (sessionError) {
      console.log('Session auth also failed.'+sessionError);
    }

    // 3. If both methods fail, the user is not authenticated.
    dispatch({ type: 'AUTH_ERROR' });
  };

  useEffect(() => {
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
      // ❗️ **ADD THIS:** First, clear any existing server-side session.
      // This sends the connect.sid cookie to the server to be invalidated.
      try {
        await axiosInstance.get('/auth/logout', { withCredentials: true });
      } catch (e) {
        // Don't worry if this fails (e.g., if there was no session).
        // The main goal is to clear a session if it exists.
        console.log("Pre-login logout call did not find an active session, which is okay."+e);
      }

      // Now, proceed with the JWT login as before.
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

  const logout = async () => {
    // ❗️ **CHANGE THIS:** Always attempt to log out of the server-side session.
    try {
      // This will clear the `connect.sid` cookie.
      await axiosInstance.get('/auth/logout', { withCredentials: true });
    } catch (error) {
      console.error('Session logout failed, proceeding with client-side cleanup:', error);
    }
    
    // Always clear the token from Axios headers and localStorage.
    delete axiosInstance.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' }); // This reducer already removes the token from localStorage.
  };

  const updateUserInContext = (updatedUserData: Partial<User>) => {
    dispatch({ type: 'PROFILE_UPDATED', payload: { user: updatedUserData } });
  };

  const refetchUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        authToken: state.token,
        login,
        register,
        logout,
        updateUserInContext,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;