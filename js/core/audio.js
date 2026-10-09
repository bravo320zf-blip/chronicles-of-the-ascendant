// Dynamic Music & Sound Effects System with Smooth Cross-Fading
import { gameState } from "./state.js";

// Audio Track Manifest
export const BGM_TRACKS = {
    'main_menu': 'Music/MainMenu.mp3',
    'city': 'Music/City.mp3',
    'glacial_reach': 'Music/Glacial Reach.mp3',
    'imperial_crownland': 'Music/Imperial Crownland.mp3',
    'mount_caldera': 'Music/Mount Caldera.mp3',
    'scorched_sands': 'Music/Scorched Sands.mp3',
    'the_shadowmire': 'Music/The Shadowmire.mp3',
    'verdant_elderwood': 'Music/Verdant Elderwood.mp3',
    'dungeon': 'Music/Dungeon.mp3',
    'caves': 'Music/Caves.mp3',
    'forts': 'Music/Forts.mp3',
    'combat': 'Music/Combat.mp3'
};

export const SFX_TRACKS = {
    'enemy_attack': 'Music/EnemyAttack.mp3',
    'door': 'Music/Door.mp3',
    'attack_1': 'Music/Attack1.mp3',
    'attack_2': 'Music/Attack2.mp3',
    'attack_3': 'Music/Attack3.mp3',
    'stairs': 'Music/Stairs.mp3',
    'ambush': 'Music/Ambush.mp3'
};

// Continental coordinates for overworld biome identification
const CONTINENTS = [
    { id: 'T', cx: 55, cy: 38, rx: 36, ry: 24, name: "Glacial Reach" },
    { id: 'F', cx: 48, cy: 92, rx: 28, ry: 30, name: "Verdant Elderwood" },
    { id: 'P', cx: 135, cy: 85, rx: 38, ry: 32, name: "Imperial Crownland" },
    { id: 'S', cx: 48, cy: 152, rx: 28, ry: 26, name: "The Shadowmire" },
    { id: 'D', cx: 152, cy: 152, rx: 34, ry: 28, name: "Scorched Sands" },
    { id: '#', cx: 100, cy: 165, rx: 20, ry: 18, name: "Mount Caldera" },
    { id: 'Ω', cx: 98, cy: 92, rx: 11, ry: 11, name: "Sacred Isle" }
];

// Audio State
let isMuted = false;
let bgmVolume = 0.45;
let sfxVolume = 0.65;
let currentBgmKey = null;
let currentBgmAudio = null;
let pendingBgmKey = null;
let activeFadeIntervals = [];

// Load persisted audio settings
if (typeof localStorage !== 'undefined') {
    try {
        const saved = localStorage.getItem('cota_audio_settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (typeof parsed.isMuted === 'boolean') isMuted = parsed.isMuted;
            if (typeof parsed.bgmVolume === 'number') bgmVolume = parsed.bgmVolume;
            if (typeof parsed.sfxVolume === 'number') sfxVolume = parsed.sfxVolume;
        }
    } catch (e) {}
}

function saveSettings() {
    if (typeof localStorage !== 'undefined') {
        try {
            localStorage.setItem('cota_audio_settings', JSON.stringify({ isMuted, bgmVolume, sfxVolume }));
        } catch (e) {}
    }
    updateAudioUI();
}

// Clear all active volume ramps
function clearFadeIntervals() {
    activeFadeIntervals.forEach(id => clearInterval(id));
    activeFadeIntervals = [];
}

/**
 * Smoothly cross-fade to a new background music track
 * @param {string|null} trackKey Key from BGM_TRACKS
 * @param {number} durationMs Transition duration in milliseconds
 */
