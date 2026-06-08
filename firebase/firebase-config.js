/**
 * firebase/firebase-config.js
 * Church Youth Collection Manager
 */

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBAaXVxwpkLx1bKXaBp1vbAGQBLf19rRck",
    authDomain: "church-youth-manager-8a895.firebaseapp.com",
    databaseURL: "https://church-youth-manager-8a895-default-rtdb.firebaseio.com",
    projectId: "church-youth-manager-8a895",
    storageBucket: "church-youth-manager-8a895.firebasestorage.app",
    messagingSenderId: "829854911697",
    appId: "1:829854911697:web:3df4bf5ea2e4b71eb409f0"
};

const DB_KEYS = {
    MEMBERS: "members",
    COLLECTIONS: "collections",
    SETTINGS: "settings",
    SYNC_QUEUE: "syncQueue"
};

function initializeFirebase() {
    try {

        if (typeof firebase === "undefined") {
            console.error("❌ Firebase SDK not loaded");
            return false;
        }

        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }

        console.log("✅ Firebase initialized");
        return true;

    } catch (error) {

        console.error("❌ Firebase initialization error:", error);
        return false;

    }
}
