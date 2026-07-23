const FILES_FOLDER_KEY = 'vaultify_video_file_folders';

const getFileFoldersMap = () => {
  try {
    const data = localStorage.getItem(FILES_FOLDER_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const saveFileFoldersMap = (map) => {
  localStorage.setItem(FILES_FOLDER_KEY, JSON.stringify(map));
};

export const videoService = {
  // Get all files from backend, filter to video types, and assign their local video folder mapping
  getVideos: async () => {
    const token = localStorage.getItem('vaultify_token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const res = await fetch(`${API_URL}/videos`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      throw new Error('Failed to fetch videos.');
    }
    const data = await res.json();
    const rawVideos = data.data?.videos || [];

    const fileFolderMap = getFileFoldersMap();

    // Map each backend video into frontend UI structure
    return rawVideos.map((f) => {
      const name = f.filename || f.originalName;
      const ext = name.split('.').pop().toLowerCase();
      return {
        id: f._id || f.id,
        name: name,
        category: 'Media',
        type: ext,
        size: f.size || 0,
        dateAdded: f.createdAt,
        isStarred: false,
        inTrash: f.status === 'Failed',
        sharedWith: [],
        downloadCount: 0,
        s3_key: f.s3Key,
        mimeType: f.mimeType || `video/${ext}`,
        // Local Folder Mapping
        videoFolderId: f.folderId || fileFolderMap[f._id || f.id] || null,
        owner: f.owner || { name: 'Me' },
        status: f.status || 'Active', // Active, Uploading, Failed
      };
    });
  },

  renameVideo: async (id, newName) => {
    const token = localStorage.getItem('vaultify_token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const res = await fetch(`${API_URL}/videos/${id}/rename`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: newName })
    });
    if (!res.ok) {
      throw new Error('Failed to rename video.');
    }
  },

  moveVideo: async (id, targetFolderId) => {
    const map = getFileFoldersMap();
    if (targetFolderId) {
      map[id] = targetFolderId;
    } else {
      delete map[id]; // moved to root
    }
    saveFileFoldersMap(map);
    return { id, videoFolderId: targetFolderId };
  },

  deleteVideo: async (id, permanent = false) => {
    const token = localStorage.getItem('vaultify_token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const res = await fetch(`${API_URL}/videos/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      throw new Error('Failed to delete video.');
    }
    
    // Clean up local folder mapping
    const map = getFileFoldersMap();
    delete map[id];
    saveFileFoldersMap(map);
  },

  downloadVideo: async (id) => {
    const token = localStorage.getItem('vaultify_token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const res = await fetch(`${API_URL}/videos/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      throw new Error('Failed to get download URL.');
    }
    const result = await res.json();
    return result.data?.downloadUrl;
  },

  getPlaybackUrl: async (id) => {
    const token = localStorage.getItem('vaultify_token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const res = await fetch(`${API_URL}/videos/${id}/preview`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      throw new Error('Failed to get preview URL.');
    }
    const result = await res.json();
    return result.data?.downloadUrl;
  }
};
