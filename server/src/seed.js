import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './db.js';
import {
  Schedule, Room, Booking, Event, Registration, Announcement, Assignment,
  AdminCredentials, AgentConfig,
} from './models/index.js';
import { hashPassword } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// data/ lives at the repo root: server/src/seed.js -> ../../data
const DATA_DIR = path.resolve(__dirname, '../../data');

function load(file) {
  const full = path.join(DATA_DIR, file);
  const raw = fs.readFileSync(full, 'utf-8');
  const parsed = JSON.parse(raw);
  // tolerate either a bare array or { <key>: [...] }
  if (Array.isArray(parsed)) return parsed;
  const firstArray = Object.values(parsed).find(Array.isArray);
  return firstArray || [];
}

// Helper to infer dept and semester from course code, e.g. "CSE 4113" -> { dept: 'CSE', semester: '4.1' }
function parseCourse(courseCode) {
  if (!courseCode) return { dept: 'CSE', semester: '4.1' };
  const parts = courseCode.trim().split(/\s+/);
  const dept = parts[0] || 'CSE';
  let semester = '4.1';
  if (parts[1] && parts[1].length >= 2) {
    const y = parts[1][0];
    const t = parts[1][1];
    semester = `${y}.${t}`;
  }
  return { dept, semester };
}

async function run() {
  await connectDB();

  console.log('[seed] clearing collections...');
  await Promise.all([
    Schedule.deleteMany({}), Room.deleteMany({}), Booking.deleteMany({}),
    Event.deleteMany({}), Registration.deleteMany({}),
    Announcement.deleteMany({}), Assignment.deleteMany({}),
    AdminCredentials.deleteMany({}), AgentConfig.deleteMany({}),
  ]);

  // --- Schedules ---
  const schedulesRaw = load('schedules.json');
  const schedules = schedulesRaw.map(s => {
    const { dept, semester } = parseCourse(s.course);
    return {
      ...s,
      _id: s.id,
      dept,
      semester,
      section: s.section || 'B',
    };
  });
  await Schedule.insertMany(schedules.map(({ id, ...r }) => r), { ordered: false });
  console.log(`[seed] schedules: ${schedules.length}`);

  // --- Rooms + flattened Bookings ---
  const roomsRaw = load('rooms.json');
  const rooms = [];
  const bookings = [];
  for (const r of roomsRaw) {
    const { id, bookings: bk = [], ...rest } = r;
    rooms.push({ _id: id, ...rest });
    for (const b of bk) {
      const { booking_id, ...brest } = b;
      bookings.push({
        _id: booking_id,
        room_number: r.room_number,
        dept: 'CSE',
        semester: '4.1',
        section: 'B',
        ...brest,
      });
    }
  }
  await Room.insertMany(rooms, { ordered: false });
  if (bookings.length) await Booking.insertMany(bookings, { ordered: false });
  console.log(`[seed] rooms: ${rooms.length}, bookings: ${bookings.length}`);

  // --- Events + flattened Registrations ---
  const eventsRaw = load('events.json');
  const events = [];
  const registrations = [];
  for (const e of eventsRaw) {
    const { id, registrations: regs = [], registered, ...rest } = e;
    events.push({
      _id: id,
      dept: 'CSE',
      semester: '4.1',
      section: 'B',
      is_global: true, // Campus events default to global visibility
      ...rest,
    });
    for (const g of regs) {
      registrations.push({
        _id: `${id}:${g.student_id}`,
        event_id: id,
        student_id: g.student_id,
        name: g.name,
        dept: 'CSE',
        semester: '4.1',
        section: 'B',
      });
    }
  }
  await Event.insertMany(events, { ordered: false });
  if (registrations.length) await Registration.insertMany(registrations, { ordered: false });
  console.log(`[seed] events: ${events.length}, registrations: ${registrations.length}`);

  // --- Announcements ---
  const announcements = load('announcements.json').map(a => {
    const { id, ...rest } = a;
    return {
      _id: id,
      dept: 'CSE',
      semester: '4.1',
      section: 'B',
      is_global: ['ann-003', 'ann-004'].includes(id), // General announcements are global
      ...rest,
    };
  });
  await Announcement.insertMany(announcements, { ordered: false });
  console.log(`[seed] announcements: ${announcements.length}`);

  // --- Assignments ---
  const assignments = load('assignments.json').map(a => {
    const { id, ...rest } = a;
    const { dept, semester } = parseCourse(a.course);
    return {
      _id: id,
      dept,
      semester,
      section: 'B',
      ...rest,
    };
  });
  await Assignment.insertMany(assignments, { ordered: false });
  console.log(`[seed] assignments: ${assignments.length}`);

  // --- Admin Credentials (one row per section) ---
  const defaultAdminPass = hashPassword('admin123');
  const adminSections = [
    { dept: 'CSE', semester: '4.1', section: 'B' },
    { dept: 'CSE', semester: '4.1', section: 'A' },
    { dept: 'CSE', semester: '4.1', section: 'C' },
    { dept: 'CSE', semester: '3.2', section: 'A' },
    { dept: 'CSE', semester: '3.2', section: 'B' },
    { dept: 'EEE', semester: '4.1', section: 'A' },
    { dept: 'BBA', semester: '1.1', section: 'A' },
  ];

  const adminDocs = adminSections.map(s => ({
    _id: `${s.dept}:${s.semester}:${s.section}`,
    dept: s.dept,
    semester: s.semester,
    section: s.section,
    password_hash: defaultAdminPass,
  }));

  await AdminCredentials.insertMany(adminDocs, { ordered: false });
  console.log('[seed] done.');
  return true;
}

export { run as runSeed };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  run().then(() => process.exit(0)).catch(err => {
    console.error('[seed] failed:', err);
    process.exit(1);
  });
}
