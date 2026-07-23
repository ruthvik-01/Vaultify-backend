import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FolderLock, LayoutDashboard, FolderClosed, UploadCloud, 
  Trash2, User, Settings, X, Video, Briefcase
} from 'lucide-react';
import { useFiles } from '../context/FileContext';
import StorageCard from './StorageCard';

export default function Sidebar({ onClose }) {
  const location = useLocation();
  const { user } = useFiles();
  
  const isCompact = user.sidebar_color === 'compact';

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Files', path: '/my-files', icon: FolderClosed },
    { name: 'Work', path: '/work', icon: Briefcase },
    { name: 'Trash Bin', path: '/trash', icon: Trash2 },
    { name: 'My Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className={`${isCompact ? 'w-[72px] p-3 items-center' : 'w-72 p-6'} h-screen sticky top-0 bg-brand-cream-dark border-r border-brand-sand/80 flex flex-col justify-between overflow-y-auto z-30 shrink-0 transition-all duration-300`}>
      {/* Top Header */}
      <div className={isCompact ? 'w-full flex flex-col items-center' : ''}>
        <div className={`flex items-center ${isCompact ? 'justify-center' : 'justify-between'} mb-6 w-full`}>
          <div className={`flex items-center ${isCompact ? '' : 'space-x-3'}`}>
            <div className="bg-brand-olive text-brand-cream p-2 rounded-xl shadow-sm cursor-pointer shrink-0" title="Vaultify Dashboard">
              <FolderLock className="w-5 h-5" />
            </div>
            {!isCompact && (
              <div>
                <span className="font-serif text-xl font-bold tracking-tight text-brand-charcoal block">Vaultify</span>
                <span className="text-[10px] text-brand-olive-dark font-sans tracking-widest uppercase font-semibold">Digital Locker</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className={`lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-brand-sand transition-all ${isCompact ? 'absolute top-3 right-3' : ''}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className={`space-y-1 w-full ${isCompact ? 'flex flex-col items-center' : ''}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose} // close mobile drawer
                title={isCompact ? item.name : undefined}
                className={`
                  flex items-center ${isCompact ? 'justify-center p-2.5 w-full aspect-square max-w-[48px]' : 'space-x-3 px-4 py-3'} rounded-xl text-sm font-semibold transition-all group duration-200 transform
                  ${isActive 
                    ? 'bg-brand-olive text-white shadow-md shadow-brand-olive/20 scale-[1.02]' 
                    : isCompact
                      ? 'text-gray-600 hover:bg-brand-sand/50 hover:text-brand-charcoal'
                      : 'text-gray-600 hover:bg-brand-sand/50 hover:translate-x-1.5 hover:text-brand-charcoal'
                  }
                `}
              >
                <Icon className={`w-4.5 h-4.5 transition-transform group-hover:scale-110 duration-200 ${isActive ? 'text-white' : 'text-gray-500'} ${isCompact ? 'w-5 h-5' : 'w-4 h-4'}`} />
                {!isCompact && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Storage at the bottom */}
      <div className={`mt-8 pt-6 border-t border-brand-sand w-full ${isCompact ? 'flex flex-col items-center' : ''}`}>
        <StorageCard isCompact={isCompact} />
      </div>
    </aside>
  );
}
