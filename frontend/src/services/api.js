import { ENDPOINTS } from '../api/endpoints';
import { request, httpClient, API_BASE_URL } from '../api/client';

export { request, API_BASE_URL };

export const api = {
  isConfigured: () => Boolean(API_BASE_URL),
  getBaseUrl: () => API_BASE_URL,
  endpoints: ENDPOINTS,

  // Health
  getHealth: async (session) => {
    return httpClient.get(ENDPOINTS.HEALTH, session);
  },

  // Auth
  login: async ({ dept, semester, section, password, student_id, student_name }) => {
    return httpClient.post(ENDPOINTS.AUTH.LOGIN, {
      dept,
      semester,
      section,
      password,
      student_id,
      student_name,
    });
  },

  getMe: async (session) => {
    return httpClient.get(ENDPOINTS.AUTH.ME, session);
  },

  getAuthOptions: async () => {
    return httpClient.get(ENDPOINTS.AUTH.OPTIONS);
  },

  changePassword: async ({ current_password, new_password }, session) => {
    return httpClient.post(
      ENDPOINTS.AUTH.CHANGE_PASSWORD,
      { current_password, new_password },
      session
    );
  },

  // Schedules
  getSchedules: async (tenant, session) => {
    return httpClient.get(ENDPOINTS.SCHEDULES.LIST, session || tenant);
  },

  createSchedule: async (data, session) => {
    return httpClient.post(ENDPOINTS.SCHEDULES.CREATE, data, session);
  },

  updateSchedule: async (id, data, session) => {
    return httpClient.patch(ENDPOINTS.SCHEDULES.UPDATE(id), data, session);
  },

  deleteSchedule: async (id, session) => {
    return httpClient.delete(ENDPOINTS.SCHEDULES.DELETE(id), session);
  },

  // Rooms
  getRooms: async (session) => {
    return httpClient.get(ENDPOINTS.ROOMS.LIST, session);
  },

  getAvailableRooms: async (
    { date, start_time, end_time, min_capacity, equipment, type } = {},
    session
  ) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (start_time) params.append('start_time', start_time);
    if (end_time) params.append('end_time', end_time);
    if (min_capacity) params.append('min_capacity', min_capacity);
    if (type) params.append('type', type);
    if (equipment && equipment.length) params.append('equipment', equipment.join(','));

    const qs = params.toString();
    const url = `${ENDPOINTS.ROOMS.AVAILABLE}${qs ? `?${qs}` : ''}`;
    return httpClient.get(url, session);
  },

  getRoomBookings: async (roomNumber, date, session) => {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    return httpClient.get(`${ENDPOINTS.ROOMS.BOOKINGS(roomNumber)}${qs}`, session);
  },

  bookRoom: async (
    roomNumber,
    { date, start_time, end_time, purpose, booked_by, dept, semester, section },
    session
  ) => {
    return httpClient.post(
      ENDPOINTS.ROOMS.BOOK(roomNumber),
      { date, start_time, end_time, purpose, booked_by, dept, semester, section },
      session
    );
  },

  createRoom: async (data, session) => {
    return httpClient.post(ENDPOINTS.ROOMS.CREATE, data, session);
  },

  updateRoom: async (id, data, session) => {
    return httpClient.patch(ENDPOINTS.ROOMS.UPDATE(id), data, session);
  },

  deleteRoom: async (id, session) => {
    return httpClient.delete(ENDPOINTS.ROOMS.DELETE(id), session);
  },

  cancelBooking: async (bookingId, session) => {
    return httpClient.delete(ENDPOINTS.ROOMS.CANCEL_BOOKING(bookingId), session);
  },

  // Admin Management (Super Admin)
  getAdmins: async (session) => {
    return httpClient.get(ENDPOINTS.AUTH.ADMINS, session);
  },

  createOrUpdateAdmin: async (data, session) => {
    return httpClient.post(ENDPOINTS.AUTH.ADMINS, data, session);
  },

  deleteAdmin: async (key, session) => {
    return httpClient.delete(ENDPOINTS.AUTH.ADMIN_DELETE(key), session);
  },

  // Events
  getEvents: async (tenant, session) => {
    return httpClient.get(ENDPOINTS.EVENTS.LIST, session || tenant);
  },

  createEvent: async (data, session) => {
    return httpClient.post(ENDPOINTS.EVENTS.CREATE, data, session);
  },

  updateEvent: async (id, data, session) => {
    return httpClient.patch(ENDPOINTS.EVENTS.UPDATE(id), data, session);
  },

  deleteEvent: async (id, session) => {
    return httpClient.delete(ENDPOINTS.EVENTS.DELETE(id), session);
  },

  registerForEvent: async (eventId, { student_id, name, dept, semester, section }, session) => {
    return httpClient.post(
      ENDPOINTS.EVENTS.REGISTER(eventId),
      { student_id, name, dept, semester, section },
      session
    );
  },

  cancelRegistration: async (eventId, studentId, session) => {
    return httpClient.delete(
      ENDPOINTS.EVENTS.CANCEL_REGISTRATION(eventId, studentId),
      session
    );
  },

  // Announcements
  getAnnouncements: async (tenant, session) => {
    return httpClient.get(ENDPOINTS.ANNOUNCEMENTS.LIST, session || tenant);
  },

  createAnnouncement: async (data, session) => {
    return httpClient.post(ENDPOINTS.ANNOUNCEMENTS.CREATE, data, session);
  },

  updateAnnouncement: async (id, data, session) => {
    return httpClient.patch(ENDPOINTS.ANNOUNCEMENTS.UPDATE(id), data, session);
  },

  deleteAnnouncement: async (id, session) => {
    return httpClient.delete(ENDPOINTS.ANNOUNCEMENTS.DELETE(id), session);
  },

  // Assignments
  getAssignments: async (tenant, session) => {
    return httpClient.get(ENDPOINTS.ASSIGNMENTS.LIST, session || tenant);
  },

  createAssignment: async (data, session) => {
    return httpClient.post(ENDPOINTS.ASSIGNMENTS.CREATE, data, session);
  },

  updateAssignment: async (id, data, session) => {
    return httpClient.patch(ENDPOINTS.ASSIGNMENTS.UPDATE(id), data, session);
  },

  deleteAssignment: async (id, session) => {
    return httpClient.delete(ENDPOINTS.ASSIGNMENTS.DELETE(id), session);
  },

  // Agent Config
  getAgentConfig: async (session) => {
    return httpClient.get(ENDPOINTS.AGENT_CONFIG.GET, session);
  },

  updateAgentConfig: async (config, session) => {
    return httpClient.put(ENDPOINTS.AGENT_CONFIG.UPDATE, config, session);
  },

  // AI Chat
  sendChatMessage: async (messages, session) => {
    return httpClient.post(ENDPOINTS.CHAT.SEND, { messages }, session);
  },
};

export default api;
