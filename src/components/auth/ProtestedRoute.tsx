// src/components/auth/ProtectedRoute.jsx
import React from 'react';
import  {Navigate, Outlet } from 'react-router-dom';
import  useAuth  from '../../hooks/useAuth'

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner
  }

  // If the user is logged in AND is an admin, show the page. Otherwise, redirect.
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoute;