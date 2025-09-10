// // components/auth/RegistrationForm.tsx
// import { useState, useContext, FormEvent } from 'react';
// import { useRouter } from 'next/router';
// import Link from 'next/link';
// import { 
//   Box, 
//   Button, 
//   TextField, 
//   Typography, 
//   Paper, 
//   Alert, 
//   CircularProgress 
// } from '@mui/material';
// import AuthContext from '../context/AuthContext';
// import PasswordStrengthIndicator from '../components/auth/PasswordStrengthIndicator';

// // Define the error type for API errors
// interface ApiError {
//   response?: {
//     data?: {
//       errors?: Record<string, string>;
//       message?: string;
//     };
//   };
// }

// const RegistrationForm = () => {
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     username: '',
//     email: '',
//     password: '',
//     password2: '',
//   });
//   const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
//   const [isSubmitting, setIsSubmitting] = useState(false);
  
//   const router = useRouter();
//   const { register, error, isAuthenticated } = useContext(AuthContext);
  
//   // Redirect if already authenticated
//   if (isAuthenticated) {
//     router.push('/dashboard');
//     return null;
//   }
  
//   const validateForm = () => {
//     // Create a local errors object
//     const validationErrors: {[key: string]: string} = {};
    
//     // First Name validation
//     if (!formData.firstName.trim()) {
//       validationErrors.firstName = 'First name is required';
//     } else if (formData.firstName.trim().length < 3) {
//       validationErrors.firstName = 'First name must be at least 3 characters';
//     } else if (formData.firstName.trim().length > 30) {
//       validationErrors.firstName = 'First name cannot exceed 30 characters';
//     }
    
//     // Last Name validation
//     if (!formData.lastName.trim()) {
//       validationErrors.lastName = 'Last name is required';
//     } else if (formData.lastName.trim().length < 3) {
//       validationErrors.lastName = 'Last name must be at least 3 characters';
//     } else if (formData.lastName.trim().length > 30) {
//       validationErrors.lastName = 'Last name cannot exceed 30 characters';
//     }
    
//     // Username validation
//     if (!formData.username.trim()) {
//       validationErrors.username = 'Username is required';
//     } else if (formData.username.trim().length < 3) {
//       validationErrors.username = 'Username must be at least 3 characters';
//     } else if (formData.username.trim().length > 20) {
//       validationErrors.username = 'Username cannot exceed 20 characters';
//     } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
//       validationErrors.username = 'Username can only contain letters, numbers, and underscores';
//     }
    
//     // Email validation
//     if (!formData.email) {
//       validationErrors.email = 'Email is required';
//     } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
//       validationErrors.email = 'Please enter a valid email address';
//     }
    
//     // Password validation
//     if (!formData.password) {
//       validationErrors.password = 'Password is required';
//     } else {
//       // Check password length
//       if (formData.password.length < 8) {
//         validationErrors.password = 'Password must be at least 8 characters';
//       }
      
//       // Check for number
//       if (!/\d/.test(formData.password)) {
//         validationErrors.password = validationErrors.password || 'Password must contain at least one number';
//       }
      
//       // Check for uppercase letter
//       if (!/[A-Z]/.test(formData.password)) {
//         validationErrors.password = validationErrors.password || 'Password must contain at least one uppercase letter';
//       }
      
//       // Check for lowercase letter
//       if (!/[a-z]/.test(formData.password)) {
//         validationErrors.password = validationErrors.password || 'Password must contain at least one lowercase letter';
//       }
      
//       // Check for special character
//       if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
//         validationErrors.password = validationErrors.password || 'Password must contain at least one special character';
//       }
//     }
    
//     // Password confirmation validation
//     if (!formData.password2) {
//       validationErrors.password2 = 'Please confirm your password';
//     } else if (formData.password !== formData.password2) {
//       validationErrors.password2 = 'Passwords do not match';
//     }
    
//     setFormErrors(validationErrors);
//     return Object.keys(validationErrors).length === 0;
//   };
  
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
    
//     // Clear the error for this field when the user starts typing
//     if (formErrors[name]) {
//       setFormErrors(prev => ({ ...prev, [name]: '' }));
//     }
//   };
  
//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
    
//     if (!validateForm()) {
//       return;
//     }
    
//     setIsSubmitting(true);
    
