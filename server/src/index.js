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

dotenv.config();

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 5000;

// Parse multi-origin CLIENT_URL (supports comma-separated URLs)
const rawClientUrls = process.env.CLIENT_URL || 'http://localhost:5173';
const configuredOrigins = rawClientUrls
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

// Default development origins
const defaultDevOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000'];
const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultDevOrigins]));

const corsOriginHandler = (origin, callback) => {
  if (!origin) return callback(null, true);

  const normalized = origin.replace(/\/$/, '');
  const isDirectMatch = allowedOrigins.includes(normalized);
  const isWildcardAllowed = allowedOrigins.includes('*');
  const isVercelPreview = normalized.endsWith('.vercel.app');
  const isLocalDev = normalized.includes('localhost') || normalized.includes('127.0.0.1');

  if (isDirectMatch || isWildcardAllowed || isVercelPreview || isLocalDev) {
    return callback(null, true);
  }

  console.warn(`[CORS] Request from unlisted origin: ${origin}`);
  return callback(null, true);
};

const corsOptions = {
  origin: corsOriginHandler,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-staff-pin'],
  credentials: true,
};

// Socket.IO configuration with CORS support
const io = new Server(httpServer, {
  cors: corsOptions,
});

// Store io on app for route access
app.set('io', io);

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Health check endpoint
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

// Base API Routes
app.use('/api', apiRoutes);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
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

// Attach socket handlers
registerSocketHandlers(io);

/**
 * Initialize database connection, seed initial records, and start server
 */
export const startServer = async () => {
  const isDbConnected = await connectDB();

  if (isDbConnected) {
    await autoSeedIfEmpty();
  }

  return new Promise((resolve) => {
    httpServer.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`💈 Salon Queue Server active on port: ${PORT}`);
      console.log(`🌐 Health endpoint: http://localhost:${PORT}/api/health`);
      console.log(`🚀 Bootstrap endpoint: http://localhost:${PORT}/api/bootstrap`);
      console.log(`⚡ Socket.IO listening for client events`);
      console.log(`====================================================`);
      resolve({ app, httpServer, io });
    });
  });
};

// Start automatically when run directly
startServer().catch((err) => {
  console.error('[Server Startup Fatal Error]:', err);
});

export { app, httpServer, io };
