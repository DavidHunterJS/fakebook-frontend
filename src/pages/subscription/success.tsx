// src/pages/subscription/success.tsx

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Button } from '@mui/material';

export default function SubscriptionSuccess() {
  const router = useRouter();
  const { session_id } = router.query;

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timeout = setTimeout(() => {
      router.push('/');
    }, 5000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom, #f0f9ff, #ffffff)',
        px: 4,
      }}
    >
      <Box sx={{ textAlign: 'center', maxWidth: 500 }}>
        {/* Success Icon */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <Typography sx={{ fontSize: 48 }}>✓</Typography>
        </Box>

        {/* Success Message */}
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
          Subscription Activated! 🎉
        </Typography>

        <Typography sx={{ color: 'text.secondary', mb: 4 }}>
          Your subscription has been successfully activated. You now have access to all premium features and credits!
        </Typography>

        {session_id && (
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 4 }}>
            Session ID: {session_id}
          </Typography>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => router.push('/')}
            sx={{ px: 4 }}
          >
            Start Checking Images
          </Button>
        </Box>

        <Typography sx={{ fontSize: 14, color: 'text.secondary', mt: 3 }}>
          Redirecting automatically in 5 seconds...
        </Typography>
      </Box>
    </Box>
  );
}