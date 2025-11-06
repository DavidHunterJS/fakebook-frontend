// src/pages/SubscriptionCancel.tsx

import { useRouter } from 'next/router';
import { XCircle } from 'lucide-react';

export default function SubscriptionCancel() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <XCircle className="h-16 w-16 text-gray-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Checkout Cancelled
        </h1>
        <p className="text-gray-600 mb-8">
          No charges were made. You can try again anytime you're ready to upgrade.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push('/pricing')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            View Pricing
          </button>
          <button
            onClick={() => router.push('/')}
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}