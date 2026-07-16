require('dotenv').config();
const app = require('./app');
const logger = require('./config/logger');
const connectDB = require('./config/db');
const { checkBucketAccess } = require('./services/s3Service');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

let server;

const shutdown = (signal, error) => {
  if (error) {
    logger.error(`${signal}: ${error.message}`);
    if (error.stack) {
      logger.error(error.stack);
    }
  } else {
    logger.info(`Received ${signal}. Shutting down gracefully.`);
  }

  if (server) {
    server.close(() => process.exit(error ? 1 : 0));
  } else {
    process.exit(error ? 1 : 0);
  }
};

const startServer = async () => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in the environment variables.');
    }

    await connectDB();
    try {
      await checkBucketAccess();
    } catch (s3Err) {
      logger.warn(`S3 bucket access check failed (non-fatal): ${s3Err.message}`);
      logger.warn('File upload/download features will not work until S3 is configured.');
    }

    server = app.listen(PORT, HOST, () => {
      logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on ${HOST}:${PORT}`);
    });
  } catch (error) {
    shutdown('Startup failure', error);
  }
};

process.on('unhandledRejection', (error) => shutdown('Unhandled rejection', error));
process.on('uncaughtException', (error) => shutdown('Uncaught exception', error));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
