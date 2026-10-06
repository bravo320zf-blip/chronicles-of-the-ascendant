// Firebase Configuration and Service Initialization
// Note: To connect to your free Firebase backend, fill in your project credentials below.
// If left with default mock values, the game automatically runs in Offline / LocalStorage mode!

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInAnonymously, 
    signOut as firebaseSignOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    collection, 
    getDocs, 
    onSnapshot, 
    serverTimestamp,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Check if window or global has config, or fallback to user credentials / mock
let userConfig = null;
try {
    if (typeof window.__firebase_config !== 'undefined') {
        userConfig = typeof window.__firebase_config === 'string' ? JSON.parse(window.__firebase_config) : window.__firebase_config;
    } else {
        const stored = localStorage.getItem('cota_firebase_config');
        if (stored) userConfig = JSON.parse(stored);
    }
} catch (e) {
    console.warn("Could not parse saved firebase config:", e);
}

// Default config template. Users can replace these values or configure them in-game!
export const firebaseConfig = userConfig || {
    apiKey: "AIzaSyBA0QK49Bk09k8Hpm0UGeu3SaTpzpVsCY8",
    authDomain: "chronicles-of-the-ascendant.firebaseapp.com",
    projectId: "chronicles-of-the-ascendant",
    storageBucket: "chronicles-of-the-ascendant.firebasestorage.app",
    messagingSenderId: "1053462129131",
    appId: "1:1053462129131:web:e3f6308fa7753c2a8ed1ae",
    measurementId: "G-MP8J7F3EDV"
};

let app = null;
let auth = null;
let db = null;
let isOfflineMode = true;

// Check if valid config is present (apiKey shouldn't start with YOUR_)
const hasValidConfig = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("YOUR_") && firebaseConfig.projectId !== "mock-project";

if (hasValidConfig) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        isOfflineMode = false;
        console.log("🔥 Firebase initialized successfully in Online Cloud Mode.");
    } catch (err) {
        console.warn("Firebase initialization failed; switching to Offline / LocalStorage Mode:", err);
        isOfflineMode = true;
    }
} else {
    console.log("ℹ️ Running in Local / Offline Mode (LocalStorage). Configure Firebase in Settings to enable MMORPG cloud features.");
    isOfflineMode = true;
}

export { app, auth, db, isOfflineMode };
export { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInAnonymously, 
    firebaseSignOut, 
    onAuthStateChanged,
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    collection, 
    getDocs, 
    onSnapshot, 
    serverTimestamp,
    deleteDoc 
};
