import React, { useState } from 'react';
import { 
  X, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, RotateCcw, Play, Pause, Loader2 
} from 'lucide-react';

const formatSpeed = (bytesPerSec) => {
  if (!bytesPerSec || bytesPerSec <= 0) return '0 KB/s';
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

export default function UploadProgress({ queue, onCancel, onRetry, onClose }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!queue || queue.length === 0) return null;

  const activeCount = queue.filter(t => t.status === 'uploading' || t.status === 'queued').length;
  const successCount = queue.filter(t => t.status === 'success').length;
  const failedCount = queue.filter(t => t.status === 'failed').length;

  return (
    <div className="fixed bottom-6 right-6 z-40 w-96 bg-white border border-brand-sand rounded-2xl shadow-2xl overflow-hidden flex flex-col text-left transition-all duration-300 font-sans select-none">
      {/* Header */}
      <div 
        onClick={() => setCollapsed(!collapsed)}
        className="px-4 py-3 bg-brand-olive text-white flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center space-x-2">
          {activeCount > 0 ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-brand-sage-light" />
          )}
          <span className="text-xs font-bold font-serif">
            {activeCount > 0 
              ? `Uploading ${activeCount} file${activeCount > 1 ? 's' : ''}...` 
              : `Upload complete (${successCount} success${failedCount > 0 ? `, ${failedCount} failed` : ''})`
            }
          </span>
        </div>

        <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer focus:outline-none"
          >
            {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Upload Tasks List */}
      {!collapsed && (
        <div className="max-h-80 overflow-y-auto divide-y divide-brand-sand/50">
          {queue.map((task) => (
            <div key={task.id} className="p-4 flex flex-col space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="truncate pr-4 font-semibold text-brand-charcoal max-w-[200px]" title={task.name}>
                  {task.name}
                </span>

                <div className="flex items-center space-x-2 shrink-0">
                  {task.status === 'uploading' && (
                    <span className="text-[10px] text-gray-400 font-mono">
                      {task.progress}%
                    </span>
                  )}
                  {task.status === 'success' && (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  )}
                  {task.status === 'failed' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  
                  {/* Cancel / Retry Button */}
                  {(task.status === 'uploading' || task.status === 'queued') && (
                    <button
                      onClick={() => onCancel(task.id)}
                      className="p-0.5 rounded hover:bg-brand-cream text-gray-400 hover:text-brand-charcoal transition-colors cursor-pointer"
                      title="Cancel Upload"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {(task.status === 'failed' || task.status === 'cancelled') && (
                    <button
                      onClick={() => onRetry(task.id)}
                      className="p-0.5 rounded hover:bg-brand-cream text-brand-olive hover:text-brand-olive-dark transition-colors cursor-pointer"
                      title="Retry Upload"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar & Stats */}
              {task.status === 'uploading' && (
                <div>
                  <div className="w-full bg-brand-sand/50 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-brand-olive h-full rounded-full transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold mt-1 font-mono uppercase tracking-wider">
                    <span>{formatSpeed(task.speed)}</span>
                    <span>{formatETA(task.eta)}</span>
                  </div>
                </div>
              )}

              {task.status === 'queued' && (
                <span className="text-[10px] text-gray-400 font-bold font-mono uppercase tracking-wider">
                  Waiting in queue...
                </span>
              )}
              {task.status === 'cancelled' && (
                <span className="text-[10px] text-gray-400 font-bold font-mono uppercase tracking-wider">
                  Cancelled
                </span>
              )}
              {task.status === 'failed' && (
                <span className="text-[10px] text-red-500 font-bold font-mono uppercase tracking-wider">
                  Failed to upload
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
