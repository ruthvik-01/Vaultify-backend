import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { videoService } from '../services/videoService';
import { videoUploadService } from '../services/videoUploadService';
import { useVideoUpload } from '../hooks/useVideoUpload';
import UploadProgress from '../components/video/UploadProgress';
import SaasNotification from '../components/SaasNotification';

const FileContext = createContext(null);

export const categories = [
  'Resumes',
  'Certificates',
  'Projects',
  'Notes',
  'Assignments',
  'Placement Documents',
];

export const FileProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('vaultify_token');
  });
  const [toast, setToast] = useState(null);

  const showNotification = useCallback((message, type = 'success', title = null) => {
    setToast((prev) => {
      if (prev && prev.message === message && prev.type === type) {
        return prev;
      }
      return { message, type, title, id: Date.now() };
    });
  }, []);

  useEffect(() => {
    if (toast) {
      const type = toast.type || 'success';
      const duration = type === 'error' ? 6000 : (type === 'info' || type === 'warning' ? 4000 : 3000);

      const timer = setTimeout(() => {
        setToast(null);
      }, duration);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setToast(null);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [toast]);

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activities, setActivities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const isFetchingFiles = useRef(false);
  const [user, setUser] = useState({
    name: '',
    email: '',
    studentId: '',
    university: '',
    organization: '',
    major: '',
    phone: '',
    bio: '',
    storage_plan: 'free',
    theme_color: 'grid',
    dark_mode: 'light',
    sidebar_color: 'expanded',
    accent_color: 'green',
    font_size: 'medium',
    created_at: '',
  });

  const applySettingsToDOM = (settings) => {
    const root = document.documentElement;
    
    // 1. Theme mode ('light', 'dark', 'system')
    let isDark = false;
    const dm = settings.dark_mode || 'light';
    if (dm === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = dm === 'dark';
    }
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Store active dark mode as boolean helper attribute for global styling reference
    root.setAttribute('data-dark-mode-active', isDark ? 'true' : 'false');
    
    // 2. Accent color (blue, purple, green, orange, red)
    root.setAttribute('data-accent-color', settings.accent_color || 'green');
    
    // 3. Sidebar mode (compact, expanded)
    root.setAttribute('data-sidebar-mode', settings.sidebar_color === 'compact' ? 'compact' : 'expanded');
    
    // 4. Display preference (grid, list) — backend may return 'sage' or other color name as legacy default
    const viewMode = ['grid', 'list'].includes(settings.theme_color) ? settings.theme_color : 'grid';
    root.setAttribute('data-display-view', viewMode);
    
    // 5. Font size (small, medium, large)
    root.setAttribute('data-font-size', settings.font_size || 'medium');
    
    localStorage.setItem('vaultify_settings', JSON.stringify({
      theme_color: viewMode,
      dark_mode: dm,
      sidebar_color: settings.sidebar_color === 'compact' ? 'compact' : 'expanded',
      accent_color: settings.accent_color || 'green',
      font_size: settings.font_size || 'medium'
    }));
  };

  useEffect(() => {
    const cached = localStorage.getItem('vaultify_settings');
    if (cached) {
      try {
        applySettingsToDOM(JSON.parse(cached));
      } catch (_) {}
    } else {
      applySettingsToDOM(user);
    }
    
    // Media query listener for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      const current = localStorage.getItem('vaultify_settings');
      if (current) {
        try {
          const parsed = JSON.parse(current);
          if (parsed.dark_mode === 'system') {
            applySettingsToDOM(parsed);
          }
        } catch (_) {}
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const [notifications, setNotifications] = useState({
    emailOnShare: true,
    emailOnDownload: false,
    placementAlerts: true,
    weeklyReport: true,
  });

  const [storageStats, setStorageStats] = useState({
    totalCapacity: 500 * 1024 * 1024 * 1024, // 500 GB
    used: 0,
    breakdown: {
      Documents: 0,
      Images: 0,
      Media: 0,
    },
    counts: {
      Documents: 0,
      Images: 0,
      Media: 0,
    }
  });

  const fetchStorageStats = useCallback(async () => {
    try {
      const res = await api.getStorageSummary();
      const stats = res.data?.data || res.data;
      if (stats) {
        setStorageStats({
          totalCapacity: (stats.plan === '1 TB' ? 1000 : 500) * 1024 * 1024 * 1024,
          used: stats.usedStorage,
          breakdown: {
            Documents: stats.documents?.size || 0,
            Images: stats.images?.size || 0,
            Media: stats.media?.size || 0
          },
          counts: {
            Documents: stats.documents?.files || 0,
            Images: stats.images?.files || 0,
            Media: stats.media?.files || 0
          }
        });
      }
    } catch (err) {
      console.error('Failed to fetch storage stats:', err.message);
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await api.getActivities();
      const loadedActivities = res.data?.activities || res.data || [];
      setActivities(loadedActivities);
    } catch (err) {
      console.error('Failed to fetch activities:', err.message);
    }
  }, []);

  // ─── Bootstrap on auth ───────────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
      fetchAllFiles();
      fetchAllFolders();
      fetchActivities();
    }
  }, [isAuthenticated, fetchActivities]);

  // ─── Storage stats & activities derived from database ─────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      fetchStorageStats();
      fetchActivities();
    }
  }, [files, isAuthenticated, fetchStorageStats, fetchActivities]);

  // ─── Profile ──────────────────────────────────────────────────────────────
  const fetchUserProfile = async () => {
    try {
      const res = await api.getProfile();
      // Backend returns: { status, data: { user: { id, name, email, ... } } }
      const userData = res.data?.user || res.data;
      if (userData) {
        const orgVal = userData.organization || userData.university || '';
        const loadedUser = {
          id: userData.id,
          name: userData.name || '',
          email: userData.email || '',
          studentId: userData.studentId || '',
          university: orgVal,
          organization: orgVal,
          major: userData.major || '',
          phone: userData.phone || '',
          bio: userData.bio || '',
          profile_image: userData.profile_image || null,
          storage_plan: userData.storage_plan || 'free',
          theme_color: ['grid', 'list'].includes(userData.theme_color) ? userData.theme_color : 'grid',
          dark_mode: ['light', 'dark', 'system'].includes(userData.dark_mode) ? userData.dark_mode : 'light',
          sidebar_color: userData.sidebar_color === 'compact' ? 'compact' : 'expanded',
          accent_color: userData.accent_color || 'green',
          font_size: userData.font_size || 'medium',
          avatar:
            userData.profile_image ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name || 'SV')}`,
          created_at: userData.created_at || new Date().toISOString()
        };
        setUser(loadedUser);
        applySettingsToDOM(loadedUser);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err.message);
      if (
        err.message.includes('401') ||
        err.message.includes('Unauthorized') ||
        err.message.includes('expired')
      ) {
        logout();
      }
    }
  };

  // ─── File mapping ─────────────────────────────────────────────────────────
  /**
   * Maps backend file object to frontend file shape.
   * Backend returns: { id, file_name, original_name, file_type, file_size,
   *   is_favorite, is_deleted, category, download_count, created_at }
   */
  const mapBackendFile = (file) => ({
    id: file.id,
    user_id: file.user_id,
    folderId: file.folder_id ? file.folder_id.toString() : null,
    name: file.file_name || file.original_name,
    category: file.category || 'Others',
    type: file.file_type ? file.file_type.split('/').pop() : 'unknown',
    size: file.file_size || 0,
    dateAdded: file.created_at,
    isStarred: file.is_favorite === true || file.is_favorite === 1,
    isWorkSubmission: file.is_work_submission === true,
    inTrash: file.is_deleted === true || file.is_deleted === 1,
    sharedWith: [],
    downloadCount: file.download_count || 0,
    tags: file.tags || [],
    s3_key: file.s3_key,
    mimeType: file.file_type || 'application/octet-stream'
  });

  // ─── Files ────────────────────────────────────────────────────────────────
  const fetchAllFiles = async () => {
    // Prevent duplicate concurrent fetches (fixes 429 Too Many Requests)
    if (isFetchingFiles.current) return;
    isFetchingFiles.current = true;
    try {
      const [filesRes, videosList] = await Promise.all([
        api.getFiles(),
        videoService.getVideos().catch((err) => {
          console.error('Failed to fetch videos:', err.message);
          return [];
        })
      ]);

      const filesList = filesRes.data?.files || filesRes.data;
      let allMapped = [];
      if (Array.isArray(filesList)) {
        allMapped = filesList.map(mapBackendFile);
      }

      if (Array.isArray(videosList)) {
        allMapped = [...allMapped, ...videosList];
      }

      // Load local trash from localStorage
      const localTrash = JSON.parse(localStorage.getItem('vaultify_local_trash_files') || '[]');
      const localStarred = JSON.parse(localStorage.getItem('vaultify_local_starred_ids') || '[]');

      const trashIds = localTrash.map(f => f.id);

      // Map backend files, marking them as inTrash if they are in trashIds, and set isStarred if in localStarred
      const filesWithTrashState = allMapped.map(f => {
        const inTrash = trashIds.includes(f.id);
        const isStarred = f.isStarred || localStarred.includes(f.id);
        return { ...f, inTrash, isStarred };
      });

      // Include any localTrash items that are not returned by the backend
      const missingFromBackend = localTrash.filter(f => !allMapped.some(b => b.id === f.id));

      const mergedFiles = [...filesWithTrashState, ...missingFromBackend];
      const localShares = JSON.parse(localStorage.getItem('vaultify_local_shares') || '[]');
      const sharedFileIds = localShares.map(s => s.fileId);
      let updatedShares = false;

      const filesWithShares = mergedFiles.map(f => {
        const isVideo = f.category === 'Media' || f.mimeType?.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(f.name.split('.').pop().toLowerCase());
        if (sharedFileIds.includes(f.id) || (isVideo && f.isShared)) {
          if (isVideo && f.isShared && !sharedFileIds.includes(f.id)) {
            const token = f.shareToken;
            const link = `${window.location.origin}/share/${token}`;
            localShares.push({
              id: f.id + '_' + Date.now(),
              fileId: f.id,
              shareRecordId: token || null,
              name: f.name,
              category: 'Media',
              type: 'video',
              mimeType: f.mimeType || 'video/mp4',
              size: f.size || 0,
              shareLink: link,
              permission: 'read',
              createdAt: f.created_at || new Date().toISOString(),
              status: 'Active'
            });
            updatedShares = true;
          }
          return { ...f, sharedWith: ['recruiter@company.com'] };
        }
        return f;
      });

      if (updatedShares) {
        localStorage.setItem('vaultify_local_shares', JSON.stringify(localShares));
      }

      setFiles(filesWithShares);
    } catch (err) {
      console.error('Failed to fetch files:', err.message);
    } finally {
      isFetchingFiles.current = false;
    }
  };

  const fetchTrashFiles = async () => {
    // Managed locally via localStorage and merged in fetchAllFiles
  };

  const addActivity = async (action, fileName, category = 'System') => {
    try {
      await api.logActivity(action, fileName, { category });
      await fetchActivities();
    } catch (err) {
      console.error('Failed to log activity to backend:', err.message);
    }
  };

  const uploadFile = async (fileData, onProgressCallback = null) => {
    try {
      const file = fileData.file;
      const batchId = fileData.uploadBatchId || `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const ext = file.name.split('.').pop().toLowerCase();
      const allowedVideoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v', 'mpeg', '3gp', 'ogv'];
      const isVideo = allowedVideoExtensions.includes(ext) || (file.type && file.type.startsWith('video/'));

      if (isVideo) {
        const task = {
          id: `up_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file: file,
          name: file.name,
          size: file.size,
          progress: 0,
          status: 'queued',
          speed: 0,
          eta: 0,
          folderId: fileData.folderId || null,
          uploadBatchId: batchId
        };

        return new Promise((resolve, reject) => {
          videoUploadService.uploadVideo(task, {
            onProgress: ({ progress, speed, eta }) => {
              if (onProgressCallback) {
                onProgressCallback({ progress, speed, eta });
              }
            },
            onComplete: (videoData) => {
              const name = videoData.filename || videoData.originalName;
              const videoExt = name.split('.').pop().toLowerCase();
              const newVideoFile = {
                id: videoData._id || videoData.id,
                name: name,
                category: 'Media',
                type: videoExt,
                size: videoData.size || 0,
                dateAdded: videoData.createdAt,
                isStarred: false,
                inTrash: videoData.status === 'Failed',
                sharedWith: [],
                downloadCount: 0,
                s3_key: videoData.s3Key,
                mimeType: videoData.mimeType || `video/${videoExt}`,
                videoFolderId: videoData.folderId || null,
                owner: videoData.owner || { name: 'Me' },
                status: videoData.status || 'Active',
              };
              setFiles((prev) => [newVideoFile, ...prev]);
              addActivity('uploaded', newVideoFile.name, 'Media');
              resolve(newVideoFile);
            },
            onError: (err) => {
              reject(err);
            }
          });
        });
      } else {
        const formData = new FormData();
        formData.append('file', file);
        if (fileData.category) {
          formData.append('category', fileData.category);
        }
        if (fileData.folderId) {
          formData.append('folder_id', fileData.folderId);
        }
        formData.append('uploadBatchId', batchId);

        const res = await api.uploadFile(formData);
        const fileData2 = res.data?.file || res.data;
        if (fileData2) {
          const newFile = mapBackendFile(fileData2);
          setFiles((prev) => [newFile, ...prev]);
          addActivity('uploaded', newFile.name, newFile.category);
          return newFile;
        }
      }
    } catch (err) {
      console.error('Upload failed:', err.message);
      throw err;
    }
  };

  // Soft-delete: marks file as trashed in local state (file stays on server)
  const moveToTrash = async (id) => {
    try {
      const file = files.find((f) => f.id === id);
      if (!file) return;

      // Add to localTrash in localStorage
      const localTrash = JSON.parse(localStorage.getItem('vaultify_local_trash_files') || '[]');
      const updatedFile = { ...file, inTrash: true };
      if (!localTrash.some(t => t.id === id)) {
        localTrash.push(updatedFile);
        localStorage.setItem('vaultify_local_trash_files', JSON.stringify(localTrash));
      }

      // Update files state immediately
      setFiles(prev => {
        const remaining = prev.filter(f => f.id !== id);
        return [...remaining, updatedFile];
      });

      addActivity('trashed', file.name, file.category);
      showNotification(`"${file.name}" moved to trash`, 'success');
    } catch (err) {
      console.error('Delete failed:', err.message);
      showNotification('Failed to delete file', 'error');
    }
  };

  // Keep the old name as alias for backward compat (some components still call deleteFile)
  const deleteFile = moveToTrash;

  // Restore: moves file back from trash to active state
  const restoreFile = (id) => {
    const file = files.find((f) => f.id === id);
    if (file) {
      // Remove from localTrash
      const localTrash = JSON.parse(localStorage.getItem('vaultify_local_trash_files') || '[]');
      const filteredTrash = localTrash.filter(t => t.id !== id);
      localStorage.setItem('vaultify_local_trash_files', JSON.stringify(filteredTrash));

      // Update files state
      const updatedFile = { ...file, inTrash: false };
      setFiles(prev => {
        const remaining = prev.filter(f => f.id !== id);
        return [...remaining, updatedFile];
      });

      addActivity('restored', file.name, file.category);
      showNotification(`"${file.name}" restored from trash`, 'success');
    }
  };

  // Permanent delete: actually removes file from backend (S3 + DB)
  const permanentlyDeleteFile = async (id) => {
    try {
      const file = files.find((f) => f.id === id);
      
      // Try calling backend delete API just in case it wasn't deleted during soft-delete
      try {
        const isVideo = file && (file.category === 'Media' || file.mimeType?.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(file.name.split('.').pop().toLowerCase()));
        if (isVideo) {
          await videoService.deleteVideo(id);
        } else {
          await api.deleteFile(id);
        }
      } catch (apiErr) {
        // Silently ignore if already deleted on server
      }

      // Remove from localTrash and localRestored in localStorage
      const localTrash = JSON.parse(localStorage.getItem('vaultify_local_trash_files') || '[]');
      const filteredTrash = localTrash.filter(t => t.id !== id);
      localStorage.setItem('vaultify_local_trash_files', JSON.stringify(filteredTrash));

      const localRestored = JSON.parse(localStorage.getItem('vaultify_local_restored_files') || '[]');
      const filteredRestored = localRestored.filter(t => t.id !== id);
      localStorage.setItem('vaultify_local_restored_files', JSON.stringify(filteredRestored));

      // Remove from files state
      setFiles((prev) => prev.filter((f) => f.id !== id));
      if (file) {
        addActivity('purged', file.name, file.category);
        showNotification(`"${file.name}" permanently deleted`, 'success');
      }
    } catch (err) {
      console.error('Permanent delete failed:', err.message);
      showNotification('Failed to permanently delete file', 'error');
    }
  };

  const clearTrash = async () => {
    const trashFiles = files.filter((f) => f.inTrash);
    if (trashFiles.length === 0) return;
    await Promise.all(trashFiles.map((f) => permanentlyDeleteFile(f.id)));
    addActivity('cleared_trash', 'Trash Bin Emptied');
    showNotification('Trash emptied successfully', 'success');
  };

  const moveFile = async (id, folderId) => {
    try {
      const res = await api.moveFile(id, folderId);
      const updatedFile = res.data?.file || res.data;
      if (updatedFile) {
        const mapped = mapBackendFile(updatedFile);
        setFiles(prev => prev.map(f => f.id === id ? mapped : f));
        showNotification('File moved successfully', 'success');
      }
    } catch (err) {
      console.error('Failed to move file:', err.message);
      showNotification('Failed to move file', 'error');
      throw err;
    }
  };

  const toggleStar = async (id) => {
    try {
      const file = files.find((f) => f.id === id);
      if (!file) return;
      const nextStarred = !file.isStarred;
      const isVideo = file.category === 'Media' || file.mimeType?.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(file.name.split('.').pop().toLowerCase());
      
      if (!isVideo) {
        await api.favoriteFile(id, nextStarred);
      }

      // Persist star status locally in localStorage (crucial for videos and offline fallback)
      const localStarred = JSON.parse(localStorage.getItem('vaultify_local_starred_ids') || '[]');
      let updatedStarred;
      if (nextStarred) {
        updatedStarred = [...localStarred.filter(x => x !== id), id];
      } else {
        updatedStarred = localStarred.filter(x => x !== id);
      }
      localStorage.setItem('vaultify_local_starred_ids', JSON.stringify(updatedStarred));

      setFiles((prev) =>
        prev.map((f) => {
          if (f.id === id) {
            addActivity(nextStarred ? 'starred' : 'unstarred', f.name, f.category);
            return { ...f, isStarred: nextStarred };
          }
          return f;
        })
      );
    } catch (err) {
      console.error('Toggle favorite failed:', err.message);
    }
  };

  const renameFile = async (id, newName) => {
    try {
      const file = files.find((f) => f.id === id);
      const isVideo = file && (file.category === 'Media' || file.mimeType?.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(file.name.split('.').pop().toLowerCase()));
      
      if (isVideo) {
        await videoService.renameVideo(id, newName);
      } else {
        await api.renameFile(id, newName);
      }

      setFiles((prev) =>
        prev.map((f) => {
          if (f.id === id) {
            return { ...f, name: newName };
          }
          return f;
        })
      );
    } catch (err) {
      console.error('Rename failed:', err.message);
    }
  };

  const downloadFile = async (id, name) => {
    try {
      const file = files.find((f) => f.id === id);
      const isVideo = file && (file.category === 'Media' || file.mimeType?.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(file.name.split('.').pop().toLowerCase()));
      let url;
      
      if (isVideo) {
        url = await videoService.downloadVideo(id);
      } else {
        const res = await api.downloadFile(id);
        url = res.download_url || (res.data && res.data.download_url);
      }

      if (url) {
        window.open(url, '_blank');
        addActivity('downloaded', name, isVideo ? 'Media' : 'System');
      }
    } catch (err) {
      console.error('Download failed:', err.message);
    }
  };

  const getPreviewUrl = async (id) => {
    try {
      const file = files.find((f) => f.id === id);
      const isVideo = file && (file.category === 'Media' || file.mimeType?.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(file.name.split('.').pop().toLowerCase()));
      
      if (isVideo) {
        return await videoService.getPlaybackUrl(id);
      } else {
        const res = await api.getPreviewUrl(id);
        return res.download_url || (res.data && res.data.download_url) || null;
      }
    } catch (err) {
      console.error('Failed to obtain preview link:', err.message);
      return null;
    }
  };

  const shareFile = async (id, permission = 'read', expiryHours = 24, folderId = null) => {
    try {
      let link;
      let shareRecordId = null;

      if (folderId) {
        // Share standard folder on backend
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/share`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('vaultify_token')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ folder_id: folderId, permission, expiry_hours: expiryHours }),
          }
        );
        if (!res.ok) {
          throw new Error('Failed to generate folder share link.');
        }
        const data = await res.json();
        if (data.data) {
          link = `${window.location.origin}/share/${data.data.token}`;
          shareRecordId = data.data.id;
        }
      } else {
        const file = files.find((f) => f.id === id);
        const isVideo = file && (file.category === 'Media' || file.mimeType?.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(file.name.split('.').pop().toLowerCase()));
        
        if (isVideo) {
          const token = localStorage.getItem('vaultify_token');
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const res = await fetch(`${API_URL}/videos/${id}/share`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (!res.ok) {
            throw new Error('Failed to generate permanent share link.');
          }
          const data = await res.json();
          if (data && data.shareUrl) {
            const parts = data.shareUrl.split('/');
            const shareToken = parts[parts.length - 1];
            link = `${window.location.origin}/share/${shareToken}`;
            shareRecordId = shareToken;
          }
        } else {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/share`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${localStorage.getItem('vaultify_token')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ file_id: id, permission, expiry_hours: expiryHours }),
            }
          );
          const data = await res.json();
          if (data.data) {
            link = data.data.share_link;
            shareRecordId = data.data.id;
          }
        }
      }

      if (link) {
        if (!folderId) {
          const file = files.find((f) => f.id === id);
          const isVideo = file && (file.category === 'Media' || file.mimeType?.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(file.name.split('.').pop().toLowerCase()));
          // Save share locally to vaultify_local_shares in localStorage
          const shares = JSON.parse(localStorage.getItem('vaultify_local_shares') || '[]');
          const existingIdx = shares.findIndex(s => s.fileId === id);
          const shareRecord = {
            id: id + '_' + Date.now(),
            fileId: id,
            shareRecordId: shareRecordId || null,
            name: file.name,
            category: file.category || (isVideo ? 'Media' : 'Notes'),
            type: file.type,
            mimeType: file.mimeType,
            size: file.size,
            shareLink: link,
            permission: permission,
            createdAt: new Date().toISOString(),
            status: 'Active'
          };
          if (existingIdx >= 0) {
            shares[existingIdx] = shareRecord;
          } else {
            shares.push(shareRecord);
          }
          localStorage.setItem('vaultify_local_shares', JSON.stringify(shares));

          // Update files array locally to reflect shared status
          setFiles(prev => prev.map(f => f.id === id ? { ...f, sharedWith: [...(f.sharedWith || []), 'recruiter@company.com'] } : f));
          addActivity('shared', file.name, file.category);
        } else {
          // Folder shared
          const folder = folders.find(f => f.id === folderId);
          addActivity('shared', folder ? folder.folder_name : 'Folder', 'Folder');
        }
        return link;
      }
    } catch (err) {
      console.error('Share failed:', err.message);
    }
  };

  const removeShare = async (fileId, email = '') => {
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) return;

      const isVideo = file.category === 'Media' || file.mimeType?.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(file.name.split('.').pop().toLowerCase());

      const shares = JSON.parse(localStorage.getItem('vaultify_local_shares') || '[]');
      const record = shares.find(s => s.fileId === fileId);

      if (isVideo) {
        const token = localStorage.getItem('vaultify_token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        await fetch(`${API_URL}/videos/${fileId}/unshare`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).catch(() => {});
      } else if (record && record.shareRecordId) {
        // Call backend DELETE /api/share/:id
        const token = localStorage.getItem('vaultify_token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        await fetch(`${API_URL}/share/${record.shareRecordId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).catch(() => {});
      }

      // Remove from vaultify_local_shares
      const filtered = shares.filter(s => s.fileId !== fileId);
      localStorage.setItem('vaultify_local_shares', JSON.stringify(filtered));

      // Update files state
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, sharedWith: [] } : f));
      addActivity('unshared', file.name, file.category);
      showNotification('Sharing revoked successfully', 'success');
    } catch (err) {
      console.error('Revoke share failed:', err.message);
    }
  };

  const fetchAllFolders = async () => {
    try {
      const res = await api.getFolders();
      const foldersList = res.data?.folders || res.data;
      if (foldersList) {
        const mappedFolders = (Array.isArray(foldersList) ? foldersList : []).map(f => ({
          ...f,
          name: f.name || f.folder_name,
          parentId: f.parentId || f.parent_folder_id
        }));
        setFolders(mappedFolders);
      }
    } catch (err) {
      console.error('Failed to fetch folders:', err.message);
    }
  };

  const getOrCreateWorkFolder = async () => {
    try {
      const res = await api.getOrCreateWorkFolder();
      await fetchAllFolders();
      const folder = res.data?.folder || res.data;
      if (folder) {
        folder.name = folder.name || folder.folder_name;
        folder.parentId = folder.parentId || folder.parent_folder_id;
      }
      return folder;
    } catch (err) {
      console.error('Failed to get or create Work folder:', err.message);
      throw err;
    }
  };

  const createFolder = async (name, parentId = null) => {
    try {
      const res = await api.createFolder(name, parentId);
      await fetchAllFolders();
      showNotification(`Folder "${name}" created successfully`, 'success');
      const folder = res.data?.folder || res.data;
      if (folder) {
        folder.name = folder.name || folder.folder_name;
        folder.parentId = folder.parentId || folder.parent_folder_id;
      }
      return folder;
    } catch (err) {
      console.error('Failed to create folder:', err.message);
      showNotification('Failed to create folder', 'error');
      throw err;
    }
  };

  const renameFolder = async (id, newName) => {
    try {
      await api.renameFolder(id, newName);
      await fetchAllFolders();
      showNotification('Folder renamed successfully', 'success');
    } catch (err) {
      console.error('Failed to rename folder:', err.message);
      showNotification('Failed to rename folder', 'error');
      throw err;
    }
  };

  const deleteFolder = async (id) => {
    try {
      await api.deleteFolder(id);
      await fetchAllFolders();
      await fetchAllFiles();
      showNotification('Folder and all its contents deleted', 'success');
    } catch (err) {
      console.error('Failed to delete folder:', err.message);
      showNotification('Failed to delete folder', 'error');
      throw err;
    }
  };

  // ─── Global Video Upload Queue ─────────────────────────────────────────────
  const [isUploadProgressOpen, setIsUploadProgressOpen] = useState(true);

  const handleUploadComplete = async (fileData, folderId) => {
    if (folderId) {
      await videoService.moveVideo(fileData.id, folderId);
    }
    await fetchAllFiles();
  };

  const {
    queue: uploadQueue,
    addFilesToQueue: addFilesToUploadQueue,
    cancelUpload: cancelVideoUpload,
    retryUpload: retryVideoUpload,
  } = useVideoUpload(handleUploadComplete);

  // ─── Auth ─────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      if (res.token) {
        localStorage.setItem('vaultify_token', res.token);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: 'Login failed.' };
    } catch (err) {
      console.error('Login error:', err.message);
      return { success: false, message: err.message || 'Invalid credentials.' };
    }
  };

  const googleLogin = async (firebaseIdToken) => {
    try {
      const res = await api.googleLogin(firebaseIdToken);
      if (res.token) {
        localStorage.setItem('vaultify_token', res.token);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: 'Google login failed.' };
    } catch (err) {
      console.error('Google login error:', err.message);
      return { success: false, message: err.message || 'Google Login failed.' };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.register(userData);
      if (res.token) {
        localStorage.setItem('vaultify_token', res.token);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: true };
    } catch (err) {
      console.error('Register error:', err.message);
      return { success: false, message: err.message || 'Registration failed.' };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (_) {}
    setIsAuthenticated(false);
    localStorage.removeItem('vaultify_token');
    setFiles([]);
    setFolders([]);
    setActivities([]);
    setUser({ name: '', email: '', studentId: '', university: '', major: '', storage_plan: 'free', theme_color: 'grid', dark_mode: 'light', sidebar_color: 'expanded', accent_color: 'green', font_size: 'medium', created_at: '' });
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await api.updateProfile(profileData);
      const updatedUser = res.data?.user || res.data;
      if (updatedUser) {
        setUser((prev) => {
          const orgVal = updatedUser.organization !== undefined ? updatedUser.organization : (updatedUser.university !== undefined ? updatedUser.university : prev.organization);
          const nextUser = { 
            ...prev, 
            ...updatedUser,
            university: orgVal,
            organization: orgVal,
            avatar: updatedUser.profile_image || prev.avatar,
            theme_color: ['grid', 'list'].includes(updatedUser.theme_color) ? updatedUser.theme_color : prev.theme_color,
            dark_mode: ['light', 'dark', 'system'].includes(updatedUser.dark_mode) ? updatedUser.dark_mode : prev.dark_mode,
            created_at: updatedUser.created_at || prev.created_at
          };
          applySettingsToDOM(nextUser);
          return nextUser;
        });
      }
    } catch (err) {
      console.error('Update profile failed:', err.message);
      throw err;
    }
  };

  const updateNotifications = (settingsData) => {
    setNotifications((prev) => ({ ...prev, ...settingsData }));
  };

  return (
    <FileContext.Provider
      value={{
        files,
        folders,
        activities,
        user,
        notifications,
        storageStats,
        searchQuery,
        setSearchQuery,
        uploadFile,
        deleteFile,
        restoreFile,
        permanentlyDeleteFile,
        clearTrash,
        shareFile,
        removeShare,
        toggleStar,
        renameFile,
        downloadFile,
        getPreviewUrl,
        updateProfile,
        updateNotifications,
        isAuthenticated,
        login,
        googleLogin,
        register,
        logout,
         fetchAllFiles,
        fetchAllFolders,
        fetchTrashFiles,
        fetchUserProfile,
        showNotification,
        createFolder,
        getOrCreateWorkFolder,
        renameFolder,
        deleteFolder,
        uploadQueue,
        addFilesToUploadQueue,
        cancelVideoUpload,
        retryVideoUpload,
        isUploadProgressOpen,
        setIsUploadProgressOpen,
        moveFile,
      }}
    >
      {children}
      {/* Centered Modern SaaS Notification overlay */}
      <AnimatePresence>
        {toast && (
          <SaasNotification toast={toast} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>
      {/* Global Upload Queue Progress Dock */}
      {uploadQueue && uploadQueue.length > 0 && isUploadProgressOpen && (
        <UploadProgress
          queue={uploadQueue}
          onCancel={cancelVideoUpload}
          onRetry={retryVideoUpload}
          onClose={() => setIsUploadProgressOpen(false)}
        />
      )}
    </FileContext.Provider>
  );
};

export const useFiles = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFiles must be used within a FileProvider');
  }
  return context;
};
