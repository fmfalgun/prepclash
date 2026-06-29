// firebase-config.example.js
// Copy this file to firebase-config.js and fill in your Firebase project values.
// Find your config: Firebase Console → Project Settings → Your apps → SDK setup
// firebase-config.js is gitignored — never commit real keys.

window.FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

firebase.initializeApp(window.FIREBASE_CONFIG);
