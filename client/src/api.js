const STORAGE_KEY = 'rentplay_session';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function apiRequest(path, options = {}) {
  const session = getSession();
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutMs = Number(options.timeoutMs || 0);
  let timeoutId = null;

  if (controller && Number.isFinite(timeoutMs) && timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token || session?.token ? { Authorization: `Bearer ${options.token || session.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: controller?.signal
  }).catch((error) => {
    if (error?.name === 'AbortError') {
      throw new Error('Request timeout');
    }

    throw error;
  }).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    throw error;
  }

  return data;
}