//     try {
//       await register(
//         formData.firstName,
//         formData.lastName,
//         formData.username,
//         formData.email,
//         formData.password
//       );
//       // If registration is successful, the auth context will redirect to dashboard
//     } catch (err: unknown) {
//       console.error('Registration failed:', err);
      
//       // Type guard to check if this is an API error
//       if (err && typeof err === 'object' && 'response' in err) {
//         const errorObj = err as ApiError;
        
//         // Use optional chaining to safely access nested properties
//         const serverErrors = errorObj.response?.data?.errors;
//         if (serverErrors) {
//           setFormErrors(prevErrors => ({
//             ...prevErrors,
//             ...serverErrors
//           }));
//         }
//       }
//     } finally {
//       setIsSubmitting(false);
//     }
//   };
  
//   return (
//     <Box
//       sx={{
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//         minHeight: '100vh',
//         p: 2,
//         bgcolor: '#f5f5f5'
//       }}
//     >
//       <Paper 
//         elevation={3} 
//         sx={{ 
//           p: 4, 
//           width: '100%', 
//           maxWidth: 450,
//           borderRadius: 2 
//         }}
//       >
//         <Typography 
//           variant="h4" 
//           component="h1" 
//           gutterBottom 
//           sx={{ textAlign: 'center', fontWeight: 'bold' }}
//         >
//           Create an Account
//         </Typography>
        
//         {error && (
//           <Alert severity="error" sx={{ mb: 3 }}>
//             {error}
//           </Alert>
//         )}
        
//         <form onSubmit={handleSubmit}>
//           <Box sx={{ display: 'flex', gap: 2 }}>
//             <TextField
//               label="First Name"
//               variant="outlined"
//               fullWidth
//               margin="normal"
//               name="firstName"
//               value={formData.firstName}
//               onChange={handleChange}
//               error={!!formErrors.firstName}
//               helperText={formErrors.firstName}
//               autoFocus
//             />
            
//             <TextField
//               label="Last Name"
//               variant="outlined"
//               fullWidth
//               margin="normal"
//               name="lastName"
//               value={formData.lastName}
//               onChange={handleChange}
//               error={!!formErrors.lastName}
//               helperText={formErrors.lastName}
//             />
//           </Box>
          
//           <TextField
//             label="Username"
//             variant="outlined"
//             fullWidth
//             margin="normal"
//             name="username"
//             value={formData.username}
//             onChange={handleChange}
//             error={!!formErrors.username}
//             helperText={formErrors.username || "Letters, numbers, and underscores only"}
//             InputProps={{
//               startAdornment: <span style={{ color: '#666' }}>@</span>
//             }}
//           />
          
//           <TextField
//             label="Email Address"
//             variant="outlined"
//             fullWidth
//             margin="normal"
//             type="email"
//             name="email"
//             value={formData.email}
//             onChange={handleChange}
//             error={!!formErrors.email}
//             helperText={formErrors.email}
//           />
          
//           <TextField
//             label="Password"
//             variant="outlined"
//             fullWidth
//             margin="normal"
//             type="password"
//             name="password"
//             value={formData.password}
//             onChange={handleChange}
//             error={!!formErrors.password}
//             helperText={formErrors.password}
//           />
          
//           {formData.password && <PasswordStrengthIndicator password={formData.password} />}
          
//           <TextField
//             label="Confirm Password"
//             variant="outlined"
//             fullWidth
//             margin="normal"
//             type="password"
//             name="password2"
//             value={formData.password2}
//             onChange={handleChange}
//             error={!!formErrors.password2}
//             helperText={formErrors.password2}
//           />
          
//           <Button
//             type="submit"
//             variant="contained"
//             color="primary"
//             fullWidth
//             size="large"
//             disabled={isSubmitting}
//             sx={{ 
//               mt: 3, 
//               mb: 2,
//               py: 1.5,
//               bgcolor: '#1877f2',
//               '&:hover': {
//                 bgcolor: '#166fe5',
//               }
//             }}
//           >
//             {isSubmitting ? (
//               <CircularProgress size={24} color="inherit" />
//             ) : (
//               'Register'
//             )}
//           </Button>
          
//           <Box sx={{ textAlign: 'center', mt: 2 }}>
//             <Typography variant="body2">
//               Already have an account?{' '}
//               <Link href="/login" style={{ color: '#1877f2', fontWeight: 'bold' }}>
//                 Log in
//               </Link>
//             </Typography>
//           </Box>
//         </form>
//       </Paper>
//     </Box>
//   );
// };

// export default RegistrationForm;