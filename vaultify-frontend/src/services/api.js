const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem('vaultify_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP Error ${response.status}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : {};
};

export const api = {
  // ─── AUTH ───────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  register: async (userData) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  googleLogin: async (firebaseIdToken) => {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ idToken: firebaseIdToken }),
    });
    return handleResponse(res);
  },

  verifyEmail: async (token) => {
    const res = await fetch(`${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`);
    return handleResponse(res);
  },

  forgotPassword: async (email) => {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  resetPassword: async (token, password) => {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ token, password }),
    });
    return handleResponse(res);
  },

  getProfile: async () => {
    const res = await fetch(`${API_URL}/auth/profile`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateProfile: async (profileData) => {
    const res = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData),
    });
    return handleResponse(res);
  },

  changePassword: async (oldPassword, newPassword) => {
    const res = await fetch(`${API_URL}/auth/change-password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    return handleResponse(res);
  },

  logout: async () => {
    const res = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // ─── FILES ──────────────────────────────────────────────────────────────────
  getFiles: async (folderId = null) => {
    const url = folderId
      ? `${API_URL}/files?folder_id=${folderId}`
      : `${API_URL}/files`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  uploadFile: async (formData) => {
    const res = await fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      headers: getHeaders(true), // no Content-Type so multipart boundary is auto-set
      body: formData,
    });
    return handleResponse(res);
  },

  getFile: async (id) => {
    const res = await fetch(`${API_URL}/files/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  deleteFile: async (id) => {
    const res = await fetch(`${API_URL}/files/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  renameFile: async (id, newName) => {
    const res = await fetch(`${API_URL}/files/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ file_name: newName }),
    });
    return handleResponse(res);
  },

  // ✅ FIXED: backend expects POST /files/favorite with { file_id, is_favorite }
  favoriteFile: async (id, is_favorite) => {
    const res = await fetch(`${API_URL}/files/favorite`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ file_id: id, is_favorite }),
    });
    return handleResponse(res);
  },

  // ✅ FIXED: backend expects POST /files/move with { file_id, folder_id }
  moveFile: async (id, folderId) => {
    const res = await fetch(`${API_URL}/files/move`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ file_id: id, folder_id: folderId }),
    });
    return handleResponse(res);
  },

  downloadFile: async (id) => {
    const res = await fetch(`${API_URL}/files/download/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getPreviewUrl: async (id) => {
    const res = await fetch(`${API_URL}/files/download/${id}?disposition=inline`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // ─── FOLDERS ────────────────────────────────────────────────────────────────
  getFolders: async (parentId = null) => {
    const url = parentId
      ? `${API_URL}/folders?parent_folder_id=${parentId}`
      : `${API_URL}/folders`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  createFolder: async (name, parentId = null, uploadBatchId = null) => {
    const res = await fetch(`${API_URL}/folders`, {
      method: 'POST',
      headers: getHeaders(),
      // backend expects folder_name; we send both for compatibility
      body: JSON.stringify({ folder_name: name, name, parentId, parent_folder_id: parentId, uploadBatchId }),
    });
    return handleResponse(res);
  },

  renameFolder: async (id, newName) => {
    const res = await fetch(`${API_URL}/folders/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ folder_name: newName }),
    });
    return handleResponse(res);
  },

  deleteFolder: async (id) => {
    const res = await fetch(`${API_URL}/folders/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getOrCreateWorkFolder: async () => {
    const res = await fetch(`${API_URL}/folders/work`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getStorageSummary: async () => {
    const res = await fetch(`${API_URL}/storage/summary`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getActivities: async () => {
    const res = await fetch(`${API_URL}/auth/activities`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  logActivity: async (action, fileName, details = {}) => {
    const res = await fetch(`${API_URL}/auth/activities`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action, fileName, details }),
    });
    return handleResponse(res);
  },

  // ─── HEALTH ─────────────────────────────────────────────────────────────────
  health: async () => {
    const res = await fetch(`${API_URL}/health`);
    return handleResponse(res);
  },
};
