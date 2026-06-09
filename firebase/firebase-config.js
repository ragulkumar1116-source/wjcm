// ============================================================
//  REPLACE THESE VALUES WITH YOUR FIREBASE PROJECT SETTINGS
//  Go to: Firebase Console → Project Settings → Your Apps
// ============================================================
const firebaseConfig = {
 apiKey: "AIzaSyBAaXVxwpkLx1bKXaBp1vbAGQBLf19rRck",
  authDomain: "church-youth-manager-8a895.firebaseapp.com",
  databaseURL: "https://church-youth-manager-8a895-default-rtdb.firebaseio.com",
  projectId: "church-youth-manager-8a895",
  storageBucket: "church-youth-manager-8a895.firebasestorage.app",
  messagingSenderId: "829854911697",
  appId: "1:829854911697:web:3df4bf5ea2e4b71eb409f0",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.database();
