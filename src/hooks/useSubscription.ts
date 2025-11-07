// src/hooks/useSubscription.ts
import { useState, useEffect, useContext } from 'react';
import { subscriptionService } from '../services/subscriptionService';
import { SubscriptionData } from '../types/subscriptions.types';
import AuthContext from '../context/AuthContext'; // Adjust path if needed

export function useSubscription() {
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

const fetchSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await subscriptionService.getSubscriptionStatus();
      setSubscription(data);
    } catch (err: unknown) { // Keep as unknown
      console.error('DEBUG: Error caught in useSubscription:', err); 
      
      let isAuthError = false;
      let errorMessage = 'Failed to load subscription data.'; // Default message

      // --- Type-safe error handling ---
      
      // Check for Axios-like error structure (e.g., err.response.status)
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err // Check if 'response' key exists
      ) {
        // Safely access the response property
        const response = (err as { response: unknown }).response; 
        
        // Check if response is an object with a 'status' key
        if (
          typeof response === 'object' &&
          response !== null &&
          'status' in response
        ) {
          // Safely access the status property
          const status = (response as { status: unknown }).status; 
          if (status === 401) {
            isAuthError = true;
          }
        }
      }

      // Check for standard Error message
      if (err instanceof Error) {
        errorMessage = err.message;
        if (err.message.includes('401') || err.message.toLowerCase().includes('not authenticated')) {
          isAuthError = true;
        }
      } 
      // Fallback for other objects with a 'message' property
      else if (
        typeof err === 'object' &&
        err !== null &&
        'message' in err // Check if 'message' key exists
      ) {
        // Safely access the message property and check if it's a string
        const message = (err as { message: unknown }).message;
        if (typeof message === 'string') {
          errorMessage = message;
          if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('not authenticated')) {
            isAuthError = true;
          }
        }
      }
      // --- End of type-safe handling ---

      if (isAuthError) {
        setSubscription(null); 
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Wait for auth to finish loading first
    if (authLoading) {
      return;
    }

    // Only fetch subscription if user is authenticated
    if (isAuthenticated) {
      fetchSubscription();
    } else {
      // User is not authenticated, set clean state
      setIsLoading(false);
      setSubscription(null);
      setError(null);
    }
  }, [isAuthenticated, authLoading]); // Re-run when auth status changes

  const hasCreditsFor = (actionType: 'check' | 'fix'): boolean => {
    if (!subscription) return false;
    const credits = subscription.credits[actionType === 'check' ? 'checks' : 'fixes'];
    if (subscription.tier === 'Free') {
      return (credits.remaining || 0) > 0;
    }
    return (credits.totalAvailable || 0) > 0;
  };

  const getRemainingCredits = (actionType: 'check' | 'fix'): number => {
    if (!subscription) return 0;
    const credits = subscription.credits[actionType === 'check' ? 'checks' : 'fixes'];
    if (subscription.tier === 'Free') {
      return credits.remaining || 0;
    }
    return credits.totalAvailable || 0;
  };

  const isLowOnCredits = (actionType: 'check' | 'fix'): boolean => {
    const remaining = getRemainingCredits(actionType);
    return remaining > 0 && remaining <= 2;
  };

  return {
    subscription,
    isLoading,
    error,
    refetch: fetchSubscription,
    hasCreditsFor,
    getRemainingCredits,
    isLowOnCredits,
  };
}