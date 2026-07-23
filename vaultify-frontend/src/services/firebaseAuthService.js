import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/firebaseConfig';

export const firebaseAuthService = {
  signInWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Retrieve UID, Name, Email, Photo URL, and Firebase ID Token
      // (These are accessible on the 'user' object: user.uid, user.displayName, user.email, user.photoURL)
      const idToken = await user.getIdToken();

      // Send ONLY the Firebase ID Token to the existing backend auth service
      return idToken;
    } catch (error) {
      let message = 'Google authentication failed.';
      if (error.code === 'auth/popup-closed-by-user') {
        message = 'The sign-in popup was closed before completion.';
      } else if (error.code === 'auth/popup-blocked') {
        message = 'The sign-in popup was blocked by your browser.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        message = 'The sign-in request was cancelled.';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Network error occurred. Please check your connection.';
      } else if (error.message) {
        message = error.message;
      }
      throw new Error(message, { cause: error });
    }
  }
};
