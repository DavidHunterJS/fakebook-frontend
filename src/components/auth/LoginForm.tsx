import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { TextField, Button, Box, Alert } from '@mui/material';
import useAuth from '../../hooks/useAuth';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password should be of minimum 6 characters')
    .required('Password is required'),
});

const LoginForm = () => {
  const { login, error } = useAuth();

  const displayError = error && error !== 'No token found.' ? error : '';

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        // ✅ 3. Capture the user object returned from the login function
        const user = await login(values.email, values.password);

        // ✅ This logic now uses window.location.assign
        if (user && user.role === 'admin') {
          window.location.assign('/admin'); // Force a full page load to the admin dashboard
        } else {
          window.location.assign('/dashboard'); // Force a full page load to the regular dashboard
        }
      } catch (err) {
        // The error will be caught and displayed by the 'displayError' variable
        console.error("Login failed on form submission:", err);
        setSubmitting(false);
      }
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ width: '100%' }}>
      {displayError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {displayError}
        </Alert>
      )}
      <TextField
        fullWidth
        id="email"
        name="email"
        label="Email"
        value={formik.values.email}
        onChange={formik.handleChange}
        error={formik.touched.email && Boolean(formik.errors.email)}
        helperText={formik.touched.email && formik.errors.email}
        margin="normal"
      />
      <TextField
        fullWidth
        id="password"
        name="password"
        label="Password"
        type="password"
        value={formik.values.password}
        onChange={formik.handleChange}
        error={formik.touched.password && Boolean(formik.errors.password)}
        helperText={formik.touched.password && formik.errors.password}
        margin="normal"
      />
      <Button
        color="primary"
        variant="contained"
        fullWidth
        type="submit"
        disabled={formik.isSubmitting} // Use formik's submitting state
        sx={{ mt: 3, mb: 2 }}
      >
        {formik.isSubmitting ? 'Logging in...' : 'Login'}
      </Button>
    </Box>
  );
};

export default LoginForm;