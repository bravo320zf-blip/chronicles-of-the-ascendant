// User Account System & Firebase Authentication
import { 
    auth, 
    isOfflineMode, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInAnonymously, 
    firebaseSignOut, 
    onAuthStateChanged 
} from "../config/firebaseConfig.js";
import { gameState } from "../core/state.js";
import { logMessage } from "../ui/log.js";

export function initAuthListener(onUserChanged) {
    if (isOfflineMode || !auth) {
        console.log("Running Auth in Offline / LocalStorage Mode.");
        // Check local storage for simulated session
        const savedLocalUser = localStorage.getItem('cota_local_user');
        if (savedLocalUser) {
            gameState.currentUser = JSON.parse(savedLocalUser);
        } else {
            gameState.currentUser = { uid: 'guest_local_' + Math.random().toString(36).substr(2, 6), email: 'guest@offline.local', isAnonymous: true };
            localStorage.setItem('cota_local_user', JSON.stringify(gameState.currentUser));
        }
        if (onUserChanged) onUserChanged(gameState.currentUser);
        return () => {};
    }

    return onAuthStateChanged(auth, async (user) => {
        gameState.currentUser = user ? { uid: user.uid, email: user.email, isAnonymous: user.isAnonymous } : null;
        if (onUserChanged) onUserChanged(gameState.currentUser);
    });
}

export async function signUpWithEmail(email, password) {
    if (isOfflineMode || !auth) {
        // Local mode account simulation
        let localAccounts = JSON.parse(localStorage.getItem('cota_offline_accounts') || '{}');
        if (localAccounts[email]) {
            throw new Error("An account with this email already exists locally.");
        }
        localAccounts[email] = { password, uid: 'local_' + Date.now() };
        localStorage.setItem('cota_offline_accounts', JSON.stringify(localAccounts));
        
        gameState.currentUser = { uid: localAccounts[email].uid, email: email, isAnonymous: false };
        localStorage.setItem('cota_local_user', JSON.stringify(gameState.currentUser));
        logMessage(`Account created for ${email} (Local Mode).`, "success");
        return gameState.currentUser;
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    gameState.currentUser = { uid: cred.user.uid, email: cred.user.email, isAnonymous: false };
    logMessage(`Account created successfully: ${email}`, "success");
    return gameState.currentUser;
}

export async function signInWithEmail(email, password) {
    if (isOfflineMode || !auth) {
        let localAccounts = JSON.parse(localStorage.getItem('cota_offline_accounts') || '{}');
        if (!localAccounts[email] || localAccounts[email].password !== password) {
            throw new Error("Invalid email or password.");
        }
        gameState.currentUser = { uid: localAccounts[email].uid, email: email, isAnonymous: false };
        localStorage.setItem('cota_local_user', JSON.stringify(gameState.currentUser));
        logMessage(`Logged in as ${email} (Local Mode).`, "success");
        return gameState.currentUser;
    }

    const cred = await signInWithEmailAndPassword(auth, email, password);
    gameState.currentUser = { uid: cred.user.uid, email: cred.user.email, isAnonymous: false };
    logMessage(`Logged in as ${email}`, "success");
    return gameState.currentUser;
}

export async function signInAsGuest() {
    if (isOfflineMode || !auth) {
        gameState.currentUser = { uid: 'guest_' + Math.random().toString(36).substr(2, 6), email: 'Guest (Offline)', isAnonymous: true };
        localStorage.setItem('cota_local_user', JSON.stringify(gameState.currentUser));
        logMessage("Playing in Guest / Offline Mode.", "system");
        return gameState.currentUser;
    }

    const cred = await signInAnonymously(auth);
    gameState.currentUser = { uid: cred.user.uid, email: 'Guest', isAnonymous: true };
    logMessage("Connected anonymously as Guest.", "system");
    return gameState.currentUser;
}

export async function signOutUser() {
    if (isOfflineMode || !auth) {
        localStorage.removeItem('cota_local_user');
        gameState.currentUser = null;
        logMessage("Logged out.", "system");
        return;
    }

    await firebaseSignOut(auth);
    gameState.currentUser = null;
    logMessage("Logged out successfully.", "system");
}
