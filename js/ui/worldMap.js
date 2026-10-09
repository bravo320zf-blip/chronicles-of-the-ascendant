// Cartographic Atlas & Explored Fog of War Engine
import { gameState } from "../core/state.js";
import { WORLD_SIZE } from "../data/constants.js";
import { TERRAIN } from "../data/terrain.js";
import { CITIES, getTileBiome } from "../data/worldData.js";
import { CONTINENTAL_PORTS, ASTRAL_WAYGATES } from "../core/travel.js";

// 200x200 tiles = 40,000 bits = 5,000 bytes
const TOTAL_BITS = WORLD_SIZE * WORLD_SIZE;
const BYTE_COUNT = Math.ceil(TOTAL_BITS / 8);

class ExplorationBitset {
    constructor(base64Str = null) {
        this.bytes = new Uint8Array(BYTE_COUNT);
        if (base64Str && typeof base64Str === 'string') {
            this.deserialize(base64Str);
        }
    }

    isExplored(x, y) {
        if (x < 0 || x >= WORLD_SIZE || y < 0 || y >= WORLD_SIZE) return false;
        const idx = y * WORLD_SIZE + x;
        const bIdx = idx >> 3;
        const bit = idx & 7;
        return (this.bytes[bIdx] & (1 << bit)) !== 0;
    }

    reveal(x, y) {
        if (x < 0 || x >= WORLD_SIZE || y < 0 || y >= WORLD_SIZE) return false;
        const idx = y * WORLD_SIZE + x;
        const bIdx = idx >> 3;
        const bit = idx & 7;
        const prev = (this.bytes[bIdx] & (1 << bit)) !== 0;
        this.bytes[bIdx] |= (1 << bit);
        return !prev;
    }

    revealCircle(cx, cy, radius = 10) {
        let changed = false;
        const rSq = radius * radius;
        for (let dy = -radius; dy <= radius; dy++) {
            const y = cy + dy;
            if (y < 0 || y >= WORLD_SIZE) continue;
            for (let dx = -radius; dx <= radius; dx++) {
                const x = cx + dx;
                if (x < 0 || x >= WORLD_SIZE) continue;
                if (dx * dx + dy * dy <= rSq + radius) {
                    if (this.reveal(x, y)) changed = true;
                }
            }
        }
        return changed;
    }

    countExplored() {
        let count = 0;
        for (let i = 0; i < BYTE_COUNT; i++) {
            let b = this.bytes[i];
            while (b > 0) {
                count += (b & 1);
                b >>= 1;
            }
        }
        return count;
    }

    serialize() {
        let binary = '';
        for (let i = 0; i < BYTE_COUNT; i++) {
            binary += String.fromCharCode(this.bytes[i]);
        }
        return btoa(binary);
    }

    deserialize(base64Str) {
        try {
            const binary = atob(base64Str);
            if (binary.length !== BYTE_COUNT) {
                // Outdated world size format (e.g. from 200x200 world), reset for 600x600 world
                this.bytes.fill(0);
                return;
            }
            const len = Math.min(binary.length, BYTE_COUNT);
            for (let i = 0; i < len; i++) {
                this.bytes[i] = binary.charCodeAt(i);
            }
        } catch (e) {
            console.warn("Could not deserialize exploration map:", e);
        }
    }
}

let activeExploration = null;

export function initExploration(player) {
    if (!player) return;
    activeExploration = new ExplorationBitset(player.exploredMap);
    
    // Automatically reveal starter area if newly loaded or empty
    if (activeExploration.countExplored() === 0) {
        const sx = (player.worldX !== undefined && player.worldX !== null) ? player.worldX : (player.x || 405);
        const sy = (player.worldY !== undefined && player.worldY !== null) ? player.worldY : (player.y || 255);
        activeExploration.revealCircle(sx, sy, 25);
        player.exploredMap = activeExploration.serialize();
    }
}

export function revealWorldArea(cx, cy, radius = 10) {
    const player = gameState.player;
    if (!player) return;
    if (!activeExploration) initExploration(player);

    const changed = activeExploration.revealCircle(cx, cy, radius);
    if (changed) {
        player.exploredMap = activeExploration.serialize();
    }
}

export function isTileExplored(x, y) {
    if (!activeExploration) {
        if (gameState.player?.exploredMap) {
            activeExploration = new ExplorationBitset(gameState.player.exploredMap);
        } else {
            return false;
        }
    }
    return activeExploration.isExplored(x, y);
}

