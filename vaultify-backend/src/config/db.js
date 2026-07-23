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
    throw new Error('In-memory MongoDB is no longer supported (mongodb-memory-server removed to fix deployment OOM). Please provide a valid MongoDB URI.');
  }

  try {
    await mongoose.connect(mongoUri);
    logger.info('MongoDB connected successfully.');
  } catch (error) {
    logger.warn(`Could not connect to database at ${mongoUri.split('@').pop() || mongoUri}.`);
    logger.warn(`Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;

