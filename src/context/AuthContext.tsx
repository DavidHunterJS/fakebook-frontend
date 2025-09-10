import React, { createContext, useReducer, useEffect, ReactNode, FC } from 'react';
import { isAxiosError } from 'axios';
import axiosInstance from '../utils/api';
import { User } from '../types/user';

// Helper function to normalize user data
const normalizeUser = (userData: User | Partial<User> | Record<string, unknown> | null): User | null => {
  if (!userData) return null;

  const normalizedUser = { ...userData } as Partial<User>;

  // Handle ID normalization
  if (!normalizedUser._id && 'id' in normalizedUser && typeof normalizedUser.id === 'string') {
    normalizedUser._id = normalizedUser.id;
  }

  // Define default values for essential fields
  const defaults = {
    firstName: '',
    lastName: '',
    username: normalizedUser.email?.split('@')[0] || '',
    profileImage: 'default-avatar.png',
    coverPhoto: 'default-cover.png'
  };

  // This loop ensures that default values are applied if a property is missing or falsy.
  (Object.keys(defaults) as Array<keyof typeof defaults>).forEach((key) => {
    if (!normalizedUser[key]) {
      normalizedUser[key] = defaults[key];
    }
  });

  return normalizedUser as User;
};


// --- State and Action Types ---
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOADING' }
  | { type: 'REQUEST_COMPLETE' } 
  | { type: 'AUTH_SUCCESS'; payload: { user: User | Record<string, unknown> } }
  | { type: 'AUTH_ERROR'; payload?: string }
  | { type: 'LOGOUT_SUCCESS' }
  | { type: 'PROFILE_UPDATED'; payload: { user: Partial<User> } };

interface AuthContextType extends AuthState {
  loginWithMagicLink: (email: string) => Promise<void>;
  logout: () => void;
  updateUserInContext: (updatedUserData: Partial<User>) => void;
  refetchUser: () => Promise<void>;
}

// --- Initial State & Context ---
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
};

const AuthContext = createContext<AuthContextType>({
  ...initialState,
  loginWithMagicLink: async () => {},
  logout: () => {},
  updateUserInContext: () => {},
  refetchUser: async () => {},
});

// --- Reducer ---
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'REQUEST_COMPLETE': 
      return { ...state, loading: false, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: normalizeUser(action.payload.user),
        loading: false,
        error: null,
      };
    case 'PROFILE_UPDATED':
      if (!state.user) return state;
      return { ...state, user: normalizeUser({ ...state.user, ...action.payload.user }) };
    case 'AUTH_ERROR':
    case 'LOGOUT_SUCCESS':
      return {
        ...initialState,
        loading: false,
        error: action.type === 'AUTH_ERROR' ? (action.payload || null) : null,
      };
    default:
      return state;
  }
};

// --- Auth Provider ---
export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const extractErrorMessage = (error: unknown): string => {
    if (isAxiosError(error)) return error.response?.data?.message || error.message || 'An error occurred';
    if (error instanceof Error) return error.message;
    return 'An unexpected error occurred';
  };

  const loadUser = async () => {
    dispatch({ type: 'LOADING' });
    try {
      const res = await axiosInstance.get('/auth/current', { withCredentials: true });
      const userData = res.data.user || res.data;
      if (userData && userData._id) {
        dispatch({ type: 'AUTH_SUCCESS', payload: { user: userData } });
      } else {
        dispatch({ type: 'AUTH_ERROR' });
      }
    } catch (error) {
      console.log('No active session found.'+error);
      dispatch({ type: 'AUTH_ERROR' });
    }
  };

  const loginWithMagicLink = async (email: string) => {
    dispatch({ type: 'LOADING' });
    try {
      await axiosInstance.post('/auth/magic-link', { email });
      dispatch({ type: 'REQUEST_COMPLETE' });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err);
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };
  
  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout', {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout failed on the server, clearing client state anyway:', error);
    } finally {
      dispatch({ type: 'LOGOUT_SUCCESS' });
    }
  };

  const updateUserInContext = (updatedUserData: Partial<User>) => {
    dispatch({ type: 'PROFILE_UPDATED', payload: { user: updatedUserData } });
  };

  const refetchUser = async () => await loadUser();
  
  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, loginWithMagicLink, logout, updateUserInContext, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

