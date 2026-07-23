const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('vaultify_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const folderService = {
  getFolders: async () => {
    const res = await fetch(`${API_URL}/videos/folders`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      throw new Error('Failed to fetch folders');
    }
    const json = await res.json();
    const list = json.data?.folders || [];
    return list.map(f => ({
      id: f._id,
      name: f.name,
      parentId: f.parentFolder,
      type: 'folder',
      created_at: f.createdAt
    }));
  },

  createFolder: async (name, parentId = null, uploadBatchId = null) => {
    const res = await fetch(`${API_URL}/videos/folders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, parentFolder: parentId || null, uploadBatchId })
    });
    if (!res.ok) {
      throw new Error('Failed to create folder');
    }
    const json = await res.json();
    const f = json.data?.folder;
    return {
      id: f._id,
      name: f.name,
      parentId: f.parentFolder,
      type: 'folder',
      created_at: f.createdAt
    };
  },

  renameFolder: async (id, newName) => {
    const res = await fetch(`${API_URL}/videos/folders/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ name: newName })
    });
    if (!res.ok) {
      throw new Error('Failed to rename folder');
    }
    const json = await res.json();
    const f = json.data?.folder;
    return {
      id: f._id,
      name: f.name,
      parentId: f.parentFolder,
      type: 'folder',
      created_at: f.createdAt
    };
  },

  deleteFolder: async (id) => {
    const res = await fetch(`${API_URL}/videos/folders/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      throw new Error('Failed to delete folder');
    }
    return [id];
  },

  moveFolder: async (id, targetParentId) => {
    const res = await fetch(`${API_URL}/videos/folders/${id}/move`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ targetParentId })
    });
    if (!res.ok) {
      throw new Error('Failed to move folder');
    }
    const json = await res.json();
    const f = json.data?.folder;
    return {
      id: f._id,
      name: f.name,
      parentId: f.parentFolder,
      type: 'folder',
      created_at: f.createdAt
    };
  }
};
