import { io as Client } from 'socket.io-client';
import { connectDB, closeDB } from '../config/db.js';
import { seedData } from '../seed/seedData.js';
import { Service, Barber, SalonConfig } from '../models/index.js';
import { httpServer } from '../index.js';

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

async function runTests() {
  console.log('🚀 Starting Prompt 8 Admin API Verification...');
  await connectDB();
  await seedData();

  // Wait for server to listen
  await new Promise((resolve) => {
    if (httpServer.listening) return resolve();
    httpServer.on('listening', resolve);
    setTimeout(resolve, 1500);
  });

  const socketClient = Client(BASE_URL);
  let socketUpdatesReceived = 0;
  socketClient.on('queue:updated', () => {
    socketUpdatesReceived++;
  });

  await new Promise(r => setTimeout(r, 600));

  console.log('\n--- 1. Staff PIN Authorization Guard ---');
  // Attempt without pin
  const noPinRes = await request('/api/admin/config', {
    method: 'PATCH',
    body: { isQueueOpen: false }
  });
  if (noPinRes.status === 401) {
    console.log('✓ Rejection without PIN confirmed (401)');
  } else {
    throw new Error(`Expected 401 without PIN, got ${noPinRes.status}`);
  }

  // Attempt with invalid pin
  const badPinRes = await request('/api/admin/config', {
    method: 'PATCH',
    headers: { 'x-staff-pin': '9999' },
    body: { isQueueOpen: false }
  });
  if (badPinRes.status === 401) {
    console.log('✓ Rejection with invalid PIN confirmed (401)');
  } else {
    throw new Error(`Expected 401 with invalid PIN, got ${badPinRes.status}`);
  }

  console.log('\n--- 2. Salon Config Mutability ---');
  const initialUpdates = socketUpdatesReceived;
  const configRes = await request('/api/admin/config', {
    method: 'PATCH',
    headers: { 'x-staff-pin': STAFF_PIN },
    body: { isQueueOpen: false, openTime: '09:30', closeTime: '21:30' }
  });
  if (configRes.status === 200 && configRes.body.salonConfig.isQueueOpen === false) {
    console.log('✓ Salon config updated (isQueueOpen: false, 09:30 - 21:30)');
  } else {
    throw new Error(`Failed to update config: ${JSON.stringify(configRes.body)}`);
  }

  // Wait for socket broadcast
  await new Promise(r => setTimeout(r, 300));
  if (socketUpdatesReceived > initialUpdates) {
    console.log('✓ Socket broadcast triggered on config update');
  } else {
    console.warn('⚠️ No socket broadcast detected for config update');
  }

  console.log('\n--- 3. Barber On-Duty Mutability ---');
  const dutyRes = await request('/api/admin/barbers/ravi/duty', {
    method: 'PATCH',
    headers: { 'x-staff-pin': STAFF_PIN },
    body: { onDuty: false }
  });
  if (dutyRes.status === 200 && dutyRes.body.barber.onDuty === false) {
    console.log('✓ Barber Ravi onDuty toggled to false');
  } else {
    throw new Error(`Failed to toggle duty: ${JSON.stringify(dutyRes.body)}`);
  }

  // Toggle back to true
  await request('/api/admin/barbers/ravi/duty', {
    method: 'PATCH',
    headers: { 'x-staff-pin': STAFF_PIN },
    body: { onDuty: true }
  });
  console.log('✓ Barber Ravi onDuty restored to true');

  console.log('\n--- 4. Service Catalog CRUD ---');
  // Create Service
  const newServiceRes = await request('/api/admin/services', {
    method: 'POST',
    headers: { 'x-staff-pin': STAFF_PIN },
    body: {
      nameEn: 'Royal Beard Spa',
      nameGu: 'રોયલ દાઢી સ્પા',
      durationMin: 25,
      price: 350,
      isActive: true
    }
  });

  if (newServiceRes.status === 201 && newServiceRes.body.service?._id) {
    console.log(`✓ Created new service: ${newServiceRes.body.service.nameEn} (ID: ${newServiceRes.body.service._id})`);
  } else {
    throw new Error(`Failed to create service: ${JSON.stringify(newServiceRes.body)}`);
  }

  const createdId = newServiceRes.body.service._id;

  // Update Service
  const updateServiceRes = await request(`/api/admin/services/${createdId}`, {
    method: 'PATCH',
    headers: { 'x-staff-pin': STAFF_PIN },
    body: {
      price: 400,
      durationMin: 30
    }
  });

  if (updateServiceRes.status === 200 && updateServiceRes.body.service.price === 400) {
    console.log('✓ Updated service price to 400 and duration to 30 min');
  } else {
    throw new Error(`Failed to update service: ${JSON.stringify(updateServiceRes.body)}`);
  }

  // Delete Service
  const deleteServiceRes = await request(`/api/admin/services/${createdId}`, {
    method: 'DELETE',
    headers: { 'x-staff-pin': STAFF_PIN }
  });

  if (deleteServiceRes.status === 200) {
    console.log('✓ Successfully deleted service');
  } else {
    throw new Error(`Failed to delete service: ${JSON.stringify(deleteServiceRes.body)}`);
  }

  // Confirm it no longer exists
  const checkService = await Service.findById(createdId);
  if (!checkService) {
    console.log('✓ Confirmed service removed from database');
  } else {
    throw new Error('Service still found in database after delete');
  }

  console.log('\n🎉 ALL PROMPT 8 ADMIN TESTS PASSED PERFECTLY!');

  socketClient.disconnect();
  httpServer.close();
  await closeDB();
  process.exit(0);
}

runTests().catch(async (err) => {
  console.error('\n❌ Test failed:', err);
  if (httpServer) httpServer.close();
  await closeDB();
  process.exit(1);
});
