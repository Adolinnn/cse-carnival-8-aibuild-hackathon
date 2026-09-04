import { Router } from 'express';
import { requireAdmin, requireSectionAdmin } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';

const r = Router();

r.post('/login', authController.login);
r.get('/me', authController.getMe);
r.get('/options', authController.getOptions);
r.post('/change-password', requireSectionAdmin, authController.changePassword);
r.get('/admins', requireAdmin, authController.getAdmins);
r.post('/admins', requireAdmin, authController.createOrUpdateAdmin);
r.delete('/admins/:key', requireAdmin, authController.deleteAdmin);

export default r;
