const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    logger.info('Reusing existing MongoDB connection.');
    return;
  }

  let mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in the environment variables.');
  }

  mongoose.set('strictQuery', false);

  if (mongoUri.toLowerCase() === 'in-memory' || mongoUri.toLowerCase() === 'memory') {
    logger.info('Initializing in-memory MongoDB server for development...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
      logger.info(`In-memory MongoDB server started at: ${mongoUri}`);
    } catch (err) {
      logger.error('Failed to start in-memory MongoDB server:', err);
      throw err;
    }
  }

  try {
    await mongoose.connect(mongoUri);
    logger.info('MongoDB connected successfully.');
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      logger.warn(`Could not connect to database at ${mongoUri.split('@').pop() || mongoUri}.`);
      logger.warn(`Error: ${error.message}`);
      logger.warn('Falling back to in-memory MongoDB server for local development...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        const fallbackUri = mongoServer.getUri();
        await mongoose.connect(fallbackUri);
        logger.info(`Fallback in-memory MongoDB connected successfully at: ${fallbackUri}`);
        return;
      } catch (fallbackErr) {
        logger.error('In-memory MongoDB fallback failed:', fallbackErr);
      }
    }
    throw error;
  }
};

module.exports = connectDB;

