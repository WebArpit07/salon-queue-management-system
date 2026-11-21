import { io as Client } from 'socket.io-client';
import { connectDB, closeDB } from '../config/db.js';
import { Service, Barber, QueueTicket, SalonConfig, DailyCounter } from '../models/index.js';
import { autoSeedIfEmpty, seedData } from '../seed/seedData.js';
import { startServer, httpServer } from '../index.js';
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
  validateTransition,
} from '../services/queueEngine.js';
import { getIstDateKey } from '../utils/salonTime.js';

const TEST_PORT = 5000;
const SERVER_URL = `http://localhost:${TEST_PORT}`;

const runEngineVerification = async () => {
  console.log('====================================================');
  console.log('🧪 Starting Automated Queue Engine & Socket.IO Tests');
  console.log('====================================================');

  await connectDB();
  await seedData();

  // Wait for HTTP server to be listening
  await new Promise((resolve) => {
    if (httpServer.listening) return resolve();
    httpServer.on('listening', resolve);
    setTimeout(resolve, 1500);
  });

  const dateKey = getIstDateKey();

  // Clean any previous tickets for this test run
  await QueueTicket.deleteMany({ dateKey });
  await DailyCounter.deleteMany({ _id: `ticket_${dateKey}` });
  await Barber.updateMany({}, { $set: { status: 'available', currentTicketId: null, onDuty: true } });

  // Ensure queue is open during test execution
  await SalonConfig.findOneAndUpdate(
    { key: 'default' },
    { $set: { isQueueOpen: true, openTime: '00:00', closeTime: '23:59' } },
    { upsert: true }
  );

  const services = await Service.find({ isActive: true }).sort({ sortOrder: 1 });
  if (services.length < 2) {
    throw new Error('Expected at least 2 services in seeded database');
  }

  // ---------------------------------------------------------------
  // Test 1: Joining with 2 services calculates duration & price
  // ---------------------------------------------------------------
  console.log('\n[Test 1] Testing Service Duration & Price Calculation on Join...');
  const s1 = services[0]; // Haircut (30 min, 150)
  const s2 = services[1]; // Beard Trim (15 min, 80)
  const expectedDuration = s1.durationMin + s2.durationMin;
  const expectedPrice = s1.price + s2.price;

  const join1 = await joinQueue({
    customerName: 'Devang Patel',
    phone: '9876543210',
    serviceIds: [s1._id.toString(), s2._id.toString()],
    preferredBarber: 'ravi',
    source: 'online',
  });

  if (join1.isExisting) throw new Error('Expected new ticket, got existing');
  if (join1.ticket.token !== 'S-1') throw new Error(`Expected token S-1, got ${join1.ticket.token}`);
  if (join1.ticket.totalDurationMin !== expectedDuration) {
    throw new Error(`Expected duration ${expectedDuration}, got ${join1.ticket.totalDurationMin}`);
  }
  if (join1.ticket.totalPrice !== expectedPrice) {
    throw new Error(`Expected price ${expectedPrice}, got ${join1.ticket.totalPrice}`);
  }
  console.log('  ✅ Ticket S-1 created with exact duration (45m) and price (₹230)');

  // ---------------------------------------------------------------
  // Test 2: Duplicate Active Phone Guard
  // ---------------------------------------------------------------
  console.log('\n[Test 2] Testing Duplicate Active Phone Guard...');
  const dupJoin = await joinQueue({
    customerName: 'Devang Patel Duplicate',
    phone: '9876543210',
    serviceIds: [s1._id.toString()],
    preferredBarber: 'any',
    source: 'online',
  });

  if (!dupJoin.isExisting) throw new Error('Expected duplicate guard to return existing ticket');
  if (dupJoin.ticket.token !== 'S-1') throw new Error(`Expected existing token S-1, got ${dupJoin.ticket.token}`);
  console.log('  ✅ Duplicate active phone returned existing S-1 ticket without creating a new token');

  // ---------------------------------------------------------------
  // Test 3: Barber Preference Rule
  // Customer 1 (S-1) preferred 'ravi'.
  // Now Customer 2 (S-2) joins with preferred 'any'.
  // If Amit calls next, he MUST get Customer 2 (S-2), NOT Customer 1 (S-1).
  // ---------------------------------------------------------------
  console.log('\n[Test 3] Testing Barber Preference Matching...');
  const join2 = await joinQueue({
    customerName: 'Bhavesh Shah',
    phone: '9876543211',
    serviceIds: [s1._id.toString()],
    preferredBarber: 'any',
    source: 'online',
  });
  if (join2.ticket.token !== 'S-2') throw new Error(`Expected token S-2, got ${join2.ticket.token}`);

  const amitCall = await callNextForBarber('amit');
  if (amitCall.ticket.token !== 'S-2') {
    throw new Error(`Barber Preference Rule Violated: Amit called ${amitCall.ticket.token} instead of S-2`);
  }
  if (amitCall.ticket.assignedBarber !== 'amit') {
    throw new Error(`Expected assignedBarber 'amit', got ${amitCall.ticket.assignedBarber}`);
  }
  console.log('  ✅ Amit correctly called S-2 (preferred: any) and skipped S-1 (strictly preferred: ravi)');

  // ---------------------------------------------------------------
  // Test 4: Forward-Only State Machine & Backwards Transition Rejection
  // ---------------------------------------------------------------
  console.log('\n[Test 4] Testing Forward-Only State Transitions & Rejections...');
  // S-2 is 'called'. Start service -> 'in_chair'
  const startResult = await startTicketForBarber('amit');
  if (startResult.ticket.status !== 'in_chair') {
    throw new Error(`Expected status in_chair, got ${startResult.ticket.status}`);
  }
  console.log('  ✅ Transitioned S-2 from called -> in_chair');

  // Complete service -> 'done'
  const doneResult = await completeTicketForBarber('amit');
  if (doneResult.ticket.status !== 'done') {
    throw new Error(`Expected status done, got ${doneResult.ticket.status}`);
  }
  console.log('  ✅ Transitioned S-2 from in_chair -> done');

  // Verify backward transition throws 400
  let backwardFailed = false;
  try {
    validateTransition('done', 'waiting');
  } catch (err) {
    if (err.statusCode === 400) backwardFailed = true;
  }
  if (!backwardFailed) throw new Error('Expected done -> waiting transition to fail with 400');
  console.log('  ✅ Invalid backwards transition (done -> waiting) correctly rejected with HTTP 400');

  // ---------------------------------------------------------------
  // Test 5: No-Show Handling & Re-Queueing at End of Line
  // ---------------------------------------------------------------
  console.log('\n[Test 5] Testing No-Show Transition & End-of-Line Re-Queueing...');
  // Now Ravi calls S-1 (his dedicated ticket)
  const raviCall = await callNextForBarber('ravi');
  if (raviCall.ticket.token !== 'S-1') throw new Error(`Expected Ravi to call S-1, got ${raviCall.ticket.token}`);

  // Customer is a no-show
  const noShowResult = await markTicketNoShow(raviCall.ticket._id);
  if (noShowResult.status !== 'no_show') throw new Error(`Expected status no_show, got ${noShowResult.status}`);

  // Confirm Ravi is freed
  const raviBarber = await Barber.findOne({ slug: 'ravi' });
  if (raviBarber.status !== 'available' || raviBarber.currentTicketId !== null) {
    throw new Error('Expected Ravi to be available after no-show');
  }
  console.log('  ✅ Marked S-1 as no-show and freed barber Ravi to available');

  // Re-joining with same phone number should now create a brand-new token at the end of the line
  const reJoin = await joinQueue({
    customerName: 'Devang Patel Rejoined',
    phone: '9876543210',
    serviceIds: [s1._id.toString()],
    preferredBarber: 'any',
    source: 'online',
  });
  if (reJoin.isExisting) throw new Error('Expected new ticket after previous no-show, but got existing');
  if (reJoin.ticket.token !== 'S-3') throw new Error(`Expected new token S-3 at end of queue, got ${reJoin.ticket.token}`);
  console.log('  ✅ Re-joined customer placed at the end of the queue with new token S-3');

  // ---------------------------------------------------------------
  // Test 6: Snapshot & Wait Time Math
  // ---------------------------------------------------------------
  console.log('\n[Test 6] Testing Live Queue Snapshot Calculations...');
  const snapshot = await getLiveQueueSnapshot();
  if (!Array.isArray(snapshot.waiting) || snapshot.waiting.length !== 1) {
    throw new Error(`Expected 1 waiting ticket, got ${snapshot.waiting.length}`);
  }
  if (snapshot.waiting[0].position !== 1) {
    throw new Error(`Expected waiting ticket position 1, got ${snapshot.waiting[0].position}`);
  }
  if (snapshot.todayStats.servedCount !== 1) {
    throw new Error(`Expected servedCount 1, got ${snapshot.todayStats.servedCount}`);
  }
  if (snapshot.todayStats.noShowCount !== 1) {
    throw new Error(`Expected noShowCount 1, got ${snapshot.todayStats.noShowCount}`);
  }
  console.log('  ✅ Live snapshot stats and position calculation verified');

  // ---------------------------------------------------------------
  // Test 7: Socket.IO Real-Time Synchronization via HTTP Endpoints
  // ---------------------------------------------------------------
  console.log('\n[Test 7] Testing Socket.IO Real-Time Broadcasts...');
  const socketClient = Client(SERVER_URL, {
    transports: ['websocket'],
    reconnection: false,
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Socket.IO connection timeout')), 4000);
    socketClient.on('connect', () => {
      clearTimeout(timeout);
      resolve();
    });
  });

  let receivedQueueUpdate = false;
  let receivedTicketCalled = false;

  socketClient.on('queue:updated', (data) => {
    if (data && data.todayStats) receivedQueueUpdate = true;
  });

  socketClient.on('ticket:called', (data) => {
    if (data && data.token === 'S-3') receivedTicketCalled = true;
  });

  // Trigger call-next via REST API to ensure Socket.IO fires from route
  const callRes = await fetch(`${SERVER_URL}/api/queue/barber/ravi/call-next`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-staff-pin': '1234',
    },
  });
  const callJson = await callRes.json();
  if (callRes.status !== 200 || !callJson.success) {
    throw new Error(`Call-next HTTP failed: ${JSON.stringify(callJson)}`);
  }

  // Allow socket events to propagate
  await new Promise((r) => setTimeout(r, 600));

  if (!receivedQueueUpdate) throw new Error("Socket client did not receive 'queue:updated' event");
  if (!receivedTicketCalled) throw new Error("Socket client did not receive 'ticket:called' event for S-3");
  console.log("  ✅ Socket.IO successfully broadcasted 'queue:updated' and 'ticket:called'");

  socketClient.disconnect();

  // ---------------------------------------------------------------
  // Test 8: Staff PIN Middleware Verification
  // ---------------------------------------------------------------
  console.log('\n[Test 8] Testing Staff PIN Middleware Protection...');
  // Bad PIN
  const unauthRes = await fetch(`${SERVER_URL}/api/queue/walkin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-staff-pin': '9999',
    },
    body: JSON.stringify({
      customerName: 'Walkin Test',
      phone: '9876543299',
      serviceIds: [s1._id.toString()],
    }),
  });
  if (unauthRes.status !== 401) {
    throw new Error(`Expected 401 for bad PIN, got ${unauthRes.status}`);
  }

  // Good PIN
  const authRes = await fetch(`${SERVER_URL}/api/queue/walkin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-staff-pin': '1234',
    },
    body: JSON.stringify({
      customerName: 'Walkin Test',
      phone: '9876543299',
      serviceIds: [s1._id.toString()],
      preferredBarber: 'any',
    }),
  });
  if (authRes.status !== 201) {
    throw new Error(`Expected 201 for valid PIN, got ${authRes.status}`);
  }
  console.log('  ✅ Staff PIN middleware rejected 9999 (401) and accepted 1234 (201)');

  console.log('\n====================================================');
  console.log('🎉 ALL 8 TEST SUITES PASSED FLAWLESSLY!');
  console.log('====================================================');

  await closeDB();
  process.exit(0);
};

runEngineVerification().catch(async (err) => {
  console.error('\n❌ TEST ENGINE RUN FAILED:', err);
  await closeDB().catch(() => {});
  process.exit(1);
});
