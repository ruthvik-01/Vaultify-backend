import React, { useState, useEffect } from 'react';
import { useFiles } from '../context/FileContext';
import { 
  Users, Link2, Eye, Download, X, Share2, Calendar, FileText, 
  Award, FolderGit, FileCode, Video, File, Globe, Lock, Loader2,
  Folder, Music, FileSpreadsheet, Presentation, ShieldAlert, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmptyState from '../components/EmptyState';

export default function SharedFiles() {
  const { files, removeShare, getPreviewUrl, showNotification } = useFiles();
  const [activeTab, setActiveTab] = useState('by-me'); // by-me | with-me

  // Preview panel states
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [textContent, setTextContent] = useState('');

  // Local state for loaded shares
  const [sharedByMe, setSharedByMe] = useState([]);
  const [sharedWithMe, setSharedWithMe] = useState([]); // Empty - Do NOT generate mock data

  const loadSharedByMe = () => {
    // 1. Files & Videos from localStorage
    const localShares = JSON.parse(localStorage.getItem('vaultify_local_shares') || '[]');
    
    // 2. Folders from localStorage
    const sharedFolders = JSON.parse(localStorage.getItem('vaultify_video_shared_folders') || '{}');
    const foldersArray = Object.keys(sharedFolders).map(token => ({
      id: token,
      fileId: token,
      name: sharedFolders[token].name,
      category: 'Folder',
      type: 'folder',
      shareLink: `${window.location.origin}/share/folder/${token}`,
      createdAt: sharedFolders[token].created_at || new Date().toISOString(),
      permission: 'read',
      status: 'Active',
      isFolder: true
    }));

    setSharedByMe([...localShares, ...foldersArray]);
  };

  useEffect(() => {
    loadSharedByMe();
  }, [files]);

  const handleRevokeShare = async (item) => {
    if (confirm(`Revoke all shared access for "${item.name}"?`)) {
      if (item.isFolder) {
        // Delete folder share
        const sharedFolders = JSON.parse(localStorage.getItem('vaultify_video_shared_folders') || '{}');
        delete sharedFolders[item.id];
        localStorage.setItem('vaultify_video_shared_folders', JSON.stringify(sharedFolders));
        showNotification(`Access revoked for folder "${item.name}"`, 'success');
        loadSharedByMe();
      } else {
        // Revoke standard file/video share
        await removeShare(item.fileId);
        loadSharedByMe();
      }
    }
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getFileIcon = (file) => {
    if (file.isFolder || file.type === 'folder') return <Folder className="w-8 h-8 text-brand-olive" />;
    if (file.category === 'Certificates') return <Award className="w-8 h-8 text-amber-600" />;
    if (file.category === 'Projects') return <FolderGit className="w-8 h-8 text-brand-olive" />;
    
    const ext = file.name.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      return <File className="w-8 h-8 text-emerald-500" />;
    }
    if (['mp3', 'wav', 'aac', 'ogg'].includes(ext)) {
      return <Music className="w-8 h-8 text-purple-500" />;
    }
    if (['xls', 'xlsx'].includes(ext)) {
      return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
    }
    if (['ppt', 'pptx'].includes(ext)) {
      return <Presentation className="w-8 h-8 text-orange-500" />;
    }

    switch (file.type) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-rose-500" />;
      case 'zip':
      case 'rar':
      case '7z':
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

  const handleCopyLink = (shareLink) => {
    navigator.clipboard.writeText(shareLink);
    showNotification('Share link copied to clipboard!', 'success');
  };

  const handleOpenPreview = async (file) => {
    setPreviewFile(file);
    setPreviewLoading(true);
    setPreviewUrl(null);
    setTextContent('');
    
    try {
      if (file.isFolder) {
        setPreviewUrl(file.shareLink);
      } else {
        const url = await getPreviewUrl(file.fileId);
        setPreviewUrl(url);

        const ext = file.name.split('.').pop().toLowerCase();
        const isText = ['txt', 'js', 'json', 'css', 'html', 'md'].includes(ext) || (file.mimeType && file.mimeType.startsWith('text/'));
        if (isText && url) {
          const textRes = await fetch(url);
          if (textRes.ok) {
            const txt = await textRes.text();
            setTextContent(txt);
          } else {
            setTextContent(`Failed to load text content.`);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = (file) => {
    if (file.isFolder) {
      window.open(file.shareLink, '_blank');
    } else {
      window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/files/download/${file.fileId}?disposition=attachment`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Selector Tabs */}
      <div className="flex bg-white border border-brand-sand p-1 rounded-2xl w-full max-w-md shadow-sm">
        <button
          onClick={() => setActiveTab('by-me')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'by-me'
              ? 'bg-brand-olive text-white shadow-sm'
              : 'text-gray-500 hover:text-brand-charcoal'
          }`}
        >
          Shared by Me ({sharedByMe.length})
        </button>
        <button
          onClick={() => setActiveTab('with-me')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'with-me'
              ? 'bg-brand-olive text-white shadow-sm'
              : 'text-gray-500 hover:text-brand-charcoal'
          }`}
        >
          Shared with Me ({sharedWithMe.length})
        </button>
      </div>

      {/* Grid: Shared BY me */}
      {activeTab === 'by-me' && (
        <div className="space-y-4">
          {sharedByMe.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sharedByMe.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  className="bg-white border border-brand-sand rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 bg-brand-cream rounded-2xl border border-brand-sand/40">
                      {getFileIcon(item)}
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleCopyLink(item.shareLink)}
                        className="p-2 hover:bg-brand-cream rounded-xl border border-brand-sand/50 text-brand-charcoal transition-all text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                        title="Copy Share Link"
                      >
                        <Link2 className="w-3.5 h-3.5 text-brand-olive" />
                        <span>Copy URL</span>
                      </button>

                      <button
                        onClick={() => handleRevokeShare(item)}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-xl border border-transparent hover:border-red-100 transition-all cursor-pointer"
                        title="Revoke Share Access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-serif text-sm font-bold text-brand-charcoal truncate" title={item.name}>
                      {item.name}
                    </h4>
                    <div className="flex items-center space-x-2 text-[10px] text-gray-400 mt-1">
                      {!item.isFolder && <span>Size: {formatSize(item.size)}</span>}
                      {!item.isFolder && <span>•</span>}
                      <span className="text-brand-olive bg-brand-sage-light/25 px-2 py-0.5 rounded-full font-semibold">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Share details */}
                  <div className="pt-3 border-t border-brand-sand/50 flex justify-between items-center text-[10px] text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-brand-olive" />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 border border-emerald-100 rounded-full font-bold">
                      {item.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-12 bg-white border border-brand-sand rounded-3xl p-8 shadow-sm">
              <EmptyState 
                title="No shared links yet"
                description="When you share a file with recruiters, it will appear here so you can monitor access permission settings."
                actionText="Go to Locker Files"
                onActionClick={() => window.location.href = '/my-files'}
                icon={Share2}
              />
            </div>
          )}
        </div>
      )}

      {/* Grid: Shared WITH me */}
      {activeTab === 'with-me' && (
        <div className="py-12 bg-white border border-brand-sand rounded-3xl p-8 shadow-sm">
          <EmptyState 
            title="No files shared with you"
            description="When other users share their assets or folders with you, they will appear in this tab."
            actionText="Go to Locker Files"
            onActionClick={() => window.location.href = '/my-files'}
            icon={Users}
          />
        </div>
      )}

      {/* Dynamic Inline Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewFile(null)}
              className="absolute inset-0 bg-brand-charcoal"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-brand-sand rounded-3xl p-6 shadow-xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <button
                onClick={() => setPreviewFile(null)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-brand-charcoal hover:bg-brand-cream rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 pb-4 border-b border-brand-sand mb-4">
                <div className="p-2.5 bg-brand-cream rounded-xl border border-brand-sand/50">
                  {getFileIcon(previewFile)}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-brand-charcoal block line-clamp-1">{previewFile.name}</h3>
                  <p className="text-xs text-gray-500 font-sans">
                    Category: <span className="font-semibold text-brand-olive">{previewFile.category}</span>
                  </p>
                </div>
              </div>

              {/* Preview frame */}
              <div className="bg-brand-cream border border-brand-sand/80 rounded-2xl flex-grow overflow-hidden flex flex-col items-center justify-center min-h-[350px] relative">
                {previewLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-10 h-10 animate-spin text-brand-olive" />
                    <span className="text-xs text-gray-500 mt-2">Retrieving vault item...</span>
                  </div>
                ) : previewUrl ? (
                  (() => {
                    if (previewFile.isFolder) {
                      return (
                        <div className="text-center p-6">
                          <Folder className="w-16 h-16 text-brand-olive/60 mx-auto mb-3" />
                          <h4 className="font-semibold text-brand-charcoal text-sm mb-1">{previewFile.name}</h4>
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-brand-olive hover:bg-brand-olive-dark text-white px-5 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center space-x-2 transition-all shadow-sm"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Shared Folder</span>
                          </a>
                        </div>
                      );
                    }

                    const ext = previewFile.name.split('.').pop().toLowerCase();
                    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
                    const isPdf = ext === 'pdf';
                    const isText = ['txt', 'js', 'json', 'css', 'html', 'md'].includes(ext);

                    if (isImage) {
                      return (
                        <div className="w-full h-full flex items-center justify-center p-2">
                          <img 
                            src={previewUrl} 
                            className="max-h-[55vh] max-w-full object-contain rounded-xl shadow border border-brand-sand/40 bg-white" 
                            alt={previewFile.name} 
                          />
                        </div>
                      );
                    } else if (isPdf) {
                      return (
                        <iframe 
                          src={previewUrl} 
                          className="w-full h-[55vh] rounded-xl border border-brand-sand/50 bg-white" 
                          title={previewFile.name} 
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
                        <div className="text-center p-6">
                          <FileText className="w-16 h-16 text-brand-olive/60 mx-auto mb-3" />
                          <h4 className="font-semibold text-brand-charcoal text-sm mb-1">{previewFile.name}</h4>
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
                    <span className="text-xs text-red-500 font-semibold">Failed to establish secure preview connection.</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-brand-sand flex justify-end">
                <button
                  onClick={() => setPreviewFile(null)}
                  className="bg-brand-cream border border-brand-sand hover:bg-brand-sand/40 text-brand-charcoal px-4 py-2 rounded-xl font-semibold transition-all text-xs"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
