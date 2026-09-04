import mongoose from 'mongoose';

const { Schema } = mongoose;
const opts = { versionKey: false, _id: false };

export const VALID_SEMESTERS = ['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2'];
export const DEPARTMENTS = ['CSE', 'EEE', 'CE', 'ME', 'IPE', 'TE', 'BBA', 'Architecture'];

// _id holds given stable string IDs (e.g. "sch-001", "room-004", "bk-001")
const Schedule = mongoose.model('Schedule', new Schema({
  _id: String,
  course: String,
  title: String,
  day: String,          // Sunday..Thursday
  start_time: String,   // "HH:MM"
  end_time: String,
  room: String,
  instructor: String,
  section: { type: String, default: 'B', index: true },
  dept: { type: String, default: 'CSE', index: true },
  semester: { type: String, enum: VALID_SEMESTERS, default: '4.1', index: true },
}, opts));

// Global physical campus infrastructure (shared)
const Room = mongoose.model('Room', new Schema({
  _id: String,
  room_number: { type: String, index: true },
  type: String,               // classroom | lab | seminar
  capacity: Number,
  equipment: [String],
  floor: Number,
  status: String,             // available | unavailable
}, opts));

// Bookings attached to rooms & tagged with tenant triplet
const Booking = mongoose.model('Booking', new Schema({
  _id: String,                // booking_id, e.g. "bk-001"
  room_number: { type: String, index: true },
  booked_by: String,
  date: String,               // "YYYY-MM-DD"
  start_time: String,         // "HH:MM"
  end_time: String,
  purpose: String,
  dept: { type: String, default: 'CSE', index: true },
  semester: { type: String, default: '4.1', index: true },
  section: { type: String, default: 'B', index: true },
}, opts));

// Events (can be global campus-wide or tenant-specific)
const Event = mongoose.model('Event', new Schema({
  _id: String,
  name: String,
  description: String,
  date: String,
  end_date: String,
  start_time: String,
  end_time: String,
  venue: String,
  organizer: String,
  capacity: Number,
  status: String,             // upcoming | ongoing | completed | cancelled | full
  is_global: { type: Boolean, default: true },
  dept: { type: String, default: 'CSE', index: true },
  semester: { type: String, default: '4.1', index: true },
  section: { type: String, default: 'B', index: true },
}, opts));

// Event registrations tagged with tenant triplet
const Registration = mongoose.model('Registration', new Schema({
  _id: String,                // synthesized "<event_id>:<student_id>"
  event_id: { type: String, index: true },
  student_id: String,
  name: String,
  dept: { type: String, default: 'CSE', index: true },
  semester: { type: String, default: '4.1', index: true },
  section: { type: String, default: 'B', index: true },
}, opts));

// Announcements scoped to tenant triplet (or global)
const Announcement = mongoose.model('Announcement', new Schema({
  _id: String,
  title: String,
  body: String,
  date: String,
  priority: String,           // high | medium | low
  posted_by: String,
  expires: String,
  is_global: { type: Boolean, default: false },
  dept: { type: String, default: 'CSE', index: true },
  semester: { type: String, default: '4.1', index: true },
  section: { type: String, default: 'B', index: true },
}, opts));

// Assignments scoped to tenant triplet
const Assignment = mongoose.model('Assignment', new Schema({
  _id: String,
  course: String,
  course_title: String,
  title: String,
  description: String,
  assigned_date: String,
  deadline: String,
  submission_platform: String,
  status: String,             // pending | submitted | graded | late
  marks: Number,
  dept: { type: String, default: 'CSE', index: true },
  semester: { type: String, default: '4.1', index: true },
  section: { type: String, default: 'B', index: true },
}, opts));

// Admin credentials: one row per section
const AdminCredentials = mongoose.model('AdminCredentials', new Schema({
  _id: String,                // "${dept}:${semester}:${section}"
  dept: { type: String, required: true, index: true },
  semester: { type: String, required: true, enum: VALID_SEMESTERS, index: true },
  section: { type: String, required: true, index: true },
  password_hash: { type: String, required: true },
}, opts));

// Agent configuration per tenant
const AgentConfig = mongoose.model('AgentConfig', new Schema({
  _id: String,                // "${dept}:${semester}:${section}"
  dept: { type: String, required: true, index: true },
  semester: { type: String, required: true, enum: VALID_SEMESTERS, index: true },
  section: { type: String, required: true, index: true },
  api_base_url: String,
  api_key: String,            // encrypted / raw
  model_name: String,
  system_prompt: String,
  updated_at: { type: Date, default: Date.now },
}, opts));

export {
  Schedule, Room, Booking, Event, Registration, Announcement, Assignment,
  AdminCredentials, AgentConfig,
};
