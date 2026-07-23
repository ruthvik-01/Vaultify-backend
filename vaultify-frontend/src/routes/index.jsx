import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useFiles } from '../context/FileContext';
import DashboardLayout from '../layouts/DashboardLayout';
import AuthLayout from '../layouts/AuthLayout';

// Guest Pages & Landing
import Landing from '../pages/LandingNew';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import VerifyEmail from '../pages/VerifyEmail';
import ResetPassword from '../pages/ResetPassword';
import PublicShare from '../pages/PublicShare';

// Inner Dashboard Pages
import Dashboard from '../pages/Dashboard';
import UploadFiles from '../pages/UploadFiles';
import Videos from '../pages/Videos';
import Work from '../pages/Work';
import Trash from '../pages/Trash';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';

import AdminLayout from '../layouts/AdminLayout';
import AdminLogin from '../pages/admin/AdminLogin';
import AdminProtectedRoute from './AdminProtectedRoute';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminTeams from '../pages/admin/AdminTeams';
import AdminUploads from '../pages/admin/AdminUploads';
import AdminAnalytics from '../pages/admin/AdminAnalytics';
import AdminSettings from '../pages/admin/AdminSettings';

// Protected Route wrapper
function ProtectedRoute() {
  const { isAuthenticated } = useFiles();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public SaaS Landing Page */}
      <Route path="/" element={<Landing />} />

      {/* Public Share Access Route */}
      <Route path="/share/:token" element={<PublicShare />} />

      {/* Admin Login Route (Unauthenticated) */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Public/Guest Authentication Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Authenticated Dashboard Core Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-files" element={<Videos />} />
          <Route path="/work" element={<Work />} />
          <Route path="/upload" element={<UploadFiles />} />
          <Route path="/trash" element={<Trash />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Protected Admin Monitoring Portal Routes */}
      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/teams" element={<AdminTeams />} />
          <Route path="/admin/uploads" element={<AdminUploads />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>

      {/* Fallback Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
