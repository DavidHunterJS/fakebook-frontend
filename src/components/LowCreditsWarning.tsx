// src/components/LowCreditsWarning.tsx

import { AlertCircle, X } from 'lucide-react';
import { useState } from 'react';

interface LowCreditsWarningProps {
  onUpgradeClick: () => void;
}

export default function LowCreditsWarning({ onUpgradeClick }: LowCreditsWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 relative">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-orange-500 mr-3 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-orange-800 mb-1">
            Running Low on Credits
          </h3>
          <p className="text-sm text-orange-700 mb-3">
            You're down to your last few credits. Upgrade now to keep checking your images.
          </p>
          <button
            onClick={onUpgradeClick}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors"
          >
            Upgrade to Basic - $49/month
          </button>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-orange-500 hover:text-orange-700 ml-4"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}