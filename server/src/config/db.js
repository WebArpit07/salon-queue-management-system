
import mongoose from 'mongoose';

/**
 * Connect to MongoDB Atlas.
 * Production must use a persistent external database.
 */
export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('[Database] MONGO_URI environment variable is missing.');
    return false;
  }

  try {
    console.log('[Database] Connecting to MongoDB Atlas...');

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 10000,
    });

    console.log(
      `[Database] Connected successfully: ${conn.connection.host}`
    );

    console.log(
      `[Database] Active database: ${conn.connection.name}`
    );

    return true;
  } catch (error) {
    console.error('[Database] MongoDB connection failed.');
    console.error('[Database] Error name:', error.name);
    console.error('[Database] Error message:', error.message);
    console.error('[Database] Error code:', error.code || 'N/A');

    return false;
  }
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
};

export default connectDB;
