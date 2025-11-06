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
    } catch (err: any) {
      console.error('DEBUG: Error caught in useSubscription:', err); 
      
      let isAuthError = false;
      
      if (err.response && err.response.status === 401) {
        isAuthError = true;
      } else if (err.message && (err.message.includes('401') || err.message.toLowerCase().includes('not authenticated'))) {
        isAuthError = true;
      }

      if (isAuthError) {
        setSubscription(null); 
      } else {
        setError(err.message || 'Failed to load subscription data.');
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