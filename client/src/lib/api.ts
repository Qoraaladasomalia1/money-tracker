const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

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
  const timeout = setTimeout(() => controller.abort(), 15000);

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
        throw new Error('Request timed out. Is the API running on port 4000?');
      }
      if (
        err.message === 'Failed to fetch' ||
        err.message.includes('NetworkError') ||
        err.message.includes('Network request failed')
      ) {
        throw new Error(
          'Cannot reach the server. Start it with npm run dev (API on port 4000).'
        );
      }
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
