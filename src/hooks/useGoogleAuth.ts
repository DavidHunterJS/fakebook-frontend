import { useState, useCallback } from 'react';

// interface GoogleAuthResponse {
//   access_token: string;
//   id_token: string;
//   scope: string;
//   token_type: string;
//   expires_in: number;
// }

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  // const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

  const loginWithGoogle = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Client ID not configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Create Google OAuth URL
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: `${window.location.origin}/auth/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state: Math.random().toString(36).substring(7) // Simple state for CSRF protection
    });

    const googleAuthUrl = `https://accounts.google.com/oauth/authorize?${params.toString()}`;
    
    // Redirect to Google
    window.location.href = googleAuthUrl;
  }, [GOOGLE_CLIENT_ID]);

  return {
    loginWithGoogle,
    isLoading,
    error
  };
};