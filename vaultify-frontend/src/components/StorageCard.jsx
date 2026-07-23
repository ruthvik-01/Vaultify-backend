import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFiles } from '../context/FileContext';
import { HardDrive } from 'lucide-react';

export default function StorageCard({ isCompact = false }) {
  const { storageStats, user } = useFiles();
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    navigate(`/my-files?filter=${category}`);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const percent = storageStats.totalCapacity > 0
    ? Math.min((storageStats.used / storageStats.totalCapacity) * 100, 100)
    : 0;

  const planLabel = user.storage_plan === 'pro' ? '1 TB Plan' : '500 GB Plan';
  const limitLabel = user.storage_plan === 'pro' ? '1 TB' : '500 GB';

  if (isCompact) {
    return (
      <div
        title={`Storage: ${formatSize(storageStats.used)} used of ${limitLabel}`}
        className="flex flex-col items-center justify-center p-2 bg-white border border-brand-sand rounded-xl shadow-sm"
      >
        <HardDrive className="w-4 h-4 text-brand-olive" />
        <span className="text-[9px] font-bold text-brand-charcoal mt-1">
          {percent.toFixed(0)}%
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-brand-sand rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <HardDrive className="w-5 h-5 text-brand-olive" />
          <h3 className="font-serif font-bold text-brand-charcoal text-base">Storage</h3>
        </div>
        <span className="text-xs font-semibold text-brand-olive bg-brand-sage-light/30 px-2 py-0.5 rounded-full">
          {planLabel}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-brand-cream-dark h-2 rounded-full overflow-hidden mb-3">
        <div
          style={{ width: `${percent}%` }}
          className="bg-brand-olive h-full rounded-full transition-all duration-500 ease-out"
        />
      </div>

      {/* Used / Limit */}
      <div className="flex justify-between text-xs text-gray-500 mb-4 font-mono">
        <span>{formatSize(storageStats.used)} used</span>
        <span>{limitLabel} total</span>
      </div>

      {/* Breakdown */}
      <div className="space-y-2.5 pt-3 border-t border-brand-sand/60">
        <div 
          onClick={() => handleCategoryClick('document')}
          className="flex justify-between items-center text-xs cursor-pointer hover:bg-brand-cream/50 p-1.5 rounded-xl transition-colors select-none"
        >
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-olive" />
            <div className="flex flex-col text-left">
              <span className="text-brand-charcoal font-semibold">Documents</span>
              <span className="text-[10px] text-gray-400 font-medium">{storageStats.counts?.Documents || 0} Files</span>
            </div>
          </div>
          <span className="font-mono text-gray-500 font-semibold">{formatSize(storageStats.breakdown?.Documents || 0)}</span>
        </div>

        <div 
          onClick={() => handleCategoryClick('image')}
          className="flex justify-between items-center text-xs cursor-pointer hover:bg-brand-cream/50 p-1.5 rounded-xl transition-colors select-none"
        >
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-sage" />
            <div className="flex flex-col text-left">
              <span className="text-brand-charcoal font-semibold">Images</span>
              <span className="text-[10px] text-gray-400 font-medium">{storageStats.counts?.Images || 0} Files</span>
            </div>
          </div>
          <span className="font-mono text-gray-500 font-semibold">{formatSize(storageStats.breakdown?.Images || 0)}</span>
        </div>

        <div 
          onClick={() => handleCategoryClick('media')}
          className="flex justify-between items-center text-xs cursor-pointer hover:bg-brand-cream/50 p-1.5 rounded-xl transition-colors select-none"
        >
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <div className="flex flex-col text-left">
              <span className="text-brand-charcoal font-semibold">Media Files</span>
              <span className="text-[10px] text-gray-400 font-medium">{storageStats.counts?.Media || 0} Files</span>
            </div>
          </div>
          <span className="font-mono text-gray-500 font-semibold">{formatSize(storageStats.breakdown?.Media || 0)}</span>
        </div>
      </div>
    </div>
  );
}