export function fadeBGM(trackKey, durationMs = 1400) {
    if (typeof Audio === 'undefined') return;

    if (isMuted) {
        pendingBgmKey = trackKey;
        if (currentBgmAudio) {
            currentBgmAudio.pause();
            currentBgmAudio = null;
            currentBgmKey = null;
        }
        return;
    }

    // If target track is null, fade out current music to silence
    if (!trackKey || !BGM_TRACKS[trackKey]) {
        if (currentBgmAudio) {
            fadeOutAndStop(currentBgmAudio, durationMs);
            currentBgmAudio = null;
            currentBgmKey = null;
        }
        return;
    }

    // If already playing this track smoothly, do not interrupt
    if (trackKey === currentBgmKey && currentBgmAudio && !currentBgmAudio.paused) {
        return;
    }

    const srcPath = BGM_TRACKS[trackKey];
    let nextAudio;
    try {
        nextAudio = new Audio(encodeURI(srcPath));
    } catch (err) {
        return;
    }

    nextAudio.loop = true;
    nextAudio.volume = 0;

    const playPromise = nextAudio.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            const previousAudio = currentBgmAudio;
            currentBgmAudio = nextAudio;
            currentBgmKey = trackKey;
            pendingBgmKey = null;

            // Fade in the new track
            fadeIn(nextAudio, bgmVolume, durationMs);

            // Fade out and stop the old track
            if (previousAudio) {
                fadeOutAndStop(previousAudio, durationMs);
            }
        }).catch((err) => {
            // Autoplay blocked by browser until user interaction
            pendingBgmKey = trackKey;
        });
    }
}

function fadeIn(audio, targetVolume, durationMs) {
    const steps = 25;
    const intervalTime = Math.max(20, Math.floor(durationMs / steps));
    const stepDelta = targetVolume / steps;
    let currentVol = 0;

    const intervalId = setInterval(() => {
        if (!audio || audio.paused) {
            clearInterval(intervalId);
            return;
        }
        currentVol = Math.min(targetVolume, currentVol + stepDelta);
        audio.volume = currentVol;
        if (currentVol >= targetVolume) {
            clearInterval(intervalId);
        }
    }, intervalTime);

    activeFadeIntervals.push(intervalId);
}

function fadeOutAndStop(audio, durationMs) {
    const steps = 25;
    const intervalTime = Math.max(20, Math.floor(durationMs / steps));
    const initialVol = audio.volume;
    const stepDelta = initialVol / steps;
    let currentVol = initialVol;

    const intervalId = setInterval(() => {
        if (!audio) {
            clearInterval(intervalId);
            return;
        }
        currentVol = Math.max(0, currentVol - stepDelta);
        audio.volume = currentVol;
        if (currentVol <= 0) {
            clearInterval(intervalId);
            audio.pause();
            audio.currentTime = 0;
        }
    }, intervalTime);

    activeFadeIntervals.push(intervalId);
}

/**
 * Play a sound effect clip
 * @param {string} sfxKey 
 * @param {number} volumeScale 
 */
export function playSFX(sfxKey, volumeScale = 1.0) {
    if (typeof Audio === 'undefined' || isMuted) return;

    let targetKey = sfxKey;
    // Attack sound picks randomly from Attack1, Attack2, Attack3
    if (sfxKey === 'attack') {
        const variants = ['attack_1', 'attack_2', 'attack_3'];
        targetKey = variants[Math.floor(Math.random() * variants.length)];
    }

    const sfxPath = SFX_TRACKS[targetKey];
    if (!sfxPath) return;

    try {
        const sound = new Audio(encodeURI(sfxPath));
        sound.volume = Math.min(1.0, Math.max(0, sfxVolume * volumeScale));
        const playPromise = sound.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {});
        }
    } catch (e) {}
}

/**
 * Determine continent/biome by player world coordinates
 */
export function getOverworldBiome(x, y) {
    let maxInfluence = -Infinity;
    let closestId = 'P';

    for (const c of CONTINENTS) {
        let dx = (x - c.cx) / c.rx;
        let dy = (y - c.cy) / c.ry;
        let dist = Math.sqrt(dx * dx + dy * dy);
        let influence = 1.0 - dist;
        if (influence > maxInfluence) {
            maxInfluence = influence;
            closestId = c.id;
        }
    }
    return closestId;
}

/**
 * Resolve which background music should play based on player zone & game state
 */
