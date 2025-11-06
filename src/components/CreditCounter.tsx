// src/components/CreditCounter.tsx

import { AlertCircle } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

interface CreditCounterProps {
  onClick?: () => void;
}

export default function CreditCounter({ onClick }: CreditCounterProps) {
  const { subscription, isLoading, getRemainingCredits } = useSubscription();

  if (isLoading || !subscription) {
    return (
      <div className="animate-pulse bg-gray-200 h-10 w-32 rounded-lg" />
    );
  }

  const checksRemaining = getRemainingCredits('check');
  const fixesRemaining = getRemainingCredits('fix');
  const isLow = checksRemaining <= 2 || fixesRemaining <= 2;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all hover:scale-105 ${
        isLow
          ? 'border-orange-500 bg-orange-50 text-orange-700'
          : 'border-gray-300 bg-white text-gray-700'
      }`}
    >
      {isLow && <AlertCircle className="h-4 w-4" />}
      <div className="text-sm">
        <div className="font-semibold">
          {checksRemaining} checks • {fixesRemaining} fixes
        </div>
        {subscription.tier !== 'Free' && (
          <div className="text-xs opacity-75">
            {subscription.tier} Plan
          </div>
        )}
      </div>
    </button>
  );
}