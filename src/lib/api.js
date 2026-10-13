// Thin fetch wrapper around the Spring Boot REST API. No HTTP library needed.
const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'campuspulse.token';

export const tokenStore = {
  get() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* storage unavailable */ }
  },
  clear() {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ }
  },
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(method, path, { body, params } = {}) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.set(k, v);
  });
  const qs = query.toString();
  const url = `${BASE}${path}${qs ? `?${qs}` : ''}`;

  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('Can\'t reach the server. Check that the backend is running on port 8080.', 0);
  }

  if (res.status === 204) return null;

  let data = null;
  try { data = await res.json(); } catch { /* empty or non-JSON body */ }

  if (!res.ok) {
    const isAuthCall = path === '/auth/login' || path === '/auth/register';
    if (res.status === 401 && !isAuthCall) {
      tokenStore.clear();
      window.dispatchEvent(new Event('cp:unauthorized'));
    }
    throw new ApiError((data && data.message) || `Request failed (${res.status})`, res.status);
  }
  return data;
}

const get = (path, params) => request('GET', path, { params });
const post = (path, body) => request('POST', path, { body });
const put = (path, body) => request('PUT', path, { body });
const patch = (path, body) => request('PATCH', path, { body });
const del = (path) => request('DELETE', path);

export const api = {
  login: (body) => post('/auth/login', body),
  register: (body) => post('/auth/register', body),
  me: () => get('/auth/me'),
  logout: () => post('/auth/logout'),

  resources: {
    list: (type) => get('/resources', { type }),
    availability: (date) => get('/resources/availability', { date }),
    create: (body) => post('/resources', body),
    update: (id, body) => put(`/resources/${id}`, body),
    remove: (id) => del(`/resources/${id}`),
  },

  bookings: {
    create: (body) => post('/bookings', body),
    mine: () => get('/bookings/mine'),
    all: (date) => get('/bookings', { date }),
    cancel: (id) => post(`/bookings/${id}/cancel`),
    pending: () => get('/bookings/pending'),
    approve: (id) => post(`/bookings/${id}/approve`),
    reject: (id, note) => post(`/bookings/${id}/reject`, { note }),
  },

  maintenance: {
    create: (body) => post('/maintenance', body),
    mine: () => get('/maintenance/mine'),
    all: (status) => get('/maintenance', { status }),
    updateStatus: (id, body) => patch(`/maintenance/${id}/status`, body),
  },

  recommend: (body) => post('/recommendations', body),
  analytics: () => get('/analytics'),

  users: {
    list: () => get('/users'),
    changeRole: (id, role) => patch(`/users/${id}/role`, { role }),
  },

  notifications: {
    list: () => get('/notifications'),
    unreadCount: () => get('/notifications/unread-count'),
    markRead: (id) => post(`/notifications/${id}/read`),
    markAllRead: () => post('/notifications/read-all'),
  },

  logs: () => get('/logs'),
};
