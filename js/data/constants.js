// Core Game Constants
export const WORLD_SIZE = 200;
export const VIEW_RADIUS = 15;
export const LOCAL_SIZE = 40;
export const SAVE_VERSION = 2;

// Shared World Constants for MMORPG Synchronization
// All players connecting to the standard realm share this deterministic seed
export const SHARED_WORLD_SEED = 1337421;

// Global Game Clock: 1 full 24-hour in-game day (1440 game minutes) cycles every 24 real-time minutes
export const REAL_MINUTES_PER_GAME_DAY = 24; 
export const GAME_MINUTES_PER_REAL_SECOND = 1440 / (REAL_MINUTES_PER_GAME_DAY * 60); // 1 game min per real sec

export const APP_ID = 'chronicles-ascendant-mud';

// Selectable Avatar Glyphs for Character Creation & Customization
export const AVATAR_GLYPHS = [
    { glyph: '@', label: '@ — Classic Adventurer' },
    { glyph: '#', label: '# — Battle Bastion' },
    { glyph: '$', label: '$ — Mercenary / Outlaw' },
    { glyph: '%', label: '% — Mystic / Alchemist' },
    { glyph: '&', label: '& — Wanderer / Artisan' },
    { glyph: '§', label: '§ — Inquisitor / Arbiter' },
    { glyph: '✦', label: '✦ — Star Ascendant' },
    { glyph: '★', label: '★ — Grand Champion' },
    { glyph: '⚔', label: '⚔ — Blademaster' },
    { glyph: 'Ψ', label: 'Ψ — Arch-Psion' },
    { glyph: 'Ѫ', label: 'Ѫ — Iron Titan' },
    { glyph: '✪', label: '✪ — The Chosen One' },
    { glyph: '☼', label: '☼ — Sun Herald' }
];
