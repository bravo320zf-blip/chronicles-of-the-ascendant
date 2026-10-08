// Time progression, Day/Night cycles, and Torch Mechanics
import { gameState } from "./state.js";
import { logMessage } from "../ui/log.js";

let serverTimeOffsetMs = 0;
let timeTickerInterval = null;
let lastKnownNightState = null;
let torchIdleCounter = 0;

export function setServerTimeOffset(offsetMs) {
    serverTimeOffsetMs = offsetMs || 0;
    updateTimeUI();
}

export function getServerTimeOffset() {
    return serverTimeOffsetMs;
}

export function getGlobalWorldTimeMinutes() {
    // 1 real-life second = 1 in-game minute
    // 24 real-life minutes (1440 seconds) = 1 full in-game day (1440 minutes)
    const currentServerTimeMs = Date.now() + serverTimeOffsetMs;
    const totalSeconds = Math.floor(currentServerTimeMs / 1000);
    return ((totalSeconds % 1440) + 1440) % 1440;
}

export function isWorldNight(minutes = null) {
    const m = minutes !== null ? minutes : getGlobalWorldTimeMinutes();
    // 06:00 PM (1080) to 06:00 AM (360) is Night; 06:00 AM to 06:00 PM is Day
    return m >= 1080 || m < 360;
}

export function formatTime(minutes) {
    let h = Math.floor(minutes / 60) % 24;
    let m = Math.floor(minutes % 60);
    let ampm = h >= 12 ? 'PM' : 'AM';
    let dispH = h % 12;
    if (dispH === 0) dispH = 12;
    return `${dispH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function updateTimeUI() {
    const worldMinutes = getGlobalWorldTimeMinutes();
    if (gameState.player) {
        gameState.player.time = worldMinutes;
    }

    const night = isWorldNight(worldMinutes);
    const timeStr = `${night ? '🌙' : '☀️'} ${formatTime(worldMinutes)}`;
    
    if (typeof document !== 'undefined') {
        const timeTopEl = document.getElementById('ui-time-top');
        if (timeTopEl) {
            timeTopEl.innerText = timeStr;
            if (night) {
                timeTopEl.className = "text-blue-300 bg-blue-950/40 px-2 py-0.5 border border-blue-700 shadow-sm rounded-sm font-mono";
            } else {
                timeTopEl.className = "text-yellow-400 bg-yellow-900/30 px-2 py-0.5 border border-yellow-700 shadow-sm rounded-sm font-mono";
            }
        }
        
        const btn = document.getElementById('btn-torch');
        if (btn && gameState.player) {
            if (gameState.player.torchActive) {
                let life = gameState.player.equipment?.light?.life || 0;
                btn.innerText = `TORCH ON (${life})`;
                btn.classList.add('text-yellow-400', 'border-yellow-400');
            } else {
                btn.innerText = `TORCH [F]`;
                btn.classList.remove('text-yellow-400', 'border-yellow-400');
            }
        }
    }
}

export function toggleTorch() {
    let player = gameState.player;
    if (!player.equipment || !player.equipment.light) {
        logMessage("You don't have a torch equipped!", "text-red-400");
        return;
    }
    player.torchActive = !player.torchActive;
    logMessage(`Torch is now ${player.torchActive ? 'ON' : 'OFF'}.`, "system");
    updateTimeUI();
    if (window.renderMap) window.renderMap();
}

// 1-second real-time game clock loop: 1 real second = 1 in-game minute
export function startTimeLoop() {
    if (timeTickerInterval) clearInterval(timeTickerInterval);

    lastKnownNightState = isWorldNight();
    updateTimeUI();

    timeTickerInterval = setInterval(() => {
        const worldMinutes = getGlobalWorldTimeMinutes();
        const currentNightState = isWorldNight(worldMinutes);

        updateTimeUI();

        // Broadcast sunrise and nightfall transitions
        if (lastKnownNightState !== null && lastKnownNightState !== currentNightState) {
            if (currentNightState) {
                logMessage("Night falls across the realm. Darkness blankets the land.", "text-blue-300");
            } else {
                logMessage("The sun rises above the horizon. A new day begins.", "text-yellow-300");
                logMessage("☀️ Dawn breaks across Aethelgard. Daily gathering allowance replenished!", "text-yellow-400 font-bold");
                if (typeof window !== 'undefined' && window.updateGatherUI) window.updateGatherUI();
            }
            if (window.renderMap) window.renderMap();
        }
        lastKnownNightState = currentNightState;

        // Passive torch decay while burning (1 point every 6 real seconds = 6 in-game minutes)
        if (gameState.player?.torchActive && gameState.player.equipment?.light) {
            torchIdleCounter = (torchIdleCounter + 1) % 6;
            if (torchIdleCounter === 0) {
                gameState.player.equipment.light.life -= 1;
                if (gameState.player.equipment.light.life <= 0) {
                    gameState.player.torchActive = false;
                    gameState.player.equipment.light = null;
                    logMessage("Your torch has sputtered out and turned to ash!", "text-red-500 blink font-bold");
                    if (window.renderMap) window.renderMap();
                }
            }
        }
    }, 1000);
}
