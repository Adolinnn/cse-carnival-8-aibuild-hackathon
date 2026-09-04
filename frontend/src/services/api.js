import { dataService } from './dataService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || null;

async function request(endpoint, options = {}, session = null) {
  if (!API_BASE_URL) {
    return null; // fallback to local dataService
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(session ? {
      'x-dept': session.dept,
      'x-semester': session.semester,
      'x-section': session.section,
      'x-role': session.role,
    } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(API_BASE_URL + endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error('API Error (' + response.status + '): ' + errorText);
  }

  return response.json();
}

export const api = {
  isConfigured: () => Boolean(API_BASE_URL),

  getSchedules: async (tenant, session) => {
    try {
      const res = await request('/schedules', { method: 'GET' }, session);
      if (res) return res;
    } catch (e) {
      console.warn('API fetch failed, using local store:', e);
    }
    return dataService.getSchedules(tenant);
  },

  getRooms: async (session) => {
    try {
      const res = await request('/rooms', { method: 'GET' }, session);
      if (res) return res;
    } catch (e) {
      console.warn('API fetch failed, using local store:', e);
    }
    return dataService.getRooms();
  },

  getEvents: async (tenant, session) => {
    try {
      const res = await request('/events', { method: 'GET' }, session);
      if (res) return res;
    } catch (e) {
      console.warn('API fetch failed, using local store:', e);
    }
    return dataService.getEvents(tenant);
  },

  getAnnouncements: async (tenant, session) => {
    try {
      const res = await request('/announcements', { method: 'GET' }, session);
      if (res) return res;
    } catch (e) {
      console.warn('API fetch failed, using local store:', e);
    }
    return dataService.getAnnouncements(tenant);
  },

  getAssignments: async (tenant, session) => {
    try {
      const res = await request('/assignments', { method: 'GET' }, session);
      if (res) return res;
    } catch (e) {
      console.warn('API fetch failed, using local store:', e);
    }
    return dataService.getAssignments(tenant);
  },
};
