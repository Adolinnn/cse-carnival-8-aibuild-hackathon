import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'campusos-secret-token-key-2026-hypersecure';

// In-memory rate limiting / lockout for failed admin password attempts
// Key: `${ip}:${dept}:${semester}:${section}` -> { attempts: number, lockUntil: number, lastAttempt: number }
const loginAttemptTracker = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function checkLoginRateLimit(ip, dept, semester, section) {
  const key = `${ip || 'local'}:${dept}:${semester}:${section}`;
  const now = Date.now();
  const record = loginAttemptTracker.get(key);

  if (!record) return { allowed: true };

  // If locked out, check if window passed
  if (record.lockUntil && now < record.lockUntil) {
    const remainingSec = Math.ceil((record.lockUntil - now) / 1000);
    return {
      allowed: false,
      reason: `Too many failed attempts. Section locked for ${remainingSec} seconds.`,
      remainingSec,
    };
  }

  // If lockout expired or older than 30 mins, reset
  if (record.lockUntil && now >= record.lockUntil) {
    loginAttemptTracker.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedLogin(ip, dept, semester, section) {
  const key = `${ip || 'local'}:${dept}:${semester}:${section}`;
  const now = Date.now();
  const record = loginAttemptTracker.get(key) || { attempts: 0, lockUntil: 0, lastAttempt: now };

  record.attempts += 1;
  record.lastAttempt = now;

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockUntil = now + LOCKOUT_DURATION_MS;
    console.warn(`[security] IP ${ip} locked out of section ${dept} ${semester} Sec ${section} due to ${record.attempts} failed password attempts.`);
  }

  loginAttemptTracker.set(key, record);
}

export function recordSuccessfulLogin(ip, dept, semester, section) {
  const key = `${ip || 'local'}:${dept}:${semester}:${section}`;
  loginAttemptTracker.delete(key);
}

function base64UrlEncode(str) {
  return Buffer.from(str).toString('base64url');
}

function base64UrlDecode(str) {
  return Buffer.from(str, 'base64url').toString('utf8');
}

export function signToken(payload, expiresInSeconds) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const ttl = expiresInSeconds || (payload.role === 'admin' ? 24 * 60 * 60 : 7 * 24 * 60 * 60); // 24h for Admin, 7d for Student
  const data = base64UrlEncode(JSON.stringify({
    ...payload,
    iat: now,
    exp: now + ttl,
    jti: crypto.randomBytes(8).toString('hex'),
  }));
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${data}`).digest('base64url');
  return `${header}.${data}.${signature}`;
}

export function verifyToken(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, data, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${data}`).digest('base64url');
    
    // Constant-time comparison
    const sigBuf = Buffer.from(signature);
    const expSigBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expSigBuf.length || !crypto.timingSafeEqual(sigBuf, expSigBuf)) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(data));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) return null; // Expired
    return payload;
  } catch {
    return null;
  }
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  try {
    if (!storedHash || !password) return false;
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
    const hashBuf = Buffer.from(hash, 'hex');
    const keyBuf = Buffer.from(key, 'hex');
    if (hashBuf.length !== keyBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, keyBuf);
  } catch {
    return false;
  }
}

// Middleware to extract tenant and user from JWT or request context
export function extractTenant(req, res, next) {
  const authHeader = req.headers.authorization;
  let user = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    user = verifyToken(token);

    // If an authorization token was explicitly sent but failed validation (invalid / expired)
    if (!user && token.length > 0) {
      return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
    }
  }

  // Fallback / explicit headers for tenant context
  const dept = (user?.dept || req.headers['x-dept'] || req.query.dept || process.env.CAMPUS_DEPT || 'CSE').trim().toUpperCase();
  const semester = (user?.semester || req.headers['x-semester'] || req.query.semester || process.env.CAMPUS_SEMESTER || '4.1').trim();
  const section = (user?.section || req.headers['x-section'] || req.query.section || process.env.CAMPUS_STUDENT_SECTION || 'B').trim().toUpperCase();

  req.user = user || {
    role: 'student',
    dept,
    semester,
    section,
    student_id: process.env.CAMPUS_STUDENT_ID || '20-40532',
    student_name: process.env.CAMPUS_STUDENT_NAME || 'Sakibul Hassan',
  };

  req.tenant = { dept, semester, section };
  next();
}

// Strict Admin authorization middleware
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin permission required for this action' });
  }
  next();
}

export function requireSectionAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ error: 'Admin permission required' });
  }

  if (req.user.role === 'superadmin' || req.user.is_super_admin) {
    return next();
  }

  // If a target tenant is specified in body / params, verify the admin owns this section
  const targetDept = req.body?.dept || req.params?.dept || req.tenant?.dept;
  const targetSem = req.body?.semester || req.params?.semester || req.tenant?.semester;
  const targetSec = req.body?.section || req.params?.section || req.tenant?.section;

  if (
    (targetDept && targetDept.toUpperCase() !== req.user.dept.toUpperCase()) ||
    (targetSem && targetSem !== req.user.semester) ||
    (targetSec && targetSec.toUpperCase() !== req.user.section.toUpperCase())
  ) {
    return res.status(403).json({
      error: `Cross-tenant administration denied. You are admin of ${req.user.dept} ${req.user.semester} Sec ${req.user.section}.`,
    });
  }

  next();
}
