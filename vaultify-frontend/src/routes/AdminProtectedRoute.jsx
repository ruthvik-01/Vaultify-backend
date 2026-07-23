import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { adminService } from '../services/adminService';

export default function AdminProtectedRoute() {
  const isAuth = adminService.isAuthenticated();

  if (!isAuth) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
