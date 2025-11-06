// src/services/subscriptionService.ts

import axiosInstance from '../utils/api';

export const subscriptionService = {
  async getSubscriptionStatus() {
    try {
      const response = await axiosInstance.get('/subscription/status');
      return response.data;
    } catch (error: any) {
      console.error('Subscription status error:', error);
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to fetch subscription status');
    }
  },

  async createCheckoutSession(tier: 'Basic' | 'Pro') {
    try {
      const response = await axiosInstance.post('/subscription/create-checkout-session', { tier });
      return response.data;
    } catch (error: any) {
      console.error('Checkout session error:', error);
      throw new Error(error.response?.data?.error || 'Failed to create checkout session');
    }
  },

  async cancelSubscription() {
    try {
      const response = await axiosInstance.post('/subscription/cancel');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to cancel subscription');
    }
  },

  async reactivateSubscription() {
    try {
      const response = await axiosInstance.post('/subscription/reactivate');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to reactivate subscription');
    }
  },
};
