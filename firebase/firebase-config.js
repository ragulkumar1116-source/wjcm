/**
 * Firebase Configuration
 * Church Youth Collection Manager
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project (e.g., "church-youth-manager")
 * 3. Enable Realtime Database
 * 4. Copy your config values below
 * 5. Set database rules to allow read/write for authenticated users
 */

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDIiBdSKMigymz8P4PooMSguP7LoLKvllg",
  authDomain: "hotel-c4382.firebaseapp.com",
  databaseURL: "https://hotel-c4382-default-rtdb.firebaseio.com",
  projectId: "hotel-c4382",
  storageBucket: "hotel-c4382.firebasestorage.app",
  messagingSenderId: "879811080075",
  appId: "1:879811080075:web:656ac50faffced4aee898e",
  measurementId: "G-EGS10RS2V4"
};

// Firebase Database Reference Keys
const DB_KEYS = {
  MEMBERS: 'members',
  COLLECTIONS: 'collections',
  SETTINGS: 'settings',
  SYNC_QUEUE: 'syncQueue'
};

// Initialize Firebase (called from app.js after DOM is ready)
function initializeFirebase() {
  try {
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
      console.log('✅ Firebase initialized successfully');
      return true;
    }
  } catch (error) {
    console.warn('⚠️ Firebase initialization failed:', error.message);
    console.warn('App will run in offline-only mode.');
    return false;
  }
  return false;
}
