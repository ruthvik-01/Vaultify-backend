import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Plus, Calendar } from 'lucide-react';
import SearchBar from './SearchBar';
import UserMenu from './UserMenu';
import UploadModal from './UploadModal';

export default function Navbar({ onMenuToggle }) {
  const location = useLocation();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Derive page title from path
  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/dashboard':
        return 'Vaultify Dashboard';
      case '/my-files':
        return 'My Digital Locker';
      case '/upload':
        return 'Upload Hub';
      case '/trash':
        return 'Trash Archive';
      case '/profile':
        return 'Personal Profile';
      case '/settings':
        return 'Locker Settings';
      default:
        return 'Vaultify';
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <>
      <header className="bg-white border-b border-brand-sand/80 px-4 sm:px-6 md:px-8 py-4 flex items-center justify-between z-30">
        
        {/* Mobile Hamburger menu & Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 text-gray-500 hover:text-brand-charcoal hover:bg-brand-cream-dark rounded-xl transition-all cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="hidden sm:block">
            <h2 className="font-serif text-xl font-bold text-brand-charcoal leading-none">
              {getPageTitle(location.pathname)}
            </h2>
            <span className="text-[10px] text-gray-400 mt-1 flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-brand-olive" />
              <span>{today}</span>
            </span>
          </div>
        </div>

        {/* Global Search Omni-bar */}
        <div className="flex-1 mx-4 sm:mx-6 max-w-md hidden md:block">
          <SearchBar />
        </div>

        {/* Action button triggers & Profile User Menu */}
        <div className="flex items-center space-x-4">
          {/* User Menu avatar dropdown */}
          <UserMenu />
        </div>
      </header>

      {/* Render the Upload Modal */}
      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </>
  );
}
