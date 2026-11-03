import mongoose from 'mongoose';

let memoryServer: any = null;

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log('Connecting to provided MongoDB URI...');
      await mongoose.connect(uri);
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
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};

