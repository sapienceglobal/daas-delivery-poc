import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usually stored in the backend root
const serviceAccountPath = path.resolve(__dirname, '../../firebase-adminsdk.json');

let firebaseApp = null;

export const initFirebase = () => {
  if (firebaseApp) return firebaseApp;

  try {
    // 1. First check if environment variables are provided
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      // Handle the fact that private keys might have literal \n escaped in .env
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      
      firebaseApp = admin.initializeApp({
        credential: admin.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        })
      });
      
      logger.info('Firebase Admin SDK initialized successfully via .env');
    } 
    // 2. Fallback to the json file
    else if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      firebaseApp = admin.initializeApp({
        credential: admin.cert(serviceAccount)
      });
      
      logger.info('Firebase Admin SDK initialized successfully via firebase-adminsdk.json');
    } else {
      logger.warn('Firebase credentials not found in .env or firebase-adminsdk.json. Push notifications disabled.');
    }
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK:', error.message || error);
  }

  return firebaseApp;
};

export const getFirebaseAdmin = () => firebaseApp || initFirebase();
