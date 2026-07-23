import { useState, useEffect, useCallback } from 'react';
import { folderService } from '../services/folderService';

export function useVideoFolders() {
  const [folders, setFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await folderService.getFolders();
      setFolders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = async (name) => {
    const newFolder = await folderService.createFolder(name, currentFolderId);
    await fetchFolders();
    return newFolder;
  };

  const renameFolder = async (id, newName) => {
    const updated = await folderService.renameFolder(id, newName);
    await fetchFolders();
    return updated;
  };

  const deleteFolder = async (id) => {
    const deletedIds = await folderService.deleteFolder(id);
    await fetchFolders();
    if (deletedIds.includes(currentFolderId)) {
      setCurrentFolderId(null);
    }
    return deletedIds;
  };

  const moveFolder = async (id, targetParentId) => {
    const updated = await folderService.moveFolder(id, targetParentId);
    await fetchFolders();
    return updated;
  };

  // Build the breadcrumbs path from root to the active folder
  const getBreadcrumbs = useCallback(() => {
    const trail = [];
    let current = folders.find((f) => f.id === currentFolderId);
    while (current) {
      trail.unshift(current);
      current = folders.find((f) => f.id === current.parentId);
    }
    return trail;
  }, [folders, currentFolderId]);

  return {
    folders,
    currentFolderId,
    setCurrentFolderId,
    loading,
    createFolder,
    renameFolder,
    deleteFolder,
    moveFolder,
    getBreadcrumbs,
    refreshFolders: fetchFolders,
  };
}
