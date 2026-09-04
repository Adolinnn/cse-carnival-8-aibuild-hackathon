import { Router } from 'express';
import * as chatController from '../controllers/chatController.js';

const r = Router();

r.post('/', chatController.handleChat);

export default r;