export function getExplorationStats() {
    if (!activeExploration) {
        if (gameState.player?.exploredMap) {
            activeExploration = new ExplorationBitset(gameState.player.exploredMap);
        } else {
            return { explored: 0, total: TOTAL_BITS, percent: "0.0%" };
        }
    }
    const count = activeExploration.countExplored();
    const pct = ((count / TOTAL_BITS) * 100).toFixed(1) + "%";
    return { explored: count, total: TOTAL_BITS, percent: pct };
}

// Fantasy Cartographic Palette for Explored Terrain (RGB triplets)
const PALETTE = {
    '~': [10, 26, 44],    // Deep Ocean
    '≈': [24, 75, 105],   // Shallows
    '.': [195, 160, 100], // Sand / Dunes
    '"': [45, 115, 75],   // Plains
    '♣': [24, 72, 45],    // Forest
    '▲': [225, 230, 235], // Mountain Peak (Snow cap)
    '^': [120, 130, 145], // Mountain Foothills
    'o': [165, 75, 38],   // Red Mesa
    '╤': [135, 52, 22],   // Arid Crags
    '∆': [185, 235, 240], // Glacier
    '*': [245, 250, 255], // Drifting Snow
    'p': [68, 85, 48],    // Mire / Swamp
    'v': [155, 40, 40],   // Volcanic Vent
    '=': [180, 190, 200], // Stone Bridge
    'Ω': [255, 215, 0],   // Ancient Shrine
    '#': [100, 105, 115], // Peak Crags
    'default': [60, 90, 60]
};

const FOG_COLOR = [8, 12, 10]; // Unexplored Fog

