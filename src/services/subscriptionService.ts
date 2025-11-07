// src/services/subscriptionService.ts

import axiosInstance from '../utils/api';
import { AxiosError } from 'axios'; // <-- Import AxiosError

// Helper type for your expected error response body
interface ApiErrorResponse {
  error?: string;
  message?: string;
}

// Helper function to safely extract the error message
function getErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof AxiosError) {
    // Check if the response data matches our expected error shape
    const data = error.response?.data as ApiErrorResponse;
    return data?.error || data?.message || defaultMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
}

export const subscriptionService = {
  async getSubscriptionStatus() {
    try {
      const response = await axiosInstance.get('/subscription/status');
      return response.data;
    } catch (error: unknown) { // <-- Use unknown
      console.error('Subscription status error:', error);
      throw new Error(
        getErrorMessage(error, 'Failed to fetch subscription status')
      );
    }
  },

  async createCheckoutSession(tier: 'Basic' | 'Pro') {
    try {
      const response = await axiosInstance.post('/subscription/create-checkout-session', { tier });
      return response.data;
    } catch (error: unknown) { // <-- Use unknown
      console.error('Checkout session error:', error);
      throw new Error(
        getErrorMessage(error, 'Failed to create checkout session')
      );
    }
  },

  async cancelSubscription() {
    try {
      const response = await axiosInstance.post('/subscription/cancel');
      return response.data;
    } catch (error: unknown) { // <-- Use unknown
      throw new Error(
        getErrorMessage(error, 'Failed to cancel subscription')
      );
    }
  },

  async reactivateSubscription() {
    try {
      const response = await axiosInstance.post('/subscription/reactivate');
      return response.data;
    } catch (error: unknown) { // <-- Use unknown
      throw new Error(
        getErrorMessage(error, 'Failed to reactivate subscription')
      );
    }
  },
};