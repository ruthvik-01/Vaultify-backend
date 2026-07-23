import React, { useState, useRef } from 'react';
import { X, Video, FileText, Image as ImageIcon, Eye, Download, HardDrive, Share2, Check, User, FolderClosed, Calendar, ExternalLink, Maximize, Gauge, Music, FileSpreadsheet, Presentation, FileArchive } from 'lucide-react';

const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function VideoPlayer({ video, playbackUrl, onClose }) {
  const [copied, setCopied] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const videoRef = useRef(null);

  if (!video) return null;

  const url = playbackUrl || video.publicUrl || video.url || '';
  const ext = (video.name || video.fileName || '').split('.').pop().toLowerCase();
  const isVideo = ['mp4', 'mov', 'mkv', 'avi', 'webm', 'flv', 'wmv'].includes(ext) || (video.mimeType && video.mimeType.startsWith('video/'));
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) || (video.mimeType && video.mimeType.startsWith('image/'));
  const isPdf = ext === 'pdf' || (video.mimeType && video.mimeType === 'application/pdf');
  const isText = ['txt', 'log', 'json', 'js', 'html', 'css'].includes(ext) || (video.mimeType && video.mimeType.startsWith('text/'));
  const isAudio = ['mp3', 'wav', 'aac', 'ogg', 'm4a', 'flac'].includes(ext) || (video.mimeType && video.mimeType.startsWith('audio/'));
  const isWord = ['doc', 'docx'].includes(ext) || (video.mimeType && (video.mimeType.includes('word') || video.mimeType.includes('officedocument.wordprocessingml')));
  const isExcel = ['xls', 'xlsx'].includes(ext) || (video.mimeType && (video.mimeType.includes('excel') || video.mimeType.includes('spreadsheet') || video.mimeType.includes('csv')));
  const isPowerPoint = ['ppt', 'pptx'].includes(ext) || (video.mimeType && (video.mimeType.includes('presentation') || video.mimeType.includes('powerpoint')));
  const isZip = ['zip', 'rar', '7z'].includes(ext) || (video.mimeType && (video.mimeType.includes('zip') || video.mimeType.includes('x-rar') || video.mimeType.includes('x-7z') || video.mimeType.includes('archive') || video.mimeType.includes('compressed')));

  const handleDownload = () => {
    if (url) window.open(url, '_blank');
  };

  const handleOpenLink = () => {
    const shareLink = video.publicUrl || url || `${window.location.origin}/share/${video.id}`;
    window.open(shareLink, '_blank');
  };

  const handleCopyLink = () => {
    const shareLink = video.publicUrl || url || `${window.location.origin}/share/${video.id}`;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeedChange = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      }
    }
  };

  const renderPreview = () => {
    if (isVideo && url) {
      return (
        <video
          ref={videoRef}
          src={url}
          controls
          autoPlay
          className="w-full h-full max-h-[65vh] object-contain focus:outline-none"
        >
          Your browser does not support the video tag.
        </video>
      );
    }

    if (isImage && url) {
      return (
        <div className="w-full h-full max-h-[65vh] flex items-center justify-center p-4">
          <img
            src={url}
            alt={video.name || video.fileName}
            className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-lg border border-brand-sand/50"
          />
        </div>
      );
    }

    if ((isPdf || isText) && url) {
      return (
        <iframe
          src={url}
          className="w-full h-[65vh] border-0 rounded-b-2xl"
          title={video.name || video.fileName}
        />
      );
    }

    if (isAudio && url) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-brand-cream/40 rounded-xl animate-fade-in select-text">
          <Music className="w-16 h-16 text-purple-500 mb-4 animate-bounce" />
          <audio
            src={url}
            controls
            className="w-full max-w-md focus:outline-none"
          >
            Your browser does not support the audio player.
          </audio>
          <span className="text-xs text-gray-500 mt-2 font-mono">{video.name || video.fileName}</span>
        </div>
      );
    }

    if (isWord) {
      return (
        <div className="w-full min-h-[35vh] flex flex-col items-center justify-center p-8 bg-brand-cream/30 text-center">
          <div className="bg-brand-cream-dark p-5 rounded-full mb-4 shadow-inner text-blue-600 border border-brand-sand">
            <FileText className="w-12 h-12 stroke-[1.2]" />
          </div>
          <h3 className="font-serif font-bold text-base text-brand-charcoal mb-1">
            {video.name || video.fileName}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mb-5 font-sans">
            Word document preview is not directly viewable online. Please download to view.
          </p>
          {url && (
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-5 py-2.5 bg-brand-olive hover:bg-brand-olive-dark text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Document</span>
            </button>
          )}
        </div>
      );
    }

    if (isExcel) {
      return (
        <div className="w-full min-h-[35vh] flex flex-col items-center justify-center p-8 bg-brand-cream/30 text-center">
          <div className="bg-brand-cream-dark p-5 rounded-full mb-4 shadow-inner text-emerald-600 border border-brand-sand">
            <FileSpreadsheet className="w-12 h-12 stroke-[1.2]" />
          </div>
          <h3 className="font-serif font-bold text-base text-brand-charcoal mb-1">
            {video.name || video.fileName}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mb-5 font-sans">
            Spreadsheet preview is not directly viewable online. Please download to view.
          </p>
          {url && (
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-5 py-2.5 bg-brand-olive hover:bg-brand-olive-dark text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Spreadsheet</span>
            </button>
          )}
        </div>
      );
    }

    if (isPowerPoint) {
      return (
        <div className="w-full min-h-[35vh] flex flex-col items-center justify-center p-8 bg-brand-cream/30 text-center">
          <div className="bg-brand-cream-dark p-5 rounded-full mb-4 shadow-inner text-orange-500 border border-brand-sand">
            <Presentation className="w-12 h-12 stroke-[1.2]" />
          </div>
          <h3 className="font-serif font-bold text-base text-brand-charcoal mb-1">
            {video.name || video.fileName}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mb-5 font-sans">
            Presentation preview is not directly viewable online. Please download to view.
          </p>
          {url && (
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-5 py-2.5 bg-brand-olive hover:bg-brand-olive-dark text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Presentation</span>
            </button>
          )}
        </div>
      );
    }

    if (isZip) {
      return (
        <div className="w-full min-h-[35vh] flex flex-col items-center justify-center p-8 bg-brand-cream/30 text-center">
          <div className="bg-brand-cream-dark p-5 rounded-full mb-4 shadow-inner text-purple-600 border border-brand-sand">
            <FileArchive className="w-12 h-12 stroke-[1.2]" />
          </div>
          <h3 className="font-serif font-bold text-base text-brand-charcoal mb-1">
            {video.name || video.fileName}
          </h3>
          {video.size && (
            <p className="text-[10px] text-gray-400 font-mono mb-2">
              Size: {formatSize(video.size)}
            </p>
          )}
          <p className="text-xs text-gray-500 max-w-sm mb-5 font-sans">
            Archive package contains compressed files. Please download to extract.
          </p>
          {url && (
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-5 py-2.5 bg-brand-olive hover:bg-brand-olive-dark text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Archive</span>
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="w-full min-h-[35vh] flex flex-col items-center justify-center p-8 bg-brand-cream/30 text-center">
        <div className="bg-brand-cream-dark p-5 rounded-full mb-4 shadow-inner text-brand-olive border border-brand-sand">
          <FileText className="w-12 h-12 stroke-[1.2]" />
        </div>
        <h3 className="font-serif font-bold text-base text-brand-charcoal mb-1">
          {video.name || video.fileName}
        </h3>
        <p className="text-xs text-gray-500 max-w-sm mb-5 font-sans">
          No preview available
        </p>
        {url && (
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-5 py-2.5 bg-brand-olive hover:bg-brand-olive-dark text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download File</span>
          </button>
        )}
      </div>
    );
  };

  const getHeaderIcon = () => {
    if (isVideo) return <Video className="w-5 h-5 text-brand-olive shrink-0" />;
    if (isImage) return <ImageIcon className="w-5 h-5 text-brand-olive shrink-0" />;
    if (isAudio) return <Music className="w-5 h-5 text-brand-olive shrink-0" />;
    if (isWord) return <FileText className="w-5 h-5 text-brand-olive shrink-0" />;
    if (isExcel) return <FileSpreadsheet className="w-5 h-5 text-brand-olive shrink-0" />;
    if (isPowerPoint) return <Presentation className="w-5 h-5 text-brand-olive shrink-0" />;
    if (isZip) return <FileArchive className="w-5 h-5 text-brand-olive shrink-0" />;
    return <Eye className="w-5 h-5 text-brand-olive shrink-0" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/90 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl border border-brand-sand/55 flex flex-col max-h-[90vh]">
        {/* Header Controls */}
        <div className="px-6 py-4 border-b border-brand-sand flex items-center justify-between bg-brand-cream">
          <div className="flex items-center space-x-2.5 min-w-0 text-left">
            {getHeaderIcon()}
            <h2 className="font-serif font-bold text-sm text-brand-charcoal truncate">
              {video.name || video.fileName}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {/* Playback Speed Controls for Video */}
            {isVideo && (
              <div className="flex items-center space-x-1 bg-white border border-brand-sand rounded-xl px-2 py-1 text-xs">
                <Gauge className="w-3.5 h-3.5 text-brand-olive" />
                <select
                  value={playbackRate}
                  onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                  className="bg-transparent font-semibold text-[11px] text-brand-charcoal focus:outline-none cursor-pointer"
                  title="Playback Speed"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>
            )}
            {isVideo && (
              <button
                onClick={handleFullscreen}
                className="p-1.5 rounded-xl bg-white border border-brand-sand hover:bg-brand-sand/50 text-brand-charcoal transition-colors cursor-pointer"
                title="Fullscreen"
              >
                <Maximize className="w-3.5 h-3.5 text-brand-olive" />
              </button>
            )}
            <button
              onClick={handleOpenLink}
              className="p-1.5 rounded-xl bg-white border border-brand-sand hover:bg-brand-sand/50 text-brand-charcoal transition-colors cursor-pointer"
              title="Open Share Link in New Tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-brand-olive" />
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white border border-brand-sand hover:bg-brand-sand/50 text-brand-charcoal text-xs font-semibold transition-colors cursor-pointer"
              title="Copy Share Link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-brand-olive" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
            {url && (
              <button
                onClick={handleDownload}
                className="p-1.5 rounded-xl bg-white border border-brand-sand hover:bg-brand-sand/50 text-gray-700 transition-colors cursor-pointer"
                title="Download"
              >
                <Download className="w-4 h-4 text-brand-olive" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white border border-brand-sand hover:bg-brand-sand/50 text-gray-500 hover:text-brand-charcoal transition-colors cursor-pointer"
              aria-label="Close preview"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-grow bg-white relative flex items-center justify-center overflow-hidden">
          {renderPreview()}
        </div>

        {/* Video Metadata Panel Footer */}
        <div className="px-6 py-3 bg-brand-cream border-t border-brand-sand flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-600 gap-2">
          <div className="flex items-center space-x-4">
            {video.student && (
              <span className="flex items-center space-x-1 font-semibold text-brand-charcoal">
                <User className="w-3.5 h-3.5 text-brand-olive" />
                <span>{video.student} ({video.team || 'General'})</span>
              </span>
            )}
            {video.folder && (
              <span className="flex items-center space-x-1 text-gray-500 font-medium">
                <FolderClosed className="w-3.5 h-3.5 text-brand-tan" />
                <span>{video.folder}</span>
              </span>
            )}
            <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-brand-sand/40 text-brand-charcoal">
              {ext.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] font-medium text-gray-500">
            <span className="flex items-center space-x-1">
              <HardDrive className="w-3.5 h-3.5 text-brand-olive" />
              <span>{formatSize(video.size)}</span>
            </span>
            {video.uploadDate && (
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-brand-olive" />
                <span>{new Date(video.uploadDate).toLocaleDateString()}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
