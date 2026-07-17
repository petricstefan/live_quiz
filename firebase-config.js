// ============================================
// FIREBASE CONFIGURATION
// ============================================
// To set up Firebase:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (free tier is fine)
// 3. Go to Project Settings > General > Your apps > Add web app
// 4. Copy the config object below
// 5. Go to Firestore Database > Create database > Start in TEST mode
// 6. Replace the placeholder values below with your config
// ============================================

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
let db;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
} catch (e) {
    console.error("Firebase init error:", e);
}
