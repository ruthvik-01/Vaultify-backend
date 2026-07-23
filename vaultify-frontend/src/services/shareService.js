// Service for managing share links of videos and video folders.
// Integrates with backend share APIs for files, and uses local simulation for folders.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const shareService = {
  // Share a file or regular folder (uses the real backend /share API)
  shareFile: async (fileId, folderId = null) => {
    const token = localStorage.getItem('vaultify_token');
    const body = { permission: 'read', expiry_hours: 24 };
    if (fileId) body.file_id = fileId;
    if (folderId) body.folder_id = folderId;
    const res = await fetch(`${API_URL}/share`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      throw new Error('Failed to generate share link.');
    }
    const data = await res.json();
    return data.data; // { token, share_link, permission, expiry_date }
  },

  // Share a video folder (uses the real backend /share API)
  shareFolder: async (folderId) => {
    const token = localStorage.getItem('vaultify_token');
    const res = await fetch(`${API_URL}/videos/share`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ folderId })
    });
    if (!res.ok) {
      throw new Error('Failed to generate share link.');
    }
    const data = await res.json();
    return {
      token: data.data.token,
      share_link: `${window.location.origin}/share/${data.data.token}`
    };
  },

  // Resolve a public token to retrieve shared details (no auth required)
  getSharedItem: async (token) => {
    const res = await fetch(`${API_URL}/share/${token}?disposition=inline`);
    if (!res.ok) {
      throw new Error('Shared link is invalid or has expired.');
    }
    const json = await res.json();
    const data = json.data;
    if (data.type === 'folder') {
      return data;
    }
    return {
      type: 'file',
      name: data.file_name,
      file_name: data.file_name,
      size: data.file_size,
      file_size: data.file_size,
      mimeType: data.file_type,
      file_type: data.file_type,
      downloadUrl: data.download_url,
      download_url: data.download_url,
      createdAt: data.createdAt,
      ownerName: data.ownerName
    };
  }
};
