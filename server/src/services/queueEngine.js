import { Service, Barber, QueueTicket, SalonConfig, DailyCounter } from '../models/index.js';
import { getIstDateKey, evaluateOnlineJoiningStatus } from '../utils/salonTime.js';
import { AppError } from '../utils/AppError.js';

/**
 * Strict forward-only state machine definition
 */
export const ALLOWED_TRANSITIONS = {
  waiting: ['called', 'cancelled'],
  called: ['in_chair', 'no_show'],
  in_chair: ['done'],
  done: [],
  cancelled: [],
  no_show: [],
};

/**
 * Validate state machine transition
 */
export const validateTransition = (currentStatus, targetStatus) => {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    throw new AppError(
      `Invalid ticket state transition from '${currentStatus}' to '${targetStatus}'. Allowed: [${allowed.join(', ') || 'none'}]`,
      400
    );
  }
};

/**
 * Join the queue (Public online or Staff walk-in)
 */
export const joinQueue = async ({
  customerName,
  phone,
  serviceIds,
  preferredBarber = 'any',
  source = 'online',
}) => {
  // 1. Validation
  if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
    throw new AppError('Customer name must be at least 2 characters', 400);
  }

  const cleanPhone = String(phone || '').trim();
  if (!/^\d{10}$/.test(cleanPhone)) {
    throw new AppError('Phone number must be exactly 10 digits', 400);
  }

  if (!Array.isArray(serviceIds) || serviceIds.length < 1 || serviceIds.length > 3) {
    throw new AppError('Between 1 and 3 services must be selected', 400);
  }

  // 2. Fetch & validate active services
  const dbServices = await Service.find({ _id: { $in: serviceIds }, isActive: true });
  if (dbServices.length !== serviceIds.length) {
    throw new AppError('One or more selected services are invalid or inactive', 400);
  }

  // Preserve serviceIds selection order
  const serviceSnapshots = serviceIds.map((id) => {
    const s = dbServices.find((srv) => srv._id.toString() === id.toString());
    return {
      serviceId: s._id,
      nameEn: s.nameEn,
      nameGu: s.nameGu,
      durationMin: s.durationMin,
      price: s.price,
    };
  });

  const totalDurationMin = serviceSnapshots.reduce((acc, s) => acc + s.durationMin, 0);
  const totalPrice = serviceSnapshots.reduce((acc, s) => acc + s.price, 0);

  const dateKey = getIstDateKey();

  // 3. Duplicate Active Phone Guard
  const existingTicket = await QueueTicket.findOne({
    dateKey,
    phone: cleanPhone,
    status: { $in: ['waiting', 'called', 'in_chair'] },
  });

  if (existingTicket) {
    return { ticket: existingTicket, isExisting: true };
  }

  // 4. Online Cutoff Guard (walkin bypasses cutoff)
  const salonConfig =
    (await SalonConfig.findOne({ key: 'default' })) ||
    (await SalonConfig.create({}));

  if (source === 'online') {
    const onlineCheck = evaluateOnlineJoiningStatus(salonConfig);
    if (!onlineCheck.isOpen) {
      throw new AppError('Online queue joining is currently closed', 403, {
        reason: onlineCheck.reason,
      });
    }
  }

  // 5. Preferred Barber Validation
  const prefSlug = (preferredBarber || 'any').toLowerCase().trim();
  if (prefSlug !== 'any') {
    const barber = await Barber.findOne({ slug: prefSlug, onDuty: true });
    if (!barber) {
      throw new AppError(
        `Barber '${preferredBarber}' is not currently on duty or does not exist`,
        400
      );
    }
  }

  // 6. Generate atomic daily token & create ticket
  const { sequence, token } = await DailyCounter.getNextToken(dateKey);

  const ticket = await QueueTicket.create({
    dateKey,
    sequence,
    token,
    customerName: customerName.trim(),
    phone: cleanPhone,
    services: serviceSnapshots,
    totalDurationMin,
    totalPrice,
    preferredBarber: prefSlug,
    source: source === 'walkin' ? 'walkin' : 'online',
    status: 'waiting',
    joinedAt: new Date(),
  });

  return { ticket, isExisting: false };
};

/**
 * Call next customer for a barber
 */
