// Inter-Continental Travel Engine: Maritime Harbors, Ferries, and Astral Leyline Waygates
import { gameState } from "./state.js";
import { CITIES } from "../data/worldData.js";
import { logMessage } from "../ui/log.js";
import { playSFX, updateMusicForCurrentState } from "./audio.js";
import { enterLocalZone } from "./worldGen.js";
import { renderMap } from "../ui/renderer.js";
import { triggerAutoSave } from "../network/characterSave.js";
import { broadcastPresence } from "../network/multiplayer.js";
import { revealWorldArea } from "../ui/worldMap.js";
import { formatTime, getGlobalWorldTimeMinutes } from "./time.js";

// ==========================================
// 1. MARITIME HARBOR & FERRY SYSTEM
// ==========================================
export const CONTINENTAL_PORTS = [
    {
        id: 'port_kingsfall',
        name: "Port of Kingsfall",
        cityName: "Kingsfall",
        continent: "Crownlands",
        biome: 'P',
        worldX: 135,
        worldY: 85,
        cityIdx: 4,
        shipName: "The Sun Sovereign",
        captain: "Captain Valen Drake",
        fare: 25,
        desc: "The imperial naval anchorage of the Concordat. Gilded galleons set sail under the Solar Crest across the Great Inland Sea."
    },
    {
        id: 'port_oakhaven',
        name: "Oakhaven Docks",
        cityName: "Oakhaven",
        continent: "Sylva (Elderwood)",
        biome: 'F',
        worldX: 48,
        worldY: 92,
        cityIdx: 0,
        shipName: "The Verdant Skiff",
        captain: "River Captain Marlo",
        fare: 25,
        desc: "An arboreal pier carved from ironwood roots, ferrying druids and rangers down the whispering waterways into the open sea."
    },
    {
        id: 'port_frosthold',
        name: "Frosthold Ice-Pier",
        cityName: "Frosthold",
        continent: "Borealis (Glacial Reach)",
        biome: 'T',
        worldX: 55,
        worldY: 38,
        cityIdx: 2,
        shipName: "The Glacier Cutter",
        captain: "Captain Sigurd Iron-Helm",
        fare: 30,
        desc: "A granite and permafrost jetty overlooking freezing northern fjords, equipped with iron-reinforced icebreaker hulls."
    },
    {
        id: 'port_mirage_edge',
        name: "Mirage Edge Duneport",
        cityName: "Mirage Edge",
        continent: "Solaris (Scorched Sands)",
        biome: 'D',
        worldX: 152,
        worldY: 152,
        cityIdx: 1,
        shipName: "The Golden Dune-Barge",
        captain: "Navigator Zahra Al-Din",
        fare: 25,
        desc: "A sun-drenched sandstone port on the desert bay, where spice traders, silk merchants, and dune nomads meet the waves."
    },
    {
        id: 'port_bogwatch',
        name: "Bogwatch Mist Wharf",
        cityName: "Bogwatch",
        continent: "Venomfang (Shadowmire)",
        biome: 'S',
        worldX: 48,
        worldY: 152,
        cityIdx: 3,
        shipName: "The Mist Strider",
        captain: "Ferryman Kaelen",
        fare: 20,
        desc: "A lantern-lit stilt dock hovering above black marsh waters. Shallow-draft skiffs navigate through dense alchemical fog."
    },
    {
        id: 'port_embergard',
        name: "Embergard Basalt Harbor",
        cityName: "Embergard",
        continent: "Ashen Reach (Mount Caldera)",
        biome: '#',
        worldX: 100,
        worldY: 165,
        cityIdx: 5,
        shipName: "The Obsidian Ironclad",
        captain: "Captain Vulcan Stone-Keel",
        fare: 35,
        desc: "A fortified volcanic bay forged of solid cooled basalt, where heavy iron-hulled ships braving boiling currents moor."
    },
    {
        id: 'port_sacred_isle',
        name: "Sacred Isle Anchorage",
        cityName: "Sacred Isle",
        continent: "The Sanctuary (Sacred Isle)",
        biome: 'Ω',
        worldX: 98,
        worldY: 92,
        cityIdx: -1,
        shipName: "The Starfarer Pilgrim",
        captain: "Celestial Pilot Zephyr",
        fare: 40,
        desc: "The sacred white-marble dock of the Ancient Ascendants, bathed in celestial starlight at the center of the world."
    }
];

