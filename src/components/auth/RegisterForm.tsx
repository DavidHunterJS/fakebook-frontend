// components/auth/RegistrationForm.tsx
import { useState, useContext, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Alert, 
  CircularProgress 
} from '@mui/material';
import AuthContext from '../../context/AuthContext';

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    password2: '',
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();
  const { register, error, isAuthenticated } = useContext(AuthContext);
  
  // Filter out the "No token found" error on the register page
  const displayError = error && error !== 'No token found.' ? error : '';
  
  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/dashboard');
    return null;
  }
  
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.username.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.password2) {
      errors.password2 = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await register(formData.firstName, formData.lastName, formData.username, formData.email, formData.password);
      // If registration is successful, the auth context will redirect to dashboard
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        p: 2,
        bgcolor: '#f5f5f5'
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          width: '100%', 
          maxWidth: 450,
          borderRadius: 2 
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          sx={{ textAlign: 'center', fontWeight: 'bold' }}
        >
          Create an Account
        </Typography>
        
        {displayError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {displayError}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <TextField
            label="Full Name"
            variant="outlined"
            fullWidth
            margin="normal"
            name="name"
            value={formData.username}
            onChange={handleChange}
            error={!!formErrors.name}
            helperText={formErrors.name}
            autoFocus
          />
          
          <TextField
            label="Email Address"
            variant="outlined"
            fullWidth
            margin="normal"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={!!formErrors.email}
            helperText={formErrors.email}
          />
          
          <TextField
            label="Password"
            variant="outlined"
            fullWidth
            margin="normal"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={!!formErrors.password}
            helperText={formErrors.password}
          />
          
          <TextField
            label="Confirm Password"
            variant="outlined"
            fullWidth
            margin="normal"
            type="password"
            name="password2"
            value={formData.password2}
            onChange={handleChange}
            error={!!formErrors.password2}
            helperText={formErrors.password2}
          />
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={isSubmitting}
            sx={{ 
              mt: 3, 
              mb: 2,
              py: 1.5,
              bgcolor: '#1877f2',
              '&:hover': {
                bgcolor: '#166fe5',
              }
            }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Register'
            )}
          </Button>
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#1877f2', fontWeight: 'bold' }}>
                Log in
              </Link>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default RegistrationForm;