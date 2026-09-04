// Multi-tenant and Security smoke test
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';

async function req(url, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runMultiTenantTests() {
  console.log('--- Running Multi-Tenant & Security Smoke Tests ---');
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

  // 1. Auth Options
  const optsRes = await req('/auth/options');
  assert(optsRes.status === 200 && Array.isArray(optsRes.data.semesters), 'GET /api/auth/options returns valid semesters list', optsRes.data);

  // 2. Student Login (No Password)
  const studentLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      dept: 'CSE',
      semester: '4.1',
      section: 'B',
      student_id: '20-40532',
      student_name: 'Sakibul Hassan',
    }),
  });
  assert(studentLogin.status === 200 && studentLogin.data.role === 'student' && studentLogin.data.token, 'Student login succeeds with no password', studentLogin.data);
  const studentToken = studentLogin.data?.token;

  // 3. Admin Login (Correct Password "admin123")
  const adminLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      dept: 'CSE',
      semester: '4.1',
      section: 'B',
      password: 'admin123',
    }),
  });
  assert(adminLogin.status === 200 && adminLogin.data.role === 'admin' && adminLogin.data.token, 'Admin login succeeds with password "admin123"', adminLogin.data);
  const adminToken = adminLogin.data?.token;

  // 4. Admin Login (Wrong Password)
  const wrongLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      dept: 'CSE',
      semester: '4.1',
      section: 'A',
      password: 'wrongpassword',
    }),
  });
  assert(wrongLogin.status === 401 && wrongLogin.data.error === 'Access denied', 'Wrong password returns 401 Access denied without leaking details', wrongLogin.data);

  // 5. Invalid / Tampered Token Rejection
  const invalidTokenRes = await req('/auth/me', {}, 'tampered.token.signature');
  assert(invalidTokenRes.status === 401, 'Tampered / invalid token rejected with 401 Unauthorized', invalidTokenRes.data);

  // 6. Auth /me endpoint with valid token
  const meRes = await req('/auth/me', {}, studentToken);
  assert(meRes.status === 200 && meRes.data.user.role === 'student' && meRes.data.tenant.dept === 'CSE', 'GET /api/auth/me returns authenticated tenant triplet', meRes.data);

  // 7. Tenant-Scoped Schedules
  const schRes = await req('/schedules', {}, studentToken);
  assert(schRes.status === 200 && Array.isArray(schRes.data) && schRes.data.length > 0, `GET /api/schedules with tenant token returned ${schRes.data.length} records`);

  // 8. Global Physical Rooms
  const roomRes = await req('/rooms', {}, studentToken);
  assert(roomRes.status === 200 && Array.isArray(roomRes.data) && roomRes.data.length === 20, `GET /api/rooms returns 20 global physical rooms (got ${roomRes.data.length})`);

  // 9. Book Room with Tenant Tagging
  const bookRes = await req('/rooms/7A03/bookings', {
    method: 'POST',
    body: JSON.stringify({
      date: '2026-09-22',
      start_time: '10:00',
      end_time: '12:00',
      purpose: 'Multi-Tenant Booking Test',
    }),
  }, studentToken);
  assert(bookRes.status === 201 && bookRes.data.dept === 'CSE' && bookRes.data.section === 'B', 'POST /api/rooms/7A03/bookings tagged booking with tenant CSE 4.1 Sec B', bookRes.data);

  // Clean up booking
  if (bookRes.data?._id) {
    const delBk = await req(`/bookings/${bookRes.data._id}`, { method: 'DELETE' }, studentToken);
    assert(delBk.status === 200, 'DELETE booking cleaned up successfully');
  }

  // 10. Agent Config GET for Admin
  const agentCfgGet = await req('/agent-config', {}, adminToken);
  assert(agentCfgGet.status === 200, 'GET /api/agent-config succeeds for admin');

  console.log(`\nResults: ${passed}/${total} assertions passed.`);
}

runMultiTenantTests().catch(console.error);
