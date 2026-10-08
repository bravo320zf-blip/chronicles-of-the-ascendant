// Daily Gathering Limit and Crafting Profession Scaling System
import { gameState } from "./state.js";
import { getServerTimeOffset, getGlobalWorldTimeMinutes } from "./time.js";

// Calculates current in-game day index (synchronized with the realm server)
// 1 real second = 1 in-game minute
// 1440 real seconds (24 real minutes) = 1 in-game day (1440 in-game minutes)
// Dawn begins at 06:00 AM (in-game minute 360 = 360 seconds into day)
export function getGlobalInGameDay() {
    const serverOffsetMs = getServerTimeOffset() || 0;
    const currentServerTimeMs = Date.now() + serverOffsetMs;
    const totalSeconds = Math.floor(currentServerTimeMs / 1000);
    // Shift by -360 seconds so day rollover happens precisely at 06:00 AM dawn
    return Math.floor((totalSeconds - 360) / 1440);
}

// Calculate the maximum daily gathers for a player based on profession mastery
export function getMaxDailyGathers(player = null) {
    const p = player || gameState.player;
    if (!p) return 10;

    // Base novice gathering capacity
    const BASE_CAPACITY = 10;
    
    // Each level in ANY crafting profession above Level 1 adds +2 daily gathers
    let profBonus = 0;
    if (p.professions) {
        for (const profName in p.professions) {
            const lvl = p.professions[profName]?.level || 1;
            if (lvl > 1) {
                profBonus += (lvl - 1) * 2;
            }
        }
    }

    // Passive synergy: Survivalist grants +5 gathers per rank
    let passiveBonus = 0;
    if (p.passives && p.passives.survivalist) {
        passiveBonus += p.passives.survivalist * 5;
    }

    return BASE_CAPACITY + profBonus + passiveBonus;
}

// Get how many gathers the player has remaining for the current in-game day
export function getRemainingGathers(player = null) {
    const p = player || gameState.player;
    if (!p) return 10;

    if (!p.gatherState) {
        p.gatherState = { day: getGlobalInGameDay(), used: 0 };
    }

    const currentDay = getGlobalInGameDay();
    // Reset if a new in-game day has begun
    if (p.gatherState.day !== currentDay) {
        p.gatherState.day = currentDay;
        p.gatherState.used = 0;
    }

    const maxG = getMaxDailyGathers(p);
    return Math.max(0, maxG - (p.gatherState.used || 0));
}

// Consume 1 gathering action from the daily quota
export function useGatherEnergy(player = null) {
    const p = player || gameState.player;
    if (!p) return false;

    if (!p.gatherState) {
        p.gatherState = { day: getGlobalInGameDay(), used: 0 };
    }

    const currentDay = getGlobalInGameDay();
    if (p.gatherState.day !== currentDay) {
        p.gatherState.day = currentDay;
        p.gatherState.used = 0;
    }

    const maxG = getMaxDailyGathers(p);
    if ((p.gatherState.used || 0) >= maxG) {
        return false;
    }

    p.gatherState.used = (p.gatherState.used || 0) + 1;
    updateGatherUI();
    return true;
}

// Update UI button and status indicators
export function updateGatherUI() {
    if (typeof document === 'undefined') return;
    const p = gameState.player;
    if (!p) return;

    const btn = document.getElementById('btn-gather');
    if (btn) {
        const rem = getRemainingGathers(p);
        const maxG = getMaxDailyGathers(p);
        btn.innerHTML = `GATHER [G] <span class="${rem > 0 ? 'text-yellow-400' : 'text-gray-500 font-normal'}">(${rem}/${maxG})</span>`;
        if (rem === 0) {
            btn.classList.add('opacity-60', 'border-gray-800');
            btn.classList.remove('border-yellow-900', 'text-yellow-500');
            btn.classList.add('text-gray-400');
        } else {
            btn.classList.remove('opacity-60', 'border-gray-800', 'text-gray-400');
            btn.classList.add('border-yellow-900', 'text-yellow-500');
        }
    }
}

if (typeof window !== 'undefined') {
    window.updateGatherUI = updateGatherUI;
    window.getRemainingGathers = getRemainingGathers;
    window.getMaxDailyGathers = getMaxDailyGathers;
}
