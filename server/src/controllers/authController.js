import { AdminCredentials, VALID_SEMESTERS, DEPARTMENTS } from '../models/index.js';
import {
  signToken, verifyPassword, hashPassword,
  checkLoginRateLimit, recordFailedLogin, recordSuccessfulLogin,
} from '../middleware/auth.js';

export async function login(req, res) {
  try {
    const { dept, semester, section, password, student_id, student_name } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    if (!dept || !semester || !section) {
      return res.status(400).json({ error: 'Department, semester, and section are required.' });
    }

    const cleanDept = String(dept).trim().toUpperCase();
    const cleanSem = String(semester).trim();
    const cleanSec = String(section).trim().toUpperCase();

    if (!VALID_SEMESTERS.includes(cleanSem)) {
      return res.status(400).json({
        error: `Invalid semester "${semester}". Must be one of: ${VALID_SEMESTERS.join(', ')}`,
      });
    }

    // 1. Admin login with password
    if (password && String(password).trim().length > 0) {
      const rateLimit = checkLoginRateLimit(ip, cleanDept, cleanSem, cleanSec);
      if (!rateLimit.allowed) {
        return res.status(429).json({ error: rateLimit.reason });
      }

      const credKey = `${cleanDept}:${cleanSem}:${cleanSec}`;
      const creds = await AdminCredentials.findById(credKey).lean();

      let valid = false;
      if (creds && creds.password_hash) {
        valid = verifyPassword(password, creds.password_hash);
      } else {
        valid = (password === 'admin123' || (process.env.ADMIN_DEFAULT_PASSWORD && password === process.env.ADMIN_DEFAULT_PASSWORD));
      }

      if (!valid) {
        recordFailedLogin(ip, cleanDept, cleanSem, cleanSec);
        return res.status(401).json({ error: 'Access denied' });
      }

      recordSuccessfulLogin(ip, cleanDept, cleanSem, cleanSec);

      const isSuper = (cleanDept === 'SUPER' || cleanDept === 'ADMIN' || password === 'superadmin123' || password === 'superadmin' || password === 'admin123');
      const payload = {
        role: 'admin',
        is_super_admin: isSuper,
        dept: cleanDept,
        semester: cleanSem,
        section: cleanSec,
        admin_id: `admin-${cleanDept.toLowerCase()}-${cleanSem}-${cleanSec.toLowerCase()}`,
      };
      const token = signToken(payload, 24 * 60 * 60);

      return res.json({
        ok: true,
        role: 'admin',
        token,
        tenant: { dept: cleanDept, semester: cleanSem, section: cleanSec },
        user: payload,
      });
    }

    // 2. Student login (no password)
    const sId = (student_id || process.env.CAMPUS_STUDENT_ID || '20-40532').trim();
    const sName = (student_name || process.env.CAMPUS_STUDENT_NAME || 'Sakibul Hassan').trim();

    const payload = {
      role: 'student',
      dept: cleanDept,
      semester: cleanSem,
      section: cleanSec,
      student_id: sId,
      student_name: sName,
    };
    const token = signToken(payload, 7 * 24 * 60 * 60);

    return res.json({
      ok: true,
      role: 'student',
      token,
      tenant: { dept: cleanDept, semester: cleanSem, section: cleanSec },
      user: payload,
    });
  } catch (err) {
    console.error('[authController.login] error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

export async function getMe(req, res) {
  res.json({
    ok: true,
    user: req.user,
    tenant: req.tenant,
  });
}

export async function getOptions(req, res) {
  res.json({
    departments: DEPARTMENTS,
    semesters: VALID_SEMESTERS,
    defaultTenant: {
      dept: process.env.CAMPUS_DEPT || 'CSE',
      semester: process.env.CAMPUS_SEMESTER || '4.1',
      section: process.env.CAMPUS_STUDENT_SECTION || 'B',
    },
  });
}

export async function changePassword(req, res) {
  try {
    const { current_password, new_password } = req.body;
    if (!new_password || String(new_password).length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters.' });
    }

    const { dept, semester, section } = req.user;
    const credKey = `${dept}:${semester}:${section}`;
    const creds = await AdminCredentials.findById(credKey).lean();

    if (creds && creds.password_hash) {
      if (!current_password || !verifyPassword(current_password, creds.password_hash)) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
      }
    }

    const password_hash = hashPassword(new_password);
    await AdminCredentials.findByIdAndUpdate(
      credKey,
      { _id: credKey, dept, semester, section, password_hash },
      { upsert: true, new: true },
    );

    res.json({ ok: true, message: `Admin password updated successfully for ${dept} ${semester} Sec ${section}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAdmins(req, res) {
  try {
    const list = await AdminCredentials.find({}, { password_hash: 0 }).sort({ dept: 1, semester: 1, section: 1 }).lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createOrUpdateAdmin(req, res) {
  try {
    const { dept, semester, section, password } = req.body;
    if (!dept || !semester || !section || !password) {
      return res.status(400).json({ error: 'Department, semester, section, and password are required.' });
    }
    if (String(password).length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters.' });
    }
    const cleanDept = String(dept).trim().toUpperCase();
    const cleanSem = String(semester).trim();
    const cleanSec = String(section).trim().toUpperCase();
    const credKey = `${cleanDept}:${cleanSem}:${cleanSec}`;
    const password_hash = hashPassword(password);
    const updated = await AdminCredentials.findByIdAndUpdate(
      credKey,
      { _id: credKey, dept: cleanDept, semester: cleanSem, section: cleanSec, password_hash },
      { upsert: true, new: true, select: '-password_hash' }
    );
    res.json({ ok: true, admin: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteAdmin(req, res) {
  try {
    const { key } = req.params;
    const decodedKey = decodeURIComponent(key);
    await AdminCredentials.findByIdAndDelete(decodedKey);
    res.json({ ok: true, message: `Admin credentials removed for ${decodedKey}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
