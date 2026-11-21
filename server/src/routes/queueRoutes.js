import { Router } from 'express';
import {
  joinQueue,
  callNextForBarber,
  startTicketForBarber,
  completeTicketForBarber,
  setBarberBreakStatus,
  cancelTicket,
  markTicketNoShow,
  getLiveQueueSnapshot,
  getEnrichedTicketById,
} from '../services/queueEngine.js';
import { requireStaffPin } from '../middleware/requireStaffPin.js';
import { broadcastQueueUpdate } from '../sockets/socketHandler.js';
import { AppError } from '../utils/AppError.js';

const router = Router();

/**
 * GET /api/queue/state
 * Public live queue snapshot
 */
router.get('/state', async (req, res, next) => {
  try {
    const snapshot = await getLiveQueueSnapshot();
    res.status(200).json(snapshot);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/queue/join
 * Public online queue join
 */
router.post('/join', async (req, res, next) => {
  try {
    const { customerName, phone, serviceIds, preferredBarber } = req.body || {};
    const result = await joinQueue({
      customerName,
      phone,
      serviceIds,
      preferredBarber,
      source: 'online',
    });

    const io = req.app.get('io');
    await broadcastQueueUpdate(io);

    res.status(result.isExisting ? 200 : 201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/queue/walkin
 * Staff-assisted walk-in check-in (protected by staff PIN)
 */
router.post('/walkin', requireStaffPin, async (req, res, next) => {
  try {
    const { customerName, phone, serviceIds, preferredBarber } = req.body || {};
    const result = await joinQueue({
      customerName,
      phone,
      serviceIds,
      preferredBarber,
      source: 'walkin',
    });

    const io = req.app.get('io');
    await broadcastQueueUpdate(io);

    res.status(result.isExisting ? 200 : 201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/queue/ticket/:id or /api/queue/status/:id
 * Public status lookup for a customer's specific ticket
 */
router.get(['/ticket/:id', '/status/:id'], async (req, res, next) => {
  try {
    const enriched = await getEnrichedTicketById(req.params.id);
    res.status(200).json(enriched);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/queue/ticket/:id/cancel or /api/queue/:id/cancel
 * Public cancellation of a waiting ticket
 */
router.post(['/ticket/:id/cancel', '/:id/cancel'], async (req, res, next) => {
  try {
    const ticket = await cancelTicket(req.params.id);
    const io = req.app.get('io');
    await broadcastQueueUpdate(io);
    res.status(200).json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/queue/ticket/:id/no-show or /api/queue/:id/no-show
 * Mark a called ticket as no-show (protected by staff PIN)
 */
router.post(['/ticket/:id/no-show', '/:id/no-show'], requireStaffPin, async (req, res, next) => {
  try {
    const ticket = await markTicketNoShow(req.params.id);
    const io = req.app.get('io');
    await broadcastQueueUpdate(io);
    res.status(200).json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/queue/barber/:slug/call-next
 * Barber calls the next client (protected by staff PIN)
 */
router.post('/barber/:slug/call-next', requireStaffPin, async (req, res, next) => {
  try {
    const { ticket, barber } = await callNextForBarber(req.params.slug);
    const io = req.app.get('io');

    await broadcastQueueUpdate(io, {
      type: 'ticket_called',
      ticketId: ticket._id,
      token: ticket.token,
      customerName: ticket.customerName,
      assignedBarber: barber.slug,
      barberName: barber.name,
    });

    res.status(200).json({ success: true, ticket, barber });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/queue/barber/:slug/start
 * Barber starts service for in-chair customer (protected by staff PIN)
 */
router.post('/barber/:slug/start', requireStaffPin, async (req, res, next) => {
  try {
    const { ticket, barber } = await startTicketForBarber(req.params.slug);
    const io = req.app.get('io');
    await broadcastQueueUpdate(io);
    res.status(200).json({ success: true, ticket, barber });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/queue/barber/:slug/done
 * Barber completes service (protected by staff PIN)
 */
router.post('/barber/:slug/done', requireStaffPin, async (req, res, next) => {
  try {
    const { ticket, barber } = await completeTicketForBarber(req.params.slug);
    const io = req.app.get('io');
    await broadcastQueueUpdate(io);
    res.status(200).json({ success: true, ticket, barber });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/queue/barber/:slug/status
 * Toggle barber available/on_break status (protected by staff PIN)
 */
router.patch('/barber/:slug/status', requireStaffPin, async (req, res, next) => {
  try {
    const { status } = req.body || {};
    const barber = await setBarberBreakStatus(req.params.slug, status);
    const io = req.app.get('io');
    await broadcastQueueUpdate(io);
    res.status(200).json({ success: true, barber });
  } catch (err) {
    next(err);
  }
});

export default router;
