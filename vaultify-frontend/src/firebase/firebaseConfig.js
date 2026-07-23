import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDktRwP9RT_BQ6hZ2XgYsbFqMZ__MejzYM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'vaultify-234cc.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'vaultify-234cc',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'vaultify-234cc.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '20279385176',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:20279385176:web:3219e6aea64b594ea1fe2d',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