export function getAreaBGMKey() {
    const player = gameState.player;
    if (!player) return 'main_menu';

    // Menu Screens (Login, Character Select, Creation)
    if (typeof document !== 'undefined') {
        const authEl = document.getElementById('auth-modal');
        const charSelectEl = document.getElementById('char-select-modal');
        const charCreateEl = document.getElementById('char-creation');
        const mainGameEl = document.getElementById('main-game');

        if (mainGameEl && mainGameEl.classList.contains('hidden-ui')) {
            return 'main_menu';
        }
        if (authEl && !authEl.classList.contains('hidden-ui')) return 'main_menu';
        if (charSelectEl && !charSelectEl.classList.contains('hidden-ui')) return 'main_menu';
        if (charCreateEl && !charCreateEl.classList.contains('hidden-ui')) return 'main_menu';
    }

    // Local Maps (Cities, Dungeons, Caves, Forts, Arena)
    if (player.zone !== 'world') {
        const lMap = gameState.localMaps[player.zone];
        if (lMap) {
            if (lMap.type === 'arena') return 'combat';
            if (lMap.type === 'C' || lMap.type === 'shop') return 'city';
            if (lMap.type === 'D') return 'dungeon';
            if (lMap.type === '*') return 'caves';
            if (lMap.type === '^') return 'forts';
        }
        return 'dungeon';
    }

    // Overworld Biomes
    const px = player.worldX ?? player.x ?? 30;
    const py = player.worldY ?? player.y ?? 30;
    const biome = getOverworldBiome(px, py);

    switch (biome) {
        case 'T': return 'glacial_reach';
        case 'F': return 'verdant_elderwood';
        case 'P': return 'imperial_crownland';
        case 'S': return 'the_shadowmire';
        case 'D': return 'scorched_sands';
        case '#': return 'mount_caldera';
        case 'Ω': return 'imperial_crownland';
        default: return 'imperial_crownland';
    }
}

/**
 * Updates and cross-fades music to match current world location or menu
 */
export function updateMusicForCurrentState() {
    const desiredTrack = getAreaBGMKey();
    fadeBGM(desiredTrack);
}

/**
 * Toggle sound mute state (BGM and SFX)
 */
export function toggleAudioMute() {
    isMuted = !isMuted;
    saveSettings();

    if (isMuted) {
        if (currentBgmAudio) {
            currentBgmAudio.pause();
        }
    } else {
        updateMusicForCurrentState();
    }
    return isMuted;
}

/**
 * Set master music and SFX volumes
 */
export function setAudioVolume(bgm = 0.45, sfx = 0.65) {
    bgmVolume = Math.max(0, Math.min(1, bgm));
    sfxVolume = Math.max(0, Math.min(1, sfx));
    if (currentBgmAudio && !isMuted) {
        currentBgmAudio.volume = bgmVolume;
    }
    saveSettings();
}

/**
 * Update UI audio status badge/button
 */
export function updateAudioUI() {
    if (typeof document === 'undefined') return;
    const btn = document.getElementById('btn-audio-toggle');
    if (btn) {
        btn.innerHTML = isMuted ? '🔇 Audio: OFF' : '🔊 Audio: ON';
        if (isMuted) {
            btn.classList.add('text-gray-500', 'border-gray-800');
            btn.classList.remove('text-cyan-400', 'border-cyan-800');
        } else {
            btn.classList.remove('text-gray-500', 'border-gray-800');
            btn.classList.add('text-cyan-400', 'border-cyan-800');
        }
    }
}

// User Interaction Hook for Browser Autoplay Policy
export function initAudioUserUnlock() {
    if (typeof window === 'undefined') return;

    const unlockOnGesture = () => {
        if (pendingBgmKey) {
            fadeBGM(pendingBgmKey);
        } else {
            updateMusicForCurrentState();
        }
        window.removeEventListener('click', unlockOnGesture);
        window.removeEventListener('keydown', unlockOnGesture);
        window.removeEventListener('touchstart', unlockOnGesture);
    };

    window.addEventListener('click', unlockOnGesture);
    window.addEventListener('keydown', unlockOnGesture);
    window.addEventListener('touchstart', unlockOnGesture);
}

// Global window exposure for HTML buttons and terminal commands
if (typeof window !== 'undefined') {
    window.fadeBGM = fadeBGM;
    window.playSFX = playSFX;
    window.updateMusicForCurrentState = updateMusicForCurrentState;
    window.toggleAudioMute = toggleAudioMute;
    window.setAudioVolume = setAudioVolume;
}
