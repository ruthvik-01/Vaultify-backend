import React from 'react';
import { 
  FolderPlus, Upload, FolderUp, LayoutGrid, List, Search 
} from 'lucide-react';

export default function VideoToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onCreateFolder,
  onUploadFileClick,
  onUploadFolderClick,
  hideSearch = false
}) {
  const showSearch = onSearchChange && !hideSearch;
  const hasActions = onCreateFolder || onUploadFileClick || onUploadFolderClick;

  return (
    <div className={`bg-white border border-brand-sand rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center ${showSearch ? 'md:justify-between' : 'md:justify-end'} gap-4`}>
      {/* Search Input */}
      {showSearch && (
        <div className="relative flex-grow max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-brand-cream border border-brand-sand rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-olive text-brand-charcoal"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-brand-charcoal font-bold focus:outline-none cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 justify-end">
        {/* Create Folder */}
        {onCreateFolder && (
          <button
            onClick={onCreateFolder}
            className="flex items-center space-x-1.5 px-3 py-2 bg-brand-cream hover:bg-brand-sand/50 text-brand-charcoal border border-brand-sand rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-brand-olive" />
            <span>New Folder</span>
          </button>
        )}

        {/* Upload File */}
        {onUploadFileClick && (
          <button
            onClick={onUploadFileClick}
            className="flex items-center space-x-1.5 px-3 py-2 bg-brand-olive hover:bg-brand-olive-dark text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Files</span>
          </button>
        )}

        {/* Upload Folder */}
        {onUploadFolderClick && (
          <button
            onClick={onUploadFolderClick}
            className="flex items-center space-x-1.5 px-3 py-2 bg-brand-cream hover:bg-brand-sand/50 text-brand-charcoal border border-brand-sand rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            <FolderUp className="w-4 h-4 text-brand-olive" />
            <span>Upload Folder</span>
          </button>
        )}

        {hasActions && <div className="w-px h-6 bg-brand-sand/80 mx-1 hidden sm:block" />}

        {/* View Mode Toggle */}
        <div className="bg-brand-cream border border-brand-sand rounded-xl p-0.5 flex space-x-0.5 shadow-inner">
          <button
            onClick={() => onViewModeChange('grid')}
            title="Grid view"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-brand-charcoal shadow-sm'
                : 'text-gray-400 hover:text-brand-charcoal'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            title="List view"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-brand-charcoal shadow-sm'
                : 'text-gray-400 hover:text-brand-charcoal'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
