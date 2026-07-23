const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const adminToken = localStorage.getItem('vaultify_admin_token');
  const userToken = localStorage.getItem('vaultify_token');
  const token = adminToken || userToken;
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const cache = new Map();
const pendingRequests = new Map();

async function fetchAdmin(url, options = {}) {
  const headers = getHeaders();
  if (options.headers) {
    Object.assign(headers, options.headers);
  }
  const config = {
    ...options,
    headers
  };
  const res = await fetch(url, config);
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('vaultify_admin_token');
    window.location.href = '/admin/login';
    throw new Error('Session expired or unauthorized. Please log in again.');
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP Error ${res.status}: Failed operation.`);
  }
  return await res.json();
}

async function fetchWithDeduplication(url) {
  if (pendingRequests.has(url)) {
    return pendingRequests.get(url);
  }

  const promise = (async () => {
    try {
      const data = await fetchAdmin(url);
      cache.set(url, { data, timestamp: Date.now() });
      return data;
    } finally {
      pendingRequests.delete(url);
    }
  })();

  pendingRequests.set(url, promise);
  return promise;
}

export const adminService = {
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Invalid admin credentials');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('vaultify_admin_token', data.token);
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('vaultify_admin_token');
    cache.clear();
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('vaultify_admin_token');
  },

  getStats: async () => {
    return await fetchWithDeduplication(`${API_URL}/admin/dashboard`);
  },

  getStudents: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = `${API_URL}/admin/students?${query}`;
    return await fetchWithDeduplication(url);
  },

  getStudent: async (id) => {
    return await fetchWithDeduplication(`${API_URL}/admin/student/${id}`);
  },

  getTeams: async () => {
    return await fetchWithDeduplication(`${API_URL}/admin/teams`);
  },

  getUploads: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = `${API_URL}/admin/uploads?${query}`;
    return await fetchWithDeduplication(url);
  },

  deleteUpload: async (id, fileType) => {
    const query = fileType ? `?type=${fileType}` : '';
    return await fetchAdmin(`${API_URL}/admin/uploads/${id}${query}`, {
      method: 'DELETE'
    });
  },

  deleteTeamUploads: async (teamName) => {
    return await fetchAdmin(`${API_URL}/admin/teams/${encodeURIComponent(teamName)}/uploads`, {
      method: 'DELETE'
    });
  },

  getActivity: async () => {
    return await fetchWithDeduplication(`${API_URL}/admin/activity`);
  },

  getAnalytics: async () => {
    return await fetchWithDeduplication(`${API_URL}/admin/analytics`);
  },

  // Settings Endpoints
  getSettings: async () => {
    return await fetchAdmin(`${API_URL}/admin/settings`);
  },

  updateSettings: async (settings) => {
    return await fetchAdmin(`${API_URL}/admin/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },

  changePassword: async (oldPassword, newPassword) => {
    return await fetchAdmin(`${API_URL}/admin/settings/change-password`, {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword })
    });
  },

  addMonitoredStudent: async (student) => {
    return await fetchAdmin(`${API_URL}/admin/settings/monitored-emails`, {
      method: 'POST',
      body: JSON.stringify(student)
    });
  },

  deleteMonitoredStudent: async (id) => {
    return await fetchAdmin(`${API_URL}/admin/settings/monitored-emails/${id}`, {
      method: 'DELETE'
    });
  },

  exportMonitoringData: async () => {
    const token = localStorage.getItem('vaultify_admin_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    const res = await fetch(`${API_URL}/admin/settings/export`, { headers });
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('vaultify_admin_token');
      window.location.href = '/admin/login';
      throw new Error('Session expired. Please log in again.');
    }
    if (!res.ok) {
      throw new Error('Failed to export monitoring data.');
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `vaultify_monitoring_export_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  },

  getPreviewUrl: async (id, fileType, disposition = 'inline') => {
    const type = fileType === 'video' ? 'video' : fileType === 'group' ? 'group' : 'file';
    const res = await fetchAdmin(`${API_URL}/admin/uploads/${id}/preview?type=${type}&disposition=${disposition}`);
    return res.download_url;
  },

  createUploadShare: async (id, fileType) => {
    const type = fileType === 'video' ? 'video' : fileType === 'group' ? 'group' : 'file';
    return await fetchAdmin(`${API_URL}/admin/uploads/${id}/share?type=${type}`, {
      method: 'POST'
    });
  }
};