export function renderWorldMapModal() {
    const canvas = document.getElementById('worldmap-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ensure world generation is ready
    if (!gameState.worldMap || gameState.worldMap.length === 0) {
        if (window.generateWorld) window.generateWorld();
    }

    const player = gameState.player;
    if (!player) return;
    if (!activeExploration || activeExploration.countExplored() === 0) {
        initExploration(player);
    }

    const stats = getExplorationStats();
    const badgeEl = document.getElementById('wm-explored-badge');
    if (badgeEl) {
        badgeEl.innerText = `${stats.percent} Explored (${stats.explored.toLocaleString()} / 360,000 tiles)`;
    }

    const heroCoordsEl = document.getElementById('wm-hero-coords');
    if (heroCoordsEl) {
        const hTile = gameState.worldMap[player.worldY]?.[player.worldX] || '"';
        const biome = getTileBiome(hTile);
        const regionNames = { 'P': 'Crownlands', 'F': 'Sylva', 'T': 'Borealis', 'S': 'Venomfang', 'D': 'Solaris', '#': 'Ashen Reach' };
        const reg = regionNames[biome] || 'The Great Rift';
        heroCoordsEl.innerText = `(${player.worldX}, ${player.worldY}) — ${reg}`;
    }

    // 600x600 tiles rendered at 1:1 scale (600x600 canvas)
    const scale = 1;
    const imgData = ctx.createImageData(600, 600);
    const data = imgData.data;

    for (let y = 0; y < WORLD_SIZE; y++) {
        for (let x = 0; x < WORLD_SIZE; x++) {
            const isExplored = activeExploration.isExplored(x, y);
            let r, g, b;

            if (!isExplored) {
                // Subtle fog grid markings every 50 tiles
                if (x % 50 === 0 || y % 50 === 0) {
                    r = 14; g = 18; b = 15;
                } else {
                    r = FOG_COLOR[0]; g = FOG_COLOR[1]; b = FOG_COLOR[2];
                }
            } else {
                const tile = gameState.worldMap[y]?.[x] || '~';
                const col = PALETTE[tile] || PALETTE['default'];
                r = col[0]; g = col[1]; b = col[2];
            }

            const idx = (y * 600 + x) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
        }
    }

    ctx.putImageData(imgData, 0, 0);

    // ==========================================
    // OVERLAY: DISCOVERED CITIES & LANDMARKS
    // ==========================================
    ctx.imageSmoothingEnabled = false;

    // Discovered Cities
    for (const [id, city] of Object.entries(CITIES)) {
        if (activeExploration.isExplored(city.x, city.y)) {
            const cx = city.x * scale;
            const cy = city.y * scale;

            // Golden Citadel Marker
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(cx, cy, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // City Name Label
            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = '#fef08a';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2.5;
            ctx.strokeText(city.name, cx + 7, cy + 3);
            ctx.fillText(city.name, cx + 7, cy + 3);
        }
    }

    // Ancient Shrine of the Ascendant (294, 276)
    if (activeExploration.isExplored(294, 276)) {
        const sx = 294 * scale;
        const sy = 276 * scale;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#7dd3fc';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.strokeText("Ancient Shrine", sx + 6, sy + 3);
        ctx.fillText("Ancient Shrine", sx + 6, sy + 3);
    }

    // Active World Bosses in Explored Territory
    const bosses = gameState.worldBosses || [];
    bosses.forEach(boss => {
        if (!boss.isDefeated && activeExploration.isExplored(boss.x, boss.y)) {
            const bx = boss.x * scale + 1.5;
            const by = boss.y * scale + 1.5;

            ctx.fillStyle = '#ec4899';
            ctx.beginPath();
            ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#831843';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = '#f472b6';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2.5;
            ctx.strokeText(`☠ ${boss.name.split(',')[0]}`, bx + 6, by + 3);
            ctx.fillText(`☠ ${boss.name.split(',')[0]}`, bx + 6, by + 3);
        }
    });

    // ==========================================
    // OVERLAY: CONTINENTAL PORTS & DOCKS (⚓)
    // ==========================================
    CONTINENTAL_PORTS.forEach(port => {
        if (activeExploration.isExplored(port.worldX, port.worldY)) {
            const px = port.worldX * scale;
            const py = port.worldY * scale;

            // Cyan Anchor Dot
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Port Label
            const shortName = port.name.replace('Port of ', '').replace(' Docks', '');
            ctx.font = 'bold 8px monospace';
            ctx.fillStyle = '#bae6fd';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeText(`⚓ ${shortName}`, px + 6, py + 2);
            ctx.fillText(`⚓ ${shortName}`, px + 6, py + 2);
        }
    });

    // ==========================================
    // OVERLAY: ASTRAL LEYLINE WAYGATES (Փ)
    // ==========================================
    ASTRAL_WAYGATES.forEach(gate => {
        if (activeExploration.isExplored(gate.worldX, gate.worldY)) {
            const gx = gate.worldX * scale;
            const gy = gate.worldY * scale;

            // Violet Diamond / Pulsing Node
            ctx.fillStyle = gate.color || '#c084fc';
            ctx.beginPath();
            ctx.arc(gx, gy, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#581c87';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Waygate Label
            const shortGate = gate.name.replace(' Waygate', '').replace(' Portal', '');
            ctx.font = 'bold 8px monospace';
            ctx.fillStyle = '#f3e8ff';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeText(`Փ ${shortGate}`, gx + 6, gy + 2);
            ctx.fillText(`Փ ${shortGate}`, gx + 6, gy + 2);
        }
    });

    // ==========================================
    // HERO LOCATION BEACON
    // ==========================================
    const hx = player.worldX * scale;
    const hy = player.worldY * scale;

    // Glowing Crosshair
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hx - 15, hy); ctx.lineTo(hx + 15, hy);
    ctx.moveTo(hx, hy - 15); ctx.lineTo(hx, hy + 15);
    ctx.stroke();

    // Pulsing Core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(hx, hy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hero Label
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#4ade80';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(`★ ${player.name || 'Hero'}`, hx + 7, hy - 5);
    ctx.fillText(`★ ${player.name || 'Hero'}`, hx + 7, hy - 5);
}

// ==========================================
// CAMERA ZOOM & PAN ENGINE
// ==========================================
let mapZoom = 1.0;
let panX = 0;
let panY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartPanX = 0;
let dragStartPanY = 0;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 4.0;

export function applyMapTransform() {
    const canvas = document.getElementById('worldmap-canvas');
    if (canvas) {
        canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${mapZoom})`;
    }
    const zoomLabel = document.getElementById('wm-zoom-level');
    if (zoomLabel) {
        zoomLabel.innerText = `${Math.round(mapZoom * 100)}%`;
    }
}

export function setZoom(newZoom, focalX = null, focalY = null) {
    const wrapper = document.getElementById('wm-canvas-wrapper');
    if (!wrapper) return;

    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    if (Math.abs(clampedZoom - mapZoom) < 0.001) return;

    const W = wrapper.clientWidth || 700;
    const H = wrapper.clientHeight || 550;
    const fx = (focalX !== null && focalX !== undefined) ? focalX : W / 2;
    const fy = (focalY !== null && focalY !== undefined) ? focalY : H / 2;

    // World tile coordinate under focal point before zoom
    const wx = (fx - panX) / mapZoom;
    const wy = (fy - panY) / mapZoom;

    mapZoom = clampedZoom;
    panX = Math.round(fx - wx * mapZoom);
    panY = Math.round(fy - wy * mapZoom);

    applyMapTransform();
}

export function zoomIn() {
    const canvas = document.getElementById('worldmap-canvas');
    if (canvas) canvas.style.transition = 'transform 0.08s ease-out';
    setZoom(mapZoom * 1.25);
}

export function zoomOut() {
    const canvas = document.getElementById('worldmap-canvas');
    if (canvas) canvas.style.transition = 'transform 0.08s ease-out';
    setZoom(mapZoom / 1.25);
}

export function centerOnCoords(worldX, worldY) {
    const wrapper = document.getElementById('wm-canvas-wrapper');
    if (!wrapper) return;
    const W = wrapper.clientWidth || 700;
    const H = wrapper.clientHeight || 550;
    panX = Math.round(W / 2 - worldX * mapZoom);
    panY = Math.round(H / 2 - worldY * mapZoom);
    applyMapTransform();
}

export function centerOnHero() {
    const player = gameState.player;
    if (!player) return;
    const hx = (player.worldX !== undefined && player.worldX !== null) ? player.worldX : (player.x || 405);
    const hy = (player.worldY !== undefined && player.worldY !== null) ? player.worldY : (player.y || 255);
    centerOnCoords(hx, hy);
}

export function resetZoomAndRecenter() {
    mapZoom = 1.0;
    const canvas = document.getElementById('worldmap-canvas');
    if (canvas) canvas.style.transition = 'transform 0.1s ease-out';
    centerOnHero();
}

export function panCamera(dx, dy) {
    const canvas = document.getElementById('worldmap-canvas');
    if (canvas) canvas.style.transition = 'transform 0.08s ease-out';
    panX += dx;
    panY += dy;
    applyMapTransform();
}

export function handleWorldMapKey(e) {
    const k = e.key.toLowerCase();
    const panStep = Math.round(45 * Math.max(0.7, mapZoom));

    switch(k) {
        case 'arrowup':
        case 'w':
            panCamera(0, panStep);
            return true;
        case 'arrowdown':
        case 's':
            panCamera(0, -panStep);
            return true;
        case 'arrowleft':
        case 'a':
            panCamera(panStep, 0);
            return true;
        case 'arrowright':
        case 'd':
            panCamera(-panStep, 0);
            return true;
        case '+':
        case '=':
            zoomIn();
            return true;
        case '-':
        case '_':
            zoomOut();
            return true;
        case '0':
        case 'r':
            resetZoomAndRecenter();
            return true;
    }
    return false;
}

export function isWorldMapOpen() {
    const modal = document.getElementById('worldmap-modal');
    return modal && !modal.classList.contains('hidden-ui');
}

export function initWorldMapEvents() {
    const canvas = document.getElementById('worldmap-canvas');
    const hoverInfo = document.getElementById('wm-hover-info');
    const recenterBtn = document.getElementById('btn-wm-recenter');
    const wrapper = document.getElementById('wm-canvas-wrapper');
    const zoomInBtn = document.getElementById('btn-wm-zoom-in');
    const zoomOutBtn = document.getElementById('btn-wm-zoom-out');
    const zoomResetBtn = document.getElementById('btn-wm-zoom-reset');

    if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
    if (zoomResetBtn) zoomResetBtn.addEventListener('click', resetZoomAndRecenter);
    if (recenterBtn) recenterBtn.addEventListener('click', centerOnHero);

    if (wrapper) {
        // Drag to Pan
        wrapper.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Only primary button
            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            dragStartPanX = panX;
            dragStartPanY = panY;
            wrapper.classList.remove('cursor-grab');
            wrapper.classList.add('cursor-grabbing');
            if (canvas) canvas.style.transition = 'none';
        });

        const handleDragMove = (e) => {
            const rect = wrapper.getBoundingClientRect();
            const mouseWrapperX = e.clientX - rect.left;
            const mouseWrapperY = e.clientY - rect.top;

            if (isDragging) {
                const dx = e.clientX - dragStartX;
                const dy = e.clientY - dragStartY;
                panX = dragStartPanX + dx;
                panY = dragStartPanY + dy;
                applyMapTransform();
            }

            // Calculate world tile taking pan & zoom into account
            if (hoverInfo) {
                const tx = Math.floor((mouseWrapperX - panX) / mapZoom);
                const ty = Math.floor((mouseWrapperY - panY) / mapZoom);

                if (tx < 0 || tx >= WORLD_SIZE || ty < 0 || ty >= WORLD_SIZE) {
                    hoverInfo.innerHTML = `<span class="text-gray-500 italic">Beyond the Charted Frontiers (${tx}, ${ty})</span>`;
                    return;
                }

                if (isTileExplored(tx, ty)) {
                    const tile = gameState.worldMap[ty]?.[tx] || '~';
                    const tObj = TERRAIN[tile] || { name: 'Wilderness' };
                    const biome = getTileBiome(tile);
                    const regions = { 'P': 'Crownlands', 'F': 'Sylva', 'T': 'Borealis', 'S': 'Venomfang', 'D': 'Solaris', '#': 'Ashen Reach' };
                    const reg = regions[biome] || 'The Great Rift Ocean';

                    let landmark = "";
                    const city = Object.values(CITIES).find(c => Math.abs(c.x - tx) <= 5 && Math.abs(c.y - ty) <= 5);
                    if (city) landmark += ` ★ City of ${city.name}`;
                    if (Math.abs(tx - 294) <= 4 && Math.abs(ty - 276) <= 4) landmark += ` ✦ Ancient Shrine of the Ascendant`;

                    const nearPort = CONTINENTAL_PORTS.find(p => Math.abs(p.worldX - tx) <= 5 && Math.abs(p.worldY - ty) <= 5);
                    if (nearPort) landmark += ` ⚓ ${nearPort.name}`;

                    const nearGate = ASTRAL_WAYGATES.find(g => Math.abs(g.worldX - tx) <= 5 && Math.abs(g.worldY - ty) <= 5);
                    if (nearGate) landmark += ` Փ ${nearGate.name}`;

                    hoverInfo.innerHTML = `<span class="text-green-400 font-bold">${tObj.name}</span> in <span class="text-cyan-400 font-bold">${reg}</span> — Coords: <span class="text-yellow-400 font-mono">(${tx}, ${ty})</span>${landmark ? ` <span class="text-purple-300 font-bold">${landmark}</span>` : ''}`;
                } else {
                    hoverInfo.innerHTML = `<span class="text-gray-500 italic">Uncharted Fog of War</span> — Coords: <span class="text-gray-400 font-mono">(${tx}, ${ty})</span>`;
                }
            }
        };

        wrapper.addEventListener('mousemove', handleDragMove);

        const stopDrag = () => {
            if (isDragging) {
                isDragging = false;
                wrapper.classList.remove('cursor-grabbing');
                wrapper.classList.add('cursor-grab');
                if (canvas) canvas.style.transition = 'transform 0.08s ease-out';
            }
        };

        window.addEventListener('mouseup', stopDrag);
        wrapper.addEventListener('mouseleave', () => {
            stopDrag();
            if (hoverInfo) hoverInfo.innerHTML = "Hover over discovered regions to inspect coordinates & terrain.";
        });

        // Mouse Wheel Zoom Anchored to Cursor
        wrapper.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = wrapper.getBoundingClientRect();
            const fx = e.clientX - rect.left;
            const fy = e.clientY - rect.top;
            const zoomMultiplier = e.deltaY < 0 ? 1.15 : 0.87;
            if (canvas) canvas.style.transition = 'transform 0.05s ease-out';
            setZoom(mapZoom * zoomMultiplier, fx, fy);
        }, { passive: false });
    }

    const modal = document.getElementById('worldmap-modal');
    if (modal) {
        const observer = new MutationObserver(() => {
            if (!modal.classList.contains('hidden-ui')) {
                renderWorldMapModal();
                requestAnimationFrame(() => {
                    centerOnHero();
                });
            }
        });
        observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
}

export function openWorldMap() {
    const modal = document.getElementById('worldmap-modal');
    if (modal) {
        modal.classList.remove('hidden-ui');
        renderWorldMapModal();
        requestAnimationFrame(() => {
            centerOnHero();
        });
    }
}

export function toggleWorldMap() {
    const modal = document.getElementById('worldmap-modal');
    if (modal) {
        if (modal.classList.contains('hidden-ui')) {
            modal.classList.remove('hidden-ui');
            renderWorldMapModal();
            requestAnimationFrame(() => {
                centerOnHero();
            });
        } else {
            modal.classList.add('hidden-ui');
        }
    }
}

if (typeof window !== 'undefined') {
    window.openWorldMap = openWorldMap;
    window.toggleWorldMap = toggleWorldMap;
    window.setWorldMapZoom = setZoom;
    window.zoomInWorldMap = zoomIn;
    window.zoomOutWorldMap = zoomOut;
    window.resetWorldMapZoom = resetZoomAndRecenter;
    window.centerWorldMapOnHero = centerOnHero;
}

