import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, MoreVertical, Edit2, Move, Download, Share2, Trash2, Video, Clock, HardDrive, Calendar, User, Folder,
  FileText, Award, FolderGit, FileCode, File, Music, Image as ImageIcon, FileSpreadsheet, Presentation, Eye, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDate } from '../../utils/formatDate';
import { useFiles } from '../../context/FileContext';

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function VideoCard({
  video,
  folders,
  onPlay,
  onRename,
  onMove,
  onDownload,
  onShare,
  onDelete,
}) {
  const { getPreviewUrl } = useFiles();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [loadingThumbnail, setLoadingThumbnail] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const extName = (video.name || video.filename || '').split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extName) || (video.mimeType && video.mimeType.startsWith('image/'));
    const isVideoFile = ['mp4', 'mov', 'mkv', 'avi', 'webm'].includes(extName) || (video.mimeType && video.mimeType.startsWith('video/'));
    const isPdfFile = extName === 'pdf';

    if (isImage || isVideoFile || isPdfFile) {
      setLoadingThumbnail(true);
      getPreviewUrl(video.id)
        .then((url) => {
          if (url) setThumbnailUrl(url);
        })
        .catch((err) => console.error('Failed to get preview URL for video card:', err))
        .finally(() => setLoadingThumbnail(false));
    }
  }, [video.id]);

  const videoFolder = folders.find((f) => f.id === video.videoFolderId);
  const folderName = videoFolder ? videoFolder.name : 'Root';

  const name = video.name || video.filename || '';
  const ext = name.split('.').pop().toLowerCase();
  const isVideo = ['mp4', 'mov', 'mkv', 'avi', 'webm', 'flv', 'wmv'].includes(ext) || (video.mimeType && video.mimeType.startsWith('video/'));
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || (video.mimeType && video.mimeType.startsWith('image/'));
  const isAudio = ['mp3', 'wav', 'ogg', 'm4a'].includes(ext) || (video.mimeType && video.mimeType.startsWith('audio/'));
  const isPdf = ext === 'pdf';
  const isCode = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java', 'cpp', 'c', 'go'].includes(ext);
  const isSpreadsheet = ['xls', 'xlsx', 'csv'].includes(ext);
  const isPresentation = ['ppt', 'pptx'].includes(ext);

  const getFileIcon = () => {
    if (isVideo) return <Video className="w-12 h-12 text-brand-sage/40 stroke-[1.5]" />;
    if (isImage) return <ImageIcon className="w-12 h-12 text-blue-500/40 stroke-[1.5]" />;
    if (isAudio) return <Music className="w-12 h-12 text-purple-500/40 stroke-[1.5]" />;
    if (isPdf) return <FileText className="w-12 h-12 text-rose-500/40 stroke-[1.5]" />;
    if (isCode) return <FileCode className="w-12 h-12 text-amber-500/40 stroke-[1.5]" />;
    if (isSpreadsheet) return <FileSpreadsheet className="w-12 h-12 text-emerald-500/40 stroke-[1.5]" />;
    if (isPresentation) return <Presentation className="w-12 h-12 text-orange-500/40 stroke-[1.5]" />;
    return <File className="w-12 h-12 text-gray-400/40 stroke-[1.5]" />;
  };

  return (
    <div className="bg-white border border-brand-sand/70 rounded-2xl shadow-sm hover:shadow-md hover:border-brand-sage/60 transition-all duration-200 text-left relative flex flex-col h-full">
      {/* Thumbnail Placeholder */}
      <div 
        onClick={() => onPlay(video)}
        className="w-full aspect-video bg-brand-cream-dark border-b border-brand-sand/50 flex flex-col items-center justify-center relative cursor-pointer group"
      >
        <div className="absolute inset-0 bg-brand-charcoal/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="bg-white/90 text-brand-olive p-3 rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform duration-200">
            {isVideo ? <Play className="w-6 h-6 fill-brand-olive" /> : <Eye className="w-6 h-6 text-brand-olive" />}
          </div>
        </div>
        
        {/* Render appropriate file icon or live preview */}
        {loadingThumbnail ? (
          <div className="flex flex-col items-center space-y-1 select-none">
            <Loader2 className="w-5 h-5 text-brand-olive animate-spin" />
            <span className="text-[8px] text-gray-400">Loading preview...</span>
          </div>
        ) : thumbnailUrl ? (
          (() => {
            if (isImage) {
              return (
                <img 
                  src={thumbnailUrl} 
                  alt={video.name} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              );
            }
            if (isVideo) {
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
            if (isPdf) {
              return (
                <iframe
                  src={thumbnailUrl + "#toolbar=0&navpanes=0&scrollbar=0"}
                  className="w-full h-full border-0 pointer-events-none scale-[0.9] origin-center"
                  scrolling="no"
                  title={video.name}
                />
              );
            }
            return getFileIcon();
          })()
        ) : (
          getFileIcon()
        )}
        
        {/* Video length tag overlay */}
        {isVideo && video.duration > 0 && (
        <span className="absolute bottom-2.5 right-2.5 bg-brand-charcoal/80 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center space-x-1 shadow-sm">
          <Clock className="w-2.5 h-2.5" />
          <span>{Math.floor(video.duration / 60).toString().padStart(2, '0')}:{Math.floor(video.duration % 60).toString().padStart(2, '0')}</span>
        </span>
        )}

        {/* File Type Badge */}
        <span className="absolute top-2.5 left-2.5 bg-brand-cream/90 border border-brand-sand/80 text-brand-olive-dark font-sans text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
          {ext}
        </span>
      </div>

      {/* Info & Content details */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between mb-1.5">
            <h3 className="font-serif font-bold text-xs text-brand-charcoal line-clamp-1 flex-grow pr-2" title={video.name}>
              {video.name}
            </h3>

            {/* Actions Dropdown */}
            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1 rounded-lg hover:bg-brand-cream text-gray-400 hover:text-brand-charcoal transition-colors cursor-pointer"
                aria-label="File actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 bg-white border border-brand-sand/80 rounded-2xl shadow-xl z-[100] py-1.5 text-xs text-left"
                  style={{ top: '100%' }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onPlay(video);
                    }}
                    className="w-full px-4 py-2.5 hover:bg-brand-cream text-gray-700 flex items-center space-x-2.5 transition-colors cursor-pointer font-semibold"
                  >
                    <Eye className="w-4 h-4 text-brand-olive" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onRename(video);
                    }}
                    className="w-full px-4 py-2.5 hover:bg-brand-cream text-gray-700 flex items-center space-x-2.5 transition-colors cursor-pointer font-semibold"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                    <span>Rename</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onMove(video);
                    }}
                    className="w-full px-4 py-2.5 hover:bg-brand-cream text-gray-700 flex items-center space-x-2.5 transition-colors cursor-pointer font-semibold"
                  >
                    <Move className="w-4 h-4 text-gray-400" />
                    <span>Move</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onDownload(video);
                    }}
                    className="w-full px-4 py-2.5 hover:bg-brand-cream text-gray-700 flex items-center space-x-2.5 transition-colors cursor-pointer font-semibold"
                  >
                    <Download className="w-4 h-4 text-gray-400" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onShare(video);
                    }}
                    className="w-full px-4 py-2.5 hover:bg-brand-cream text-gray-700 flex items-center space-x-2.5 transition-colors cursor-pointer font-semibold"
                  >
                    <Share2 className="w-4 h-4 text-gray-400" />
                    <span>Share</span>
                  </button>
                  <div className="border-t border-brand-sand/60 my-1" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onDelete(video);
                    }}
                    className="w-full px-4 py-2.5 hover:bg-red-50 text-red-600 flex items-center space-x-2.5 transition-colors cursor-pointer font-semibold"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span>Delete</span>
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Details Metadata grid */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] text-gray-500 font-medium font-sans">
            <div className="flex items-center space-x-1 truncate">
              <HardDrive className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{formatSize(video.size)}</span>
            </div>
            <div className="flex items-center space-x-1 truncate">
              <Folder className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{folderName}</span>
            </div>
            <div className="flex items-center space-x-1 truncate">
              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{video.status === 'Uploading' ? 'Uploading...' : formatDate(video.dateAdded)}</span>
            </div>
            <div className="flex items-center space-x-1 truncate">
              <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{video.owner?.name || 'Me'}</span>
            </div>
          </div>
        </div>

        {/* Video Uploading Status footer */}
        {video.status === 'Uploading' && (
          <div className="mt-3 pt-2.5 border-t border-brand-sand/60 flex items-center justify-between text-[9px] font-bold tracking-wider text-brand-olive uppercase animate-pulse">
            <span>Uploading...</span>
            <div className="w-1.5 h-1.5 bg-brand-olive rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}
