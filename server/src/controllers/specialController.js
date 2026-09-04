import { Booking, Registration } from '../models/index.js';
import {
  getRoom, findAvailableRooms, bookRoom as bookRoomService, cancelBooking as cancelBookingService,
  registerForEvent as registerEventService, cancelRegistration as cancelRegistrationService,
} from '../services/campus.js';

export async function getAvailableRooms(req, res, next) {
  try {
    const { date, start_time, end_time, min_capacity, type } = req.query;
    const equipment = req.query.equipment
      ? String(req.query.equipment).split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const rooms = await findAvailableRooms({
      date, start_time, end_time, min_capacity, equipment, type,
    });
    res.json(rooms);
  } catch (e) { next(e); }
}

export async function getRoomFull(req, res, next) {
  try {
    const room = await getRoom(req.params.room_number);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (e) { next(e); }
}

export async function getRoomBookings(req, res, next) {
  try {
    const q = { room_number: req.params.room_number };
    if (req.query.date) q.date = req.query.date;
    res.json(await Booking.find(q).sort({ date: 1, start_time: 1 }).lean());
  } catch (e) { next(e); }
}

export async function bookRoom(req, res, next) {
  try {
    const { date, start_time, end_time, booked_by, purpose } = req.body;
    const dept = req.body.dept || req.tenant?.dept || 'CSE';
    const semester = req.body.semester || req.tenant?.semester || '4.1';
    const section = req.body.section || req.tenant?.section || 'B';
    const userBookedBy = booked_by || req.user?.student_name || 'Sakibul Hassan';

    const result = await bookRoomService({
      room_number: req.params.room_number,
      date, start_time, end_time,
      booked_by: userBookedBy,
      purpose,
      dept, semester, section,
    });
    if (!result.ok) return res.status(409).json({ error: result.reason });
    res.status(201).json(result.booking);
  } catch (e) { next(e); }
}

export async function cancelBooking(req, res, next) {
  try {
    const result = await cancelBookingService({
      booking_id: req.params.booking_id,
      requested_by: req.user?.student_name,
      role: req.user?.role || 'student',
      tenant: req.tenant,
    });
    if (!result.ok) return res.status(404).json({ error: result.reason });
    res.json({ ok: true, cancelled: result.cancelled });
  } catch (e) { next(e); }
}

export async function getEventRegistrations(req, res, next) {
  try {
    res.json(await Registration.find({ event_id: req.params.id }).lean());
  } catch (e) { next(e); }
}

export async function registerForEvent(req, res, next) {
  try {
    const student_id = req.body.student_id || req.user?.student_id || '20-40532';
    const name = req.body.name || req.user?.student_name || 'Sakibul Hassan';
    const dept = req.body.dept || req.tenant?.dept || 'CSE';
    const semester = req.body.semester || req.tenant?.semester || '4.1';
    const section = req.body.section || req.tenant?.section || 'B';

    const result = await registerEventService({
      event_id: req.params.id, student_id, name,
      dept, semester, section,
    });
    if (!result.ok) return res.status(409).json({ error: result.reason });
    res.status(201).json(result);
  } catch (e) { next(e); }
}

export async function cancelRegistration(req, res, next) {
  try {
    const result = await cancelRegistrationService({
      event_id: req.params.id,
      student_id: req.params.student_id || req.user?.student_id,
    });
    if (!result.ok) return res.status(404).json({ error: result.reason });
    res.json(result);
  } catch (e) { next(e); }
}
