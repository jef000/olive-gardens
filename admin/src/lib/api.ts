import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import csrfManager from './csrfManager';
import tokenManager from './tokenManager';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);
const PUBLIC_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/me', '/auth/forgot-password', '/auth/reset-password', '/auth/mfa/validate', '/auth/mfa/backup-code'];

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise: Promise<void> | null = null;
let csrfPromise: Promise<void> | null = null;

async function ensureCsrfToken(): Promise<void> {
  if (csrfManager.getToken()) return;
  if (!csrfPromise) {
    csrfPromise = api.get('/auth/me').then(() => undefined).finally(() => {
      csrfPromise = null;
    });
  }
  await csrfPromise;
}

async function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = api.post('/auth/refresh').then(() => {
      tokenManager.markRefreshed();
    }).finally(() => {
      refreshPromise = null;
    });
  }
  await refreshPromise;
}

function isPublicEndpoint(config: InternalAxiosRequestConfig): boolean {
  return PUBLIC_ENDPOINTS.some((endpoint) => config.url?.endsWith(endpoint));
}

api.interceptors.request.use(async (request) => {
  if (!isPublicEndpoint(request) && tokenManager.needsRefresh()) await refreshSession();
  const method = request.method?.toLowerCase();
  if (method && MUTATING_METHODS.has(method) && !isPublicEndpoint(request) && !csrfManager.getToken()) {
    await ensureCsrfToken();
  }
  const csrfToken = csrfManager.getToken();
  if (method && MUTATING_METHODS.has(method) && csrfToken) request.headers.set('X-CSRF-Token', csrfToken);
  return request;
});

api.interceptors.response.use(
  (response) => {
    const token = response.headers['x-csrf-token'];
    if (typeof token === 'string') csrfManager.setToken(token);
    return response;
  },
  async (error: AxiosError) => {
    const request = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && request && !request._retry && !isPublicEndpoint(request)) {
      request._retry = true;
      try {
        await refreshSession();
        return api(request);
      } catch {
        tokenManager.clearTokens();
        csrfManager.clearToken();
        localStorage.removeItem('admin_user');
        if (window.location.pathname !== '/login') window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

export { refreshSession };
export default api;
