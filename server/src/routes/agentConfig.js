import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import * as agentConfigController from '../controllers/agentConfigController.js';

const r = Router();

r.get('/', agentConfigController.getAgentConfig);
r.put('/', requireAdmin, agentConfigController.updateAgentConfig);

export default r;
