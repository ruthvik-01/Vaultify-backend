import React, { useState, useRef } from 'react';
import { UploadCloud, X, FolderUp, FileText } from 'lucide-react';

export default function VideoUploadDialog({ isOpen, onClose, onUpload }) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
      onClose();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      onClose();
    }
  };

  const handleFolderChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      onClose();
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const triggerFolderSelect = () => {
    folderInputRef.current.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/40 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-lg border border-brand-sand/55 flex flex-col text-left">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-sand flex items-center justify-between bg-brand-cream">
          <div className="flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-brand-olive" />
            <h2 className="font-serif font-bold text-sm text-brand-charcoal">
              Upload Files
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-brand-sand/60 text-gray-500 hover:text-brand-charcoal transition-colors cursor-pointer focus:outline-none"
            aria-label="Close upload dialog"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Drag and Drop Zone */}
        <div className="p-6">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className={`w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
              dragActive
                ? 'border-brand-olive bg-brand-sage-light/20 scale-[0.98]'
                : 'border-brand-sand hover:border-brand-sage/80 hover:bg-brand-cream/30'
            }`}
          >
            <UploadCloud className={`w-12 h-12 mb-3 transition-transform duration-200 ${
              dragActive ? 'text-brand-olive scale-110' : 'text-brand-sage'
            }`} />
            <p className="text-xs font-semibold text-brand-charcoal mb-1">
              Drag & Drop your files here
            </p>
            <p className="text-[10px] text-gray-400 font-medium">
              or click to browse local files
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Custom file inputs */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
            />
            <input
              type="file"
              ref={folderInputRef}
              onChange={handleFolderChange}
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
            />

            <button
              onClick={triggerFileSelect}
              className="flex items-center justify-center space-x-2 py-3 bg-brand-cream hover:bg-brand-sand/55 border border-brand-sand rounded-xl text-xs font-semibold text-brand-charcoal cursor-pointer transition-colors"
            >
              <FileText className="w-4 h-4 text-brand-olive" />
              <span>Select Files</span>
            </button>

            <button
              onClick={triggerFolderSelect}
              className="flex items-center justify-center space-x-2 py-3 bg-brand-cream hover:bg-brand-sand/55 border border-brand-sand rounded-xl text-xs font-semibold text-brand-charcoal cursor-pointer transition-colors"
            >
              <FolderUp className="w-4 h-4 text-brand-olive" />
              <span>Select Folder</span>
            </button>
          </div>
        </div>

        {/* Info panel */}
        <div className="px-6 py-4 bg-brand-cream border-t border-brand-sand/65 text-[10px] text-gray-500 font-sans font-medium flex items-center justify-between">
          <span>Supported: All formats</span>
          <span>No file size limits</span>
        </div>
      </div>
    </div>
  );
}
