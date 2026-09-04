import { nanoid } from 'nanoid';
import { Booking } from '../models/index.js';

export function createCrudController(Model, { prefix, filterable = [], isTenantScoped = true } = {}) {
  return {
    list: async (req, res, next) => {
      try {
        const q = {};
        for (const f of filterable) {
          if (req.query[f] != null && req.query[f] !== '') {
            q[f] = req.query[f];
          }
        }

        if (isTenantScoped && req.tenant && req.query.scope !== 'all') {
          const { dept, semester, section } = req.tenant;
          const orConditions = [];

          const tenantQuery = {};
          if (dept && !q.dept) tenantQuery.dept = dept;
          if (semester && !q.semester) tenantQuery.semester = semester;
          
          if (section && !q.section) {
            tenantQuery.$or = [
              { section: section },
              { section: { $regex: new RegExp(`^${section}[0-9/]|/${section}`, 'i') } },
              { section: { $in: ['CS', 'DWM', 'All', 'Open'] } },
              { section: { $exists: false } },
            ];
          }
          orConditions.push(tenantQuery);
          orConditions.push({ is_global: true });
          orConditions.push({ dept: { $exists: false } });

          q.$or = orConditions;
        }

        let rows = await Model.find(q).lean();
        if (Model.modelName === 'Room') {
          const allBookings = await Booking.find({}).sort({ date: 1, start_time: 1 }).lean();
          const bookingsByRoom = {};
          for (const bk of allBookings) {
            if (!bookingsByRoom[bk.room_number]) bookingsByRoom[bk.room_number] = [];
            bookingsByRoom[bk.room_number].push({
              ...bk,
              booking_id: bk._id,
            });
          }
          rows = rows.map(r => ({
            ...r,
            bookings: bookingsByRoom[r.room_number] || [],
          }));
        }
        res.json(rows);
      } catch (e) { next(e); }
    },

    getById: async (req, res, next) => {
      try {
        const row = await Model.findById(req.params.id).lean();
        if (!row) return res.status(404).json({ error: 'Not found' });
        if (Model.modelName === 'Room') {
          const bookings = await Booking.find({ room_number: row.room_number }).sort({ date: 1, start_time: 1 }).lean();
          row.bookings = bookings.map(b => ({ ...b, booking_id: b._id }));
        }
        res.json(row);
      } catch (e) { next(e); }
    },

    create: async (req, res, next) => {
      try {
        const body = { ...req.body };
        if (!body._id) body._id = body.id || `${prefix}-${nanoid(6)}`;
        delete body.id;

        if (isTenantScoped && req.tenant) {
          if (!body.dept) body.dept = req.tenant.dept;
          if (!body.semester) body.semester = req.tenant.semester;
          if (!body.section) body.section = req.tenant.section;
        }

        const created = await Model.create(body);
        res.status(201).json(created.toObject());
      } catch (e) { next(e); }
    },

    update: async (req, res, next) => {
      try {
        const body = { ...req.body };
        delete body._id; delete body.id;
        const updated = await Model.findByIdAndUpdate(req.params.id, body, {
          new: true, runValidators: true,
        }).lean();
        if (!updated) return res.status(404).json({ error: 'Not found' });
        res.json(updated);
      } catch (e) { next(e); }
    },

    remove: async (req, res, next) => {
      try {
        const del = await Model.findByIdAndDelete(req.params.id).lean();
        if (!del) return res.status(404).json({ error: 'Not found' });
        res.json({ ok: true, deleted: del });
      } catch (e) { next(e); }
    },
  };
}
