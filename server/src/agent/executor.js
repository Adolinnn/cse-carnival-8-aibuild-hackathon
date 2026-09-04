import { nanoid } from 'nanoid';
import {
  Schedule, Room, Booking, Event, Registration, Announcement, Assignment,
} from '../models/index.js';
import {
  listSchedules, listAssignments, listAnnouncements, listEvents,
  getRoom, findAvailableRooms, bookRoom, cancelBooking,
  registerForEvent, cancelRegistration,
} from '../services/campus.js';

function student(contextUser) {
  return {
    id: contextUser?.student_id || process.env.CAMPUS_STUDENT_ID || '20-40532',
    name: contextUser?.student_name || process.env.CAMPUS_STUDENT_NAME || 'Sakibul Hassan',
    dept: contextUser?.dept || process.env.CAMPUS_DEPT || 'CSE',
    semester: contextUser?.semester || process.env.CAMPUS_SEMESTER || '4.1',
    section: contextUser?.section || process.env.CAMPUS_STUDENT_SECTION || 'B',
  };
}

function nowContext(contextUser) {
  const s = student(contextUser);
  const iso = process.env.CAMPUS_NOW;
  const d = iso ? new Date(iso) : new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const pad = n => String(n).padStart(2, '0');
  return {
    today: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    day_of_week: days[d.getDay()],
    current_time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    student: s,
    tenant: { dept: s.dept, semester: s.semester, section: s.section },
    note: 'University week runs Sunday-Thursday; Friday and Saturday are weekends.',
  };
}

const SYSTEM_MODELS = {
  schedules: { model: Schedule, prefix: 'sch' },
  assignments: { model: Assignment, prefix: 'asgn' },
  announcements: { model: Announcement, prefix: 'ann' },
  events: { model: Event, prefix: 'evt' },
  rooms: { model: Room, prefix: 'room' },
};

// Executes a single tool call scoped to the caller's tenant triplet and role
export async function runTool(name, args = {}, context = {}) {
  try {
    const s = student(context.user);
    const tenant = context.tenant || { dept: s.dept, semester: s.semester, section: s.section };
    const isAdmin = context.user?.role === 'admin';

    switch (name) {
      case 'get_current_context':
        return nowContext(context.user);
      case 'list_schedules':
        return { results: await listSchedules({ ...args, dept: tenant.dept, semester: tenant.semester, section: args.section || tenant.section }) };
      case 'list_assignments':
        return { results: await listAssignments({ ...args, dept: tenant.dept, semester: tenant.semester, section: tenant.section }) };
      case 'list_announcements':
        return { results: await listAnnouncements({ ...args, today: nowContext(context.user).today, dept: tenant.dept, semester: tenant.semester, section: tenant.section }) };
      case 'list_events':
        return { results: await listEvents({ ...args, dept: tenant.dept, semester: tenant.semester, section: tenant.section }) };
      case 'get_room': {
        const room = await getRoom(args.room_number);
        return room || { error: `Room ${args.room_number} not found.` };
      }
      case 'find_available_rooms':
        return { results: await findAvailableRooms(args) };
      case 'book_room':
        return bookRoom({
          ...args,
          booked_by: s.name,
          dept: tenant.dept,
          semester: tenant.semester,
          section: tenant.section,
        });
      case 'cancel_booking':
        return cancelBooking({
          booking_id: args.booking_id,
          requested_by: s.name,
          role: context.user?.role || 'student',
          tenant,
        });
      case 'register_for_event':
        return registerForEvent({
          event_id: args.event_id,
          student_id: s.id,
          name: s.name,
          dept: tenant.dept,
          semester: tenant.semester,
          section: tenant.section,
        });
      case 'cancel_registration':
        return cancelRegistration({
          event_id: args.event_id,
          student_id: s.id,
        });

      // Admin CRUD Tools
      case 'create_record': {
        if (!isAdmin) return { error: 'Admin permission required to create records.' };
        const mapping = SYSTEM_MODELS[args.system];
        if (!mapping) return { error: `Unknown system: ${args.system}` };
        const doc = { ...args.data };
        if (!doc._id) doc._id = `${mapping.prefix}-${nanoid(6)}`;
        if (args.system !== 'rooms') {
          if (!doc.dept) doc.dept = tenant.dept;
          if (!doc.semester) doc.semester = tenant.semester;
          if (!doc.section) doc.section = tenant.section;
        }
        const created = await mapping.model.create(doc);
        return { ok: true, created: created.toObject() };
      }

      case 'update_record': {
        if (!isAdmin) return { error: 'Admin permission required to update records.' };
        const mapping = SYSTEM_MODELS[args.system];
        if (!mapping) return { error: `Unknown system: ${args.system}` };
        const updated = await mapping.model.findByIdAndUpdate(args.id, args.data, { new: true }).lean();
        if (!updated) return { error: `Record with id ${args.id} not found.` };
        return { ok: true, updated };
      }

      case 'delete_record': {
        if (!isAdmin) return { error: 'Admin permission required to delete records.' };
        const mapping = SYSTEM_MODELS[args.system];
        if (!mapping) return { error: `Unknown system: ${args.system}` };
        const deleted = await mapping.model.findByIdAndDelete(args.id).lean();
        if (!deleted) return { error: `Record with id ${args.id} not found.` };
        return { ok: true, deleted };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { error: e.message || String(e) };
  }
}
