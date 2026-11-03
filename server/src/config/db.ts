import mongoose from 'mongoose';

let memoryServer: any = null;
let connectPromise: Promise<void> | null = null;

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    const uri = process.env.MONGODB_URI;

    if (uri && uri.trim() !== '') {
      try {
        console.log('Connecting to provided MongoDB URI...');
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ Connected to MongoDB successfully.');
        return;
      } catch (err) {
        console.warn('⚠️ Failed to connect to MONGODB_URI. Falling back to in-memory database for development/testing...');
      }
    }

    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      console.log(`Connecting to in-memory MongoDB at: ${memUri}`);
      await mongoose.connect(memUri);
      console.log('✅ Connected to in-memory MongoDB database (development mode).');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  })();

  return connectPromise;
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
  connectPromise = null;
};

