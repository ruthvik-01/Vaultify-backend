import React, { useState, useEffect } from 'react';
import { useFiles } from '../context/FileContext';
import { 
  FileText, Award, FolderGit, FileCode, Video, File, 
  MoreVertical, Star, Share2, Trash2, ArrowUpRight, 
  Download, Eye, UserPlus, ShieldAlert, Check, X, RefreshCw, Loader2,
  Music, Image as ImageIcon, FileSpreadsheet, Presentation, FolderClosed
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate } from '../utils/formatDate';

export default function FileCard({ file, viewMode = 'grid', isTrashView = false }) {
  const { toggleStar, deleteFile, restoreFile, permanentlyDeleteFile, shareFile, removeShare, downloadFile, getPreviewUrl, showNotification, folders, moveFile } = useFiles();
  const [showMenu, setShowMenu] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);

  // Fetch presigned thumbnail URL for previewable files on mount
  useEffect(() => {
    const ext = file.name.split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || (file.mimeType && file.mimeType.startsWith('image/'));
    const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext) || (file.mimeType && file.mimeType.startsWith('video/'));
    const isPdf = ext === 'pdf' || (file.mimeType && file.mimeType === 'application/pdf');

    if ((isImage || isVideo || isPdf) && viewMode === 'grid' && !isTrashView) {
      getPreviewUrl(file.id).then((url) => {
        if (url) setThumbnailUrl(url);
      });
    }
  }, [file.id, viewMode]);

  const handleOpenPreview = async () => {
    setShowPreviewPanel(true);
    setPreviewLoading(true);
    setPreviewUrl(null);
    setTextContent('');
    try {
      const url = await getPreviewUrl(file.id);
      setPreviewUrl(url);
      
      const ext = file.name.split('.').pop().toLowerCase();
      const isText = ['txt', 'js', 'json', 'css', 'html', 'md'].includes(ext) || (file.mimeType && file.mimeType.startsWith('text/'));
      if (isText && url) {
        const textRes = await fetch(url);
        if (textRes.ok) {
          const txt = await textRes.text();
          setTextContent(txt);
        } else {
          setTextContent(`Failed to load text content: HTTP ${textRes.status}`);
        }
      }
    } catch (err) {
      console.error('Error fetching preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };



  // Get matching icon based on file properties
  const getFileIcon = () => {
    if (file.category === 'Certificates') {
      return <Award className="w-8 h-8 text-amber-600" />;
    }
    if (file.category === 'Projects') {
      return <FolderGit className="w-8 h-8 text-brand-olive" />;
    }

    const ext = file.name.split('.').pop().toLowerCase();
    
    // Images
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(ext) || (file.mimeType && file.mimeType.startsWith('image/'))) {
      return <ImageIcon className="w-8 h-8 text-emerald-500" />;
    }
    
    // Videos
    if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v', 'mpeg', '3gp', 'ogv'].includes(ext) || (file.mimeType && file.mimeType.startsWith('video/'))) {
      return <Video className="w-8 h-8 text-cyan-500" />;
    }
    
    // Audio
    if (['mp3', 'wav', 'aac', 'ogg', 'm4a', 'flac'].includes(ext) || (file.mimeType && file.mimeType.startsWith('audio/'))) {
      return <Music className="w-8 h-8 text-purple-500" />;
    }
    
    // Documents
    if (ext === 'pdf' || (file.mimeType && file.mimeType === 'application/pdf')) {
      return <FileText className="w-8 h-8 text-rose-500" />;
    }
    if (['doc', 'docx', 'odt'].includes(ext) || (file.mimeType && file.mimeType.includes('document'))) {
      return <File className="w-8 h-8 text-blue-500" />;
    }
    if (['xls', 'xlsx', 'ods', 'csv'].includes(ext) || (file.mimeType && (file.mimeType.includes('sheet') || file.mimeType.includes('csv')))) {
      return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
    }
    if (['ppt', 'pptx', 'odp'].includes(ext) || (file.mimeType && file.mimeType.includes('presentation'))) {
      return <Presentation className="w-8 h-8 text-orange-500" />;
    }
    if (['txt', 'rtf', 'log'].includes(ext) || (file.mimeType && file.mimeType.startsWith('text/'))) {
      return <FileText className="w-8 h-8 text-gray-600" />;
    }
    
    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <FileCode className="w-8 h-8 text-indigo-500" />;
    }

    switch (file.type) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-rose-500" />;
      case 'zip':
      case 'rar':
        return <FileCode className="w-8 h-8 text-indigo-500" />;
      case 'doc':
      case 'docx':
        return <File className="w-8 h-8 text-blue-500" />;
      case 'video':
      case 'mp4':
        return <Video className="w-8 h-8 text-cyan-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const handleShareSubmit = (e) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;
    shareFile(file.id, shareEmail.trim());
    setShareEmail('');
    showNotification(`File shared with ${shareEmail.trim()}`, 'success');
  };

  const handleDownload = () => {
    downloadFile(file.id, file.name);
    setShowMenu(false);
  };

  // Render List View Mode
  if (viewMode === 'list') {
    return (
      <tr className="hover:bg-brand-cream-dark/40 transition-all border-b border-brand-sand/50">
        <td className="py-4 px-4 whitespace-nowrap">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-cream rounded-xl border border-brand-sand/30">
              {getFileIcon()}
            </div>
            <div className="max-w-xs sm:max-w-md truncate">
              <span className="text-xs font-semibold text-brand-charcoal block truncate">{file.name}</span>
            </div>
          </div>
        </td>
        <td className="py-4 px-4 whitespace-nowrap text-xs text-gray-500 font-mono">
          {formatSize(file.size)}
        </td>
        <td className="py-4 px-4 whitespace-nowrap text-xs text-gray-400">
          {formatDate(file.dateAdded)}
        </td>
        <td className="py-4 px-4 whitespace-nowrap text-right text-xs">
          <div className="flex items-center justify-end space-x-2">
            {!isTrashView && (
              <>
                <button
                  onClick={handleOpenPreview}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-brand-olive hover:bg-brand-cream transition-all"
                  title="Quick Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleStar(file.id)}
                  className={`p-1.5 rounded-lg transition-all ${file.isStarred ? 'text-amber-500' : 'text-gray-300 hover:text-amber-500'}`}
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
              </>
            )}
            
            {/* Actions triggers */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 hover:bg-brand-sand/55 text-gray-400 hover:text-brand-charcoal rounded-lg transition-all cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Popover Action Menu */}
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => { setShowMenu(false); setShowSharePanel(false); }} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 mt-2 w-48 bg-white border border-brand-sand/80 rounded-2xl shadow-xl z-50 py-1.5 text-left divide-y divide-brand-sand/40 font-sans"
                  >
                    {isTrashView ? (
                      <div className="py-1">
                        <button
                          onClick={() => { restoreFile(file.id); setShowMenu(false); }}
                          className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs font-semibold text-brand-olive hover:bg-brand-cream transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4 text-brand-olive" />
                          <span>Restore File</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete forever? This action cannot be undone.')) {
                              permanentlyDeleteFile(file.id);
                            }
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                          <span>Delete Forever</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="py-1">
                          <button
                            onClick={() => { handleOpenPreview(); setShowMenu(false); }}
                            className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-brand-cream transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4 text-gray-400" />
                            <span>Quick Preview</span>
                          </button>
                          <button
                            onClick={() => { setShowSharePanel(!showSharePanel); setShowMenu(false); }}
                            className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-brand-cream transition-colors cursor-pointer"
                          >
                            <Share2 className="w-4 h-4 text-gray-400" />
                            <span>Share / Permissions</span>
                          </button>
                          <button
                            onClick={() => { setShowMoveModal(true); setShowMenu(false); }}
                            className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-brand-cream transition-colors cursor-pointer"
                          >
                            <FolderClosed className="w-4 h-4 text-gray-400" />
                            <span>Move to Folder</span>
                          </button>
                          <button
                            onClick={() => { handleDownload(); setShowMenu(false); }}
                            className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-brand-cream transition-colors cursor-pointer"
                          >
                            <Download className="w-4 h-4 text-gray-400" />
                            <span>Download</span>
                          </button>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={() => { deleteFile(file.id); setShowMenu(false); }}
                            className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                            <span>Move to Trash</span>
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  }

  // Render Grid View Mode (Default Showcase)
  return (
    <>
      <motion.div
        layout
        className="bg-white border border-brand-sand rounded-2xl overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between h-80 group/card relative"
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* File Preview Pane */}
        <div className="h-44 bg-brand-cream-dark/40 border-b border-brand-sand/45 relative flex items-center justify-center overflow-hidden shrink-0 group">
          {(() => {
            const ext = file.name.split('.').pop().toLowerCase();
            const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || (file.mimeType && file.mimeType.startsWith('image/'));
            const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext) || (file.mimeType && file.mimeType.startsWith('video/'));
            const isPdf = ext === 'pdf' || (file.mimeType && file.mimeType === 'application/pdf');
            
            if (isImage && thumbnailUrl) {
              return (
                <img 
                  src={thumbnailUrl} 
                  alt={file.name} 
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = '<div class="text-gray-400 flex flex-col items-center"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-[9px] mt-1">Image Unloaded</span></div>';
                  }}
                />
              );
            }
            if (isVideo && thumbnailUrl) {
              return (
                <video
                  src={thumbnailUrl}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                  playsInline
                />
              );
            }
            if (isPdf && thumbnailUrl) {
              return (
                <iframe
                  src={thumbnailUrl + "#toolbar=0&navpanes=0&scrollbar=0"}
                  className="w-full h-full border-0 pointer-events-none scale-[0.9] origin-center"
                  scrolling="no"
                  title={file.name}
                />
              );
            }
            if ((isImage || isVideo || isPdf) && !thumbnailUrl) {
              return (
                <div className="flex flex-col items-center space-y-1">
                  <Loader2 className="w-6 h-6 text-brand-olive animate-spin" />
                  <span className="text-[9px] text-gray-400">Loading preview...</span>
                </div>
              );
            }
            return (
              <div className="flex flex-col items-center space-y-2">
                <div className="p-2.5 bg-brand-cream border border-brand-sand/55 rounded-2xl shadow-sm">
                  {getFileIcon()}
                </div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{ext.toUpperCase() || 'FILE'}</span>
              </div>
            );
          })()}

          {/* Star Badge */}
          {!isTrashView && (
            <button
              onClick={() => toggleStar(file.id)}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 shadow-sm backdrop-blur-sm transition-all text-amber-500 z-10 cursor-pointer"
            >
              <Star className={`w-3.5 h-3.5 ${file.isStarred ? 'fill-current' : 'stroke-[1.8] text-gray-400 hover:text-amber-500'}`} />
            </button>
          )}
        </div>

        {/* File Metadata Details */}
        <div className="p-3 flex-grow flex flex-col justify-between text-left">
          <div>
            <div className="flex justify-between items-start mb-1">
              <h4 className="text-xs font-bold text-brand-charcoal block line-clamp-1 flex-1 pr-2 cursor-pointer hover:text-brand-olive transition-all" title={file.name} onClick={handleOpenPreview}>
                {file.name}
              </h4>
              <span className="text-[9px] text-brand-olive bg-brand-sage-light/25 font-bold px-1.5 py-0.5 rounded-md shrink-0">
                {file.category}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1 font-mono">
              <span>{formatSize(file.size)}</span>
              <span>{formatDate(file.dateAdded)}</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-3 pt-2 border-t border-brand-sand/40 flex items-center justify-between">
            {isTrashView ? (
              <div className="flex space-x-1.5 w-full">
                <button
                  onClick={() => restoreFile(file.id)}
                  className="flex-1 py-1.5 bg-brand-olive/10 hover:bg-brand-olive text-brand-olive hover:text-white rounded-lg text-[10px] font-bold flex items-center justify-center space-x-1 transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Restore</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete forever? This action cannot be undone.')) {
                      permanentlyDeleteFile(file.id);
                    }
                  }}
                  className="flex-1 py-1.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-[10px] font-bold flex items-center justify-center space-x-1 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Purge</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <button
                  onClick={handleOpenPreview}
                  className="px-2.5 py-1.5 bg-brand-cream border border-brand-sand hover:bg-brand-olive hover:text-white text-brand-charcoal rounded-xl text-[10px] font-bold transition-all flex items-center space-x-1 shadow-sm cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                
                <div className="flex space-x-0.5 text-gray-400">
                  <button
                    onClick={handleDownload}
                    className="p-1.5 rounded-lg hover:bg-brand-cream border border-transparent hover:border-brand-sand hover:text-brand-charcoal transition-all cursor-pointer"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowMoveModal(true)}
                    className="p-1.5 rounded-lg hover:bg-brand-cream border border-transparent hover:border-brand-sand hover:text-brand-charcoal transition-all cursor-pointer"
                    title="Move to Folder"
                  >
                    <FolderClosed className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowSharePanel(true)}
                    className="p-1.5 rounded-lg hover:bg-brand-cream border border-transparent hover:border-brand-sand hover:text-brand-charcoal transition-all cursor-pointer"
                    title="Share File"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteFile(file.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
                    title="Move to Trash"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Sharing Details Overlay Drawer */}
      <AnimatePresence>
        {showSharePanel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSharePanel(false)}
              className="absolute inset-0 bg-brand-charcoal"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-brand-sand rounded-3xl p-6 shadow-xl w-full max-w-md relative z-10"
            >
              <button
                onClick={() => setShowSharePanel(false)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-brand-charcoal hover:bg-brand-cream rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-serif text-xl font-bold text-brand-charcoal mb-1">Share Credential</h3>
              <p className="text-xs text-gray-500 mb-4 truncate">File: {file.name}</p>

              <form onSubmit={handleShareSubmit} className="mb-4">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">
                  Invite via email address
                </label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    required
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="recruiter@company.com"
                    className="flex-1 px-3 py-2 border border-brand-sand rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-olive focus:border-brand-olive text-brand-charcoal bg-brand-cream"
                  />
                  <button
                    type="submit"
                    className="bg-brand-olive hover:bg-brand-olive-dark text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all shadow-sm cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Invite</span>
                  </button>
                </div>
              </form>

              {/* Shared with section */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-2">
                  Who has access ({file.sharedWith.length})
                </span>
                {file.sharedWith.length > 0 ? (
                  <ul className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {file.sharedWith.map((email, idx) => (
                      <li key={idx} className="flex justify-between items-center bg-brand-cream border border-brand-sand/60 px-3 py-2 rounded-xl text-xs">
                        <span className="text-brand-charcoal truncate pr-2" title={email}>{email}</span>
                        <button
                          type="button"
                          onClick={() => {
                            removeShare(file.id, email);
                            showNotification(`Removed share permission for ${email}`, 'success');
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="bg-brand-cream/60 border border-brand-sand border-dashed p-4 rounded-2xl text-center text-xs text-gray-500 font-sans">
                    This file is currently private. Only you can view or download it.
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-brand-sand flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-brand-charcoal block">Public Share Link</span>
                  <span className="text-[10px] text-gray-400">Anyone with this link can access the file</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const link = await shareFile(file.id, 'read', 24);
                      if (link) {
                        navigator.clipboard.writeText(link);
                        showNotification('Share link copied to clipboard!', 'success');
                      } else {
                        showNotification('Failed to generate share link', 'error');
                      }
                    } catch (e) {
                      showNotification('Failed to generate share link', 'error');
                    }
                  }}
                  className="bg-brand-cream-dark hover:bg-brand-sand text-brand-charcoal px-3 py-2 rounded-xl text-[10px] font-bold border border-brand-sand transition-all flex items-center space-x-1"
                >
                  <ArrowUpRight className="w-3 h-3" />
                  <span>Copy Link</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* File Quick Preview Overlay Drawer */}
      <AnimatePresence>
        {showPreviewPanel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreviewPanel(false)}
              className="absolute inset-0 bg-brand-charcoal"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-brand-sand rounded-3xl p-6 shadow-xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <button
                onClick={() => setShowPreviewPanel(false)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-brand-charcoal hover:bg-brand-cream rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 pb-4 border-b border-brand-sand mb-4">
                <div className="p-2.5 bg-brand-cream rounded-xl border border-brand-sand/50">
                  {getFileIcon()}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-brand-charcoal block line-clamp-1">{file.name}</h3>
                  <p className="text-xs text-gray-500 font-sans">
                    Category: <span className="font-semibold text-brand-olive">{file.category}</span> • Size: {formatSize(file.size)}
                  </p>
                </div>
              </div>
              {/* Dynamic Preview Frame based on category or properties */}
              <div className="bg-brand-cream border border-brand-sand/80 rounded-2xl flex-grow overflow-hidden flex flex-col items-center justify-center min-h-[350px] relative">
                {previewLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-10 h-10 animate-spin text-brand-olive" />
                    <span className="text-xs text-gray-500 mt-2">Retrieving vault item...</span>
                  </div>
                ) : previewUrl ? (
                  (() => {
                    const ext = file.name.split('.').pop().toLowerCase();
                    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || (file.mimeType && file.mimeType.startsWith('image/'));
                    const isPdf = ext === 'pdf' || (file.mimeType && file.mimeType === 'application/pdf');
                    const isText = ['txt', 'js', 'json', 'css', 'html', 'md'].includes(ext) || (file.mimeType && file.mimeType.startsWith('text/'));
                    const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v', 'mpeg', '3gp', 'ogv'].includes(ext) || (file.mimeType && file.mimeType.startsWith('video/'));
                    const isAudio = ['mp3', 'wav', 'aac', 'ogg', 'm4a', 'flac'].includes(ext) || (file.mimeType && file.mimeType.startsWith('audio/'));
                    const isExcel = ['xls', 'xlsx', 'ods', 'csv'].includes(ext) || (file.mimeType && (file.mimeType.includes('sheet') || file.mimeType.includes('csv')));
                    const isPowerPoint = ['ppt', 'pptx', 'odp'].includes(ext) || (file.mimeType && file.mimeType.includes('presentation'));

                    if (isImage) {
                      return (
                        <div className="w-full h-full flex items-center justify-center p-2">
                          <img 
                            src={previewUrl} 
                            className="max-h-[55vh] max-w-full object-contain rounded-xl shadow border border-brand-sand/40 bg-white" 
                            alt={file.name} 
                          />
                        </div>
                      );
                    } else if (isVideo) {
                      return (
                        <div className="w-full h-full flex items-center justify-center p-2 bg-black">
                          <video
                            src={previewUrl}
                            controls
                            autoPlay
                            preload="metadata"
                            className="max-h-[55vh] max-w-full object-contain rounded-xl shadow focus:outline-none"
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      );
                    } else if (isAudio) {
                      return (
                        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-brand-cream rounded-xl">
                          <Music className="w-16 h-16 text-purple-500 mb-4 animate-bounce" />
                          <audio
                            src={previewUrl}
                            controls
                            className="w-full max-w-md focus:outline-none"
                          >
                            Your browser does not support the audio player.
                          </audio>
                          <span className="text-xs text-gray-500 mt-2 font-mono">{file.name}</span>
                        </div>
                      );
                    } else if (isExcel) {
                      return (
                        <div className="text-center max-w-md p-6">
                          <FileSpreadsheet className="w-16 h-16 text-green-600 mx-auto mb-3" />
                          <h4 className="font-semibold text-brand-charcoal text-sm mb-1">{file.name}</h4>
                          <p className="text-xs text-gray-500 leading-relaxed mb-4 font-sans">
                            Spreadsheet preview is not directly viewable online. Please download to edit or view.
                          </p>
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-brand-olive hover:bg-brand-olive-dark text-white px-5 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center space-x-2 transition-all shadow-sm"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download Spreadsheet</span>
                          </a>
                        </div>
                      );
                    } else if (isPowerPoint) {
                      return (
                        <div className="text-center max-w-md p-6">
                          <Presentation className="w-16 h-16 text-orange-500 mx-auto mb-3" />
                          <h4 className="font-semibold text-brand-charcoal text-sm mb-1">{file.name}</h4>
                          <p className="text-xs text-gray-500 leading-relaxed mb-4 font-sans">
                            Presentation preview is not directly viewable online. Please download to view.
                          </p>
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-brand-olive hover:bg-brand-olive-dark text-white px-5 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center space-x-2 transition-all shadow-sm"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download Presentation</span>
                          </a>
                        </div>
                      );
                    } else if (isPdf) {
                      return (
                        <iframe 
                          src={previewUrl} 
                          className="w-full h-[55vh] rounded-xl border border-brand-sand/50 bg-white" 
                          title={file.name} 
                        />
                      );
                    } else if (isText) {
                      return (
                        <pre className="w-full h-[55vh] p-4 bg-brand-charcoal text-emerald-400 font-mono text-[11px] rounded-xl overflow-auto whitespace-pre-wrap text-left border border-brand-charcoal">
                           {textContent}
                        </pre>
                      );
                    } else {
                      return (
                        <div className="text-center max-w-md p-6">
                          <FileText className="w-16 h-16 text-brand-olive/60 mx-auto mb-3" />
                          <h4 className="font-semibold text-brand-charcoal text-sm mb-1">{file.name}</h4>
                          <p className="text-xs text-gray-500 leading-relaxed mb-4">
                            Preview not directly supported for <strong>.{ext.toUpperCase()}</strong> files. Please download the file to view its contents.
                          </p>
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-brand-olive hover:bg-brand-olive-dark text-white px-5 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center space-x-2 transition-all shadow-sm"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download File</span>
                          </a>
                        </div>
                      );
                    }
                  })()
                ) : (
                  <div className="text-center p-6">
                    <Loader2 className="w-8 h-8 text-red-500 mx-auto mb-2 animate-bounce" />
                    <span className="text-xs text-red-500 font-semibold">Failed to establish secure preview connection.</span>
                  </div>
                )}
              </div>


              <div className="mt-4 pt-4 border-t border-brand-sand flex justify-between items-center text-xs">
                <span className="text-gray-400">Uploaded on {formatDate(file.dateAdded)} • {file.downloadCount || 0} downloads</span>
                <button
                  onClick={() => setShowPreviewPanel(false)}
                  className="bg-brand-cream border border-brand-sand hover:bg-brand-sand/40 text-brand-charcoal px-4 py-2 rounded-xl font-semibold transition-all"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Move File Modal */}
      <AnimatePresence>
        {showMoveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMoveModal(false)}
              className="absolute inset-0 bg-brand-charcoal"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-brand-sand rounded-3xl p-6 shadow-xl w-full max-w-sm relative z-10 text-left font-sans"
            >
              <div className="flex justify-between items-center pb-3 border-b border-brand-sand mb-4">
                <h3 className="font-serif text-sm font-bold text-brand-charcoal">Move File</h3>
                <button
                  onClick={() => setShowMoveModal(false)}
                  className="p-1.5 text-gray-400 hover:text-brand-charcoal hover:bg-brand-cream rounded-full transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto mb-5 pr-1 scrollbar-thin">
                {/* Locker Root option */}
                <button
                  onClick={async () => {
                    await moveFile(file.id, null);
                    setShowMoveModal(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-2.5 rounded-xl text-left text-xs font-semibold hover:bg-brand-cream transition-colors cursor-pointer ${
                    file.folder_id === null ? 'bg-brand-olive/10 text-brand-olive border border-brand-olive/30' : 'text-gray-700'
                  }`}
                >
                  <FolderClosed className="w-4 h-4 shrink-0 text-brand-olive" />
                  <span>Locker Root</span>
                </button>

                {/* Subfolders list */}
                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={async () => {
                      await moveFile(file.id, f.id);
                      setShowMoveModal(false);
                    }}
                    className={`w-full flex items-center space-x-3 p-2.5 rounded-xl text-left text-xs font-semibold hover:bg-brand-cream transition-colors cursor-pointer ${
                      file.folder_id === f.id ? 'bg-brand-olive/10 text-brand-olive border border-brand-olive/30' : 'text-gray-700'
                    }`}
                  >
                    <FolderClosed className="w-4 h-4 shrink-0 text-brand-olive" />
                    <span className="truncate">{f.folder_name}</span>
                  </button>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowMoveModal(false)}
                  className="flex-1 bg-brand-cream border border-brand-sand hover:bg-brand-sand/40 text-brand-charcoal text-xs font-semibold py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
