import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  withCredentials: false,
});

// No auth headers — all requests are anonymous
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
