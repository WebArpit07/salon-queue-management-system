import { io } from 'socket.io-client';

const rawSocketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = rawSocketUrl.replace(/\/$/, '');

class SocketService {
  constructor() {
    this.socket = null;
  }

  getSocket() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        console.log(`[Socket.IO] Connected to salon server (ID: ${this.socket.id})`);
      });

      this.socket.on('disconnect', (reason) => {
        console.log(`[Socket.IO] Disconnected from server: ${reason}`);
      });

      this.socket.on('connect_error', (error) => {
        console.warn(`[Socket.IO] Connection error: ${error.message}`);
      });
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
export const socket = socketService.getSocket();
export default socket;
