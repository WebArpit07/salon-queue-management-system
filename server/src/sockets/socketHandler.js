import { getLiveQueueSnapshot } from '../services/queueEngine.js';

/**
 * Broadcasts fresh queue snapshot to all connected clients and triggers targeted events
 * @param {import('socket.io').Server} io
 * @param {object|null} eventMeta - e.g. { type: 'ticket_called', ticketId, token, customerName, assignedBarber, barberName }
 */
export const broadcastQueueUpdate = async (io, eventMeta = null) => {
  if (!io) return;

  try {
    const snapshot = await getLiveQueueSnapshot();
    io.emit('queue:updated', snapshot);

    if (eventMeta?.type === 'ticket_called') {
      io.emit('ticket:called', {
        ticketId: eventMeta.ticketId,
        token: eventMeta.token,
        customerName: eventMeta.customerName,
        assignedBarber: eventMeta.assignedBarber,
        barberName: eventMeta.barberName,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[Socket] Error broadcasting queue update:', error.message);
  }
};

/**
 * Register primary socket connection and events
 */
export const registerSocketHandlers = (io) => {
  io.on('connection', async (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Immediately hydrate client with live queue snapshot
    try {
      const snapshot = await getLiveQueueSnapshot();
      socket.emit('queue:updated', snapshot);
    } catch (err) {
      console.warn(`[Socket] Could not send initial snapshot to ${socket.id}:`, err.message);
    }

    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} (${reason})`);
    });
  });
};

export default {
  registerSocketHandlers,
  broadcastQueueUpdate,
};
