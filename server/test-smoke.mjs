// Smoke test script for CampusOS backend
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';

async function req(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runSmokeTests() {
  console.log(`Starting smoke test against ${BASE_URL}...`);
  let passed = 0;
  let total = 0;

  function assert(condition, message, details) {
    total++;
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ ${message}`, details || '');
    }
  }

  // 1. Health check
  const health = await req('/health');
  assert(health.status === 200 && health.data.ok === true, 'GET /api/health returns ok: true', health.data);
  assert(health.data.student && health.data.student.id === '20-40532', 'GET /api/health returns student Sakibul Hassan (20-40532)', health.data);

  // 2. Schedules (expect 24 when scope=all, >= 19 for tenant)
  const schedules = await req('/schedules?scope=all');
  assert(Array.isArray(schedules.data) && schedules.data.length === 24, `GET /api/schedules?scope=all returns 24 schedules (got ${schedules.data?.length})`);

  // 3. Rooms (expect 20)
  const rooms = await req('/rooms');
  assert(Array.isArray(rooms.data) && rooms.data.length === 20, `GET /api/rooms returns 20 rooms (got ${rooms.data?.length})`);

  // 4. Events (expect 7)
  const events = await req('/events');
  assert(Array.isArray(events.data) && events.data.length === 7, `GET /api/events returns 7 events (got ${events.data?.length})`);

  // 5. Announcements (expect 8)
  const announcements = await req('/announcements');
  assert(Array.isArray(announcements.data) && announcements.data.length === 8, `GET /api/announcements returns 8 announcements (got ${announcements.data?.length})`);

  // 6. Assignments (expect 8)
  const assignments = await req('/assignments');
  assert(Array.isArray(assignments.data) && assignments.data.length === 8, `GET /api/assignments returns 8 assignments (got ${assignments.data?.length})`);

  // 7. Available rooms query
  const avail = await req('/rooms/available?date=2026-09-08&start_time=10:00&end_time=12:00&min_capacity=30&equipment=projector');
  assert(Array.isArray(avail.data) && avail.data.length > 0, `GET /api/rooms/available returned ${avail.data?.length} available rooms`);

  // 8. POST a booking
  const testRoom = '7A02';
  const testDate = '2026-09-15';
  const bookingRes = await req(`/rooms/${testRoom}/bookings`, {
    method: 'POST',
    body: JSON.stringify({
      date: testDate,
      start_time: '14:00',
      end_time: '16:00',
      booked_by: 'Sakibul Hassan',
      purpose: 'Hackathon Practice Session',
    }),
  });
  assert(bookingRes.status === 201 && bookingRes.data._id, `POST /api/rooms/${testRoom}/bookings created booking ${bookingRes.data?._id}`);

  const bookingId = bookingRes.data?._id;

  // 9. Verify booking retrieved via room bookings
  if (bookingId) {
    const checkBookings = await req(`/rooms/${testRoom}/bookings?date=${testDate}`);
    const found = Array.isArray(checkBookings.data) && checkBookings.data.some(b => b._id === bookingId);
    assert(found, `GET /api/rooms/${testRoom}/bookings retrieved persisted booking ${bookingId}`);

    // Clean up test booking
    const delRes = await req(`/bookings/${bookingId}`, { method: 'DELETE' });
    assert(delRes.status === 200 && delRes.data.ok === true, `DELETE /api/bookings/${bookingId} cleaned up test booking`);
  }

  console.log(`\nSmoke tests finished: ${passed}/${total} assertions passed.`);
}

runSmokeTests().catch(console.error);