// ==========================================
// 2. ASTRAL LEYLINE WAYGATES (TELEPORTERS)
// ==========================================
export const ASTRAL_WAYGATES = [
    {
        id: 'gate_crownlands',
        name: "Crownlands Solar Spire",
        continent: "Crownlands",
        region: "Aethelgard (Imperial Realm)",
        biome: 'P',
        worldX: 133,
        worldY: 83,
        rune: "☼ Solar Keystone",
        element: "Divine Radiance",
        color: "#f59e0b",
        desc: "Pulsing with the warm golden resonance of the High Solar leyline, radiating celestial majesty."
    },
    {
        id: 'gate_elderwood',
        name: "Elderwood Root-Nexus",
        continent: "Sylva",
        region: "The Elderwood",
        biome: 'F',
        worldX: 46,
        worldY: 90,
        rune: "♣ Verdant Keystone",
        element: "Verdant Nature",
        color: "#22c55e",
        desc: "Woven from living silver roots and bioluminescent flora singing the song of primordial nature."
    },
    {
        id: 'gate_borealis',
        name: "Borealis Rime-Gate",
        continent: "Borealis",
        region: "The Glacial Reach",
        biome: 'T',
        worldX: 53,
        worldY: 36,
        rune: "❄ Frost Keystone",
        element: "Arctic Frost",
        color: "#38bdf8",
        desc: "An archway of eternal rime and glacial crystal humming with the crisp chill of the northern aurora."
    },
    {
        id: 'gate_solaris',
        name: "Solaris Sun-Altar Portal",
        continent: "Solaris",
        region: "The Scorched Sands",
        biome: 'D',
        worldX: 150,
        worldY: 150,
        rune: "🔥 Flame Keystone",
        element: "Solar Flame",
        color: "#f97316",
        desc: "A ring of mirror-finished sandstone monoliths bending solar rays into a shimmering thermal gateway."
    },
    {
        id: 'gate_venomfang',
        name: "Venomfang Mire-Veil Gate",
        continent: "Venomfang",
        region: "The Shadowmire",
        biome: 'S',
        worldX: 46,
        worldY: 150,
        rune: "≈ Tide Keystone",
        element: "Shadow & Mists",
        color: "#a855f7",
        desc: "Shrouded in spectral swamp willows and violet phosphorescence, connecting deep planar mists."
    },
    {
        id: 'gate_caldera',
        name: "Caldera Ash-Rift",
        continent: "Ashen Reach",
        region: "Mount Caldera",
        biome: '#',
        worldX: 98,
        worldY: 163,
        rune: "⛰ Magma Keystone",
        element: "Earth & Molten Magma",
        color: "#ef4444",
        desc: "Basalt monoliths carved with blazing magma runes radiating deep geothermal vibrational power."
    },
    {
        id: 'gate_sanctuary',
        name: "The Ascendant Core Nexus",
        continent: "Sacred Isle",
        region: "Sanctuary of the Ascendants",
        biome: 'Ω',
        worldX: 98,
        worldY: 92,
        rune: "✦ Astral Core",
        element: "Cosmic Aether",
        color: "#e879f9",
        desc: "The central planetary convergence node surrounding the Ancient Shrine of the Ascendant."
    }
];

// Helper to determine closest port to player's current location
export function getCurrentPort() {
    let player = gameState.player;
    if (!player) return CONTINENTAL_PORTS[0];

    let px = player.worldX ?? player.x ?? 135;
    let py = player.worldY ?? player.y ?? 85;

    // Check if player is in a city local map
    if (player.zone && player.zone !== 'world') {
        let rootKey = player.zone.split('_')[0];
        let poi = gameState.pois[rootKey];
        if (poi && poi.type === 'C') {
            let matched = CONTINENTAL_PORTS.find(p => p.cityName === poi.name);
            if (matched) return matched;
        }
    }

    // Distance on world map
    let closest = CONTINENTAL_PORTS[0];
    let minDist = Infinity;
    for (let p of CONTINENTAL_PORTS) {
        let dist = Math.hypot(p.worldX - px, p.worldY - py);
        if (dist < minDist) {
            minDist = dist;
            closest = p;
        }
    }
    return closest;
}

