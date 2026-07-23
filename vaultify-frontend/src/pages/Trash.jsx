import React from 'react';
import { useFiles } from '../context/FileContext';
import FileCard from '../components/FileCard';
import EmptyState from '../components/EmptyState';
import { Trash2, RefreshCcw, ShieldAlert, ArchiveRestore } from 'lucide-react';

export default function Trash() {
  const { files, clearTrash, restoreFile, showNotification } = useFiles();

  // Filter files that ARE in trash
  const trashFiles = files.filter(f => f.inTrash);

  const handleEmptyTrash = () => {
    if (trashFiles.length === 0) return;
    if (confirm('Are you sure you want to empty the Trash Bin? All files in trash will be permanently lost and space quota cleared.')) {
      clearTrash();
    }
  };

  const handleRestoreAll = () => {
    if (trashFiles.length === 0) return;
    trashFiles.forEach(f => {
      restoreFile(f.id);
    });
    showNotification('Restored all trash items back to their directories!', 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Control Board */}
      <div className="bg-white border border-brand-sand rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="bg-red-50 text-red-600 p-2.5 rounded-2xl border border-red-100">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-brand-charcoal">Trash Archive Locker</h3>
            <p className="text-xs text-gray-500 mt-0.5">Deleted items remain here and count towards space limits until purged.</p>
          </div>
        </div>

        <div className="flex space-x-3.5">
          {trashFiles.length > 0 && (
            <>
              <button
                onClick={handleRestoreAll}
                className="bg-brand-cream hover:bg-brand-sand/40 border border-brand-sand text-brand-charcoal px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <RefreshCcw className="w-3.5 h-3.5 text-brand-olive" />
                <span>Restore All</span>
              </button>
              <button
                onClick={handleEmptyTrash}
                className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Empty Trash</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Warning Alert Banner */}
      {trashFiles.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-start space-x-3 text-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Locker Data Security Check</span>
            <span>Items inside the Trash Bin still consume storage quota. Empty the trash bin to release allocated locker storage capacity.</span>
          </div>
        </div>
      )}

      {/* Grid displaying deleted files */}
      <div className="space-y-4">
        {trashFiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {trashFiles.map((file) => (
              <FileCard key={file.id} file={file} viewMode="grid" isTrashView={true} />
            ))}
          </div>
        ) : (
          <div className="py-12">
            <EmptyState 
              title="Trash Bin is clean"
              description="No deleted files are stored here. Everything is safely backed up in active folders."
              icon={ArchiveRestore}
            />
          </div>
        )}
      </div>

    </div>
  );
}
