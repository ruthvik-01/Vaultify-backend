import React from 'react';
import VideoFolderCard from './VideoFolderCard';
import VideoCard from './VideoCard';
import { HardDrive, FolderOpen } from 'lucide-react';

export default function VideoGrid({
  folders,
  videos,
  onFolderEnter,
  onFolderRename,
  onFolderMove,
  onFolderShare,
  onFolderDelete,
  onVideoPlay,
  onVideoRename,
  onVideoMove,
  onVideoDownload,
  onVideoShare,
  onVideoDelete,
}) {
  const hasFolders = folders.length > 0;
  const hasVideos = videos.length > 0;

  if (!hasFolders && !hasVideos) {
    return (
      <div className="bg-white border border-brand-sand rounded-2xl p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <div className="bg-brand-cream-dark text-brand-olive p-4 rounded-full mb-4 shadow-inner">
          <HardDrive className="w-10 h-10 stroke-[1.2]" />
        </div>
        <h3 className="font-serif font-bold text-lg text-brand-charcoal mb-1">
          No items found
        </h3>
        <p className="text-xs text-gray-500 max-w-sm">
          Get started by creating a folder or uploading your first file to this section.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      {/* Video Folders Section */}
      {hasFolders && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <FolderOpen className="w-4 h-4 text-brand-olive" />
            <h2 className="font-serif font-bold text-xs uppercase tracking-wider text-brand-charcoal">
              Folders ({folders.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {folders.map((folder) => (
              <VideoFolderCard
                key={folder.id}
                folder={folder}
                onEnter={onFolderEnter}
                onRename={onFolderRename}
                onMove={onFolderMove}
                onShare={onFolderShare}
                onDelete={onFolderDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Videos Section */}
      {hasVideos && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <HardDrive className="w-4 h-4 text-brand-olive" />
            <h2 className="font-serif font-bold text-xs uppercase tracking-wider text-brand-charcoal">
              Files ({videos.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                folders={folders}
                onPlay={onVideoPlay}
                onRename={onVideoRename}
                onMove={onVideoMove}
                onDownload={onVideoDownload}
                onShare={onVideoShare}
                onDelete={onVideoDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
