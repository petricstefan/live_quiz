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
    apiKey: "AIzaSyCT3UZzw-cOZItRlF4A9R1X9fPMRCS4UrA",
    authDomain: "hackathon2026livequiz.firebaseapp.com",
    projectId: "hackathon2026livequiz",
    storageBucket: "hackathon2026livequiz.firebasestorage.app",
    messagingSenderId: "973227863991",
    appId: "1:973227863991:web:cf854eb67f0bcfaddc4232"
};

// Initialize Firebase
let db;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
} catch (e) {
    console.error("Firebase init error:", e);
}
