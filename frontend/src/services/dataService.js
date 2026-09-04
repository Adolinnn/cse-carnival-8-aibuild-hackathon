import { api } from './api';
import { generateSeedData } from './seedData';
import {
  DEPARTMENTS,
  SEMESTERS,
  SECTIONS,
  DEFAULT_TENANT,
  DEFAULT_STUDENT,
  DEFAULT_SIMULATED_DATE,
  DEFAULT_SIMULATED_TIME,
  DEFAULT_AGENT_SYSTEM_PROMPT,
  NON_OVERRIDABLE_SAFETY_WRAPPER,
  STORAGE_KEYS,
} from '../constants/campus';
import { checkBookingConflict, checkScheduleConflict } from '../utils/conflicts';

// Re-export constants for full backward compatibility
export {
  DEPARTMENTS,
  SEMESTERS,
  SECTIONS,
  DEFAULT_TENANT,
  DEFAULT_STUDENT,
  DEFAULT_SIMULATED_DATE,
  DEFAULT_SIMULATED_TIME,
  DEFAULT_AGENT_SYSTEM_PROMPT,
  NON_OVERRIDABLE_SAFETY_WRAPPER,
  STORAGE_KEYS,
};

const STORAGE_KEY = STORAGE_KEYS.DATA;
const SESSION_KEY = STORAGE_KEYS.SESSION;
const AGENT_CONFIG_KEY = STORAGE_KEYS.AGENT_CONFIG;

class DataService {
  constructor() {
    this.subscribers = [];
    this.data = this.loadData();
    this.initSync();
  }

  initSync() {
    const session = this.getSession();
    if (session) {
      this.refreshFromBackend(session).catch(() => {});
    }
  }

  loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to read localStorage:', e);
    }
    const initial = generateSeedData();
    this.saveData(initial);
    return initial;
  }

  saveData(data) {
    this.data = data;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to write localStorage:', e);
    }
    this.notify();
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  notify() {
    this.subscribers.forEach((cb) => {
      try {
        cb(this.data);
      } catch (e) {
        console.error('Subscriber error:', e);
      }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('campusos:data-change', { detail: this.data }));
    }
  }

  // --- Backend Data Sync ---
  async refreshFromBackend(session) {
    const activeSession = session || this.getSession();
    if (!activeSession) return;

    try {
      const [schedulesRes, roomsRes, eventsRes, annRes, asgRes] = await Promise.allSettled([
        api.getSchedules(activeSession, activeSession),
        api.getRooms(activeSession),
        api.getEvents(activeSession, activeSession),
        api.getAnnouncements(activeSession, activeSession),
        api.getAssignments(activeSession, activeSession),
      ]);

      const normalize = (items, prefix) => {
        if (!Array.isArray(items)) return null;
        return items.map((item, idx) => ({
          ...item,
          id: item.id || item._id || `${prefix}-${idx + 1}`,
        }));
      };

      const updated = { ...this.data };
      if (schedulesRes.status === 'fulfilled' && Array.isArray(schedulesRes.value)) {
        updated.schedules = normalize(schedulesRes.value, 'sched');
      }
      if (roomsRes.status === 'fulfilled' && Array.isArray(roomsRes.value)) {
        updated.rooms = roomsRes.value.map((r) => ({
          ...r,
          bookings: r.bookings || [],
        }));
      }
      if (eventsRes.status === 'fulfilled' && Array.isArray(eventsRes.value)) {
        updated.events = normalize(eventsRes.value, 'evt');
      }
      if (annRes.status === 'fulfilled' && Array.isArray(annRes.value)) {
        updated.announcements = normalize(annRes.value, 'ann');
      }
      if (asgRes.status === 'fulfilled' && Array.isArray(asgRes.value)) {
        updated.assignments = normalize(asgRes.value, 'asg');
      }

      this.saveData(updated);
    } catch (e) {
      console.warn('[dataService] Backend sync notice:', e.message);
    }
  }

  // --- Auth & Sessions ---
  getSession() {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  }

  setSession(session) {
    try {
      if (session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (e) {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('campusos:session-change', { detail: session }));
    }
  }

  clearSession() {
    this.setSession(null);
  }

  async login({ dept, semester, section, password, student_id, student_name }) {
    if (!dept || !semester || !section) {
      return { success: false, error: 'Please select Department, Semester, and Section.' };
    }

    try {
      const res = await api.login({
        dept,
        semester,
        section,
        password: password || undefined,
        student_id: student_id || '20-40532',
        student_name: student_name || 'Sakibul Hasan',
      });

      if (res && res.ok) {
        const session = {
          role: res.role,
          dept: res.tenant.dept,
          semester: res.tenant.semester,
          section: res.tenant.section,
          token: res.token,
          user: res.user,
        };
        this.setSession(session);
        this.refreshFromBackend(session).catch(() => {});
        return { success: true, role: res.role, session };
      }
    } catch (err) {
      if (err.status === 401 || err.status === 400 || err.status === 429) {
        return { success: false, error: err.message || 'Access denied: invalid credentials.' };
      }
      console.warn('[auth] Backend unreachable, falling back to local verification:', err.message);
    }

    // Fallback: Local offline verification
    if (password && password.trim().length > 0) {
      if (password.trim() === 'admin123') {
        const session = { role: 'admin', dept, semester, section };
        this.setSession(session);
        return { success: true, role: 'admin', session };
      } else {
        return { success: false, error: 'Access denied: invalid credentials.' };
      }
    }

    const session = { role: 'student', dept, semester, section };
    this.setSession(session);
    return { success: true, role: 'student', session };
  }

  // --- Tenant Filter Helper ---
  matchesTenant(item, tenant) {
    if (!tenant) return true;
    return (
      (!item.dept || item.dept.toUpperCase() === tenant.dept.toUpperCase()) &&
      (!item.semester || item.semester === tenant.semester) &&
      (!item.section || item.section.toUpperCase() === tenant.section.toUpperCase())
    );
  }

  // --- Schedules ---
  getSchedules(tenant) {
    if (!tenant) return this.data.schedules;
    return this.data.schedules.filter((s) => this.matchesTenant(s, tenant));
  }

  addSchedule(newSchedule, tenant, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can add schedules.');
    const schedule = {
      ...newSchedule,
      id: 'sched-' + Date.now(),
      dept: tenant.dept,
      semester: tenant.semester,
      section: tenant.section,
    };
    const schedules = [...this.data.schedules, schedule];
    this.saveData({ ...this.data, schedules });

    const session = this.getSession();
    api.createSchedule(schedule, session)
      .then(() => this.refreshFromBackend(session))
      .catch((e) => console.warn('[addSchedule] Backend sync notice:', e.message));

    return schedule;
  }

  updateSchedule(id, updated, tenant, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can update schedules.');
    const schedules = this.data.schedules.map((s) => (s.id === id ? { ...s, ...updated } : s));
    this.saveData({ ...this.data, schedules });

    const session = this.getSession();
    api.updateSchedule(id, updated, session)
      .then(() => this.refreshFromBackend(session))
      .catch((e) => console.warn('[updateSchedule] Backend sync notice:', e.message));

    return schedules.find((s) => s.id === id);
  }

  deleteSchedule(id, tenant, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can delete schedules.');
    const schedules = this.data.schedules.filter((s) => s.id !== id);
    this.saveData({ ...this.data, schedules });

    const session = this.getSession();
    api.deleteSchedule(id, session)
      .then(() => this.refreshFromBackend(session))
      .catch((e) => console.warn('[deleteSchedule] Backend sync notice:', e.message));

    return true;
  }

  // --- Rooms ---
  getRooms() {
    return this.data.rooms;
  }

  addRoom(newRoom, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can add rooms.');
    const cleanNum = String(newRoom.room_number || '').trim().toUpperCase();
    const room = {
      id: newRoom.id || ('room-' + Date.now()),
      _id: newRoom.id || ('room-' + Date.now()),
      room_number: cleanNum,
      type: newRoom.type || 'classroom',
      capacity: Number(newRoom.capacity) || 40,
      equipment: Array.isArray(newRoom.equipment)
        ? newRoom.equipment
        : (newRoom.equipment ? String(newRoom.equipment).split(',').map(s => s.trim()).filter(Boolean) : ['whiteboard', 'AC']),
      floor: Number(newRoom.floor) || (cleanNum ? parseInt(cleanNum[1] || '7', 10) || 7 : 7),
      status: newRoom.status || 'available',
      bookings: [],
    };
    const rooms = [...this.data.rooms, room];
    this.saveData({ ...this.data, rooms });

    const session = this.getSession();
    api.createRoom(room, session)
      .then(() => this.refreshFromBackend(session))
      .catch((e) => console.warn('[createRoom] Backend sync notice:', e.message));

    return room;
  }

  updateRoom(id, updatedRoom, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can edit rooms.');
    const rooms = this.data.rooms.map((r) => {
      if (r.id === id || r._id === id || r.room_number === id) {
        return {
          ...r,
          ...updatedRoom,
          capacity: Number(updatedRoom.capacity != null ? updatedRoom.capacity : r.capacity),
          equipment: Array.isArray(updatedRoom.equipment)
            ? updatedRoom.equipment
            : (updatedRoom.equipment ? String(updatedRoom.equipment).split(',').map(s => s.trim()).filter(Boolean) : r.equipment),
        };
      }
      return r;
    });
    this.saveData({ ...this.data, rooms });

    const session = this.getSession();
    api.updateRoom(id, updatedRoom, session)
      .then(() => this.refreshFromBackend(session))
      .catch((e) => console.warn('[updateRoom] Backend sync notice:', e.message));

    return true;
  }

  deleteRoom(id, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can delete rooms.');
    const rooms = this.data.rooms.filter((r) => r.id !== id && r._id !== id && r.room_number !== id);
    this.saveData({ ...this.data, rooms });

    const session = this.getSession();
    api.deleteRoom(id, session)
      .then(() => this.refreshFromBackend(session))
      .catch((e) => console.warn('[deleteRoom] Backend sync notice:', e.message));

    return true;
  }

  async bookRoom(roomNumber, bookingDetails, tenant, role = 'student') {
    const room = this.data.rooms.find((r) => r.room_number.toUpperCase() === roomNumber.toUpperCase());
    if (!room) {
      return { success: false, message: 'Room ' + roomNumber + ' does not exist.' };
    }

    if (bookingDetails.start_time < '06:00' || bookingDetails.end_time > '18:00') {
      return {
        success: false,
        message: 'Room bookings are only allowed between 6:00 AM and 6:00 PM.',
      };
    }

    const overlap = checkBookingConflict(room, bookingDetails.date, bookingDetails.start_time, bookingDetails.end_time);
    if (overlap) {
      return {
        success: false,
        message:
          'Conflict: Room ' +
          roomNumber +
          ' is already booked on ' +
          bookingDetails.date +
          ' from ' +
          overlap.start_time +
          ' to ' +
          overlap.end_time +
          ' by ' +
          overlap.booked_by +
          ' (' +
          (overlap.purpose || 'Reserved') +
          ').',
      };
    }

    const classConflict = checkScheduleConflict(
      this.data.schedules,
      room.room_number,
      bookingDetails.date,
      bookingDetails.start_time,
      bookingDetails.end_time
    );

    if (classConflict) {
      return {
        success: false,
        message:
          'Conflict: Room ' +
          roomNumber +
          ' has a scheduled class (' +
          classConflict.course +
          ' - ' +
          classConflict.title +
          ') on ' +
          classConflict.day +
          's from ' +
          classConflict.start_time +
          ' to ' +
          classConflict.end_time +
          '.',
      };
    }

    const newBooking = {
      booking_id: 'bk-' + Date.now(),
      booked_by: bookingDetails.booked_by || (tenant.dept + ' ' + tenant.semester + '-' + tenant.section),
      dept: tenant.dept,
      semester: tenant.semester,
      section: tenant.section,
      date: bookingDetails.date,
      start_time: bookingDetails.start_time,
      end_time: bookingDetails.end_time,
      purpose: bookingDetails.purpose || 'Study / Team Session',
    };

    // Confirm with backend first
    try {
      const session = this.getSession();
      const backendRes = await api.bookRoom(roomNumber, newBooking, session);
      if (backendRes && (backendRes._id || backendRes.id)) {
        newBooking.booking_id = backendRes._id || backendRes.id;
      }
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Conflict: Room booking rejected by server.',
      };
    }

    const rooms = this.data.rooms.map((r) => {
      if (r.room_number.toUpperCase() === roomNumber.toUpperCase()) {
        return { ...r, bookings: [...(r.bookings || []), newBooking] };
      }
      return r;
    });

    this.saveData({ ...this.data, rooms });

    const session = this.getSession();
    this.refreshFromBackend(session).catch((e) => console.warn('[bookRoom] Refresh notice:', e.message));

    return {
      success: true,
      booking: newBooking,
      message:
        'Room ' +
        roomNumber +
        ' successfully booked for ' +
        bookingDetails.date +
        ' from ' +
        bookingDetails.start_time +
        ' to ' +
        bookingDetails.end_time +
        '.',
    };
  }

  cancelRoomBooking(roomNumber, bookingId, tenant, role = 'student') {
    const room = this.data.rooms.find((r) => r.room_number.toUpperCase() === roomNumber.toUpperCase());
    if (!room) return { success: false, message: 'Room not found.' };

    const booking = room.bookings.find((b) => b.booking_id === bookingId);
    if (!booking) return { success: false, message: 'Booking not found.' };

    if (role === 'student') {
      if (
        booking.dept &&
        (booking.dept !== tenant.dept ||
          booking.semester !== tenant.semester ||
          booking.section !== tenant.section)
      ) {
        return {
          success: false,
          message: "Permission denied: Students can only cancel their own section's bookings.",
        };
      }
    }

    const rooms = this.data.rooms.map((r) => {
      if (r.room_number.toUpperCase() === roomNumber.toUpperCase()) {
        return { ...r, bookings: r.bookings.filter((b) => b.booking_id !== bookingId) };
      }
      return r;
    });

    this.saveData({ ...this.data, rooms });

    const session = this.getSession();
    api.cancelBooking(bookingId, session)
      .then(() => this.refreshFromBackend(session))
      .catch((e) => console.warn('[cancelBooking] Backend sync notice:', e.message));

    return { success: true, message: 'Booking successfully canceled.' };
  }

  // --- Events ---
  getEvents(tenant) {
    if (!tenant) return this.data.events;
    return this.data.events.filter((e) => e.is_global || this.matchesTenant(e, tenant));
  }

  addEvent(newEvent, tenant, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can add events.');
    const event = {
      ...newEvent,
      id: 'evt-' + Date.now(),
      dept: tenant.dept,
      semester: tenant.semester,
      section: tenant.section,
      registrations: [],
    };
    const events = [...this.data.events, event];
    this.saveData({ ...this.data, events });

    const session = this.getSession();
    api.createEvent(event, session)
      .then(() => this.refreshFromBackend(session))
      .catch((e) => console.warn('[addEvent] Backend sync notice:', e.message));

    return event;
  }

  updateEvent(id, updated, tenant, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can update events.');
    const events = this.data.events.map((e) => (e.id === id ? { ...e, ...updated } : e));
    this.saveData({ ...this.data, events });

    const session = this.getSession();
    api.updateEvent(id, updated, session)
      .then(() => this.refreshFromBackend(session))
      .catch((e) => console.warn('[updateEvent] Backend sync notice:', e.message));

    return events.find((e) => e.id === id);
  }

  deleteEvent(id, tenant, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can delete events.');
    const events = this.data.events.filter((e) => e.id !== id);
    this.saveData({ ...this.data, events });

    const session = this.getSession();
    api.deleteEvent(id, session)
      .then(() => this.refreshFromBackend(session))
      .catch((e) => console.warn('[deleteEvent] Backend sync notice:', e.message));

    return true;
  }

  registerForEvent(eventId, studentDetails, tenant) {
    const event = this.data.events.find((e) => e.id === eventId);
    if (!event) return { success: false, message: 'Event not found.' };

    const regList = event.registrations || [];
    const alreadyReg = regList.find((r) => r.student_id === studentDetails.student_id);
    if (alreadyReg) {
      return { success: false, message: 'You are already registered for ' + event.name + '.' };
    }

    if (event.capacity && regList.length >= event.capacity) {
      return {
        success: false,
        message:
          'Registration full: ' +
          event.name +
          ' has reached its limit of ' +
          event.capacity +
          ' seats.',
      };
    }

    const newReg = {
      student_id: studentDetails.student_id,
      name: studentDetails.name,
      dept: tenant.dept,
      semester: tenant.semester,
      section: tenant.section,
      timestamp: new Date().toISOString(),
    };

    const events = this.data.events.map((e) => {
      if (e.id === eventId) {
        return { ...e, registrations: [...(e.registrations || []), newReg] };
      }
      return e;
    });

    this.saveData({ ...this.data, events });

    const session = this.getSession();
    api.registerForEvent(eventId, newReg, session)
      .then(() => this.refreshFromBackend(session))
      .catch((e) => console.warn('[registerForEvent] Backend sync notice:', e.message));

    return { success: true, message: 'Successfully registered for ' + event.name + '!' };
  }

  cancelEventRegistration(eventId, studentId) {
    const event = this.data.events.find((e) => e.id === eventId);
    if (!event) return { success: false, message: 'Event not found.' };

    const events = this.data.events.map((e) => {
      if (e.id === eventId) {
        return {
          ...e,
          registrations: (e.registrations || []).filter((r) => r.student_id !== studentId),
        };
      }
      return e;
    });

    this.saveData({ ...this.data, events });

    const session = this.getSession();
    api.cancelRegistration(eventId, studentId, session)
      .then(() => this.refreshFromBackend(session))
      .catch((e) => console.warn('[cancelEventRegistration] Backend sync notice:', e.message));

    return { success: true, message: 'Cancelled registration for ' + event.name + '.' };
  }

  // --- Announcements ---
  getAnnouncements(tenant) {
    if (!tenant) return this.data.announcements;
    return this.data.announcements.filter((a) => this.matchesTenant(a, tenant));
  }

  addAnnouncement(notice, tenant, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can post announcements.');
    const announcement = {
      ...notice,
      id: 'ann-' + Date.now(),
      dept: tenant.dept,
      semester: tenant.semester,
      section: tenant.section,
    };
    const announcements = [announcement, ...this.data.announcements];
    this.saveData({ ...this.data, announcements });

    const session = this.getSession();
    api.createAnnouncement(announcement, session)
      .then(() => this.refreshFromBackend(session))
      .catch((e) => console.warn('[addAnnouncement] Backend sync notice:', e.message));

    return announcement;
  }

  updateAnnouncement(id, updated, tenant, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can update announcements.');
    const announcements = this.data.announcements.map((a) => (a.id === id ? { ...a, ...updated } : a));
    this.saveData({ ...this.data, announcements });

    const session = this.getSession();
    api.updateAnnouncement(id, updated, session)
      .then(() => this.refreshFromBackend(session))
      .catch((e) => console.warn('[updateAnnouncement] Backend sync notice:', e.message));

    return announcements.find((a) => a.id === id);
  }

  deleteAnnouncement(id, tenant, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can delete announcements.');
    const announcements = this.data.announcements.filter((a) => a.id !== id);
    this.saveData({ ...this.data, announcements });

    const session = this.getSession();
    api.deleteAnnouncement(id, session)
      .then(() => this.refreshFromBackend(session))
      .catch((e) => console.warn('[deleteAnnouncement] Backend sync notice:', e.message));

    return true;
  }

  // --- Assignments ---
  getAssignments(tenant) {
    if (!tenant) return this.data.assignments;
    return this.data.assignments.filter((a) => this.matchesTenant(a, tenant));
  }

  addAssignment(task, tenant, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can create assignments.');
    const assignment = {
      ...task,
      id: 'asg-' + Date.now(),
      dept: tenant.dept,
      semester: tenant.semester,
      section: tenant.section,
    };
    const assignments = [...this.data.assignments, assignment];
    this.saveData({ ...this.data, assignments });

    const session = this.getSession();
    api.createAssignment(assignment, session)
      .then(() => this.refreshFromBackend(session))
      .catch((e) => console.warn('[addAssignment] Backend sync notice:', e.message));

    return assignment;
  }

  updateAssignment(id, updated, tenant, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can update assignments.');
    const assignments = this.data.assignments.map((a) => (a.id === id ? { ...a, ...updated } : a));
    this.saveData({ ...this.data, assignments });

    const session = this.getSession();
    api.updateAssignment(id, updated, session)
      .then(() => this.refreshFromBackend(session))
      .catch((e) => console.warn('[updateAssignment] Backend sync notice:', e.message));

    return assignments.find((a) => a.id === id);
  }

  deleteAssignment(id, tenant, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can delete assignments.');
    const assignments = this.data.assignments.filter((a) => a.id !== id);
    this.saveData({ ...this.data, assignments });

    const session = this.getSession();
    api.deleteAssignment(id, session)
      .then(() => this.refreshFromBackend(session))
      .catch((e) => console.warn('[deleteAssignment] Backend sync notice:', e.message));

    return true;
  }

  // --- Agent Config ---
  getAgentConfig(tenant) {
    try {
      const stored = localStorage.getItem(AGENT_CONFIG_KEY);
      if (stored) {
        const configs = JSON.parse(stored);
        const key = tenant.dept + '_' + tenant.semester + '_' + tenant.section;
        if (configs[key]) return configs[key];
      }
    } catch (e) {}

    return {
      dept: tenant.dept,
      semester: tenant.semester,
      section: tenant.section,
      api_base_url: 'https://api.openai.com/v1',
      api_key: 'sk-demo-key-encrypted',
      model_name: 'gemini-2.5-flash',
      system_prompt: DEFAULT_AGENT_SYSTEM_PROMPT.replace('{dept}', tenant.dept)
        .replace('{semester}', tenant.semester)
        .replace('{section}', tenant.section),
      updated_at: new Date().toISOString(),
    };
  }

  saveAgentConfig(tenant, config, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can configure the AI Agent.');
    try {
      const stored = localStorage.getItem(AGENT_CONFIG_KEY);
      const configs = stored ? JSON.parse(stored) : {};
      const key = tenant.dept + '_' + tenant.semester + '_' + tenant.section;
      configs[key] = {
        ...config,
        dept: tenant.dept,
        semester: tenant.semester,
        section: tenant.section,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(AGENT_CONFIG_KEY, JSON.stringify(configs));

      const session = this.getSession();
      api.updateAgentConfig(
        {
          api_base_url: config.api_base_url,
          api_key: config.api_key,
          model_name: config.model_name,
          system_prompt: config.system_prompt,
        },
        session
      ).catch((e) => console.warn('[saveAgentConfig] Backend sync notice:', e.message));

      return configs[key];
    } catch (e) {
      console.error('Failed to save agent config:', e);
      return config;
    }
  }

  resetAgentConfig(tenant, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can reset agent config.');
    const defaultConfig = {
      dept: tenant.dept,
      semester: tenant.semester,
      section: tenant.section,
      api_base_url: 'https://api.openai.com/v1',
      api_key: 'sk-demo-key-encrypted',
      model_name: 'gemini-2.5-flash',
      system_prompt: DEFAULT_AGENT_SYSTEM_PROMPT.replace('{dept}', tenant.dept)
        .replace('{semester}', tenant.semester)
        .replace('{section}', tenant.section),
      updated_at: new Date().toISOString(),
    };
    return this.saveAgentConfig(tenant, defaultConfig, role);
  }

  // --- Reset to seed ---
  resetToSeed() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = generateSeedData();
    this.saveData(this.data);
    this.notify();
    return this.data;
  }
}

export const dataService = new DataService();