// Helper to determine closest waygate
export function getCurrentWaygate() {
    let player = gameState.player;
    if (!player) return ASTRAL_WAYGATES[0];

    let px = player.worldX ?? player.x ?? 133;
    let py = player.worldY ?? player.y ?? 83;

    let closest = ASTRAL_WAYGATES[0];
    let minDist = Infinity;
    for (let g of ASTRAL_WAYGATES) {
        let dist = Math.hypot(g.worldX - px, g.worldY - py);
        if (dist < minDist) {
            minDist = dist;
            closest = g;
        }
    }
    return closest;
}

/**
 * Open Maritime Port Authority / Voyage Charter modal
 */
export function openVoyageModal(captain = null) {
    const modal = document.getElementById('voyage-modal');
    if (!modal) return;

    modal.classList.remove('hidden-ui');
    renderVoyageModal(captain);
}

export function closeVoyageModal() {
    const modal = document.getElementById('voyage-modal');
    if (modal) modal.classList.add('hidden-ui');
}

/**
 * Render Voyage Charter Modal UI
 */
export function renderVoyageModal(captain = null) {
    const currentPort = getCurrentPort();
    const player = gameState.player;
    const container = document.getElementById('voyage-content');
    if (!container) return;

    const capName = captain ? captain.name : currentPort.captain;
    const capDialogue = captain ? captain.dialogue : `Welcome aboard, traveler! The tides are favorable. Where would you like to sail today?`;

    container.innerHTML = `
        <!-- Current Port Banner -->
        <div class="bg-zinc-950 border border-amber-900/70 p-3 rounded mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
                <div class="text-xs uppercase tracking-widest text-amber-500 font-bold">Current Anchorage:</div>
                <div class="text-lg text-amber-300 font-bold flex items-center gap-2">
                    <span>⚓ ${currentPort.name}</span>
                    <span class="text-xs text-gray-400 font-mono">(${currentPort.continent})</span>
                </div>
                <div class="text-xs text-gray-400 mt-1 italic">"${capDialogue}" — <span class="text-amber-400 font-bold">${capName}</span></div>
            </div>
            <div class="bg-black/80 border border-amber-950 px-3 py-1.5 rounded text-right">
                <div class="text-[10px] text-gray-400 uppercase">Available Gold</div>
                <div class="text-base text-yellow-400 font-bold font-mono">💰 ${player.gold || 0} Gold</div>
            </div>
        </div>

        <!-- Available Destinations Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1 log-container">
            ${CONTINENTAL_PORTS.map(port => {
                const isCurrent = port.id === currentPort.id;
                const canAfford = (player.gold || 0) >= port.fare;

                return `
                    <div class="p-3 rounded border flex flex-col justify-between ${isCurrent ? 'bg-zinc-900/40 border-gray-800 opacity-60' : 'bg-black/90 border-amber-900/50 hover:border-amber-500 transition-colors'}">
                        <div>
                            <div class="flex justify-between items-start mb-1">
                                <h4 class="font-bold text-sm text-yellow-300 flex items-center gap-1.5">
                                    <span>⚓</span> ${port.name}
                                </h4>
                                <span class="text-[11px] font-mono px-2 py-0.5 rounded font-bold ${isCurrent ? 'bg-gray-800 text-gray-400' : 'bg-amber-950 text-amber-300 border border-amber-800'}">
                                    ${isCurrent ? 'CURRENT PORT' : `${port.fare} Gold`}
                                </span>
                            </div>
                            <div class="text-xs text-cyan-400 font-semibold mb-1">Flagship: ${port.shipName}</div>
                            <p class="text-[11px] text-gray-400 leading-tight mb-2">${port.desc}</p>
                        </div>

                        <div class="border-t border-amber-950/60 pt-2 flex justify-between items-center mt-2">
                            <span class="text-[10px] text-gray-500 font-mono">Coords: (${port.worldX}, ${port.worldY})</span>
                            ${isCurrent ? `
                                <button class="btn-term text-xs py-1 px-3 text-gray-500 border-gray-800 cursor-not-allowed" disabled>Docked Here</button>
                            ` : `
                                <button class="btn-term text-xs py-1 px-3 ${canAfford ? 'text-amber-400 border-amber-700 hover:bg-amber-900/40 font-bold' : 'text-yellow-600 border-yellow-950 hover:bg-yellow-950/30'}" onclick="embarkVoyage('${port.id}')">
                                    ${canAfford ? '⛵ Cast Off' : '⛵ Sail (Subsidized)'}
                                </button>
                            `}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Execute Sea Voyage to Destination Port
 */
export function embarkVoyage(portId) {
    const targetPort = CONTINENTAL_PORTS.find(p => p.id === portId);
    if (!targetPort) return;

    const player = gameState.player;
    const currentPort = getCurrentPort();

    // Fare calculation
    let cost = targetPort.fare;
    if (player.gold >= cost) {
        player.gold -= cost;
        logMessage(`You pay ${cost} gold to ${targetPort.captain} for passage on ${targetPort.shipName}.`, "text-yellow-400");
    } else {
        logMessage(`${targetPort.captain} winks: "A little short on coin? The Realm needs hardy heroes today. Climb aboard!"`, "text-cyan-400 font-bold");
    }

    // Play nautical door / embarking SFX
    playSFX('door');

    // Rich narrative travel announcement
    logMessage(`🌊 *** ALL ABOARD! The ship's bell tolls as ${targetPort.shipName} casts off from ${currentPort.name}! ***`, "text-cyan-300 font-bold blink");
    logMessage(`Sailing across the cerulean swells toward ${targetPort.name}... The salty breeze fills the sails as the shoreline of ${targetPort.continent} rises upon the horizon.`, "text-cyan-400 italic");

    // Advance World Time by 1 hour (sea voyage duration)
    player.actionCount = (player.actionCount || 0) + 60;

    // Transport Player to Destination
    if (targetPort.id === 'port_sacred_isle') {
        player.zone = 'world';
        player.x = targetPort.worldX;
        player.y = targetPort.worldY;
        player.worldX = targetPort.worldX;
        player.worldY = targetPort.worldY;
    } else {
        // Place inside destination city
        const cityPOI = gameState.pois[`${targetPort.worldX},${targetPort.worldY}`];
        if (cityPOI) {
            enterLocalZone(`${targetPort.worldX},${targetPort.worldY}`, cityPOI);
            player.localX = 20;
            player.localY = 35; // City gate / dock entrance
        } else {
            player.zone = 'world';
            player.x = targetPort.worldX;
            player.y = targetPort.worldY;
            player.worldX = targetPort.worldX;
            player.worldY = targetPort.worldY;
        }
    }

    // Reveal world exploration around arrival port
    revealWorldArea(targetPort.worldX, targetPort.worldY, 14);

    // Cross-fade background music smoothly to the destination biome
    updateMusicForCurrentState();

    // Close modal & refresh views
    closeVoyageModal();
    renderMap();
    triggerAutoSave();
    broadcastPresence();

    logMessage(`⚓ Safely docked at ${targetPort.name} (${targetPort.continent}). Welcome!`, "success font-bold");
}

// ==========================================
// 3. ASTRAL LEYLINE TELEPORTER ENGINE
// ==========================================

export function openWaygateModal() {
    const modal = document.getElementById('waygate-modal');
    if (!modal) return;

    modal.classList.remove('hidden-ui');
    renderWaygateModal();
}

export function closeWaygateModal() {
    const modal = document.getElementById('waygate-modal');
    if (modal) modal.classList.add('hidden-ui');
}

export function renderWaygateModal() {
    const currentGate = getCurrentWaygate();
    const player = gameState.player;
    const container = document.getElementById('waygate-content');
    if (!container) return;

    container.innerHTML = `
        <!-- Current Waygate Header -->
        <div class="bg-zinc-950 border border-purple-900/80 p-3 rounded mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
                <div class="text-xs uppercase tracking-widest text-purple-400 font-bold">Attuned Planar Nexus:</div>
                <div class="text-lg text-purple-300 font-bold flex items-center gap-2">
                    <span>Փ ${currentGate.name}</span>
                    <span class="text-xs text-cyan-300 font-mono">[${currentGate.rune}]</span>
                </div>
                <div class="text-xs text-gray-400 mt-0.5">The ancient cosmic leylines hum with astral resonance across all 7 planetary sanctuaries.</div>
            </div>
            <div class="bg-black/90 border border-purple-950 px-3 py-1.5 rounded text-right">
                <div class="text-[10px] text-gray-400 uppercase">Aether Resonance</div>
                <div class="text-xs text-emerald-400 font-bold font-mono">STABLE & UNBOUND</div>
            </div>
        </div>

        <!-- Waygate Destinations Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1 log-container">
            ${ASTRAL_WAYGATES.map(gate => {
                const isCurrent = gate.id === currentGate.id;

                return `
                    <div class="p-3 rounded border flex flex-col justify-between ${isCurrent ? 'bg-zinc-900/40 border-gray-800 opacity-60' : 'bg-black/90 border-purple-900/60 hover:border-purple-400 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.05)]'}">
                        <div>
                            <div class="flex justify-between items-start mb-1">
                                <h4 class="font-bold text-sm text-purple-300 flex items-center gap-1.5">
                                    <span style="color: ${gate.color}">✦</span> ${gate.name}
                                </h4>
                                <span class="text-[10px] font-mono px-2 py-0.5 rounded font-bold" style="background: rgba(168,85,247,0.15); color: ${gate.color}; border: 1px solid ${gate.color}40">
                                    ${gate.rune}
                                </span>
                            </div>
                            <div class="text-xs text-cyan-400 font-semibold mb-1">Element: ${gate.element} (${gate.region})</div>
                            <p class="text-[11px] text-gray-400 leading-tight mb-2">${gate.desc}</p>
                        </div>

                        <div class="border-t border-purple-950/60 pt-2 flex justify-between items-center mt-2">
                            <span class="text-[10px] text-gray-500 font-mono">Coords: (${gate.worldX}, ${gate.worldY})</span>
                            ${isCurrent ? `
                                <button class="btn-term text-xs py-1 px-3 text-gray-500 border-gray-800 cursor-not-allowed" disabled>Current Anchor</button>
                            ` : `
                                <button class="btn-term text-xs py-1 px-3 text-purple-300 border-purple-700 hover:bg-purple-900/40 font-bold shadow-[0_0_10px_rgba(168,85,247,0.2)]" onclick="teleportViaWaygate('${gate.id}')">
                                    ✦ Channel Leyline
                                </button>
                            `}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Teleport instantly via Astral Leyline Waygate
 */
export function teleportViaWaygate(gateId) {
    const targetGate = ASTRAL_WAYGATES.find(g => g.id === gateId);
    if (!targetGate) return;

    const player = gameState.player;
    const currentGate = getCurrentWaygate();

    // Play celestial spell sound effect
    playSFX('attack');

    // Rich cosmic warp narrative announcement
    logMessage(`✦ *** PLANAR HARMONY ACTIVATED! ***`, "text-purple-400 font-bold blink");
    logMessage(`The cosmic leylines erupt in blinding stellar radiance! Your physical form dematerializes into pure astral starlight...`, "text-cyan-300 italic");
    logMessage(`*** FLASH! You rematerialize at the ${targetGate.name} in ${targetGate.region}! ***`, "text-yellow-300 font-bold");

    // Move player directly to target waygate world coordinates
    player.zone = 'world';
    player.x = targetGate.worldX;
    player.y = targetGate.worldY;
    player.worldX = targetGate.worldX;
    player.worldY = targetGate.worldY;
    player.inCombat = false;
    player.currentEnemy = null;
    player.combatTarget = null;

    // Reveal world exploration around arrival gate
    revealWorldArea(targetGate.worldX, targetGate.worldY, 15);

    // Cross-fade regional music smoothly
    updateMusicForCurrentState();

    // Close modal & refresh UI
    closeWaygateModal();
    renderMap();
    triggerAutoSave();
    broadcastPresence();

    logMessage(`You step through the ${targetGate.rune}. The air of ${targetGate.continent} fills your lungs.`, "success");
}

// Global window exposure for HTML buttons and onclick handlers
if (typeof window !== 'undefined') {
    window.openVoyageModal = openVoyageModal;
    window.closeVoyageModal = closeVoyageModal;
    window.embarkVoyage = embarkVoyage;
    window.openWaygateModal = openWaygateModal;
    window.closeWaygateModal = closeWaygateModal;
    window.teleportViaWaygate = teleportViaWaygate;
}
