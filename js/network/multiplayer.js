// Realtime Online Presence, World Synchronization, and Multiplayer MUD Chat
import { db, isOfflineMode, doc, setDoc, collection, onSnapshot, serverTimestamp, deleteDoc } from "../config/firebaseConfig.js";
import { gameState } from "../core/state.js";
import { APP_ID } from "../data/constants.js";
import { logMessage } from "../ui/log.js";
import { getGlobalWorldTimeMinutes, updateTimeUI, setServerTimeOffset } from "../core/time.js";
import { renderMap } from "../ui/renderer.js";

let presenceUnsubscribe = null;
let chatUnsubscribe = null;
let lastBroadcastTime = 0;
let presenceHeartbeatInterval = null;
let worldClockInterval = null;

export function initMultiplayer() {
    initWorldClockSync();

    if (isOfflineMode || !db) {
        initSimulatedAdventurers();
        return;
    }

    initPresenceListener();
    initChatListener();

    // Heartbeat every 8 seconds to announce online status
    presenceHeartbeatInterval = setInterval(() => {
        if (gameState.player && gameState.player.name && gameState.currentUser) {
            broadcastPresence();
        }
    }, 8000);
}

export function cleanupMultiplayer() {
    if (presenceUnsubscribe) presenceUnsubscribe();
    if (chatUnsubscribe) chatUnsubscribe();
    if (presenceHeartbeatInterval) clearInterval(presenceHeartbeatInterval);
    if (worldClockInterval) clearInterval(worldClockInterval);
    
    // Remove presence on leave
    if (!isOfflineMode && db && gameState.currentUser) {
        try {
            const presDoc = doc(db, 'artifacts', APP_ID, 'presence', gameState.currentUser.uid);
            deleteDoc(presDoc);
        } catch (e) {}
    }
}

export async function broadcastPresence() {
    const user = gameState.currentUser;
    const player = gameState.player;
    if (!user || !player || !player.name) return;

    // Throttle to at most once every 1.5 seconds to conserve Firebase free tier writes
    const now = Date.now();
    if (now - lastBroadcastTime < 1500) return;
    lastBroadcastTime = now;

    if (isOfflineMode || !db) return;

    try {
        const presDoc = doc(db, 'artifacts', APP_ID, 'presence', user.uid);
        await setDoc(presDoc, {
            uid: user.uid,
            name: player.name,
            level: player.level || 1,
            loadout: player.loadout || 'adventurer',
            zone: player.zone,
            worldX: player.worldX,
            worldY: player.worldY,
            localX: player.localX,
            localY: player.localY,
            lastActive: Date.now()
        }, { merge: true });
    } catch (err) {
        console.warn("Could not broadcast presence:", err);
    }
}

function initPresenceListener() {
    if (isOfflineMode || !db) return;

    try {
        const presenceCol = collection(db, 'artifacts', APP_ID, 'presence');
        presenceUnsubscribe = onSnapshot(presenceCol, (snapshot) => {
            const now = Date.now();
            const currentUid = gameState.currentUser?.uid;
            
            snapshot.docChanges().forEach((change) => {
                const data = change.doc.data();
                if (data.uid === currentUid) return; // Don't track self as other

                // Ignore stale entries (> 30 seconds since last heartbeat)
                if (now - (data.lastActive || 0) > 30000) {
                    gameState.onlinePlayers.delete(data.uid);
                    return;
                }

                if (change.type === 'removed') {
                    if (gameState.onlinePlayers.has(data.uid)) {
                        logMessage(`[World]: Adventurer ${data.name} has departed from the realm.`, "system");
                        gameState.onlinePlayers.delete(data.uid);
                    }
                } else {
                    const isNew = !gameState.onlinePlayers.has(data.uid);
                    gameState.onlinePlayers.set(data.uid, data);
                    if (isNew && data.name) {
                        logMessage(`[World]: Adventurer ${data.name} (Lvl ${data.level || 1}) has arrived in the realm.`, "system");
                    }
                }
            });

            // Re-render map to reflect other player positions
            renderMap();
            updateOnlinePlayersCount();
        }, (err) => {
            console.warn("Presence listener error:", err);
        });
    } catch (e) {
        console.warn("Could not start presence listener:", e);
    }
}

function initChatListener() {
    if (isOfflineMode || !db) return;

    try {
        const chatCol = collection(db, 'artifacts', APP_ID, 'chat');
        // Listen to new messages
        chatUnsubscribe = onSnapshot(chatCol, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const msg = change.doc.data();
                    const currentUid = gameState.currentUser?.uid;
                    if (msg.senderUid === currentUid) return; // Already logged locally

                    // If message is older than 1 minute, don't replay history
                    if (Date.now() - (msg.timestamp || 0) > 60000) return;

                    if (msg.type === 'shout') {
                        logMessage(`[SHOUT] ${msg.senderName}: "${msg.text}"`, "shout");
                    } else if (msg.type === 'say') {
                        // Check if in the same zone or within earshot
                        if (msg.zone === gameState.player.zone) {
                            logMessage(`[SAY] ${msg.senderName} says: "${msg.text}"`, "chat");
                        }
                    }
                }
            });
        });
    } catch (e) {
        console.warn("Could not start chat listener:", e);
    }
}

