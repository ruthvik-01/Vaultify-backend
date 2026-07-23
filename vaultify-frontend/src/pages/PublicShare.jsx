import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { shareService } from '../services/shareService';
import SaasNotification from '../components/SaasNotification';
import { 
  Download, Film, Folder, AlertTriangle, Loader2, ShieldCheck, Lock, HardDrive, User, Calendar,
  FileText, FileCode, File, Music, Image as ImageIcon, FileSpreadsheet, Presentation, Video, Eye, X, Play 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDate } from '../utils/formatDate';

const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function PublicShare() {
  const { token } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function loadSharedItem() {
      setLoading(true);
      setError('');
      try {
        const data = await shareService.getSharedItem(token);
        setItem(data);
      } catch (err) {
        setError(err.message || 'The shared link is invalid, has expired, or has been deleted.');
      } finally {
        setLoading(false);
      }
    }
    if (token) {
      loadSharedItem();
    }
  }, [token]);

  const handleDownloadFile = async (fileId, fileName) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_URL}/share/${token}/files/${fileId}`);
      if (!res.ok) {
        throw new Error('Failed to get download URL.');
      }
      const json = await res.json();
      const downloadUrl = json.data.download_url;
      if (downloadUrl) {
        // Trigger download
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Could not download file: ' + err.message, type: 'error' });
    }
  };

  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  const handlePreviewFile = async (file) => {
    setPreviewFile(file);
    setPreviewLoading(true);
    setPreviewUrl(null);
    setPreviewError('');
    try {
      const fileId = file.id || file._id;
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_URL}/share/${token}/files/${fileId}?disposition=inline`);
      if (!res.ok) {
        throw new Error('Failed to load file preview.');
      }
      const json = await res.json();
      const downloadUrl = json.data.download_url;
      setPreviewUrl(downloadUrl);
    } catch (err) {
      setPreviewError(err.message || 'Could not load preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-4 font-sans select-none text-left">
        <div className="bg-white border border-brand-sand rounded-3xl p-12 text-center shadow-xl flex flex-col items-center justify-center max-w-sm w-full">
          <Loader2 className="w-10 h-10 text-brand-olive animate-spin mb-4" />
          <h3 className="font-serif font-bold text-base text-brand-charcoal mb-1">
            Loading Shared Vault...
          </h3>
          <p className="text-[10px] text-brand-olive-dark tracking-widest uppercase font-semibold">
            Decrypting credentials
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-4 font-sans select-none text-left">
        <div className="bg-white border border-brand-sand rounded-3xl p-10 text-center shadow-xl flex flex-col items-center justify-center max-w-md w-full">
          <div className="bg-red-50 text-red-600 p-4 rounded-full mb-4 border border-red-100">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="font-serif font-bold text-lg text-brand-charcoal mb-2">
            Link Unavailable
          </h2>
          <p className="text-xs text-gray-500 mb-6 max-w-xs">
            {error}
          </p>
          <a
            href="/"
            className="px-5 py-2.5 bg-brand-olive hover:bg-brand-olive-dark text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-md shadow-brand-olive/15"
          >
            Go to Vaultify Home
          </a>
        </div>
      </div>
    );
  }

  const fileName = item.file_name || item.name || 'Shared File';
  const fileSize = item.file_size || item.size || 0;
  const fileType = item.file_type || item.mimeType || '';
  const downloadUrl = item.download_url || item.downloadUrl;
  const createdAt = item.createdAt;
  const ownerName = item.ownerName || 'Owner';
  const isFolder = item.type === 'folder';

  const ext = fileName.split('.').pop().toLowerCase();
  const isVideo = fileType.startsWith('video/') || ['mp4', 'mov', 'mkv', 'avi', 'webm'].includes(ext);
  const isImage = fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);
  const isPdf = fileType === 'application/pdf' || ext === 'pdf';
  const isText = fileType.startsWith('text/') || ['txt', 'log', 'json', 'js', 'html', 'css'].includes(ext);

  const getFileIcon = (name, mimeType) => {
    const fileExt = (name || '').split('.').pop().toLowerCase();
    const isVideoFile = ['mp4', 'mov', 'mkv', 'avi', 'webm', 'flv', 'wmv'].includes(fileExt) || (mimeType && mimeType.startsWith('video/'));
    const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExt) || (mimeType && mimeType.startsWith('image/'));
    const isAudio = ['mp3', 'wav', 'ogg', 'm4a'].includes(fileExt) || (mimeType && mimeType.startsWith('audio/'));
    const isPdfFile = fileExt === 'pdf';
    const isCode = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java', 'cpp', 'c', 'go'].includes(fileExt);
    const isSpreadsheet = ['xls', 'xlsx', 'csv'].includes(fileExt);
    const isPresentation = ['ppt', 'pptx'].includes(fileExt);

    if (isVideoFile) return <Video className="w-4 h-4 text-brand-sage shrink-0" />;
    if (isImg) return <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />;
    if (isAudio) return <Music className="w-4 h-4 text-purple-500 shrink-0" />;
    if (isPdfFile) return <FileText className="w-4 h-4 text-rose-500 shrink-0" />;
    if (isCode) return <FileCode className="w-4 h-4 text-amber-500 shrink-0" />;
    if (isSpreadsheet) return <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />;
    if (isPresentation) return <Presentation className="w-4 h-4 text-orange-500 shrink-0" />;
    return <File className="w-4 h-4 text-gray-400 shrink-0" />;
  };

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-4 md:p-8 font-sans select-none text-left">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white border border-brand-sand rounded-3xl overflow-hidden shadow-2xl max-w-3xl w-full flex flex-col"
      >
        {/* Brand Header */}
        <div className="px-6 py-4 border-b border-brand-sand bg-brand-cream-dark flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="bg-brand-olive text-white p-2 rounded-xl">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif text-sm font-bold tracking-tight text-brand-charcoal block">Vaultify</span>
              <span className="text-[8px] text-brand-olive-dark font-sans tracking-widest uppercase font-semibold">Secure Share</span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 text-[9px] font-bold text-brand-olive uppercase tracking-wider bg-white border border-brand-sand rounded-full px-2.5 py-1 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>End-to-End Encrypted</span>
          </div>
        </div>

        {/* Shared file details */}
        {!isFolder ? (
          <div className="flex flex-col">
            {/* Preview Frame */}
            {isVideo && downloadUrl ? (
              <div className="bg-black aspect-video flex items-center justify-center relative w-full border-b border-brand-sand">
                <video
                  src={downloadUrl}
                  controls
                  preload="metadata"
                  className="w-full h-full max-h-[45vh] object-contain focus:outline-none"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : isImage && downloadUrl ? (
              <div className="bg-white aspect-video flex items-center justify-center relative w-full border-b border-brand-sand p-4">
                <img
                  src={downloadUrl}
                  alt={fileName}
                  className="max-w-full max-h-[45vh] object-contain rounded-xl shadow-md border border-brand-sand/50"
                />
              </div>
            ) : (isPdf || isText) && downloadUrl ? (
              <div className="bg-white aspect-video flex items-center justify-center relative w-full border-b border-brand-sand">
                <iframe
                  src={downloadUrl}
                  className="w-full h-[45vh] border-0"
                  title={fileName}
                />
              </div>
            ) : (
              <div className="bg-brand-cream-dark aspect-video flex flex-col items-center justify-center w-full border-b border-brand-sand">
                <Film className="w-16 h-16 text-brand-sage/40 stroke-[1.2]" />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-2">
                  No preview available for this file format
                </span>
              </div>
            )}

            {/* Info panel */}
            <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3 flex-grow min-w-0">
                <div className="flex items-center space-x-2">
                  <Film className="w-5 h-5 text-brand-olive shrink-0" />
                  <h1 className="font-serif font-bold text-base md:text-lg text-brand-charcoal truncate">
                    {fileName}
                  </h1>
                </div>
                
                {/* Meta details list */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 font-medium font-sans">
                  <div className="flex items-center space-x-1">
                    <HardDrive className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{formatSize(fileSize)}</span>
                  </div>
                  {createdAt && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>Uploaded: {formatDate(createdAt)}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>Owner: {ownerName}</span>
                  </div>
                </div>
              </div>

              {/* Download Action button */}
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download={fileName}
                  className="flex items-center justify-center space-x-2 px-6 py-3.5 bg-brand-olive hover:bg-brand-olive-dark text-white rounded-2xl text-xs font-semibold cursor-pointer transition-colors shadow-lg shadow-brand-olive/15 text-center shrink-0"
                >
                  <Download className="w-4.5 h-4.5" />
                  <span>Download file</span>
                </a>
              )}
            </div>
          </div>
        ) : (
          /* Shared Folder */
          <div className="p-8 space-y-6 text-left">
            <div className="flex items-center space-x-3 pb-4 border-b border-brand-sand">
              <div className="bg-brand-sage-light/50 text-brand-olive p-3 rounded-2xl">
                <Folder className="w-8 h-8 fill-brand-sage/20" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-lg text-brand-charcoal mb-0.5">
                  {item.file_name || item.name}
                </h1>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-sans">
                  Shared Folder Content
                </span>
              </div>
            </div>

            {/* List of files in the folder */}
            <div className="space-y-3">
              <h2 className="font-serif text-sm font-bold text-brand-charcoal">Files</h2>
              {item.files && item.files.length > 0 ? (
                <div className="bg-brand-cream/35 border border-brand-sand/70 rounded-2xl overflow-hidden divide-y divide-brand-sand/50">
                  {item.files.map((file) => (
                    <div 
                      key={file.id || file._id} 
                      className="p-4 flex items-center justify-between hover:bg-brand-cream/70 transition-colors"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="bg-white p-2.5 rounded-xl border border-brand-sand text-brand-olive shrink-0 animate-fade-in">
                          {getFileIcon(file.name || file.filename || file.file_name, file.mimeType || file.file_type)}
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-semibold text-brand-charcoal block truncate">{file.name || file.filename || file.file_name}</span>
                          <span className="text-[10px] text-gray-400 font-mono block mt-0.5">{formatSize(file.size || file.file_size)}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handlePreviewFile(file)}
                          className="flex items-center space-x-1.5 px-3 py-2 bg-brand-cream hover:bg-brand-sand/55 text-brand-charcoal border border-brand-sand rounded-xl text-[10px] font-bold cursor-pointer transition-colors shadow-sm select-none"
                        >
                          <Eye className="w-3.5 h-3.5 text-brand-olive" />
                          <span>Preview</span>
                        </button>
                        <button
                          onClick={() => handleDownloadFile(file.id || file._id, file.name || file.filename || file.file_name)}
                          className="flex items-center space-x-1.5 px-3 py-2 bg-brand-olive hover:bg-brand-olive-dark text-white rounded-xl text-[10px] font-bold cursor-pointer transition-colors shadow-sm select-none"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-brand-cream border border-brand-sand rounded-2xl p-6 text-center text-xs text-gray-500 font-medium">
                  <span>This folder is empty.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer branding */}
        <div className="px-6 py-4 bg-brand-cream-dark border-t border-brand-sand text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center select-none">
          Powered by Vaultify Cloud Services • Secure Carrier Link
        </div>
      </motion.div>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-charcoal/90 backdrop-blur-sm animate-fade-in text-left">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl border border-brand-sand/55 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-brand-sand flex items-center justify-between bg-brand-cream select-none">
              <div className="flex items-center space-x-2.5 min-w-0">
                <Eye className="w-5 h-5 text-brand-olive shrink-0" />
                <h2 className="font-serif font-bold text-sm text-brand-charcoal truncate">
                  {previewFile.name || previewFile.filename || previewFile.file_name}
                </h2>
              </div>
              <button
                onClick={() => { setPreviewFile(null); setPreviewUrl(null); }}
                className="p-1.5 rounded-lg hover:bg-brand-sand/60 text-gray-500 hover:text-brand-charcoal transition-colors cursor-pointer focus:outline-none"
                aria-label="Close preview"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-grow bg-white relative flex items-center justify-center overflow-hidden min-h-[40vh]">
              {previewLoading ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <Loader2 className="w-10 h-10 text-brand-olive animate-spin mb-4" />
                  <span className="text-xs font-semibold text-gray-500">Decrypting & Loading Preview...</span>
                </div>
              ) : previewError ? (
                <div className="p-8 text-center text-xs text-red-600 bg-red-50 rounded-2xl border border-red-200">
                  {previewError}
                </div>
              ) : (
                (() => {
                  const name = previewFile.name || previewFile.filename || previewFile.file_name || '';
                  const fileType = previewFile.mimeType || previewFile.file_type || '';
                  const ext = name.split('.').pop().toLowerCase();
                  const isVideo = fileType.startsWith('video/') || ['mp4', 'mov', 'mkv', 'avi', 'webm'].includes(ext);
                  const isImage = fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
                  const isPdf = fileType === 'application/pdf' || ext === 'pdf';
                  const isText = fileType.startsWith('text/') || ['txt', 'log', 'json', 'js', 'html', 'css'].includes(ext);

                  if (isVideo && previewUrl) {
                    return (
                      <video src={previewUrl} controls autoPlay className="w-full h-full max-h-[70vh] object-contain focus:outline-none" />
                    );
                  }
                  if (isImage && previewUrl) {
                    return (
                      <div className="p-4">
                        <img src={previewUrl} alt={name} className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-md border border-brand-sand/50" />
                      </div>
                    );
                  }
                  if ((isPdf || isText) && previewUrl) {
                    return (
                      <iframe src={previewUrl} className="w-full h-[70vh] border-0" title={name} />
                    );
                  }
                  return (
                    <div className="w-full min-h-[40vh] flex flex-col items-center justify-center p-8 text-center bg-brand-cream/30">
                      <div className="bg-brand-cream-dark p-6 rounded-full mb-4 shadow-inner text-brand-olive border border-brand-sand">
                        <FileText className="w-14 h-14 stroke-[1.1]" />
                      </div>
                      <h3 className="font-serif font-bold text-base text-brand-charcoal mb-2">{name}</h3>
                      <p className="text-xs text-gray-500 max-w-sm mb-6">
                        Previews are not supported for this file type ({ext.toUpperCase()}). Please download to view.
                      </p>
                      <a
                        href={previewUrl}
                        download={name}
                        className="flex items-center space-x-2 px-6 py-3 bg-brand-olive hover:bg-brand-olive-dark text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-md shadow-brand-olive/10"
                      >
                        <Download className="w-4.5 h-4.5" />
                        <span>Download to View</span>
                      </a>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-brand-cream border-t border-brand-sand text-[10px] text-gray-400 font-semibold tracking-wider uppercase select-none text-right">
              Vaultify Shared View • Encrypted Session
            </div>
          </div>
        </div>
      )}
      <AnimatePresence>
        {toast && (
          <SaasNotification toast={toast} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
