// src/components/PricingCard.tsx

import { Check } from 'lucide-react';

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  checks: string;
  fixes: string;
  features: string[];
  cta: string;
  tier: 'free' | 'basic' | 'pro';
  popular?: boolean;
  isLoading?: boolean;
  onSelect: (tier: 'basic' | 'pro') => void;
}

export default function PricingCard({
  name,
  price,
  period,
  description,
  checks,
  fixes,
  features,
  cta,
  tier,
  popular = false,
  isLoading = false,
  onSelect,
}: PricingCardProps) {
  return (
    <div
      className={`relative rounded-2xl border-2 p-8 bg-white shadow-lg transition-all hover:shadow-xl ${
        popular ? 'border-blue-500 scale-105' : 'border-gray-200'
      }`}
    >
      {/* Popular Badge */}
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}

      {/* Plan Name */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>

      {/* Price */}
      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center">
          <span className="text-5xl font-extrabold text-gray-900">{price}</span>
          <span className="text-gray-500 ml-2">/{period}</span>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          <div>{checks}</div>
          <div>{fixes}</div>
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={() => {
          if (tier === 'free') {
            window.location.href = '/signup';
          } else {
            onSelect(tier);
          }
        }}
        disabled={isLoading}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
          popular
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 mr-2"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          cta
        )}
      </button>
    </div>
  );
}