export const callNextForBarber = async (barberSlug) => {
  const slug = (barberSlug || '').toLowerCase().trim();
  const dateKey = getIstDateKey();

  const barber = await Barber.findOne({ slug });
  if (!barber) {
    throw new AppError(`Barber '${slug}' not found`, 404);
  }

  if (!barber.onDuty) {
    throw new AppError(`Barber '${barber.name}' is not currently on duty`, 400);
  }

  if (barber.status !== 'available') {
    throw new AppError(`Barber '${barber.name}' is currently ${barber.status}`, 400);
  }

  // Verify barber does not have an active customer
  const activeTicket = await QueueTicket.findOne({
    dateKey,
    assignedBarber: slug,
    status: { $in: ['called', 'in_chair'] },
  });

  if (activeTicket) {
    throw new AppError(
      `Barber '${barber.name}' already has an active customer in service (${activeTicket.token})`,
      400
    );
  }

  // Strictly prioritize first-come, first-served: preferredBarber is [slug, 'any']
  const nextTicket = await QueueTicket.findOne({
    dateKey,
    status: 'waiting',
    preferredBarber: { $in: [slug, 'any'] },
  }).sort({ sequence: 1 });

  if (!nextTicket) {
    throw new AppError('No eligible customers waiting for this barber', 404);
  }

  // Validate & transition
  validateTransition(nextTicket.status, 'called');

  nextTicket.status = 'called';
  nextTicket.assignedBarber = slug;
  nextTicket.calledAt = new Date();
  await nextTicket.save();

  barber.status = 'busy';
  barber.currentTicketId = nextTicket._id;
  await barber.save();

  return { ticket: nextTicket, barber };
};

/**
 * Start service for barber's current called client
 */
export const startTicketForBarber = async (barberSlug) => {
  const slug = (barberSlug || '').toLowerCase().trim();
  const dateKey = getIstDateKey();

  const barber = await Barber.findOne({ slug });
  if (!barber) {
    throw new AppError(`Barber '${slug}' not found`, 404);
  }

  const ticket = await QueueTicket.findOne({
    dateKey,
    assignedBarber: slug,
    status: 'called',
  });

  if (!ticket) {
    throw new AppError('No called ticket waiting to start service for this barber', 404);
  }

  validateTransition(ticket.status, 'in_chair');

  ticket.status = 'in_chair';
  ticket.startedAt = new Date();
  await ticket.save();

  barber.status = 'busy';
  barber.currentTicketId = ticket._id;
  await barber.save();

  return { ticket, barber };
};

/**
 * Complete service for barber's current in_chair client
 */
export const completeTicketForBarber = async (barberSlug) => {
  const slug = (barberSlug || '').toLowerCase().trim();
  const dateKey = getIstDateKey();

  const barber = await Barber.findOne({ slug });
  if (!barber) {
    throw new AppError(`Barber '${slug}' not found`, 404);
  }

  const ticket = await QueueTicket.findOne({
    dateKey,
    assignedBarber: slug,
    status: 'in_chair',
  });

  if (!ticket) {
    throw new AppError('No in-chair ticket to complete for this barber', 404);
  }

  validateTransition(ticket.status, 'done');

  ticket.status = 'done';
  ticket.completedAt = new Date();
  await ticket.save();

  barber.status = 'available';
  barber.currentTicketId = null;
  await barber.save();

  return { ticket, barber };
};

/**
 * Toggle barber break status ('available' | 'on_break')
 */
export const setBarberBreakStatus = async (barberSlug, targetStatus) => {
  const slug = (barberSlug || '').toLowerCase().trim();
  if (!['available', 'on_break'].includes(targetStatus)) {
    throw new AppError(`Target status must be 'available' or 'on_break'`, 400);
  }

  const barber = await Barber.findOne({ slug });
  if (!barber) {
    throw new AppError(`Barber '${slug}' not found`, 404);
  }

  const dateKey = getIstDateKey();
  const activeTicket = await QueueTicket.findOne({
    dateKey,
    assignedBarber: slug,
    status: { $in: ['called', 'in_chair'] },
  });

  if (activeTicket || barber.status === 'busy') {
    throw new AppError('Cannot toggle break status while barber has an active customer in service', 400);
  }

  barber.status = targetStatus;
  await barber.save();
  return barber;
};

/**
 * Cancel a waiting ticket
 */
export const cancelTicket = async (ticketId) => {
  const ticket = await QueueTicket.findById(ticketId);
  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  validateTransition(ticket.status, 'cancelled');

  ticket.status = 'cancelled';
  ticket.cancelledAt = new Date();
  await ticket.save();

  return ticket;
};

/**
 * Mark a called ticket as no-show and free the barber
 */
export const markTicketNoShow = async (ticketId) => {
  const ticket = await QueueTicket.findById(ticketId);
  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  validateTransition(ticket.status, 'no_show');

  ticket.status = 'no_show';
  await ticket.save();

  // Free the assigned barber
  if (ticket.assignedBarber) {
    await Barber.findOneAndUpdate(
      { slug: ticket.assignedBarber },
      { $set: { status: 'available', currentTicketId: null } }
    );
  }

  return ticket;
};

