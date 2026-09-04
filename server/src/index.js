import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import {
  Schedule, Room, Event, Announcement, Assignment,
} from './models/index.js';
import { crudRouter } from './routes/crud.js';
import specialRoutes from './routes/special.js';
import chatRoutes from './routes/chat.js';
import authRoutes from './routes/auth.js';
import agentConfigRoutes from './routes/agentConfig.js';
import { extractTenant } from './middleware/auth.js';

const app = express();
app.use(cors());
app.use(express.json());

// Global tenant & auth extractor middleware
app.use('/api', extractTenant);

// Auth & Tenant routes
app.use('/api/auth', authRoutes);
app.use('/api/agent-config', agentConfigRoutes);

// Health check with live session context
app.get('/api/health', (req, res) => res.json({
  ok: true,
  student: {
    id: req.user?.student_id || process.env.CAMPUS_STUDENT_ID || '20-40532',
    name: req.user?.student_name || process.env.CAMPUS_STUDENT_NAME || 'Sakibul Hassan',
    role: req.user?.role || 'student',
    dept: req.tenant?.dept || 'CSE',
    semester: req.tenant?.semester || '4.1',
    section: req.tenant?.section || 'B',
  },
  tenant: req.tenant,
}));

// Bookings, registrations, availability (mounted before generic CRUD /:id)
app.use('/api', specialRoutes);

// Five CRUD resources (20 + 20 marks)
app.use('/api/schedules', crudRouter(Schedule, { prefix: 'sch', filterable: ['day', 'course', 'section', 'dept', 'semester'] }));
app.use('/api/rooms', crudRouter(Room, { prefix: 'room', filterable: ['type', 'status'], isTenantScoped: false })); // Global rooms
app.use('/api/events', crudRouter(Event, { prefix: 'evt', filterable: ['status'] }));
app.use('/api/announcements', crudRouter(Announcement, { prefix: 'ann', filterable: ['priority'] }));
app.use('/api/assignments', crudRouter(Assignment, { prefix: 'asgn', filterable: ['status', 'course'] }));

// AI agent
app.use('/api/chat', chatRoutes);

// 404 fallback for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route ${req.originalUrl} not found` });
});

// Serve frontend production build if present (for single-service deployment)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[error]', err.stack || err.message);
  res.status(err.status || 400).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    const server = app.listen(PORT, () => console.log(`[server] http://localhost:${PORT}`));

    const shutdown = async (signal) => {
      console.log(`[server] ${signal} received, closing HTTP server and DB connections...`);
      server.close(async () => {
        await mongoose.connection.close(false);
        console.log('[server] graceful shutdown complete.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })
  .catch(err => {
    console.error('[server] failed to start:', err);
    process.exit(1);
  });
