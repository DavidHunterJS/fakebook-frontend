// src/pages/subscription/cancel.tsx

import { useRouter } from 'next/router';
import { Box, Typography, Button } from '@mui/material';

export default function SubscriptionCancel() {
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom, #fef2f2, #ffffff)',
        px: 4,
      }}
    >
      <Box sx={{ textAlign: 'center', maxWidth: 500 }}>
        {/* Cancel Icon */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <Typography sx={{ fontSize: 48, color: 'white' }}>✕</Typography>
        </Box>

        {/* Cancel Message */}
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
          Checkout Cancelled
        </Typography>

        <Typography sx={{ color: 'text.secondary', mb: 4 }}>
          No charges were made. You can upgrade anytime when you&apos;re ready.
        </Typography>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={() => router.push('/pricing')}
          >
            View Pricing
          </Button>
          <Button
            variant="outlined"
            onClick={() => router.push('/')}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
