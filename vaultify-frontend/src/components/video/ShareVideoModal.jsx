import React from 'react';
import { X, Copy, Check, Share2, Loader2 } from 'lucide-react';

export default function ShareVideoModal({
  isOpen,
  onClose,
  item,
  shareLink,
  loading,
  copied,
  error,
  onCopy,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/40 backdrop-blur-xs select-none animate-fade-in">
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-md border border-brand-sand/55 flex flex-col text-left">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-sand flex items-center justify-between bg-brand-cream">
          <div className="flex items-center space-x-2.5">
            <Share2 className="w-5 h-5 text-brand-olive" />
            <h2 className="font-serif font-bold text-sm text-brand-charcoal">
              Share {item?.type === 'folder' ? 'Folder' : 'Video'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-brand-sand/60 text-gray-500 hover:text-brand-charcoal transition-colors cursor-pointer focus:outline-none"
            aria-label="Close share modal"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-xs text-gray-500 font-medium">
            <span>Anyone with this link will be able to view and download </span>
            <strong className="text-brand-charcoal font-semibold">"{item?.name}"</strong>.
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6 text-xs text-gray-400 font-bold tracking-wider uppercase space-x-2">
              <Loader2 className="w-5 h-5 text-brand-olive animate-spin" />
              <span>Generating Secure Link...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-xs font-semibold">
              {error}
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                Public Link
              </label>
              
              <div className="flex items-center space-x-2 bg-brand-cream border border-brand-sand rounded-2xl p-2.5">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="flex-grow bg-transparent border-none text-xs text-brand-charcoal focus:outline-none select-all truncate font-medium font-sans pr-2"
                />
                
                <button
                  onClick={onCopy}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-sm select-none shrink-0 ${
                    copied 
                      ? 'bg-brand-olive text-white' 
                      : 'bg-white hover:bg-brand-cream border border-brand-sand text-brand-charcoal'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-brand-olive" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-brand-cream border-t border-brand-sand/65 text-[10px] text-gray-400 font-sans font-bold uppercase tracking-wider text-right">
          Link Expiry • 24 Hours
        </div>
      </div>
    </div>
  );
}
