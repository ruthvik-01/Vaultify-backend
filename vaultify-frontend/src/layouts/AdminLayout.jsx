import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminErrorBoundary from '../components/admin/AdminErrorBoundary';
import { Menu, WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFiles } from '../context/FileContext';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const location = useLocation();
  const { currentUser, userProfile } = useFiles();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Get dynamic page title from pathname
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/admin/teams')) return 'Monitored Teams';
    if (path.includes('/admin/uploads')) return 'Student Uploads';
    if (path.includes('/admin/settings')) return 'Admin Settings';
    return 'Admin Dashboard';
  };

  return (
    <div className="h-screen w-screen flex bg-brand-cream relative overflow-hidden select-none">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 bg-brand-charcoal z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Admin Sidebar - Locked Height, No Outer Scroll */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform lg:transform-none lg:relative lg:flex h-full shrink-0
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <AdminSidebar onClose={closeSidebar} />
      </div>

      {/* Main Content Area - Locked Height, flex container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Navigation - Fixed size, never scrolls */}
        <header className="bg-white/80 backdrop-blur-md border-b border-brand-sand/80 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-brand-sand/40 transition-colors"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-serif font-bold text-lg sm:text-xl text-brand-charcoal tracking-tight">
                {getPageTitle()}
              </h1>
              <p className="text-[11px] text-gray-400 font-medium hidden sm:block">
                Vaultify Enterprise • Real-time Training Monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Admin Badge & Profile */}
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-olive text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {(userProfile?.name || currentUser?.displayName || 'Admin').charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left select-none">
                <p className="text-xs font-bold text-brand-charcoal truncate max-w-[120px]">
                  {userProfile?.name || currentUser?.displayName || 'Administrator'}
                </p>
                <span className="text-[10px] text-brand-olive font-semibold block">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body - Scrollbar is local to this main block */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto bg-brand-cream min-h-0">
          <div className="max-w-7xl mx-auto h-full space-y-4">
            {isOffline && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-800 font-medium shadow-sm">
                <div className="flex items-center space-x-2.5">
                  <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>You are currently offline. System metrics will update once connectivity is restored.</span>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center space-x-1 px-3 py-1 bg-amber-200 hover:bg-amber-300 rounded-xl text-[11px] font-bold text-amber-900 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}
            <AdminErrorBoundary key={location.pathname}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Outlet />
              </motion.div>
            </AdminErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
