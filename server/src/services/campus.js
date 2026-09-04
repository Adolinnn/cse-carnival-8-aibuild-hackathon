import { nanoid } from 'nanoid';
import {
  Schedule, Room, Booking, Event, Registration, Announcement, Assignment,
} from '../models/index.js';

// ---------- helpers ----------
export function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

export function getWeekday(dateString) {
  if (!dateString) return '';
  const parts = String(dateString).trim().split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dt.getUTCDay()];
  }
  return '';
}

// Normalize equipment input (handles array, string, comma-separated string)
function normalizeEquipment(equipment) {
  if (Array.isArray(equipment)) return equipment.map(e => String(e).trim()).filter(Boolean);
  if (typeof equipment === 'string') {
    return equipment.split(',').map(e => e.trim()).filter(Boolean);
  }
  return [];
}

// ---------- read queries ----------
export async function listSchedules({ day, course, section, after_time, dept, semester } = {}) {
  const q = {};
  if (day) q.day = new RegExp(`^${day.trim()}$`, 'i');
  if (course) q.course = new RegExp(course.trim(), 'i');
  if (section) q.section = new RegExp(`^${section.trim()}`, 'i');
  if (dept) q.dept = new RegExp(`^${dept.trim()}$`, 'i');
  if (semester) q.semester = String(semester).trim();

  let rows = await Schedule.find(q).lean();
  if (after_time) rows = rows.filter(r => r.start_time >= after_time);
  return rows.sort((a, b) =>
    (a.day || '').localeCompare(b.day || '') || (a.start_time || '').localeCompare(b.start_time || ''));
}

export async function listAssignments({ status, course, deadline_from, deadline_to, dept, semester, section } = {}) {
  const q = {};
  if (status) q.status = new RegExp(`^${status.trim()}$`, 'i');
  if (course) q.course = new RegExp(course.trim(), 'i');
  if (dept) q.dept = new RegExp(`^${dept.trim()}$`, 'i');
  if (semester) q.semester = String(semester).trim();
  if (section) q.section = new RegExp(`^${section.trim()}`, 'i');

  if (deadline_from || deadline_to) {
    q.deadline = {};
    if (deadline_from) q.deadline.$gte = deadline_from;
    if (deadline_to) q.deadline.$lte = deadline_to;
  }
  return Assignment.find(q).sort({ deadline: 1 }).lean();
}

export async function listAnnouncements({ priority, active_only, today, dept, semester, section } = {}) {
  const q = {};
  if (priority) q.priority = new RegExp(`^${priority.trim()}$`, 'i');
  if (active_only && today) q.expires = { $gte: today };

  if (dept || semester || section) {
    const orConds = [{ is_global: true }, { is_global: { $exists: false } }];
    const tenantCond = {};
    if (dept) tenantCond.dept = new RegExp(`^${dept.trim()}$`, 'i');
    if (semester) tenantCond.semester = String(semester).trim();
    if (section) tenantCond.section = new RegExp(`^${section.trim()}`, 'i');
    orConds.push(tenantCond);
    q.$or = orConds;
  }

  return Announcement.find(q).sort({ date: -1 }).lean();
}

export async function listEvents({ date_from, date_to, status, dept, semester, section } = {}) {
  const q = {};
  if (status) q.status = new RegExp(`^${status.trim()}$`, 'i');
  if (date_from || date_to) {
    q.date = {};
    if (date_from) q.date.$gte = date_from;
    if (date_to) q.date.$lte = date_to;
  }

  if (dept || semester || section) {
    const orConds = [{ is_global: true }, { is_global: { $exists: false } }];
    const tenantCond = {};
    if (dept) tenantCond.dept = new RegExp(`^${dept.trim()}$`, 'i');
    if (semester) tenantCond.semester = String(semester).trim();
    if (section) tenantCond.section = new RegExp(`^${section.trim()}`, 'i');
    orConds.push(tenantCond);
    q.$or = orConds;
  }

  const events = await Event.find(q).sort({ date: 1, start_time: 1 }).lean();
  // attach live registration counts
  const counts = await Registration.aggregate([
    { $group: { _id: '$event_id', n: { $sum: 1 } } },
  ]);
  const byId = Object.fromEntries(counts.map(c => [c._id, c.n]));
  return events.map(e => ({ ...e, registered: byId[e._id] || 0 }));
}

// Global Physical Room lookup
export async function getRoom(room_number) {
  if (!room_number) return null;
  const room = await Room.findOne({ room_number: new RegExp(`^${room_number.trim()}$`, 'i') }).lean();
  if (!room) return null;
  const bookings = await Booking.find({ room_number: room.room_number }).sort({ date: 1, start_time: 1 }).lean();
  return { ...room, bookings };
}

// Available rooms lookup (checks against global physical room bookings)
export async function findAvailableRooms({
  date, start_time, end_time, min_capacity, equipment = [], type,
}) {
  if (!date || !start_time || !end_time) return [];
  if (start_time >= end_time) return [];

  const q = { status: 'available' };
  if (min_capacity) q.capacity = { $gte: Number(min_capacity) };
  if (type) q.type = new RegExp(`^${type.trim()}$`, 'i');
  
  const eqList = normalizeEquipment(equipment);
  if (eqList.length > 0) {
    q.equipment = { $all: eqList };
  }
  const rooms = await Room.find(q).lean();

  const clashingBookings = await Booking.find({
    date,
    start_time: { $lt: end_time },
    end_time: { $gt: start_time },
  }).distinct('room_number');

  const weekday = getWeekday(date);
  let clashingClasses = [];
  if (weekday) {
    clashingClasses = await Schedule.find({
      day: new RegExp(`^${weekday}$`, 'i'),
      start_time: { $lt: end_time },
      end_time: { $gt: start_time },
    }).distinct('room');
  }

  const busy = new Set([
    ...clashingBookings.map(r => String(r).toUpperCase()),
    ...clashingClasses.map(r => String(r).toUpperCase()),
  ]);

  return rooms.filter(r => !busy.has(String(r.room_number).toUpperCase()))
    .sort((a, b) => a.capacity - b.capacity);
}

