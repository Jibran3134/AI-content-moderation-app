import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  withCredentials: true,
});

// ─── Request interceptor: attach stored access token ──────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('ai-moderation-auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        const token = parsed?.state?.accessToken;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // ignore parse errors
    }
  }
  return config;
});

// ─── Response interceptor: auto-refresh on 401 ───────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token!);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401s (not on auth endpoints themselves to avoid loops)
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue the request until refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const res = await api.post('/auth/refresh');
      const newToken = res.data.data.accessToken;

      // Update zustand persisted store in localStorage
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('ai-moderation-auth');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.state) {
              parsed.state.accessToken = newToken;
              localStorage.setItem('ai-moderation-auth', JSON.stringify(parsed));
            }
          }
        } catch {
          // ignore
        }
      }

      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      // Clear auth state and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ai-moderation-auth');
        window.location.href = '/login';
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;

/** Convert a relative upload path to an absolute URL */
export function getImageUrl(path: string | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1').replace(
    '/api/v1',
    '',
  );
  return `${base}${path}`;
}
