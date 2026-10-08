/**
 * API base URL.
 * - Production (Docker/Coolify): leave empty → browser calls /api on the same domain;
 *   nginx proxies /api → Express (server:4000).
 * - Local Vite only: set client/.env → VITE_API_URL=http://localhost:4000
 *   OR rely on vite.config.ts proxy (preferred).
 */
const raw = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');

// Never call localhost from a deployed (non-local) site
const API_BASE =
  raw.includes('localhost') &&
  typeof window !== 'undefined' &&
  !['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? ''
    : raw;

function getToken() {
  return localStorage.getItem('mt_token');
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('mt_token', token);
  else localStorage.removeItem('mt_token');
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        (data as { error?: string }).error || `Request failed (${res.status})`
      );
    }
    return data as T;
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      if (
        err.message === 'Failed to fetch' ||
        err.message.includes('NetworkError') ||
        err.message.includes('Network request failed')
      ) {
        throw new Error(
          'Cannot reach the API. Check that the server is running and /api is proxied.'
        );
      }
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
