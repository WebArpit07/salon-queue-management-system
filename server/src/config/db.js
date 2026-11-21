import mongoose from 'mongoose';

let memoryServer = null;

/**
 * Connect to MongoDB with automatic in-memory fallback if standard local MongoDB is not running.
 */
export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/salon_queue';

  try {
    // Attempt standard connection with a short timeout
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[Database] Standard MongoDB connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`[Database] Standard MongoDB connection failed (${error.message}).`);
    console.log(`[Database] Initializing embedded in-memory MongoDB fallback...`);

    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'salon_queue',
        },
      });
      const uri = memoryServer.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`[Database] Embedded In-Memory MongoDB connected successfully: ${conn.connection.host}`);
      return true;
    } catch (memErr) {
      console.error(`[Database] Failed to start embedded in-memory MongoDB:`, memErr);
      return false;
    }
  }
};

/**
 * Check active MongoDB connection status
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

export const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
  }
};

export default connectDB;
