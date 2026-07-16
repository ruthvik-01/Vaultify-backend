const { initializeApp, getApps, cert, applicationDefault } = require('firebase-admin');
const logger = require('./logger');

let firebaseApp = null;

try {
  if (getApps().length === 0) {
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      firebaseApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
      logger.info('Firebase Admin initialized successfully using environment variables.');
    } else {
      firebaseApp = initializeApp({
        credential: applicationDefault(),
      });
      logger.info('Firebase Admin initialized successfully using Application Default Credentials.');
    }
  } else {
    firebaseApp = getApps()[0];
  }
} catch (error) {
  logger.error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
}

module.exports = firebaseApp;