// ---------- write actions ----------
export async function bookRoom({
  room_number, date, start_time, end_time, booked_by, purpose,
  dept = 'CSE', semester = '4.1', section = 'B',
}) {
  if (!room_number || !date || !start_time || !end_time) {
    return { ok: false, reason: 'Room number, date, start time, and end time are required.' };
  }
  if (start_time >= end_time) {
    return { ok: false, reason: `Start time (${start_time}) must be earlier than end time (${end_time}).` };
  }
  if (start_time < '06:00' || end_time > '18:00') {
    return { ok: false, reason: 'Room bookings are only allowed between 6:00 AM and 6:00 PM.' };
  }

  const cleanRoomNumber = String(room_number).trim().toUpperCase();
  const room = await Room.findOne({ room_number: new RegExp(`^${cleanRoomNumber}$`, 'i') }).lean();
  if (!room) return { ok: false, reason: `Room ${room_number} does not exist.` };
  if (room.status !== 'available')
    return { ok: false, reason: `Room ${room.room_number} is marked unavailable.` };

  // 1. Conflict check: Existing room bookings
  const clash = await Booking.findOne({
    room_number: room.room_number, date,
    start_time: { $lt: end_time },
    end_time: { $gt: start_time },
  }).lean();
  if (clash) {
    return {
      ok: false,
      reason: `Conflict: Room ${room.room_number} is already booked on ${date} from ${clash.start_time} to ${clash.end_time} (${clash.purpose || 'Reserved by ' + clash.booked_by}).`,
    };
  }

  // 2. Conflict check: Scheduled university classes in this room on that weekday
  const weekday = getWeekday(date);
  if (weekday) {
    const classClash = await Schedule.findOne({
      room: new RegExp(`^${cleanRoomNumber}$`, 'i'),
      day: new RegExp(`^${weekday}$`, 'i'),
      start_time: { $lt: end_time },
      end_time: { $gt: start_time },
    }).lean();

    if (classClash) {
      return {
        ok: false,
        reason: `Conflict: Room ${room.room_number} has a scheduled class (${classClash.course} - ${classClash.title || 'Class'}) on ${weekday} from ${classClash.start_time} to ${classClash.end_time}.`,
      };
    }
  }

  const booking = await Booking.create({
    _id: `bk-${nanoid(6)}`,
    room_number: room.room_number, date, start_time, end_time,
    booked_by: booked_by || 'Unknown',
    purpose: purpose || 'N/A',
    dept, semester, section,
  });
  return { ok: true, booking: booking.toObject() };
}

export async function cancelBooking({ booking_id, requested_by, role = 'student', tenant = {} }) {
  if (!booking_id) return { ok: false, reason: 'Booking ID is required.' };
  const booking = await Booking.findById(booking_id).lean();
  if (!booking) return { ok: false, reason: `No booking with id ${booking_id}.` };

  // Admin of that tenant or the person who booked it can cancel
  if (role !== 'admin' && requested_by && booking.booked_by !== requested_by) {
    return { ok: false, reason: `That booking was made by ${booking.booked_by}, not you. You can only cancel your own bookings.` };
  }
  await Booking.deleteOne({ _id: booking_id });
  return { ok: true, cancelled: booking };
}

export async function registerForEvent({
  event_id, student_id, name, dept = 'CSE', semester = '4.1', section = 'B',
}) {
  if (!event_id || !student_id) {
    return { ok: false, reason: 'Event ID and Student ID are required.' };
  }
  const event = await Event.findById(event_id).lean();
  if (!event) return { ok: false, reason: `No event with id ${event_id}.` };
  if (['cancelled', 'completed'].includes(event.status))
    return { ok: false, reason: `Event "${event.name}" is ${event.status}; registration is closed.` };

  const existing = await Registration.findById(`${event_id}:${student_id}`).lean();
  if (existing) return { ok: false, reason: `You are already registered for "${event.name}".` };

  const count = await Registration.countDocuments({ event_id });
  if (event.capacity && count >= event.capacity)
    return { ok: false, reason: `"${event.name}" is full (${count}/${event.capacity}).` };

  await Registration.create({
    _id: `${event_id}:${student_id}`,
    event_id, student_id, name: name || 'Student',
    dept, semester, section,
  });
  return { ok: true, event: event.name, registered: count + 1, capacity: event.capacity };
}

export async function cancelRegistration({ event_id, student_id }) {
  if (!event_id || !student_id) {
    return { ok: false, reason: 'Event ID and Student ID are required.' };
  }
  const id = `${event_id}:${student_id}`;
  const reg = await Registration.findById(id).lean();
  if (!reg) return { ok: false, reason: `You are not registered for that event.` };
  await Registration.deleteOne({ _id: id });
  return { ok: true, cancelled: reg };
}
