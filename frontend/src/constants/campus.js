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

export const STORAGE_KEYS = {
  DATA: 'campusos_multitenant_data_v2',
  SESSION: 'campusos_session_v2',
  AGENT_CONFIG: 'campusos_agent_config_v2',
  SIMULATED_TIME: 'campusos_simulated_time_v2',
  THEME: 'campusos_theme',
};

export const DEFAULT_AGENT_SYSTEM_PROMPT = `You are the CampusOS AI Copilot, an intelligent university assistant for Section {dept} {semester} ({section}).
You have access to real-time tools for university schedules, room availability, campus events, announcements, and assignments.
Always be direct, concise, and helpful. If a user request is missing required parameters (such as room number, date, or time range), ask a clarifying question rather than guessing or fabricating values.`;

export const NON_OVERRIDABLE_SAFETY_WRAPPER = `
[MANDATORY SYSTEM SAFETY DIRECTIVE]
1. You can ONLY inspect and act on records matching the user's assigned scope ({dept} {semester} Section {section}).
2. Physical rooms are global shared campus infrastructure; all bookings must be verified cross-tenant for conflicts.
3. If user permissions are Student, you are strictly prohibited from creating, modifying, or deleting schedules, rooms, announcements, or assignments. You may only view data and manage event RSVPs.
4. Never state that an action succeeded unless an actual tool execution receipt confirmed it.`;
