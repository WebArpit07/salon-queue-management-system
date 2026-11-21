import { Router } from 'express';
import { Service, Barber, SalonConfig, QueueTicket } from '../models/index.js';
import { requireStaffPin } from '../middleware/requireStaffPin.js';
import { broadcastQueueUpdate } from '../sockets/socketHandler.js';
import { AppError } from '../utils/AppError.js';
import { getIstDateKey } from '../utils/salonTime.js';

const router = Router();

// Protect ALL admin routes with staff PIN middleware
router.use(requireStaffPin);

/**
 * GET /api/admin/services
 * Get all services (active and inactive) sorted by sortOrder
 */
router.get('/services', async (req, res, next) => {
  try {
    const services = await Service.find().sort({ sortOrder: 1, nameEn: 1 });
    res.status(200).json({ services });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/services
 * Create a new bilingual service
 */
router.post('/services', async (req, res, next) => {
  try {
    const { nameEn, nameGu, durationMin, price, isActive = true, sortOrder = 0 } = req.body || {};

    if (!nameEn || !nameGu || durationMin == null || price == null) {
      throw new AppError('nameEn, nameGu, durationMin, and price are required', 400);
    }

    const service = await Service.create({
      nameEn: String(nameEn).trim(),
      nameGu: String(nameGu).trim(),
      durationMin: Number(durationMin),
      price: Number(price),
      isActive: Boolean(isActive),
      sortOrder: Number(sortOrder),
    });

    const io = req.app.get('io');
    await broadcastQueueUpdate(io);

    res.status(201).json({ success: true, service });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/services/:id
 * Update an existing service
 */
router.patch('/services/:id', async (req, res, next) => {
  try {
    const updates = {};
    const allowed = ['nameEn', 'nameGu', 'durationMin', 'price', 'isActive', 'sortOrder'];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const service = await Service.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    if (!service) {
      throw new AppError('Service not found', 404);
    }

    const io = req.app.get('io');
    await broadcastQueueUpdate(io);

    res.status(200).json({ success: true, service });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/admin/services/:id
 * Delete a service
 */
router.delete('/services/:id', async (req, res, next) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      throw new AppError('Service not found', 404);
    }

    const io = req.app.get('io');
    await broadcastQueueUpdate(io);

    res.status(200).json({ success: true, message: 'Service deleted successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/barbers/:slug/duty
 * Toggle barber onDuty state (reject if actively servicing customer)
 */
router.patch('/barbers/:slug/duty', async (req, res, next) => {
  try {
    const slug = (req.params.slug || '').toLowerCase().trim();
    const { onDuty } = req.body || {};

    if (onDuty === undefined) {
      throw new AppError('onDuty boolean is required', 400);
    }

    const barber = await Barber.findOne({ slug });
    if (!barber) {
      throw new AppError(`Barber '${slug}' not found`, 404);
    }

    if (!onDuty) {
      // Check if actively serving a customer
      const activeTicket = await QueueTicket.findOne({
        dateKey: getIstDateKey(),
        assignedBarber: slug,
        status: { $in: ['called', 'in_chair'] },
      });

      if (activeTicket) {
        throw new AppError('Cannot take barber off duty while actively serving a customer', 400);
      }
    }

    barber.onDuty = Boolean(onDuty);
    if (!barber.onDuty) {
      barber.status = 'on_break';
    } else if (barber.status === 'on_break') {
      barber.status = 'available';
    }
    await barber.save();

    const io = req.app.get('io');
    await broadcastQueueUpdate(io);

    res.status(200).json({ success: true, barber });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/config
 * Update salon operating parameters
 */
router.patch('/config', async (req, res, next) => {
  try {
    const updates = {};
    const allowed = ['isQueueOpen', 'openTime', 'closeTime', 'salonNameEn', 'salonNameGu', 'onlineCutoffMinutes'];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const config = await SalonConfig.findOneAndUpdate(
      { key: 'default' },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    const io = req.app.get('io');
    await broadcastQueueUpdate(io);

    res.status(200).json({ success: true, salonConfig: config });
  } catch (err) {
    next(err);
  }
});

export default router;
