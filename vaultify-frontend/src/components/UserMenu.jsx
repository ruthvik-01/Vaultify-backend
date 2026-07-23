import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFiles } from '../context/FileContext';
import { User, Settings, LogOut, CheckCircle, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserMenu() {
  const { user, logout } = useFiles();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setIsOpen(false);
    navigate('/');
    setTimeout(() => {
      logout();
    }, 150);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2.5 p-1 px-2.5 rounded-full hover:bg-brand-sand/40 border border-transparent hover:border-brand-sand transition-all text-left focus:outline-none cursor-pointer"
      >
        <div className="relative">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover border border-brand-sand"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
        </div>
        <div className="hidden md:block">
          <span className="text-xs font-semibold text-brand-charcoal block leading-none">{user.name}</span>
          <span className="text-[9px] text-gray-500 block mt-0.5">Active Locker</span>
        </div>
      </button>

      {/* Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2.5 w-72 bg-white border border-brand-sand rounded-2xl shadow-xl py-2 z-50 overflow-hidden"
          >
            {/* Header user details */}
            <div className="px-4 py-3 border-b border-brand-sand bg-brand-cream/50">
              <div className="flex items-center space-x-3 mb-2">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border border-brand-sand"
                />
                <div>
                  <h4 className="text-sm font-semibold text-brand-charcoal flex items-center">
                    <span>{user.name}</span>
                    <CheckCircle className="w-3.5 h-3.5 text-brand-olive ml-1" />
                  </h4>
                  <p className="text-[11px] text-gray-500 truncate max-w-[180px]">{user.email}</p>
                </div>
              </div>
              <div className="text-[10px] text-brand-olive font-medium bg-brand-sage-light/20 px-2 py-1 rounded-lg flex items-center space-x-1.5 mt-1 border border-brand-sage-light/20">
                <GraduationCap className="w-3.5 h-3.5" />
                <span className="truncate">{user.university}</span>
              </div>
            </div>

            {/* Links */}
            <div className="p-1.5 border-b border-brand-sand">
              <button
                onClick={() => handleMenuClick('/profile')}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-brand-cream hover:text-brand-charcoal text-left transition-all cursor-pointer"
              >
                <User className="w-4 h-4 text-gray-400" />
                <span>Showcase Portfolio</span>
              </button>

              <button
                onClick={() => handleMenuClick('/settings')}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-brand-cream hover:text-brand-charcoal text-left transition-all cursor-pointer"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                <span>Account & Plan Settings</span>
              </button>
            </div>

            {/* Logout button */}
            <div className="p-1.5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 text-left transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
