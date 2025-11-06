// src/components/DebugPanel.tsx
import { useSubscription } from '../hooks/useSubscription';

export default function DebugPanel() {
  const { subscription, isLoading } = useSubscription();

  if (isLoading) return <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg">Loading...</div>;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg text-xs max-w-sm z-50">
      <div className="font-bold mb-2">🔍 Subscription Debug</div>
      <div className="space-y-1">
        <div><strong>Tier:</strong> {subscription?.tier}</div>
        <div><strong>Status:</strong> {subscription?.status}</div>
        <div className="border-t border-gray-700 my-2 pt-2">
          <strong>Checks:</strong>
          {subscription?.tier === 'Free' ? (
            <div className="ml-2">
              Total: {subscription.credits.checks.total}<br/>
              Used: {subscription.credits.checks.used}<br/>
              <strong className="text-green-400">Remaining: {subscription.credits.checks.remaining}</strong>
            </div>
          ) : (
            <div className="ml-2">
              Monthly: {subscription?.credits.checks.monthly}<br/>
              Used: {subscription?.credits.checks.monthlyUsed}<br/>
              Rollover: {subscription?.credits.checks.rollover}<br/>
              <strong className="text-green-400">Available: {subscription?.credits.checks.totalAvailable}</strong>
            </div>
          )}
        </div>
        <div className="border-t border-gray-700 my-2 pt-2">
          <strong>Fixes:</strong>
          {subscription?.tier === 'Free' ? (
            <div className="ml-2">
              Total: {subscription.credits.fixes.total}<br/>
              Used: {subscription.credits.fixes.used}<br/>
              <strong className="text-green-400">Remaining: {subscription.credits.fixes.remaining}</strong>
            </div>
          ) : (
            <div className="ml-2">
              Monthly: {subscription?.credits.fixes.monthly}<br/>
              Used: {subscription?.credits.fixes.monthlyUsed}<br/>
              Rollover: {subscription?.credits.fixes.rollover}<br/>
              <strong className="text-green-400">Available: {subscription?.credits.fixes.totalAvailable}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}