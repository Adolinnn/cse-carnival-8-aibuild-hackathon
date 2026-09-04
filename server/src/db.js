import mongoose from 'mongoose';
import { runSeed } from './seed.js';

let isConnected = false;
let mongod = null;

export async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusos';

  mongoose.connection.on('connected', () => {
    isConnected = true;
  });

  mongoose.connection.on('error', (err) => {
    console.error('[db] connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[db] disconnected from MongoDB');
  });

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 2000,
    });
    isConnected = true;
    console.log(`[db] connected successfully to ${uri}`);
    return mongoose.connection;
  } catch (err) {
    console.warn(`[db] direct Mongo connection to ${uri} failed (${err.message}). Starting embedded MongoMemoryServer...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      console.log(`[db] MongoMemoryServer started at ${memUri}`);
      await mongoose.connect(memUri);
      isConnected = true;
      console.log(`[db] connected to embedded memory database, auto-seeding initial dataset...`);
      await runSeed();
      return mongoose.connection;
    } catch (memErr) {
      console.error('[db] failed to start embedded MongoMemoryServer:', memErr);
      throw memErr;
    }
  }
}

export async function closeDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close(false);
  }
  if (mongod) {
    await mongod.stop();
  }
  isConnected = false;
}
