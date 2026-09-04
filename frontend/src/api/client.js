import { STORAGE_KEYS } from '../constants/campus';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export function getStoredSessionToken(session) {
  if (session?.token) return session.token;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.token) return parsed.token;
    }
  } catch {}
  return null;
}

export async function request(endpoint, options = {}, session = null) {
  const token = getStoredSessionToken(session);
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(session?.dept ? { 'x-dept': session.dept } : {}),
    ...(session?.semester ? { 'x-semester': session.semester } : {}),
    ...(session?.section ? { 'x-section': session.section } : {}),
    ...(session?.role ? { 'x-role': session.role } : {}),
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const msg = (data && data.error) || (typeof data === 'string' ? data : `HTTP ${response.status}`);
    const error = new Error(msg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const httpClient = {
  get: (endpoint, session = null, options = {}) =>
    request(endpoint, { method: 'GET', ...options }, session),

  post: (endpoint, body, session = null, options = {}) =>
    request(
      endpoint,
      {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
        ...options,
      },
      session
    ),

  patch: (endpoint, body, session = null, options = {}) =>
    request(
      endpoint,
      {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
        ...options,
      },
      session
    ),

  put: (endpoint, body, session = null, options = {}) =>
    request(
      endpoint,
      {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
        ...options,
      },
      session
    ),

  delete: (endpoint, session = null, options = {}) =>
    request(endpoint, { method: 'DELETE', ...options }, session),
};
