// Time progression, Day/Night cycles, and Torch Mechanics
import { gameState } from "./state.js";
import { logMessage } from "../ui/log.js";
import { GAME_MINUTES_PER_REAL_SECOND } from "../data/constants.js";

export function formatTime(minutes) {
    let h = Math.floor(minutes / 60) % 24;
    let m = Math.floor(minutes % 60);
    let ampm = h >= 12 ? 'PM' : 'AM';
    let dispH = h % 12;
    if (dispH === 0) dispH = 12;
    return `${dispH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function getGlobalWorldTimeMinutes() {
    // Synchronized World Clock: Shared epoch math across all players
    // 1 full in-game day (1440 minutes) corresponds to 24 real-world minutes (1440 seconds)
    const nowSeconds = Math.floor(Date.now() / 1000);
    const dayCycleSeconds = 24 * 60; // 1440 seconds
    const elapsedToday = nowSeconds % dayCycleSeconds;
    return Math.floor(elapsedToday * GAME_MINUTES_PER_REAL_SECOND);
}

export function updateTimeUI() {
    let player = gameState.player;
    if (!player.time) player.time = 480;
    let timeStr = formatTime(player.time);
    
    let timeTopEl = document.getElementById('ui-time-top');
    if (timeTopEl) timeTopEl.innerText = timeStr;
    
    let btn = document.getElementById('btn-torch');
    if (btn) {
        if (player.torchActive) {
            let life = player.equipment && player.equipment.light ? player.equipment.light.life : 0;
            btn.innerText = `TORCH ON (${life})`;
            btn.classList.add('text-yellow-400', 'border-yellow-400');
        } else {
            btn.innerText = `TORCH [F]`;
            btn.classList.remove('text-yellow-400', 'border-yellow-400');
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

export function advanceWorldTime(deltaMinutes = 1) {
    let player = gameState.player;
    player.time = (player.time + deltaMinutes) % 1440;

    // Torch decay
    if (player.torchActive && player.equipment && player.equipment.light) {
        let torch = player.equipment.light;
        torch.life = Math.max(0, torch.life - 1);
        if (torch.life <= 0) {
            player.torchActive = false;
            player.equipment.light = null;
            logMessage("Your torch has sputtered out and turned to ash!", "text-orange-400");
        }
    }
    updateTimeUI();
}
