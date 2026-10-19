// Device client ID generation and persistence
function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem('al_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
    localStorage.setItem('al_device_id', deviceId);
  }
  return deviceId;
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

export function resolveFileUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (API_BASE_URL.startsWith('http')) {
    try {
      const backendOrigin = new URL(API_BASE_URL).origin;
      return `${backendOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
    } catch {
      return url;
    }
  }
  return url;
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...customConfig } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const query = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
    if (query) {
      url += (url.includes('?') ? '&' : '?') + query;
    }
  }

  const token = localStorage.getItem('al_token');
  const deviceId = getOrCreateDeviceId();

  const defaultHeaders: Record<string, string> = {
    'X-Device-Id': deviceId,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!(customConfig.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  });

  // Handle 401 Session Expiration
  if (response.status === 401 && !endpoint.includes('/auth/login')) {
    localStorage.removeItem('al_token');
    localStorage.removeItem('al_user');
    window.dispatchEvent(new CustomEvent('al:session-expired', {
      detail: { message: 'Your session has expired. Please log in again.' },
    }));
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: any = new Error(data.message || 'An error occurred while communicating with the server.');
    error.status = response.status;
    error.code = data.code;
    error.data = data;
    throw error;
  }

  return data;
}

// API methods
export const api = {
  // Auth
  auth: {
    login: (credentials: { username: string; password: string }) =>
      apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    logout: () =>
      apiRequest('/auth/logout', { method: 'POST' }),
    me: () =>
      apiRequest('/auth/me'),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      apiRequest('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Users
  users: {
    list: (params?: any) =>
      apiRequest('/users', { params }),
    get: (id: string) =>
      apiRequest(`/users/${id}`),
    create: (data: any) =>
      apiRequest('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      apiRequest(`/users/${id}`, { method: 'DELETE' }),
    resetPassword: (id: string, newPassword: string) =>
      apiRequest(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) }),
    forceLogout: (id: string) =>
      apiRequest(`/users/${id}/force-logout`, { method: 'POST' }),
  },

  // Curriculum & Courses
  courses: {
    list: () =>
      apiRequest('/courses'),
    get: (id: string) =>
      apiRequest(`/courses/${id}`),
    studentTree: () =>
      apiRequest('/courses/student-tree'),
    create: (data: any) =>
      apiRequest('/courses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiRequest(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      apiRequest(`/courses/${id}`, { method: 'DELETE' }),
    // Semesters
    createSemester: (data: any) =>
      apiRequest('/courses/semesters', { method: 'POST', body: JSON.stringify(data) }),
    deleteSemester: (id: string) =>
      apiRequest(`/courses/semesters/${id}`, { method: 'DELETE' }),
    // Subjects
    createSubject: (data: any) =>
      apiRequest('/courses/subjects', { method: 'POST', body: JSON.stringify(data) }),
    updateSubject: (id: string, data: any) =>
      apiRequest(`/courses/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteSubject: (id: string) =>
      apiRequest(`/courses/subjects/${id}`, { method: 'DELETE' }),
    // Topics
    createTopic: (data: any) =>
      apiRequest('/courses/topics', { method: 'POST', body: JSON.stringify(data) }),
    deleteTopic: (id: string) =>
      apiRequest(`/courses/topics/${id}`, { method: 'DELETE' }),
  },

  // Notes
  notes: {
    list: (params?: any) =>
      apiRequest('/notes', { params }),
    get: (id: string) =>
      apiRequest(`/notes/${id}`),
    search: (q: string) =>
      apiRequest('/notes/search', { params: { q } }),
    recentlyViewed: () =>
      apiRequest('/notes/recently-viewed'),
    create: (data: any) =>
      apiRequest('/notes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiRequest(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      apiRequest(`/notes/${id}`, { method: 'DELETE' }),
  },

  // Access Control
  access: {
    grant: (data: any) =>
      apiRequest('/access/grant', { method: 'POST', body: JSON.stringify(data) }),
    revoke: (id: string) =>
      apiRequest(`/access/${id}`, { method: 'DELETE' }),
    userAccess: (userId: string) =>
      apiRequest(`/access/user/${userId}`),
  },

  // Sessions
  sessions: {
    active: () =>
      apiRequest('/sessions/active'),
    revoke: (id: string) =>
      apiRequest(`/sessions/${id}`, { method: 'DELETE' }),
    revokeAll: () =>
      apiRequest('/sessions/revoke-all-users', { method: 'POST' }),
  },

  // Packages
  packages: {
    list: () =>
      apiRequest('/packages'),
    create: (data: any) =>
      apiRequest('/packages', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiRequest(`/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      apiRequest(`/packages/${id}`, { method: 'DELETE' }),
  },

  // Payments
  payments: {
    list: (params?: any) =>
      apiRequest('/payments', { params }),
    create: (data: any) =>
      apiRequest('/payments', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, data: any) =>
      apiRequest(`/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      apiRequest(`/payments/${id}`, { method: 'DELETE' }),
  },

  // Announcements
  announcements: {
    active: () =>
      apiRequest('/announcements/active'),
    list: () =>
      apiRequest('/announcements'),
    create: (data: any) =>
      apiRequest('/announcements', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiRequest(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      apiRequest(`/announcements/${id}`, { method: 'DELETE' }),
  },

  // Social Links
  socialLinks: {
    public: () =>
      apiRequest('/social-links/public'),
    list: () =>
      apiRequest('/social-links'),
    create: (data: any) =>
      apiRequest('/social-links', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiRequest(`/social-links/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      apiRequest(`/social-links/${id}`, { method: 'DELETE' }),
  },

  // Settings
  settings: {
    public: () =>
      apiRequest('/settings/public'),
    all: () =>
      apiRequest('/settings'),
    updateBulk: (data: Record<string, string>) =>
      apiRequest('/settings/bulk', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Activity Logs & Stats
  activityLogs: {
    list: (params?: any) =>
      apiRequest('/activity-logs', { params }),
  },
  stats: {
    dashboard: () =>
      apiRequest('/stats/dashboard'),
  },

  // File Uploads
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/upload', { method: 'POST', body: formData });
  },
};
