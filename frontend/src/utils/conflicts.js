import { getDayName } from './date';

export function isTimeOverlapping(startA, endA, startB, endB) {
  return !(endA <= startB || startA >= endB);
}

export function checkBookingConflict(room, date, startTime, endTime) {
  if (!room || !room.bookings) return null;

  return room.bookings.find((b) => {
    if (b.date !== date) return false;
    return isTimeOverlapping(startTime, endTime, b.start_time, b.end_time);
  });
}

export function checkScheduleConflict(schedules, roomNumber, date, startTime, endTime) {
  if (!Array.isArray(schedules) || !roomNumber || !date) return null;
  const weekday = getDayName(date);

  return schedules.find((s) => {
    if (!s.room || s.room.toUpperCase() !== roomNumber.toUpperCase()) return false;
    if (s.day !== weekday) return false;
    return isTimeOverlapping(startTime, endTime, s.start_time, s.end_time);
  });
}
