
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure dotenv is loaded even when scripts are executed from root or subfolders
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

let memoryServer = null;
let connectingPromise = null;

/**
 * Connect to MongoDB Atlas or local MongoDB with in-memory fallback for tests/local dev.
 */
export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = (async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/salon_queue';

    try {
      console.log('[Database] Connecting to MongoDB...');
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 5000,
      });

      console.log(`[Database] Connected successfully: ${conn.connection.host}`);
      console.log(`[Database] Active database: ${conn.connection.name}`);
      return true;
    } catch (error) {
      console.warn(`[Database] MongoDB connection failed (${error.message}).`);

      // In production, log error and do not spin up in-memory server
      if (process.env.NODE_ENV === 'production' && process.env.MONGO_URI) {
        console.error('[Database] Production MongoDB connection failure.');
        return false;
      }

      console.log('[Database] Initializing embedded in-memory MongoDB fallback...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        if (!memoryServer) {
          memoryServer = await MongoMemoryServer.create({
            instance: {
              dbName: 'salon_queue',
            },
          });
        }
        const uri = memoryServer.getUri();
        const conn = await mongoose.connect(uri);
        console.log(`[Database] Embedded in-memory MongoDB connected: ${conn.connection.host}`);
        return true;
      } catch (memErr) {
        console.error('[Database] Failed to initialize in-memory fallback:', memErr);
        return false;
      }
    } finally {
      connectingPromise = null;
    }
  })();

  return connectingPromise;
};

/**
 * Monitor database connection changes.
 */
mongoose.connection.on('connected', () => {
  console.log('[Database] Connection established.');
});

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB disconnected.');
});

mongoose.connection.on('error', (error) => {
  console.error('[Database] Runtime error:', error.message);
});

/**
 * Return current database connection status.
 */
export const getDBStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return states[mongoose.connection.readyState] || 'unknown';
};

/**
 * Close database connection.
 */
export const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
  }
};

export default connectDB;
