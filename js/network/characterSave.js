// Character Save / Load Engine with Multi-Slot Support & Backward Compatibility
import { db, isOfflineMode, doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "../config/firebaseConfig.js";
import { gameState, TRANSIENT_STATE } from "../core/state.js";
import { APP_ID, SAVE_VERSION } from "../data/constants.js";
import { calculateStats } from "../core/inventory.js";
import { getGlobalWorldTimeMinutes } from "../core/time.js";
import { CITIES } from "../data/worldData.js";

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
            symbol: player.symbol || '@',
            party: player.party || [],
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

        // 2. Also update primary user document for backward compatibility
        const legacyDocRef = doc(db, 'artifacts', APP_ID, 'users', user.uid);
        await setDoc(legacyDocRef, { player: cleanData }, { merge: true });

    } catch (e) {
        console.error("Save failed:", e);
    }
}

export async function updateCharacterRecord(charData) {
    const user = gameState.currentUser;
    if (!user || !charData || !charData.id) return;
    try {
        const cleanData = JSON.parse(JSON.stringify(charData));
        cleanData.symbol = cleanData.symbol || '@';
        cleanData.updatedAt = Date.now();

        if (isOfflineMode || !db) {
            let savedMap = JSON.parse(localStorage.getItem(`cota_characters_${user.uid}`) || '{}');
            savedMap[charData.id] = cleanData;
            localStorage.setItem(`cota_characters_${user.uid}`, JSON.stringify(savedMap));
            return;
        }

        const charDocRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'characters', charData.id);
        await setDoc(charDocRef, cleanData, { merge: true });

        if (gameState.player && gameState.player.id === charData.id) {
            gameState.player.symbol = cleanData.symbol;
        }
    } catch (e) {
        console.error("Failed to update character record:", e);
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
                if (parsed.name) {
                    if (!parsed.symbol) parsed.symbol = '@';
                    characters.push(parsed);
                }
            }
        }
        return characters;
    }

    try {
        // 1. Check multi-character slots subcollection in Firestore
        const charColRef = collection(db, 'artifacts', APP_ID, 'users', uid, 'characters');
        const snap = await getDocs(charColRef);
        
        if (!snap.empty) {
            snap.forEach(docSnap => {
                const cData = docSnap.data();
                if (cData && cData.name) {
                    if (!cData.symbol) cData.symbol = '@';
                    characters.push(cData);
                }
            });
        }

        // 2. Backward compatibility fallback: check legacy user document if subcollection was empty
        if (characters.length === 0) {
            const legacyDocRef = doc(db, 'artifacts', APP_ID, 'users', uid);
            const legacySnap = await getDoc(legacyDocRef);
            
            if (legacySnap.exists()) {
                const data = legacySnap.data();
                if (data.player && data.player.name) {
                    if (!data.player.symbol) data.player.symbol = '@';
                    characters.push(data.player);

                    // Auto-migrate legacy character into the subcollection
                    const charDocRef = doc(db, 'artifacts', APP_ID, 'users', uid, 'characters', data.player.id || 'default');
                    setDoc(charDocRef, data.player, { merge: true }).catch(() => {});
                }
            }
        }

        return characters;
    } catch (err) {
        console.warn("Could not load characters from Firebase, checking local storage:", err);
        let savedMap = JSON.parse(localStorage.getItem(`cota_characters_${uid}`) || '{}');
        return Object.values(savedMap);
    }
}

export function activateCharacter(characterData) {
    let player = JSON.parse(JSON.stringify(characterData));
    
    // Ensure symbol and party are initialized
    player.symbol = player.symbol || '@';
    player.party = player.party || [];

    // Ensure world coordinates are always initialized and scaled to 600x600 world
    if (player.worldX === undefined) player.worldX = player.x || 405;
    if (player.worldY === undefined) player.worldY = player.y || 255;

    // Auto-migrate legacy 200x200 characters to new 600x600 world
    if ((player.worldX < 200 || player.worldY < 200) && (!player.saveVersion || player.saveVersion < 3)) {
        if (player.boundCity !== undefined && CITIES[player.boundCity]) {
            player.worldX = CITIES[player.boundCity].x;
            player.worldY = CITIES[player.boundCity].y;
            player.x = player.worldX;
            player.y = player.worldY;
        } else {
            player.worldX = Math.min(590, Math.max(10, Math.round(player.worldX * 3)));
            player.worldY = Math.min(590, Math.max(10, Math.round(player.worldY * 3)));
            player.x = player.worldX;
            player.y = player.worldY;
        }
        player.exploredMap = null; // Re-initialize exploration bitset for 600x600
        player.saveVersion = 3;
    }

    // Synchronize to realm server world clock
    player.time = getGlobalWorldTimeMinutes();
    
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
    if (!player.unlockedFloors) player.unlockedFloors = {};

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

        // Also check if legacy player matched and delete/clear it
        const legacyDocRef = doc(db, 'artifacts', APP_ID, 'users', user.uid);
        const legacySnap = await getDoc(legacyDocRef);
        if (legacySnap.exists() && legacySnap.data()?.player?.id === charId) {
            await setDoc(legacyDocRef, { player: null }, { merge: true });
        }
    } catch (e) {
        console.error("Delete failed:", e);
    }
}

// Ensure game state saves when player navigates away
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => { if (document.hidden) flushSave(); });
    window.addEventListener('pagehide', flushSave);
}
