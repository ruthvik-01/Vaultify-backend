const { getAuth } = require('firebase-admin/auth');
const firebaseApp = require('../config/firebaseAdmin');

const verifyFirebaseIdToken = async (idToken) => {
  if (!idToken) {
    throw new Error('ID Token is missing.');
  }

  // Verify the ID token using the admin SDK getAuth()
  // Since firebaseApp is already initialized, getAuth() will automatically use it.
  const decodedToken = await getAuth(firebaseApp).verifyIdToken(idToken);
  
  // Extract user details
  const { uid, email, name, picture } = decodedToken;
  
  return {
    uid,
    email,
    name,
    picture
  };
};

module.exports = {
  verifyFirebaseIdToken
};
