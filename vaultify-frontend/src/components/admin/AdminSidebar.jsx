import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { 
  LayoutDashboard, 
  FolderKanban, 
  UploadCloud, 
  BarChart3, 
  Settings, 
  ShieldCheck, 
  ArrowLeft, 
  LogOut,
  X,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminSidebar({ onClose }) {
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Teams', path: '/admin/teams', icon: FolderKanban },
    { name: 'Uploads', path: '/admin/uploads', icon: UploadCloud },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const handleAdminLogout = () => {
    adminService.logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <aside className="w-64 bg-white border-r border-brand-sand/80 flex flex-col h-screen sticky top-0 select-none shadow-sm transition-all duration-300">
      {/* Brand Header */}
      <div className="p-5 border-b border-brand-sand/60 flex items-center justify-between bg-brand-cream/40">
        <Link to="/admin/dashboard" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-olive to-brand-olive-dark flex items-center justify-center text-white shadow-md shadow-brand-olive/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-serif font-bold text-base text-brand-charcoal tracking-tight">Vaultify</span>
              <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-olive/10 text-brand-olive uppercase">Admin</span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">Monitoring Portal</p>
          </div>
        </Link>

        {onClose && (
          <button 
            onClick={onClose} 
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-brand-charcoal hover:bg-brand-sand/50 transition-colors"
            aria-label="Close Admin Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Admin Monitoring Badge */}
      <div className="px-4 py-3 mx-4 my-3 rounded-2xl bg-brand-olive/10 border border-brand-olive/20 flex items-center space-x-2.5">
        <ShieldCheck className="w-4 h-4 text-brand-olive shrink-0" />
        <div>
          <h4 className="text-xs font-bold text-brand-charcoal">Admin Portal</h4>
          <p className="text-[10px] text-gray-500 font-medium">Monitored Student Training</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-brand-olive text-white shadow-md shadow-brand-olive/20 font-semibold' 
                  : 'text-gray-600 hover:text-brand-charcoal hover:bg-brand-cream/80'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4.5 h-4.5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-brand-olive'}`} />
                  <span>{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeAdminTab"
                      className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Admin Action Buttons */}
      <div className="p-4 border-t border-brand-sand/60 bg-brand-cream/30 space-y-2">
        <button
          onClick={handleAdminLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all shadow-sm cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Admin Log Out</span>
        </button>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-white border border-brand-sand/80 hover:bg-brand-sand/40 hover:text-brand-charcoal transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-brand-olive" />
          <span>User Vault</span>
        </button>
      </div>
    </aside>
  );
}
