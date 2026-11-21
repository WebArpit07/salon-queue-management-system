
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { connectDB, getDBStatus } from './config/db.js';
import { autoSeedIfEmpty } from './seed/seedData.js';
import apiRoutes from './routes/index.js';
import { registerSocketHandlers } from './sockets/index.js';

// Load environment variables
dotenv.config();

// Initialize Express application
const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 5000;

// ============================================
// CORS CONFIGURATION
// ============================================

// Parse multi-origin CLIENT_URL
const rawClientUrls =
  process.env.CLIENT_URL || 'http://localhost:5173';

const configuredOrigins = rawClientUrls
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

// Default development origins
const defaultDevOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
];

const allowedOrigins = Array.from(
  new Set([...configuredOrigins, ...defaultDevOrigins])
);

const corsOriginHandler = (origin, callback) => {
  if (!origin) {
    return callback(null, true);
  }

  const normalized = origin.replace(/\/$/, '');

  const isDirectMatch = allowedOrigins.includes(normalized);
  const isWildcardAllowed = allowedOrigins.includes('*');
  const isVercelPreview = normalized.endsWith('.vercel.app');
  const isLocalDev =
    normalized.includes('localhost') ||
    normalized.includes('127.0.0.1');

  if (
    isDirectMatch ||
    isWildcardAllowed ||
    isVercelPreview ||
    isLocalDev
  ) {
    return callback(null, true);
  }

  console.warn(`[CORS] Request from unlisted origin: ${origin}`);

  return callback(null, true);
};

const corsOptions = {
  origin: corsOriginHandler,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-staff-pin',
  ],
  credentials: true,
};

// ============================================
// SOCKET.IO CONFIGURATION
// ============================================

const io = new Server(httpServer, {
  cors: corsOptions,
});

// Make Socket.IO available to API routes
app.set('io', io);

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  res.status(200).json({
    status: 'ok',
    system: 'Salon Queue Management System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: isDbConnected ? 'connected' : 'disconnected',
    databaseState: getDBStatus(),
    socketIo: 'initialized',
  });
});

// ============================================
// API ROUTES
// ============================================

app.use('/api', apiRoutes);

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  const statusCode =
    err.statusCode ||
    (err.name === 'ValidationError' ? 400 : 500);

  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    console.error('[Server Error]:', err);
  }

  res.status(statusCode).json({
    error: err.name || 'Error',
    message,
    details: err.details || null,
  });
});

// ============================================
// SOCKET HANDLERS
// ============================================

registerSocketHandlers(io);

// ============================================
// SERVER STARTUP
// ============================================

/**
 * Initialize database connection,
 * seed initial records, and start server.
 */
export const startServer = async () => {
  console.log('');
  console.log('========================================');
  console.log('[Startup] Initializing Salon Queue API');
  console.log('========================================');

  // Step 1: Connect to MongoDB
  let isDbConnected = false;

  try {
    console.log('[Startup] Connecting to MongoDB...');

    isDbConnected = await connectDB();

    console.log(
      `[Startup] MongoDB status: ${
        isDbConnected ? 'CONNECTED' : 'DISCONNECTED'
      }`
    );
  } catch (error) {
    console.error('[Startup] MongoDB initialization failed.');
    console.error('[Startup] Error:', error.message);
  }

  // Step 2: Seed initial data if database is connected
  if (isDbConnected) {
    try {
      console.log('[Startup] Checking initial seed data...');

      await autoSeedIfEmpty();

      console.log('[Startup] Seed data check completed.');
    } catch (error) {
      console.error('[Startup] Seed initialization failed:', error);
    }
  } else {
    console.error(
      '[Startup] WARNING: Starting API without database connection.'
    );
  }

  // Step 3: Start HTTP server
  return new Promise((resolve, reject) => {
    httpServer.once('error', reject);

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('========================================');
      console.log('[Startup] Salon Queue API is running.');
      console.log(`[Startup] Port: ${PORT}`);
      console.log(`[Startup] Database: ${getDBStatus()}`);
      console.log(`[Startup] Health: /api/health`);
      console.log(`[Startup] Bootstrap: /api/bootstrap`);
      console.log('[Startup] Socket.IO initialized.');
      console.log('========================================');
      console.log('');

      resolve({
        app,
        httpServer,
        io,
      });
    });
  });
};

// ============================================
// AUTOMATIC SERVER START
// ============================================

startServer().catch((error) => {
  console.error('[Server Startup Fatal Error]:', error);
  process.exit(1);
});

// Export application instances
export { app, httpServer, io };