/**
 * Live Position, Wait-Time & Snapshot Calculator
 */
export const getLiveQueueSnapshot = async (targetDateKey = null) => {
  const dateKey = targetDateKey || getIstDateKey();

  const salonConfig =
    (await SalonConfig.findOne({ key: 'default' })) ||
    (await SalonConfig.create({}));

  const barbers = await Barber.find({ onDuty: true })
    .populate('currentTicketId')
    .sort({ name: 1 });

  const tickets = await QueueTicket.find({ dateKey }).sort({ sequence: 1 });

  const waitingTickets = tickets.filter((t) => t.status === 'waiting');
  const calledTickets = tickets.filter((t) => t.status === 'called');
  const inChairTickets = tickets.filter((t) => t.status === 'in_chair');
  const doneTickets = tickets.filter((t) => t.status === 'done');
  const noShowTickets = tickets.filter((t) => t.status === 'no_show');

  const workingBarbers = barbers.filter((b) => b.status !== 'on_break').length;

  // Enrich waiting tickets with accurate position & wait-time
  const enrichedWaiting = waitingTickets.map((t, idx) => {
    const position = idx + 1; // 1-based position

    const competingTickets = waitingTickets.filter((other) => {
      if (other.sequence >= t.sequence) return false;
      if (t.preferredBarber === 'any') return true;
      return other.preferredBarber === t.preferredBarber || other.preferredBarber === 'any';
    });

    const minutesAhead = competingTickets.reduce(
      (sum, item) => sum + (item.totalDurationMin || 0),
      0
    );
    const divisor = t.preferredBarber === 'any' ? Math.max(workingBarbers, 1) : 1;
    const estimatedWaitMin = Math.ceil(minutesAhead / divisor);

    return {
      ...t.toObject(),
      position,
      estimatedWaitMin,
      isApproaching: position === 2,
    };
  });

  const upNextTop5 = enrichedWaiting.slice(0, 5);

  // Compute average wait time for completed cuts today
  let totalWaitMins = 0;
  let waitCount = 0;
  for (const dt of doneTickets) {
    const serviceStart = dt.startedAt || dt.calledAt;
    if (serviceStart && dt.joinedAt) {
      const diffMin = Math.max(0, Math.round((new Date(serviceStart) - new Date(dt.joinedAt)) / 60000));
      totalWaitMins += diffMin;
      waitCount++;
    }
  }
  const avgWaitMin = waitCount > 0 ? Math.round(totalWaitMins / waitCount) : 0;

  const todayStats = {
    servedCount: doneTickets.length,
    avgWaitMin,
    noShowCount: noShowTickets.length,
    waitingCount: waitingTickets.length,
  };

  const onlineStatus = evaluateOnlineJoiningStatus(salonConfig);

  return {
    salonConfig,
    barbers,
    waiting: enrichedWaiting,
    upNextTop5,
    called: calledTickets,
    inChair: inChairTickets,
    todayStats,
    onlineStatus,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Enriched ticket lookup for /api/queue/ticket/:id
 */
export const getEnrichedTicketById = async (ticketId) => {
  const ticket = await QueueTicket.findById(ticketId);
  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  let position = null;
  let estimatedWaitMin = null;
  let isApproaching = false;

  if (ticket.status === 'waiting') {
    const snapshot = await getLiveQueueSnapshot(ticket.dateKey);
    const enriched = snapshot.waiting.find((t) => t._id.toString() === ticket._id.toString());
    if (enriched) {
      position = enriched.position;
      estimatedWaitMin = enriched.estimatedWaitMin;
      isApproaching = enriched.isApproaching;
    }
  }

  // Lookup barber details
  let preferredBarberInfo = null;
  if (ticket.preferredBarber && ticket.preferredBarber !== 'any') {
    preferredBarberInfo = await Barber.findOne({ slug: ticket.preferredBarber });
  }

  let assignedBarberInfo = null;
  if (ticket.assignedBarber) {
    assignedBarberInfo = await Barber.findOne({ slug: ticket.assignedBarber });
  }

  return {
    ...ticket.toObject(),
    position,
    estimatedWaitMin,
    isApproaching,
    preferredBarberInfo,
    assignedBarberInfo,
  };
};

export default {
  joinQueue,
  callNextForBarber,
  startTicketForBarber,
  completeTicketForBarber,
  setBarberBreakStatus,
  cancelTicket,
  markTicketNoShow,
  getLiveQueueSnapshot,
  getEnrichedTicketById,
  validateTransition,
};
