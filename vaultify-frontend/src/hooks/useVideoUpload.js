import { useState, useCallback } from 'react';
import { folderService } from '../services/folderService';
import { videoUploadService } from '../services/videoUploadService';
import { api } from '../services/api';

export function useVideoUpload(onUploadComplete) {
  const [queue, setQueue] = useState([]);

  const performUpload = useCallback(async (task) => {
    setQueue((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: 'uploading', progress: 0 } : t))
    );

    await videoUploadService.uploadVideo(task, {
      onProgress: ({ progress, speed, eta }) => {
        setQueue((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, progress, speed, eta }
              : t
          )
        );
      },
      onComplete: (fileData) => {
        setQueue((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: 'success', progress: 100 } : t))
        );
        if (onUploadComplete && fileData) {
          onUploadComplete(fileData, task.folderId);
        }
      },
      onError: (err, isAbort) => {
        setQueue((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  status: isAbort ? 'cancelled' : 'failed',
                  progress: isAbort ? 0 : t.progress, // keep current progress on fail for retry/resume
                  speed: 0,
                  eta: 0,
                  error: err.message
                }
              : t
          )
        );
      }
    });
  }, [onUploadComplete]);

  // Queue files/folders
  const addFilesToQueue = useCallback(async (filesList, currentFolderId, passedBatchId = null, isWorkFolder = false) => {
    const tasksToAdd = [];
    const folderCache = {};
    const uploadBatchId = passedBatchId || `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const resolveFolderIdForPath = async (relativePath) => {
      if (!relativePath) return currentFolderId;
      const parts = relativePath.split('/').slice(0, -1);
      if (parts.length === 0) return currentFolderId;

      let parentId = currentFolderId;
      let pathAccum = '';

      for (const part of parts) {
        pathAccum = pathAccum ? `${pathAccum}/${part}` : part;
        if (folderCache[pathAccum]) {
          parentId = folderCache[pathAccum];
        } else {
          let localFolders;
          if (isWorkFolder) {
            const res = await api.getFolders();
            const list = res.data?.folders || res.data || [];
            localFolders = list.map(f => ({
              id: f.id || f._id,
              name: f.name || f.folder_name,
              parentId: f.parentId || f.parent_folder_id
            }));
          } else {
            localFolders = await folderService.getFolders();
          }

          const existing = localFolders.find(
            (f) => f.name === part && f.parentId === parentId
          );

          if (existing) {
            parentId = existing.id;
          } else {
            let createdId;
            if (isWorkFolder) {
              const res = await api.createFolder(part, parentId, uploadBatchId);
              const folder = res.data?.folder || res.data;
              createdId = folder.id || folder._id;
            } else {
              const created = await folderService.createFolder(part, parentId, uploadBatchId);
              createdId = created.id;
            }
            parentId = createdId;
          }
          folderCache[pathAccum] = parentId;
        }
      }
      return parentId;
    };

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const folderId = await resolveFolderIdForPath(file.webkitRelativePath);
      
      const task = {
        id: `up_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'queued',
        speed: 0,
        eta: 0,
        folderId,
        uploadBatchId,
        relativePath: file.webkitRelativePath
      };

      tasksToAdd.push(task);
    }

    setQueue((prev) => [...prev, ...tasksToAdd]);

    // Start uploads sequentially
    tasksToAdd.forEach((task) => {
      performUpload(task);
    });
  }, [performUpload]);

  const cancelUpload = useCallback((taskId) => {
    videoUploadService.cancelUpload(taskId);
    setQueue((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'cancelled' } : t))
    );
  }, []);

  const retryUpload = useCallback((taskId) => {
    setQueue((prev) => {
      const task = prev.find((t) => t.id === taskId);
      if (task) {
        setTimeout(() => {
          performUpload(task);
        }, 0);
      }
      return prev;
    });
  }, [performUpload]);

  const clearQueue = useCallback(() => {
    setQueue((prev) => {
      prev.forEach((t) => {
        if (t.status === 'uploading' || t.status === 'queued') {
          videoUploadService.cancelUpload(t.id);
        }
      });
      return [];
    });
  }, []);

  return {
    queue,
    addFilesToQueue,
    cancelUpload,
    retryUpload,
    clearQueue,
  };
}
