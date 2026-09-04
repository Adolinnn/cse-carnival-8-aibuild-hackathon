import seedSchedules from '../../../data/schedules.json';
import seedRooms from '../../../data/rooms.json';
import seedEvents from '../../../data/events.json';
import seedAnnouncements from '../../../data/announcements.json';
import seedAssignments from '../../../data/assignments.json';

export function generateSeedData() {
  const schedules = (seedSchedules || []).map((s, idx) => ({
    ...s,
    id: s.id || s._id || 'sched-' + (idx + 1),
    dept: s.dept || 'CSE',
    semester: s.semester || '3.2',
    section: s.section || 'A',
  }));

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

  const rooms = (seedRooms || []).map((r) => ({
    ...r,
    bookings: r.bookings || [],
  }));

  const events = (seedEvents || []).map((e, idx) => ({
    ...e,
    id: e.id || e._id || 'evt-' + (idx + 1),
    dept: e.dept || 'CSE',
    semester: e.semester || '3.2',
    section: e.section || 'A',
    is_global: e.is_global !== undefined ? e.is_global : true,
    registrations: e.registrations || [],
  }));

  const announcements = (seedAnnouncements || []).map((a, idx) => ({
    ...a,
    id: a.id || a._id || 'ann-' + (idx + 1),
    dept: a.dept || 'CSE',
    semester: a.semester || '3.2',
    section: a.section || 'A',
  }));

  const assignments = (seedAssignments || []).map((asg, idx) => ({
    ...asg,
    id: asg.id || asg._id || 'asg-' + (idx + 1),
    dept: asg.dept || 'CSE',
    semester: asg.semester || '3.2',
    section: asg.section || 'A',
  }));

  return { schedules, rooms, events, announcements, assignments };
}