export async function sendChatMessage(type, text) {
    const player = gameState.player;
    const user = gameState.currentUser;
    if (!text || !text.trim()) return;

    const trimmed = text.trim();

    if (type === 'shout') {
        logMessage(`[SHOUT] You shout: "${trimmed}"`, "shout");
    } else {
        logMessage(`[SAY] You say: "${trimmed}"`, "chat");
    }

    if (isOfflineMode || !db || !user) return;

    try {
        const msgDoc = doc(collection(db, 'artifacts', APP_ID, 'chat'));
        await setDoc(msgDoc, {
            id: msgDoc.id,
            senderUid: user.uid,
            senderName: player.name || 'Anonymous',
            type: type,
            text: trimmed,
            zone: player.zone,
            timestamp: Date.now()
        });
    } catch (e) {
        console.error("Chat send failed:", e);
    }
}

export function listOnlinePlayers() {
    logMessage("=== ONLINE ADVENTURERS ===", "system");
    let count = 1;
    logMessage(`[1] ${gameState.player.name} (Lvl ${gameState.player.level || 1} ${gameState.player.loadout}) [YOU]`);

    gameState.onlinePlayers.forEach((p) => {
        count++;
        let loc = p.zone === 'world' ? `Overworld (${p.worldX}, ${p.worldY})` : `Zone ${p.zone}`;
        logMessage(`[${count}] ${p.name} (Lvl ${p.level || 1} ${p.loadout}) - ${loc}`);
    });
    logMessage(`Total Players Online: ${count}`, "text-cyan-400 font-bold");
}

function updateOnlinePlayersCount() {
    const countEl = document.getElementById('ui-online-count');
    if (countEl) {
        countEl.innerText = `${gameState.onlinePlayers.size + 1} Online`;
    }
}

// Server-Synchronized World Clock ("The World Always Running")
function initWorldClockSync() {
    if (isOfflineMode || !db) return;

    try {
        const clockDocRef = doc(db, 'artifacts', APP_ID, 'world', 'clock');

        // Listen for authoritative server time updates from Firebase
        onSnapshot(clockDocRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                if (data.serverTime) {
                    const serverMs = typeof data.serverTime.toMillis === 'function' 
                        ? data.serverTime.toMillis() 
                        : (data.serverTime.seconds ? data.serverTime.seconds * 1000 : Date.now());
                    const offset = serverMs - Date.now();
                    setServerTimeOffset(offset);
                }
            }
        }, (err) => {
            console.warn("Server clock snapshot listener notice:", err);
        });

        // Periodic server heartbeat write (every 60s) to keep server time anchored
        syncServerTimestamp();
        worldClockInterval = setInterval(syncServerTimestamp, 60000);
    } catch (err) {
        console.warn("Could not start server clock sync:", err);
    }
}

async function syncServerTimestamp() {
    if (isOfflineMode || !db) return;
    try {
        const clockDocRef = doc(db, 'artifacts', APP_ID, 'world', 'clock');
        await setDoc(clockDocRef, {
            serverTime: serverTimestamp(),
            lastSyncUser: gameState.currentUser?.uid || 'guest'
        }, { merge: true });
    } catch (e) {}
}

// Offline Simulated Adventurers for local testing
function initSimulatedAdventurers() {
    const fakeAdventurers = [
        { uid: 'sim_1', name: 'Sir Galahad', level: 3, loadout: 'warrior', zone: 'world', worldX: 27, worldY: 26 },
        { uid: 'sim_2', name: 'Morrigan', level: 5, loadout: 'mage', zone: 'world', worldX: 24, worldY: 27 },
        { uid: 'sim_3', name: 'Shadowblade', level: 2, loadout: 'rogue', zone: 'world', worldX: 26, worldY: 24 }
    ];

    fakeAdventurers.forEach(adv => gameState.onlinePlayers.set(adv.uid, adv));
    updateOnlinePlayersCount();

    // Occasionally move simulated adventurers
    setInterval(() => {
        if (gameState.player.zone !== 'world') return;
        fakeAdventurers.forEach(adv => {
            adv.worldX += (Math.floor(Math.random() * 3) - 1);
            adv.worldY += (Math.floor(Math.random() * 3) - 1);
            adv.worldX = Math.max(1, Math.min(198, adv.worldX));
            adv.worldY = Math.max(1, Math.min(198, adv.worldY));
        });
        if (gameState.player.zone === 'world') renderMap();
    }, 12000);
}
