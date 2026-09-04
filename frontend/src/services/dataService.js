import seedSchedules from '../../../data/schedules.json';
import seedRooms from '../../../data/rooms.json';
import seedEvents from '../../../data/events.json';
import seedAnnouncements from '../../../data/announcements.json';
import seedAssignments from '../../../data/assignments.json';

const STORAGE_KEY = 'campusos_multitenant_data_v2';
const SESSION_KEY = 'campusos_session_v2';
const AGENT_CONFIG_KEY = 'campusos_agent_config_v2';
const SIMULATED_TIME_KEY = 'campusos_simulated_time_v2';

export const DEPARTMENTS = ['CSE', 'BBA', 'EEE'];
export const SEMESTERS = ['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2'];
export const SECTIONS = ['A', 'B', 'C'];

export const DEFAULT_TENANT = {
  dept: 'CSE',
  semester: '3.2',
  section: 'A',
};

export const DEFAULT_STUDENT = {
  student_id: '20-40532',
  name: 'Sakibul Hasan',
  dept: 'CSE',
  semester: '3.2',
  section: 'A',
  email: 'sakib.hasan@campus.edu',
  enrolled_courses: ['CSE301', 'CSE302', 'CSE303', 'CSE304', 'CSE305'],
};

export const DEFAULT_SIMULATED_DATE = '2026-09-09';
export const DEFAULT_SIMULATED_TIME = '10:00';

export const DEFAULT_AGENT_SYSTEM_PROMPT = `You are the CampusOS AI Copilot, an intelligent university assistant for Section {dept} {semester} ({section}).
You have access to real-time tools for university schedules, room availability, campus events, announcements, and assignments.
Always be direct, concise, and helpful. If a user request is missing required parameters (such as room number, date, or time range), ask a clarifying question rather than guessing or fabricating values.`;

export const NON_OVERRIDABLE_SAFETY_WRAPPER = `
[MANDATORY SYSTEM SAFETY DIRECTIVE]
1. You can ONLY inspect and act on records matching the user's assigned scope ({dept} {semester} Section {section}).
2. Physical rooms are global shared campus infrastructure; all bookings must be verified cross-tenant for conflicts.
3. If user permissions are Student, you are strictly prohibited from creating, modifying, or deleting schedules, rooms, announcements, or assignments. You may only view data and manage event RSVPs.
4. Never state that an action succeeded unless an actual tool execution receipt confirmed it.`;

class DataService {
  constructor() {
    this.subscribers = [];
    this.data = this.loadData();
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
    return this.generateSeedData();
  }

