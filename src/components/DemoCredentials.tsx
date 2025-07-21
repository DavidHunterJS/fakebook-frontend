"use client";

import React, { useState } from 'react';
import { Box, Typography, Alert, Tooltip, IconButton, AlertTitle } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const DemoCredentials = () => {
  const [emailTooltip, setEmailTooltip] = useState('Copy');
  const [passwordTooltip, setPasswordTooltip] = useState('Copy');

  const DEMO_EMAIL = 'test4@example.com';
  const DEMO_PASSWORD = 'P@ssword123!';

  const handleCopyToClipboard = (textToCopy: string, type: 'email' | 'password') => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      if (type === 'email') {
        setEmailTooltip('Copied!');
        setTimeout(() => setEmailTooltip('Copy'), 2000);
      } else {
        setPasswordTooltip('Copied!');
        setTimeout(() => setPasswordTooltip('Copy'), 2000);
      }
    });
  };

  const CredentialLine = ({ label, value, tooltip, onCopy }: { label: string, value: string, tooltip: string, onCopy: () => void }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <Typography variant="body2">
        <strong>{label}:</strong> {value}
      </Typography>
      <Tooltip title={tooltip} placement="right">
        <IconButton onClick={onCopy} size="small">
          <ContentCopyIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <Alert severity="info" sx={{ mt: 3, '& .MuiAlert-message': { width: '100%' } }}>
      <AlertTitle>Demo Account</AlertTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <CredentialLine
          label="Email"
          value={DEMO_EMAIL}
          tooltip={emailTooltip}
          onCopy={() => handleCopyToClipboard(DEMO_EMAIL, 'email')}
        />
        <CredentialLine
          label="Password"
          value={DEMO_PASSWORD}
          tooltip={passwordTooltip}
          onCopy={() => handleCopyToClipboard(DEMO_PASSWORD, 'password')}
        />
      </Box>
    </Alert>
  );
};

export default DemoCredentials;