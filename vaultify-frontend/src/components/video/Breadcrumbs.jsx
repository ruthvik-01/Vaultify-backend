import React from 'react';
import { ChevronRight, Home, Folder } from 'lucide-react';

export default function Breadcrumbs({ trail, onNavigate }) {
  return (
    <div className="flex items-center space-x-2 text-xs text-gray-500 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center space-x-1.5 hover:text-brand-charcoal transition-colors font-semibold focus:outline-none cursor-pointer"
        aria-label="Go to root videos"
      >
        <Home className="w-4 h-4 text-brand-olive" />
        <span>Root Videos</span>
      </button>

      {trail.map((folder, index) => (
        <React.Fragment key={folder.id}>
          <ChevronRight className="w-3.5 h-3.5 text-brand-sand shrink-0" />
          <button
            onClick={() => onNavigate(folder.id)}
            disabled={index === trail.length - 1}
            className={`flex items-center space-x-1 hover:text-brand-charcoal transition-colors focus:outline-none cursor-pointer ${
              index === trail.length - 1 ? 'text-brand-charcoal font-bold cursor-default' : 'font-semibold'
            }`}
          >
            <Folder className="w-4 h-4 text-brand-sage shrink-0" />
            <span className="truncate max-w-[120px]">{folder.name}</span>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