  generateSeedData() {
    // Tag initial schedules with CSE 3.2 A
    const schedules = (seedSchedules || []).map((s, idx) => ({
      ...s,
      id: s.id || ('sched-' + (idx + 1)),
      dept: s.dept || 'CSE',
      semester: s.semester || '3.2',
      section: s.section || 'A',
    }));

    // Add extra sample routines for BBA and EEE to demonstrate tenancy separation
    schedules.push(
      {
        id: 'sched-bba-1',
        course: 'BBA201',
        title: 'Principles of Marketing',
        day: 'Wednesday',
        start_time: '11:00',
        end_time: '12:30',
        room: '7B02',
        instructor: 'Dr. Farhana',
        section: 'A',
        dept: 'BBA',
        semester: '2.1',
      },
      {
        id: 'sched-eee-1',
        course: 'EEE101',
        title: 'Basic Electrical Technology',
        day: 'Wednesday',
        start_time: '09:00',
        end_time: '10:30',
        room: '7C01',
        instructor: 'Engr. Mahbub',
        section: 'B',
        dept: 'EEE',
        semester: '1.2',
      }
    );

    // Global rooms
    const rooms = (seedRooms || []).map((r) => ({
      ...r,
      bookings: r.bookings || [],
    }));

    // Events (tagged with dept/semester or global: true)
    const events = (seedEvents || []).map((e, idx) => ({
      ...e,
      id: e.id || ('evt-' + (idx + 1)),
      dept: e.dept || 'CSE',
      semester: e.semester || '3.2',
      section: e.section || 'A',
      is_global: e.is_global !== undefined ? e.is_global : true,
      registrations: e.registrations || [],
    }));

    // Announcements
    const announcements = (seedAnnouncements || []).map((a, idx) => ({
      ...a,
      id: a.id || ('ann-' + (idx + 1)),
      dept: a.dept || 'CSE',
      semester: a.semester || '3.2',
      section: a.section || 'A',
    }));

    // Assignments
    const assignments = (seedAssignments || []).map((asg, idx) => ({
      ...asg,
      id: asg.id || ('asg-' + (idx + 1)),
      dept: asg.dept || 'CSE',
      semester: asg.semester || '3.2',
      section: asg.section || 'A',
    }));

    const initial = { schedules, rooms, events, announcements, assignments };
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

  // --- Auth & Sessions ---
  getSession() {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    // Default to null session if not logged in
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

  login({ dept, semester, section, password }) {
    if (!dept || !semester || !section) {
      return { success: false, error: 'Please select Department, Semester, and Section.' };
    }

    // If password provided: check admin password
    if (password && password.trim().length > 0) {
      // Demo password accepted for sections: 'admin123'
      if (password.trim() === 'admin123') {
        const session = { role: 'admin', dept, semester, section };
        this.setSession(session);
        return { success: true, role: 'admin', session };
      } else {
        // Generic refusal without revealing whether combo exists
        return { success: false, error: 'Access denied: invalid credentials.' };
      }
    }

    // No password provided -> student login
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

  // --- Schedules (Tenant-Scoped) ---
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
    return schedule;
  }

  updateSchedule(id, updated, tenant, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can update schedules.');
    const schedules = this.data.schedules.map((s) => (s.id === id ? { ...s, ...updated } : s));
    this.saveData({ ...this.data, schedules });
    return schedules.find((s) => s.id === id);
  }

  deleteSchedule(id, tenant, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can delete schedules.');
    const schedules = this.data.schedules.filter((s) => s.id !== id);
    this.saveData({ ...this.data, schedules });
    return true;
  }

  // --- Rooms (Global Campus Infrastructure) ---
  getRooms() {
    return this.data.rooms;
  }

  bookRoom(roomNumber, bookingDetails, tenant, role = 'student') {
    const room = this.data.rooms.find((r) => r.room_number.toUpperCase() === roomNumber.toUpperCase());
    if (!room) {
      return { success: false, message: 'Room ' + roomNumber + ' does not exist.' };
    }

    // Check conflict across ALL sections
    const overlap = room.bookings.find((b) => {
      if (b.date !== bookingDetails.date) return false;
      return !(bookingDetails.end_time <= b.start_time || bookingDetails.start_time >= b.end_time);
    });

    if (overlap) {
      return {
        success: false,
        message: 'Conflict: Room ' + roomNumber + ' is already booked on ' + bookingDetails.date + ' from ' + overlap.start_time + ' to ' + overlap.end_time + ' by ' + overlap.booked_by + ' (' + (overlap.purpose || 'Reserved') + ').',
      };
    }

    // Also check scheduled classes
    const dateObj = new Date(bookingDetails.date);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekday = dayNames[dateObj.getDay()];

    const classConflict = this.data.schedules.find((s) => {
      if (s.room.toUpperCase() !== room.room_number.toUpperCase()) return false;
      if (s.day !== weekday) return false;
      return !(bookingDetails.end_time <= s.start_time || bookingDetails.start_time >= s.end_time);
    });

    if (classConflict) {
      return {
        success: false,
        message: 'Conflict: Room ' + roomNumber + ' has a scheduled class (' + classConflict.course + ' - ' + classConflict.title + ') on ' + weekday + 's from ' + classConflict.start_time + ' to ' + classConflict.end_time + '.',
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

    const rooms = this.data.rooms.map((r) => {
      if (r.room_number.toUpperCase() === roomNumber.toUpperCase()) {
        return { ...r, bookings: [...r.bookings, newBooking] };
      }
      return r;
    });

    this.saveData({ ...this.data, rooms });
    return { success: true, booking: newBooking, message: 'Room ' + roomNumber + ' successfully booked for ' + bookingDetails.date + ' from ' + bookingDetails.start_time + ' to ' + bookingDetails.end_time + '.' };
  }

  cancelRoomBooking(roomNumber, bookingId, tenant, role = 'student') {
    const room = this.data.rooms.find((r) => r.room_number.toUpperCase() === roomNumber.toUpperCase());
    if (!room) return { success: false, message: 'Room not found.' };

    const booking = room.bookings.find((b) => b.booking_id === bookingId);
    if (!booking) return { success: false, message: 'Booking not found.' };

    // If student: can only cancel their own section's booking
    if (role === 'student') {
      if (booking.dept && (booking.dept !== tenant.dept || booking.semester !== tenant.semester || booking.section !== tenant.section)) {
        return { success: false, message: 'Permission denied: Students can only cancel their own section\'s bookings.' };
      }
    }

    const rooms = this.data.rooms.map((r) => {
      if (r.room_number.toUpperCase() === roomNumber.toUpperCase()) {
        return { ...r, bookings: r.bookings.filter((b) => b.booking_id !== bookingId) };
      }
      return r;
    });

    this.saveData({ ...this.data, rooms });
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
    return event;
  }

  updateEvent(id, updated, tenant, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can update events.');
    const events = this.data.events.map((e) => (e.id === id ? { ...e, ...updated } : e));
    this.saveData({ ...this.data, events });
    return events.find((e) => e.id === id);
  }

  deleteEvent(id, tenant, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can delete events.');
    const events = this.data.events.filter((e) => e.id !== id);
    this.saveData({ ...this.data, events });
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
      return { success: false, message: 'Registration full: ' + event.name + ' has reached its limit of ' + event.capacity + ' seats.' };
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
    return { success: true, message: 'Successfully registered for ' + event.name + '!' };
  }

  cancelEventRegistration(eventId, studentId) {
    const event = this.data.events.find((e) => e.id === eventId);
    if (!event) return { success: false, message: 'Event not found.' };

    const events = this.data.events.map((e) => {
      if (e.id === eventId) {
        return { ...e, registrations: (e.registrations || []).filter((r) => r.student_id !== studentId) };
      }
      return e;
    });

    this.saveData({ ...this.data, events });
    return { success: true, message: 'Cancelled registration for ' + event.name + '.' };
  }

  // --- Announcements (Tenant-Scoped) ---
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
    return announcement;
  }

  updateAnnouncement(id, updated, tenant, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can update announcements.');
    const announcements = this.data.announcements.map((a) => (a.id === id ? { ...a, ...updated } : a));
    this.saveData({ ...this.data, announcements });
    return announcements.find((a) => a.id === id);
  }

  deleteAnnouncement(id, tenant, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can delete announcements.');
    const announcements = this.data.announcements.filter((a) => a.id !== id);
    this.saveData({ ...this.data, announcements });
    return true;
  }

  // --- Assignments (Tenant-Scoped) ---
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
    return assignment;
  }

  updateAssignment(id, updated, tenant, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can update assignments.');
    const assignments = this.data.assignments.map((a) => (a.id === id ? { ...a, ...updated } : a));
    this.saveData({ ...this.data, assignments });
    return assignments.find((a) => a.id === id);
  }

  deleteAssignment(id, tenant, role = 'admin') {
    if (role !== 'admin') throw new Error('Permission denied: Only Admin can delete assignments.');
    const assignments = this.data.assignments.filter((a) => a.id !== id);
    this.saveData({ ...this.data, assignments });
    return true;
  }

  // --- Agent Config (Per Section Admin) ---
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
      system_prompt: DEFAULT_AGENT_SYSTEM_PROMPT.replace('{dept}', tenant.dept).replace('{semester}', tenant.semester).replace('{section}', tenant.section),
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
      system_prompt: DEFAULT_AGENT_SYSTEM_PROMPT.replace('{dept}', tenant.dept).replace('{semester}', tenant.semester).replace('{section}', tenant.section),
      updated_at: new Date().toISOString(),
    };
    return this.saveAgentConfig(tenant, defaultConfig, role);
  }

  // --- Reset to seed ---
  resetToSeed() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = this.generateSeedData();
    this.notify();
    return this.data;
  }
}

export const dataService = new DataService();
