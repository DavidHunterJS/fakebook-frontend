// components/auth/PasswordStrengthIndicator.tsx
import { Box, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
  
  return (
    <Box sx={{ mt: 1 }}>
      {requirements.map((req, idx) => (
        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          {req.met ? 
            <CheckCircleIcon color="success" fontSize="small" sx={{ fontSize: 18 }} /> : 
            <CancelIcon color="error" fontSize="small" sx={{ fontSize: 18 }} />}
          <Typography variant="caption">{req.label}</Typography>
        </Box>
      ))}
    </Box>
  );
};

export default PasswordStrengthIndicator;