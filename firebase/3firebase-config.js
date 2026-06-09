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

  apiKey: "AIzaSyBAaXVxwpkLx1bKXaBp1vbAGQBLf19rRck",
  authDomain: "church-youth-manager-8a895.firebaseapp.com",
  databaseURL: "https://church-youth-manager-8a895-default-rtdb.firebaseio.com",
  projectId: "church-youth-manager-8a895",
  storageBucket: "church-youth-manager-8a895.firebasestorage.app",
  messagingSenderId: "829854911697",
  appId: "1:829854911697:web:3df4bf5ea2e4b71eb409f0",

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
