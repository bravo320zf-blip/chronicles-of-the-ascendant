// Character Save / Load Engine with Multi-Slot Support & Backward Compatibility
import { db, isOfflineMode, doc, getDoc, setDoc, deleteDoc } from "../config/firebaseConfig.js";
import { gameState, TRANSIENT_STATE } from "../core/state.js";
import { APP_ID, SAVE_VERSION } from "../data/constants.js";
import { calculateStats } from "../core/inventory.js";

let saveTimer = null;

export function triggerAutoSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, 1500);
}

export async function flushSave() {
    clearTimeout(saveTimer);
    const user = gameState.currentUser;
    const player = gameState.player;
    if (!user || !player || !player.name) return;

    try {
        const cleanData = JSON.parse(JSON.stringify({ 
            ...player, 
            ...TRANSIENT_STATE, 
            saveVersion: SAVE_VERSION, 
            updatedAt: Date.now() 
        }));

        if (isOfflineMode || !db) {
            // Save to LocalStorage
            let savedMap = JSON.parse(localStorage.getItem(`cota_characters_${user.uid}`) || '{}');
            savedMap[player.id || 'default'] = cleanData;
            localStorage.setItem(`cota_characters_${user.uid}`, JSON.stringify(savedMap));
            
            // Also keep legacy single player save in local storage
            localStorage.setItem(`cota_player_${user.uid}`, JSON.stringify(cleanData));
            return;
        }

        // Firebase Cloud Save:
        // 1. Save to multi-character slot collection
        const charDocRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'characters', player.id || 'default');
        await setDoc(charDocRef, cleanData);

        // 2. Also update primary user document for backward compatibility with existing refactor saves!
        const legacyDocRef = doc(db, 'artifacts', APP_ID, 'users', user.uid);
        await setDoc(legacyDocRef, { player: cleanData }, { merge: true });

    } catch (e) {
        console.error("Save failed:", e);
    }
}

export async function loadUserCharacters(uid) {
    if (!uid) return [];
    let characters = [];

    if (isOfflineMode || !db) {
        let savedMap = JSON.parse(localStorage.getItem(`cota_characters_${uid}`) || '{}');
        characters = Object.values(savedMap);
        
        // Backward compatibility: check single player key
        if (characters.length === 0) {
            let legacy = localStorage.getItem(`cota_player_${uid}`);
            if (legacy) {
                let parsed = JSON.parse(legacy);
                if (parsed.name) characters.push(parsed);
            }
        }
        return characters;
    }

    try {
        // First check for modern character slots in subcollection or user doc
        // Note: In firestore, check user legacy document first to maintain backward compatibility
        const legacyDocRef = doc(db, 'artifacts', APP_ID, 'users', uid);
        const legacySnap = await getDoc(legacyDocRef);
        
        if (legacySnap.exists()) {
            const data = legacySnap.data();
            if (data.player && data.player.name) {
                characters.push(data.player);
            }
        }

        // Return characters list
        return characters;
    } catch (err) {
        console.warn("Could not load characters from Firebase, checking local storage:", err);
        let savedMap = JSON.parse(localStorage.getItem(`cota_characters_${uid}`) || '{}');
        return Object.values(savedMap);
    }
}

export function activateCharacter(characterData) {
    let player = JSON.parse(JSON.stringify(characterData));
    
    // Local maps are not persisted across sessions; resume safely on world map
    if (player.zone !== 'world') { 
        player.zone = 'world'; 
        player.x = player.worldX || player.x || 30; 
        player.y = player.worldY || player.y || 30; 
    }
    
    // Backward compatibility: initialize missing systems
    if (!player.professions) {
        player.professions = {
            'Woodworking': { level: 1, xp: 0, nextXp: 50 },
            'Metalworking': { level: 1, xp: 0, nextXp: 50 },
            'Alchemy': { level: 1, xp: 0, nextXp: 50 },
            'Hunting': { level: 1, xp: 0, nextXp: 50 }
        };
    }
    if (!player.activeBuffs) player.activeBuffs = { healingSalve: 0, strengthSalve: 0 };
    if (!player.hotkeys) player.hotkeys = { q: null, e: null };
    if (!player.unlockedActives) player.unlockedActives = [];

    Object.assign(player, TRANSIENT_STATE);
    gameState.player = player;
    gameState.activeCharacterId = player.id || 'default';

    calculateStats();
}

export async function deleteCharacter(charId) {
    const user = gameState.currentUser;
    if (!user) return;

    if (isOfflineMode || !db) {
        let savedMap = JSON.parse(localStorage.getItem(`cota_characters_${user.uid}`) || '{}');
        delete savedMap[charId];
        localStorage.setItem(`cota_characters_${user.uid}`, JSON.stringify(savedMap));
        return;
    }

    try {
        const charDocRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'characters', charId);
        await deleteDoc(charDocRef);
    } catch (e) {
        console.error("Delete failed:", e);
    }
}

// Ensure game state saves when player navigates away
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => { if (document.hidden) flushSave(); });
    window.addEventListener('pagehide', flushSave);
}
