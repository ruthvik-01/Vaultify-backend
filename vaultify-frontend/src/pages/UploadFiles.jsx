import React, { useState, useRef } from 'react';
import { useFiles } from '../context/FileContext';
import { 
  UploadCloud, FileText, CheckCircle2, FileUp, Sparkles, 
  ArrowRight, FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UploadFiles() {
  const { uploadFile, folders, files, showNotification } = useFiles();
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState('idle'); // idle | configuring | uploading | success
  
  // File details states
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [fileType, setFileType] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState('');
  
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [eta, setEta] = useState(0);

  const fileInputRef = useRef(null);
  const selectedFileRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setupFileDetails(file);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setupFileDetails(file);
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

  const setupFileDetails = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const isVideo = allowedVideoExtensions.includes(ext) || (file.type && file.type.startsWith('video/'));

    if (!isVideo && !allowedExtensions.includes(ext) && !allowedMimeTypes.includes(file.type)) {
      showNotification(
        `Unsupported file type (.${ext}). Allowed: PDF, DOC/DOCX, JPEG, PNG, ZIP, and TXT.`,
        'error'
      );
      return;
    }

    if (!isVideo && file.size > maxFileSize) {
      showNotification(
        `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed: 10 MB.`,
        'error'
      );
      return;
    }

    selectedFileRef.current = file;
    setFileName(file.name);
    setFileSize(file.size);
    setFileType(ext);
    setUploadState('configuring');
  };

  const executeUpload = async () => {
    setUploadState('uploading');
    setProgress(0);
    setSpeed(0);
    setEta(0);

    const ext = fileName.split('.').pop().toLowerCase();
    const isVideo = allowedVideoExtensions.includes(ext) || (selectedFileRef.current && selectedFileRef.current.type && selectedFileRef.current.type.startsWith('video/'));

    try {
      let progressInterval;
      if (!isVideo) {
        progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 120);
      }

      await uploadFile({
        file: selectedFileRef.current,
        name: fileName,
        type: fileType,
        size: fileSize,
        folderId: selectedFolderId || null
      }, (progInfo) => {
        if (isVideo) {
          setProgress(progInfo.progress);
          if (progInfo.speed) setSpeed(progInfo.speed);
          if (progInfo.eta) setEta(progInfo.eta);
        }
      });

      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setProgress(100);
      setUploadState('success');
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadState('idle');
      setProgress(0);
      setSpeed(0);
      setEta(0);
      showNotification('Upload failed: ' + (error?.message || 'Unknown error'), 'error');
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    return (bytes / (k * k)).toFixed(2) + ' MB';
  };

  const formatSpeed = (bytesPerSec) => {
    if (!bytesPerSec || bytesPerSec <= 0) return '';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
    return parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatETA = (seconds) => {
    if (!seconds || seconds <= 0) return 'estimating...';
    if (seconds < 60) return `${seconds}s remaining`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s remaining`;
  };

  const resetUploadPage = () => {
    selectedFileRef.current = null;
    setFileName('');
    setFileSize(0);
    setFileType('');
    setSelectedFolderId('');
    setProgress(0);
    setSpeed(0);
    setEta(0);
    setUploadState('idle');
  };

  const uploadLogs = files
    .filter(f => !f.inTrash)
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
      
      {/* Primary Upload Actions Panel */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-brand-sand rounded-3xl p-6 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-brand-charcoal mb-4">Locker Upload Workspace</h2>

          <AnimatePresence mode="wait">
            {uploadState === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[320px]
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
                <div className="bg-brand-cream-dark p-4 rounded-full text-brand-olive mb-4">
                  <UploadCloud className="w-12 h-12 stroke-[1.4]" />
                </div>
                <h3 className="font-serif text-lg font-bold text-brand-charcoal">Drag and drop file to upload</h3>
                <p className="text-xs text-gray-400 mt-1.5 max-w-sm">
                  Select your academic or placement assets: documents, images, videos, zip project codes, or certificates.
                </p>
                <button
                  type="button"
                  className="mt-6 bg-brand-olive hover:bg-brand-olive-dark text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  Browse local files
                </button>
              </motion.div>
            )}

            {uploadState === 'configuring' && (
              <motion.div
                key="configuring"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div className="bg-brand-cream border border-brand-sand rounded-2xl p-4 flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="bg-white p-2 rounded-lg border border-brand-sand/60">
                      <FileText className="w-5 h-5 text-brand-olive" />
                    </div>
                    <div>
                      <span className="font-bold text-brand-charcoal block truncate max-w-xs sm:max-w-md">{fileName}</span>
                      <span className="text-[10px] text-gray-500">{formatSize(fileSize)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={resetUploadPage}
                    className="text-xs text-red-500 hover:underline font-semibold"
                  >
                    Cancel
                  </button>
                </div>

                <div className="max-w-md">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5 flex items-center space-x-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-brand-olive" />
                    <span>Select Destination Folder</span>
                  </label>
                  <select
                    value={selectedFolderId}
                    onChange={(e) => setSelectedFolderId(e.target.value)}
                    className="w-full bg-brand-cream border border-brand-sand rounded-xl px-3 py-2.5 text-xs text-brand-charcoal focus:outline-none focus:ring-1 focus:ring-brand-olive"
                  >
                    <option value="">Locker Root (None)</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.folder_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Confirm upload buttons */}
                <div className="flex space-x-3 mt-6 pt-4 border-t border-brand-sand">
                  <button
                    onClick={resetUploadPage}
                    className="flex-1 bg-brand-cream border border-brand-sand hover:bg-brand-sand/40 text-brand-charcoal text-xs font-semibold py-2.5 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeUpload}
                    className="flex-1 bg-brand-olive hover:bg-brand-olive-dark text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>Store to Locker Vault</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {uploadState === 'uploading' && (
              <motion.div
                key="uploading"
                className="py-12 text-center flex flex-col items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full border-2 border-brand-sand border-t-brand-olive animate-spin mb-4" />
                <h3 className="font-serif text-lg font-bold text-brand-charcoal truncate max-w-sm">
                  Transferring "{fileName}" to Secure Sandbox...
                </h3>
                
                <div className="w-full max-w-xs bg-brand-cream-dark h-2 rounded-full overflow-hidden mt-6 mb-2">
                  <div 
                    className="bg-brand-olive h-full transition-all duration-300 ease-out" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
                <div className="flex flex-col space-y-1 text-center font-sans font-medium text-xs text-gray-500">
                  <span className="font-mono text-xs text-gray-600 font-bold">{progress}% COMPLETE</span>
                  <div className="flex justify-center space-x-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                    <span>Size: {formatSize(fileSize)}</span>
                    {speed > 0 && <span>Speed: {formatSpeed(speed)}</span>}
                    {eta > 0 && <span>{formatETA(eta)}</span>}
                  </div>
                </div>
              </motion.div>
            )}

            {uploadState === 'success' && (
              <motion.div
                key="success"
                className="py-12 text-center flex flex-col items-center justify-center"
              >
                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full border border-emerald-100 mb-4 inline-block">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-brand-charcoal">Secure Upload Completed</h3>
                <p className="text-xs text-gray-400 mt-2 max-w-sm leading-normal">
                  Your asset <span className="font-semibold text-brand-charcoal">"{fileName}"</span> has been encrypted and saved successfully.
                </p>

                <button
                  onClick={resetUploadPage}
                  className="mt-8 bg-brand-olive hover:bg-brand-olive-dark text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Upload another asset
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Sidebar Tips */}
      <div className="space-y-6">
        <div className="bg-white border border-brand-sand rounded-3xl p-5 shadow-sm">
          <h3 className="font-serif text-base font-bold text-brand-charcoal flex items-center mb-3">
            <Sparkles className="w-4 h-4 text-brand-olive mr-1.5" />
            <span>Vault Upload Standards</span>
          </h3>
          <ul className="text-xs text-gray-500 space-y-2.5 leading-relaxed font-sans">
            <li>
              <strong>Document Privacy:</strong> By default, all uploaded locker assets are 100% private. Use Share/Link to toggle collaborative view.
            </li>
            <li>
              <strong>Folder Storage:</strong> Organize your files inside custom folders to keep your digital locker tidy.
            </li>
          </ul>
        </div>

        <div className="bg-white border border-brand-sand rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="font-serif text-base font-bold text-brand-charcoal">Recent Upload History</h3>
          <div className="space-y-3">
            {uploadLogs.map(log => (
              <div key={log.id} className="flex items-center space-x-3 p-3 bg-brand-cream border border-brand-sand/60 rounded-xl">
                <div className="p-2 bg-white rounded-lg border border-brand-sand text-brand-olive shrink-0">
                  <FileUp className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-brand-charcoal block truncate">{log.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
