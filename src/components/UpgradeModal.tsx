// src/components/UpgradeModal.tsx

import { X } from 'lucide-react';
import { useState } from 'react';
import PricingCard from './PricingCard';
import { subscriptionService } from '../services/subscriptionService';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerSource?: 'credit_exhausted' | 'low_credits' | 'manual_click';
}

export default function UpgradeModal({
  isOpen,
  onClose,
  triggerSource = 'manual_click',
}: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpgrade = async (tier: 'basic' | 'pro') => {
    setIsLoading(true);
    setLoadingTier(tier);

    try {
      const { url } = await subscriptionService.createCheckoutSession(
        tier === 'basic' ? 'Basic' : 'Pro'
      );
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Failed to start checkout. Please try again.');
      setIsLoading(false);
      setLoadingTier(null);
    }
  };

  const plans = [
    {
      name: 'Basic',
      price: '$49',
      period: 'per month',
      description: 'For sellers with regular compliance needs',
      checks: '50 checks/month',
      fixes: '25 fixes/month',
      features: [
        '50 image checks per month',
        '25 image fixes per month',
        'Rollover credits (up to 200 checks)',
        'Email support',
        'Priority queue',
      ],
      cta: 'Upgrade to Basic',
      tier: 'basic' as const,
      popular: true,
    },
    {
      name: 'Pro',
      price: '$99',
      period: 'per month',
      description: 'For high-volume sellers and agencies',
      checks: '150 checks/month',
      fixes: '75 fixes/month',
      features: [
        '150 image checks per month',
        '75 image fixes per month',
        'Rollover credits (up to 500 checks)',
        'Priority support',
        'Bulk processing',
      ],
      cta: 'Upgrade to Pro',
      tier: 'pro' as const,
      popular: false,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="text-center pt-8 pb-6 px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {triggerSource === 'credit_exhausted' && "You've Used All Your Credits"}
            {triggerSource === 'low_credits' && "Running Low on Credits"}
            {triggerSource === 'manual_click' && 'Upgrade Your Plan'}
          </h2>
          <p className="text-gray-600">
            {triggerSource === 'credit_exhausted' &&
              'Upgrade to keep checking your Amazon images for compliance.'}
            {triggerSource === 'low_credits' &&
              "You're almost out of credits. Upgrade for unlimited peace of mind."}
            {triggerSource === 'manual_click' &&
              'Choose the plan that fits your Amazon compliance needs.'}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 px-8 pb-8">
          {plans.map((plan) => (
            <PricingCard
              key={plan.tier}
              {...plan}
              isLoading={isLoading && loadingTier === plan.tier}
              onSelect={handleUpgrade}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 text-center text-sm text-gray-600 rounded-b-2xl">
          ✅ Cancel anytime • ✅ Credits roll over • ✅ No hidden fees
        </div>
      </div>
    </div>
  );
}