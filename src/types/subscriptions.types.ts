// src/types/subscription.types.ts

export type Tier = 'Free' | 'Basic' | 'Pro';
export type SubscriptionStatus = 'Active' | 'Cancelled' | 'Past Due';

export interface CreditInfo {
  checks: {
    total?: number;
    used?: number;
    remaining?: number;
    monthly?: number;
    monthlyUsed?: number;
    monthlyRemaining?: number;
    rollover?: number;
    totalAvailable?: number;
  };
  fixes: {
    total?: number;
    used?: number;
    remaining?: number;
    monthly?: number;
    monthlyUsed?: number;
    monthlyRemaining?: number;
    rollover?: number;
    totalAvailable?: number;
  };
}

export interface SubscriptionData {
  tier: Tier;
  status: SubscriptionStatus;
  lastResetDate: Date;
  credits: CreditInfo;
}