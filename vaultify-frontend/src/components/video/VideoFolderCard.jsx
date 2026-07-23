import React, { useState, useRef, useEffect } from 'react';
import { Folder, MoreVertical, Edit2, Move, Share2, Trash2 } from 'lucide-react';

export default function VideoFolderCard({
  folder,
  onEnter,
  onRename,
  onMove,
  onShare,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      onDoubleClick={() => onEnter(folder.id)}
      className="bg-white border border-brand-sand/70 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-brand-sage/60 transition-all duration-200 select-none group relative cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="bg-brand-sage-light/50 text-brand-olive p-2.5 rounded-xl">
            <Folder className="w-6 h-6 fill-brand-sage/20" />
          </div>
          <div className="min-w-0 text-left">
            <h3 className="font-serif font-bold text-sm text-brand-charcoal truncate pr-2">
              {folder.name}
            </h3>
            <span className="text-[10px] text-gray-400 font-medium">
              Folder • Video Locker
            </span>
          </div>
        </div>

        {/* Dropdown Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 rounded-lg hover:bg-brand-cream text-gray-400 hover:text-brand-charcoal transition-colors cursor-pointer"
            aria-label="Folder actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-white border border-brand-sand rounded-xl shadow-lg z-20 py-1.5 text-xs text-left">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onRename(folder);
                }}
                className="w-full px-4 py-2 hover:bg-brand-cream text-gray-700 flex items-center space-x-2 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                <span>Rename</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onMove(folder);
                }}
                className="w-full px-4 py-2 hover:bg-brand-cream text-gray-700 flex items-center space-x-2 cursor-pointer"
              >
                <Move className="w-3.5 h-3.5 text-gray-400" />
                <span>Move</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onShare(folder);
                }}
                className="w-full px-4 py-2 hover:bg-brand-cream text-gray-700 flex items-center space-x-2 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-gray-400" />
                <span>Share</span>
              </button>
              <hr className="border-brand-sand/60 my-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete(folder);
                }}
                className="w-full px-4 py-2 hover:bg-red-50 text-red-600 flex items-center space-x-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
