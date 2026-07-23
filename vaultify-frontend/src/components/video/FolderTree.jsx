import React, { useState } from 'react';
import { X, Folder, ChevronRight, ChevronDown, Check, Home } from 'lucide-react';

export default function FolderTree({
  isOpen,
  onClose,
  folders,
  movingItem,
  onMove,
}) {
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});

  if (!isOpen) return null;

  const toggleExpand = (id) => {
    setExpandedFolders(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Helper to determine if a folder is a descendant of the moving item
  const isDescendant = (parentId, childId) => {
    if (!childId) return false;
    if (parentId === childId) return true;
    const child = folders.find(f => f.id === childId);
    return isDescendant(parentId, child?.parentId);
  };

  // Render directory item recursively
  const renderNode = (node, depth = 0) => {
    const isExpanded = expandedFolders[node.id];
    const children = folders.filter(f => f.parentId === node.id);
    const hasChildren = children.length > 0;
    
    // Hide the moving folder and its descendants from selection tree
    const isInvalidTarget = movingItem?.type === 'folder' && isDescendant(movingItem.id, node.id);
    
    if (isInvalidTarget) return null;

    return (
      <div key={node.id} className="text-xs">
        <div 
          onClick={() => setSelectedFolderId(node.id)}
          className={`flex items-center justify-between py-2 px-3 rounded-xl transition-colors cursor-pointer select-none ${
            selectedFolderId === node.id 
              ? 'bg-brand-olive text-white' 
              : 'hover:bg-brand-cream text-brand-charcoal'
          }`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
        >
          <div className="flex items-center space-x-2 min-w-0">
            {hasChildren ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.id);
                }}
                className="p-0.5 rounded hover:bg-black/5 focus:outline-none shrink-0"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <div className="w-4.5" />
            )}
            <Folder className={`w-4 h-4 shrink-0 ${
              selectedFolderId === node.id ? 'fill-white/10' : 'text-brand-sage fill-brand-sage/10'
            }`} />
            <span className="truncate pr-2 font-medium">{node.name}</span>
          </div>
          {selectedFolderId === node.id && <Check className="w-3.5 h-3.5 shrink-0" />}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-0.5">
            {children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleConfirmMove = () => {
    onMove(selectedFolderId);
    onClose();
  };

  const rootFolders = folders.filter(f => f.parentId === null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/40 backdrop-blur-xs select-none animate-fade-in">
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-sm border border-brand-sand/55 flex flex-col text-left max-h-[80vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-sand flex items-center justify-between bg-brand-cream">
          <div className="flex items-center space-x-2.5">
            <Folder className="w-5 h-5 text-brand-olive" />
            <h2 className="font-serif font-bold text-sm text-brand-charcoal">
              Move to Folder
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-brand-sand/60 text-gray-500 hover:text-brand-charcoal transition-colors cursor-pointer focus:outline-none"
            aria-label="Close folder selection tree"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Tree Container */}
        <div className="p-4 flex-grow overflow-y-auto space-y-1.5 min-h-[200px]">
          {/* Root target Selection option */}
          <div 
            onClick={() => setSelectedFolderId(null)}
            className={`flex items-center justify-between py-2 px-3 rounded-xl transition-colors cursor-pointer select-none text-xs ${
              selectedFolderId === null 
                ? 'bg-brand-olive text-white' 
                : 'hover:bg-brand-cream text-brand-charcoal'
            }`}
          >
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-4.5" />
              <Home className={`w-4 h-4 shrink-0 ${
                selectedFolderId === null ? 'text-white' : 'text-brand-olive'
              }`} />
              <span className="truncate font-semibold">Root / Videos Home</span>
            </div>
            {selectedFolderId === null && <Check className="w-3.5 h-3.5 shrink-0" />}
          </div>

          <hr className="border-brand-sand/50 my-2" />

          {/* Root level children recursion */}
          {rootFolders.length > 0 ? (
            rootFolders.map(rootNode => renderNode(rootNode))
          ) : (
            <div className="text-center py-8 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              No subfolders created
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-brand-cream border-t border-brand-sand/65 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-brand-sand rounded-xl text-xs font-semibold text-brand-charcoal hover:bg-brand-sand/30 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmMove}
            disabled={movingItem?.type === 'folder' && movingItem.parentId === selectedFolderId}
            className="px-4 py-2 bg-brand-olive hover:bg-brand-olive-dark text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Move Here
          </button>
        </div>
      </div>
    </div>
  );
}
