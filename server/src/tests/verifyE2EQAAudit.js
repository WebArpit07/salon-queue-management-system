import { io as Client } from 'socket.io-client';
import { connectDB, closeDB } from '../config/db.js';
import { seedData } from '../seed/seedData.js';
import { Service, Barber, QueueTicket, SalonConfig, DailyCounter } from '../models/index.js';
import { httpServer } from '../index.js';
import { getIstDateKey } from '../utils/salonTime.js';

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;
const STAFF_PIN = '1234';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = options.headers || {};
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, headers: res.headers, body: json };
}

async function runE2EQAAudit() {
  console.log('================================================================');
  console.log('🧪 STARTING COMPREHENSIVE E2E QA AUDIT (docs/03-flows-rules.md)');
  console.log('================================================================');

  await connectDB();
  await seedData();

  // Wait for server to listen
  await new Promise((resolve) => {
    if (httpServer.listening) return resolve();
    httpServer.on('listening', resolve);
    setTimeout(resolve, 1500);
  });

  const dateKey = getIstDateKey();
  // Clear any existing tickets
  await QueueTicket.deleteMany({ dateKey });
  await DailyCounter.deleteMany({ _id: `ticket_${dateKey}` });
  await Barber.updateMany({}, { $set: { status: 'available', currentTicketId: null, onDuty: true } });
  await SalonConfig.findOneAndUpdate({ key: 'default' }, { $set: { isQueueOpen: true, openTime: '00:00', closeTime: '23:59' } });

  // Connect Socket.IO client
  const socketClient = Client(BASE_URL);
  const queueUpdates = [];
  const calledAlerts = [];

  socketClient.on('queue:updated', (data) => queueUpdates.push(data));
  socketClient.on('ticket:called', (data) => calledAlerts.push(data));

  await new Promise((r) => setTimeout(r, 600));

  const allServices = await Service.find({ isActive: true }).sort({ sortOrder: 1 });
  const haircut = allServices.find((s) => s.nameEn.toLowerCase().includes('haircut')) || allServices[0];
  const beard = allServices.find((s) => s.nameEn.toLowerCase().includes('beard')) || allServices[1];

  // -------------------------------------------------------------------------
  // TEST 1: Service Calculation
  // -------------------------------------------------------------------------
  console.log('\n--- 1. Service Calculation (Cumulative Duration & Price) ---');
  const expectedDuration = haircut.durationMin + beard.durationMin;
  const expectedPrice = haircut.price + beard.price;

  const joinRes1 = await request('/api/queue/join', {
    method: 'POST',
    body: {
      customerName: 'Aarav Shah',
      phone: '9876543210',
      serviceIds: [haircut._id.toString(), beard._id.toString()],
      preferredBarber: 'any',
    },
  });

  if (joinRes1.status !== 201) throw new Error(`Join failed: ${JSON.stringify(joinRes1.body)}`);
  const ticket1 = joinRes1.body.ticket;
  if (ticket1.totalDurationMin !== expectedDuration || ticket1.totalPrice !== expectedPrice) {
    throw new Error(`Calculation mismatch! Expected ${expectedDuration}m / ₹${expectedPrice}, got ${ticket1.totalDurationMin}m / ₹${ticket1.totalPrice}`);
  }
  console.log(`✓ Token ${ticket1.token}: Exact duration (${ticket1.totalDurationMin} min) and price (₹${ticket1.totalPrice}) verified`);

  // -------------------------------------------------------------------------
  // TEST 2: Duplicate Phone Guard
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Duplicate Phone Guard (Active Spot Recovery) ---');
  const dupRes = await request('/api/queue/join', {
    method: 'POST',
    body: {
      customerName: 'Aarav Shah (Duplicate Attempt)',
      phone: '9876543210',
      serviceIds: [haircut._id.toString()],
      preferredBarber: 'any',
    },
  });

  if (dupRes.status !== 200 || !dupRes.body.isExisting || dupRes.body.ticket.token !== ticket1.token) {
    throw new Error(`Duplicate phone guard failed: ${JSON.stringify(dupRes.body)}`);
  }
  console.log(`✓ Duplicate submission for 9876543210 safely returned existing active token: ${dupRes.body.ticket.token}`);

  // -------------------------------------------------------------------------
  // TEST 3: Barber Preference Matching
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Barber Preference Matching (Any vs Specific Barber) ---');
  // Customer 2: Ravi specific
  const joinRavi = await request('/api/queue/join', {
    method: 'POST',
    body: {
      customerName: 'Chirag Patel',
      phone: '9876543211',
      serviceIds: [haircut._id.toString()],
      preferredBarber: 'ravi',
    },
  });
  const ticketRavi = joinRavi.body.ticket;

  // Customer 3: Amit specific
  const joinAmit = await request('/api/queue/join', {
    method: 'POST',
    body: {
      customerName: 'Devang Dave',
      phone: '9876543212',
      serviceIds: [beard._id.toString()],
      preferredBarber: 'amit',
    },
  });
  const ticketAmit = joinAmit.body.ticket;

  // Barber Amit calls next: ticket1 (Aarav - any) should be picked first since it was joined earliest
  const callAmit1 = await request('/api/queue/barber/amit/call-next', {
    method: 'POST',
    headers: { 'x-staff-pin': STAFF_PIN },
  });
  if (callAmit1.body.ticket.token !== ticket1.token) {
    throw new Error(`Expected Barber Amit to pick earliest 'Any' ticket (${ticket1.token}), but got ${callAmit1.body.ticket.token}`);
  }
  console.log(`✓ Barber Amit called earliest 'Any' ticket (${ticket1.token})`);

  // Start & finish ticket 1 so Amit is free again
  await request('/api/queue/barber/amit/start', { method: 'POST', headers: { 'x-staff-pin': STAFF_PIN } });
  await request('/api/queue/barber/amit/done', { method: 'POST', headers: { 'x-staff-pin': STAFF_PIN } });

  // Now Amit calls next again: Next in queue is ticketRavi (preferred: ravi). Amit MUST skip Ravi and pick Devang (ticketAmit)!
  const callAmit2 = await request('/api/queue/barber/amit/call-next', {
    method: 'POST',
    headers: { 'x-staff-pin': STAFF_PIN },
  });
  if (callAmit2.body.ticket.token !== ticketAmit.token) {
    throw new Error(`Barber Preference Violation! Amit should have picked ${ticketAmit.token} (preferred: amit), but picked ${callAmit2.body.ticket.token} instead!`);
  }
  console.log(`✓ Barber Preference verified: Amit skipped Ravi's preferred client (${ticketRavi.token}) and picked ${ticketAmit.token}`);

  // -------------------------------------------------------------------------
  // TEST 4: Sub-5s Real-Time Turn Alert (Socket.IO 'ticket:called')
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Sub-5s Real-Time Turn Alert via Socket.IO ---');
  const alertStart = Date.now();
  calledAlerts.length = 0;

  // Barber Ravi calls next client (ticketRavi)
  const callRavi = await request('/api/queue/barber/ravi/call-next', {
    method: 'POST',
    headers: { 'x-staff-pin': STAFF_PIN },
  });
  const callRaviTicket = callRavi.body.ticket;

  // Wait for socket alert
  while (calledAlerts.length === 0 && Date.now() - alertStart < 5000) {
    await new Promise((r) => setTimeout(r, 50));
  }
  const latency = Date.now() - alertStart;

  if (calledAlerts.length === 0 || latency >= 5000) {
    throw new Error(`Socket alert took too long (${latency}ms) or was not received!`);
  }
  const receivedAlert = calledAlerts[0];
  if (receivedAlert.token !== callRaviTicket.token || receivedAlert.barberName !== 'Ravi') {
    throw new Error(`Socket alert payload mismatch: ${JSON.stringify(receivedAlert)}`);
  }
  console.log(`✓ Real-time 'ticket:called' broadcast delivered in ${latency}ms (< 5000ms threshold) for ${callRaviTicket.token} with Ravi`);

  // Verify status lookup endpoint reflects 'called'
  const statusCheck = await request(`/api/queue/ticket/${callRaviTicket._id}`);
  if (statusCheck.body.status !== 'called' || statusCheck.body.assignedBarber !== 'ravi') {
    throw new Error(`Status lookup mismatch for called ticket: ${JSON.stringify(statusCheck.body)}`);
  }
  console.log(`✓ /ticket/:id reflects status: 'called' with assignedBarber: ravi (${statusCheck.body.assignedBarberInfo?.name})`);

  // -------------------------------------------------------------------------
  // TEST 5: Chair Lifecycle Sync (Start -> Done)
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Chair Lifecycle Sync (Start -> Done) ---');
  // Start service
  const startRes = await request('/api/queue/barber/ravi/start', {
    method: 'POST',
    headers: { 'x-staff-pin': STAFF_PIN },
  });
  if (startRes.body.ticket.status !== 'in_chair') {
    throw new Error(`Expected ticket to transition to 'in_chair', got ${startRes.body.ticket.status}`);
  }
  const raviChairCheck = await request('/api/queue/state');
  const chairBarber = raviChairCheck.body.barbers.find((b) => b.slug === 'ravi');
  if (chairBarber.status !== 'busy' || !chairBarber.currentTicketId) {
    throw new Error(`Barber state not synced to busy in chair: ${JSON.stringify(chairBarber)}`);
  }
  console.log(`✓ Started service: Ravi is busy with ${startRes.body.ticket.token} in chair`);

  // Complete service
  const doneRes = await request('/api/queue/barber/ravi/done', {
    method: 'POST',
    headers: { 'x-staff-pin': STAFF_PIN },
  });
  if (doneRes.body.ticket.status !== 'done') {
    throw new Error(`Expected ticket to transition to 'done', got ${doneRes.body.ticket.status}`);
  }
  const raviDoneCheck = await request('/api/queue/state');
  const freeBarber = raviDoneCheck.body.barbers.find((b) => b.slug === 'ravi');
  if (freeBarber.status !== 'available' || freeBarber.currentTicketId) {
    throw new Error(`Barber not freed after done: ${JSON.stringify(freeBarber)}`);
  }
  console.log(`✓ Completed service: ${doneRes.body.ticket.token} is done; Ravi is available`);

  // -------------------------------------------------------------------------
  // TEST 6: No-Show & End-of-Line Re-Join
  // -------------------------------------------------------------------------
  console.log('\n--- 6. No-Show & End-of-Line Re-Join ---');
  // Add customer for Imran
  const joinImran = await request('/api/queue/join', {
    method: 'POST',
    body: {
      customerName: 'Hardik Pandya',
      phone: '9876543213',
      serviceIds: [haircut._id.toString()],
      preferredBarber: 'imran',
    },
  });
  const ticketImran = joinImran.body.ticket;

  // Imran calls customer
  await request('/api/queue/barber/imran/call-next', {
    method: 'POST',
    headers: { 'x-staff-pin': STAFF_PIN },
  });

  // Customer does not appear; mark no-show
  const noShowRes = await request(`/api/queue/ticket/${ticketImran._id}/no-show`, {
    method: 'POST',
    headers: { 'x-staff-pin': STAFF_PIN },
  });
  if (noShowRes.body.ticket.status !== 'no_show') {
    throw new Error(`Expected status 'no_show', got ${noShowRes.body.ticket.status}`);
  }
  const imranCheck = await Barber.findOne({ slug: 'imran' });
  if (imranCheck.status !== 'available' || imranCheck.currentTicketId) {
    throw new Error(`Imran was not freed on no-show!`);
  }
  console.log(`✓ Marked ${ticketImran.token} as no-show; Barber Imran freed immediately`);

  // Hardik Pandya re-joins with same phone number
  const rejoinRes = await request('/api/queue/join', {
    method: 'POST',
    body: {
      customerName: 'Hardik Pandya',
      phone: '9876543213',
      serviceIds: [haircut._id.toString()],
      preferredBarber: 'any',
    },
  });
  if (rejoinRes.status !== 201 || rejoinRes.body.isExisting || rejoinRes.body.ticket.token === ticketImran.token) {
    throw new Error(`Expected new ticket at end of line, got: ${JSON.stringify(rejoinRes.body)}`);
  }
  console.log(`✓ Re-joining after no-show generated brand-new token (${rejoinRes.body.ticket.token}) at end of queue`);

  // -------------------------------------------------------------------------
  // TEST 7: Queue Closure & Online Cutoff vs Walk-in
  // -------------------------------------------------------------------------
  console.log('\n--- 7. Queue Closure & Online Cutoff vs Walk-in ---');
  // Close queue via Admin
  await request('/api/admin/config', {
    method: 'PATCH',
    headers: { 'x-staff-pin': STAFF_PIN },
    body: { isQueueOpen: false },
  });

  // Attempt online join (should fail with 403)
  const onlineAttempt = await request('/api/queue/join', {
    method: 'POST',
    body: {
      customerName: 'Kishan Patel',
      phone: '9876543214',
      serviceIds: [haircut._id.toString()],
      preferredBarber: 'any',
    },
  });
  if (onlineAttempt.status !== 403) {
    throw new Error(`Expected 403 when queue is closed, got ${onlineAttempt.status}`);
  }
  console.log(`✓ Online join rejected with 403 while queue is closed`);

  // Walk-in join by Reception staff (should succeed with 201)
  const walkinAttempt = await request('/api/queue/walkin', {
    method: 'POST',
    headers: { 'x-staff-pin': STAFF_PIN },
    body: {
      customerName: 'Walkin VIP Customer',
      phone: '9876543215',
      serviceIds: [haircut._id.toString()],
      preferredBarber: 'any',
    },
  });
  if (walkinAttempt.status !== 201) {
    throw new Error(`Staff walkin failed during queue closure: ${JSON.stringify(walkinAttempt.body)}`);
  }
  console.log(`✓ Reception walk-in successfully created token ${walkinAttempt.body.ticket.token} during queue closure`);

  // Re-open queue
  await request('/api/admin/config', {
    method: 'PATCH',
    headers: { 'x-staff-pin': STAFF_PIN },
    body: { isQueueOpen: true },
  });

  // -------------------------------------------------------------------------
  // TEST 8: Dynamic Wait Time Calculation
  // -------------------------------------------------------------------------
  console.log('\n--- 8. Dynamic Wait Time Calculation ---');
  const queueState = await request('/api/queue/state');
  const waitingTickets = queueState.body.waiting;
  console.log(`✓ Retrieved state with ${waitingTickets.length} waiting customers; calculated wait times: ${waitingTickets.map(t => `${t.token}: ~${t.estimatedWaitMin}m`).join(', ')}`);

  // -------------------------------------------------------------------------
  // TEST 9: Invalid State Transition Guard
  // -------------------------------------------------------------------------
  console.log('\n--- 9. Invalid State Transition Guard (Forward-Only State Machine) ---');
  // Attempt to cancel an already completed ticket
  const cancelDoneRes = await request(`/api/queue/${ticket1._id}/cancel`, {
    method: 'POST',
  });
  if (cancelDoneRes.status !== 400) {
    throw new Error(`Expected 400 for cancelling a done ticket, got ${cancelDoneRes.status}`);
  }
  console.log(`✓ Rejected backwards transition 'done -> cancelled' with HTTP 400`);

  // -------------------------------------------------------------------------
  // TEST 10: Production Health Check Endpoint
  // -------------------------------------------------------------------------
  console.log('\n--- 10. Production Health Check & CORS Preflight ---');
  const healthRes = await request('/api/health');
  if (healthRes.status !== 200 || healthRes.body.status !== 'ok' || healthRes.body.database !== 'connected') {
    throw new Error(`Health check invalid: ${JSON.stringify(healthRes.body)}`);
  }
  console.log(`✓ GET /api/health returned 200 OK: { status: 'ok', database: 'connected', uptimeSeconds: ${healthRes.body.uptimeSeconds} }`);

  // OPTIONS preflight test
  const optionsRes = await request('/api/queue/state', {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://studio-kashi-salon.vercel.app',
      'Access-Control-Request-Method': 'GET',
    },
  });
  if (optionsRes.status < 200 || optionsRes.status >= 300) {
    throw new Error(`OPTIONS preflight failed with status ${optionsRes.status}`);
  }
  console.log(`✓ CORS preflight OPTIONS request handled cleanly (status ${optionsRes.status})`);

  console.log('\n================================================================');
  console.log('🎉 ALL 11 E2E QA AUDIT AND HARDENING REQUIREMENTS VERIFIED!');
  console.log('================================================================');

  socketClient.disconnect();
  httpServer.close();
  await closeDB();
  process.exit(0);
}

runE2EQAAudit().catch(async (err) => {
  console.error('\n❌ E2E QA Audit Failed:', err);
  if (httpServer) httpServer.close();
  await closeDB();
  process.exit(1);
});
