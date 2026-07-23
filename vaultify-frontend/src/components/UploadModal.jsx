import React, { useState, useRef } from 'react';
import { useFiles } from '../context/FileContext';
import { UploadCloud, X, CheckCircle2, FileUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UploadModal({ isOpen, onClose }) {
  const { uploadFile, showNotification } = useFiles();
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState('idle'); // idle | uploading | success
  const [progress, setProgress] = useState(0);
  const [uploadedName, setUploadedName] = useState('');
  const fileInputRef = useRef(null);
  const selectedFileRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'zip', 'txt'];
  const allowedVideoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v', 'mpeg', '3gp', 'ogv'];
  const allowedMimeTypes = [
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg', 'image/png',
    'application/zip', 'application/x-zip-compressed',
    'text/plain'
  ];
  const maxFileSize = 10 * 1024 * 1024; // 10 MB

  const validateFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const isVideo = allowedVideoExtensions.includes(ext) || (file.type && file.type.startsWith('video/'));

    if (!isVideo && !allowedExtensions.includes(ext) && !allowedMimeTypes.includes(file.type)) {
      showNotification(
        `Unsupported file type (.${ext}). Allowed: PDF, DOC/DOCX, JPEG, PNG, ZIP, and TXT.`,
        'error'
      );
      return false;
    }
    if (!isVideo && file.size > maxFileSize) {
      showNotification(
        `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed: 10 MB.`,
        'error'
      );
      return false;
    }
    return true;
  };

  const startUpload = async (file) => {
    if (!validateFile(file)) return;

    setUploadedName(file.name);
    setUploadState('uploading');
    setProgress(0);

    // Simulate progress while the real upload runs
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(Math.min(currentProgress, 90));
      if (currentProgress >= 90) clearInterval(interval);
    }, 150);

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const currentFolderId = searchParams.get('folder') || null;

      await uploadFile({
        file,
        folderId: currentFolderId,
      });
      clearInterval(interval);
      setProgress(100);
      setUploadState('success');
    } catch (err) {
      clearInterval(interval);
      setUploadState('idle');
      console.error('Upload error:', err);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      selectedFileRef.current = file;
      startUpload(file);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      selectedFileRef.current = file;
      startUpload(file);
    }
  };

  const triggerInputClick = () => {
    fileInputRef.current?.click();
  };

  const resetModal = () => {
    setUploadState('idle');
    setProgress(0);
    setUploadedName('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop blur overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          onClick={resetModal}
          className="absolute inset-0 bg-brand-charcoal"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white border border-brand-sand rounded-3xl p-6 shadow-xl w-full max-w-lg relative z-10 overflow-hidden"
        >
          {/* Top Header */}
          <div className="flex justify-between items-center pb-4 border-b border-brand-sand mb-5">
            <div className="flex items-center space-x-2">
              <FileUp className="w-5 h-5 text-brand-olive" />
              <h3 className="font-serif text-lg font-bold text-brand-charcoal">Upload Document Locker</h3>
            </div>
            <button
              onClick={resetModal}
              className="p-1.5 text-gray-400 hover:text-brand-charcoal hover:bg-brand-cream rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {uploadState === 'idle' && (
            <div>
              {/* Drag Area */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerInputClick}
                className={`
                  border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center h-52
                  ${dragActive 
                    ? 'border-brand-olive bg-brand-sage-light/20 scale-[0.99]' 
                    : 'border-brand-sand hover:border-brand-olive hover:bg-brand-cream/50'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="bg-brand-cream-dark p-3 rounded-full text-brand-olive mb-3">
                  <UploadCloud className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h4 className="text-xs font-bold text-brand-charcoal">Drag and drop file here, or browse</h4>
                <p className="text-[10px] text-gray-400 mt-1 max-w-[240px]">
                  Supports documents, images, videos, and zip files up to 10 MB
                </p>
              </div>
            </div>
          )}

          {uploadState === 'uploading' && (
            <div className="py-8 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-brand-sand border-t-brand-olive animate-spin mb-4" />
              <h4 className="text-xs font-bold text-brand-charcoal truncate max-w-[320px]">
                Uploading "{uploadedName}"
              </h4>

              {/* Progress Slider */}
              <div className="w-full max-w-xs bg-brand-cream-dark h-2 rounded-full overflow-hidden mt-6 mb-2">
                <div 
                  className="bg-brand-olive h-full transition-all duration-300 ease-out" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
              <span className="font-mono text-xs text-gray-500 font-semibold">{progress}%</span>
            </div>
          )}

          {uploadState === 'success' && (
            <div className="py-8 text-center flex flex-col items-center justify-center">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-emerald-50 text-emerald-600 p-4 rounded-full mb-4 border border-emerald-100"
              >
                <CheckCircle2 className="w-12 h-12" />
              </motion.div>
              <h4 className="text-sm font-bold text-brand-charcoal">Upload Successful!</h4>
              <p className="text-xs text-gray-400 mt-1.5 truncate max-w-[320px]">
                "{uploadedName}" is now stored in your folder.
              </p>

              <div className="flex space-x-3 mt-8 w-full">
                <button
                  onClick={() => setUploadState('idle')}
                  className="flex-1 bg-brand-cream border border-brand-sand hover:bg-brand-sand/30 text-brand-charcoal text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Upload Another
                </button>
                <button
                  onClick={resetModal}
                  className="flex-1 bg-brand-olive hover:bg-brand-olive-dark text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Go to Locker
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
