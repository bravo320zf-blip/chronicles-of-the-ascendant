// Procedural World Generation, Continents, Oceans, Cities, Dungeons, Interiors, and Spawns
import { gameState } from "./state.js";
import { WORLD_SIZE, LOCAL_SIZE, SHARED_WORLD_SEED } from "../data/constants.js";
import { CITIES, ENEMIES, ENEMY_STATS, ELITE_PREFIXES, BIOME_BOSSES, NPC_NAMES, NPC_PROFESSIONS, NPC_QUIRKS, NPC_SECRETS, NPC_MOTIVATIONS, CITY_NPCS_DATA, getTileBiome } from "../data/worldData.js";
import { ACTIVES } from "../data/skills.js";
import { generateRandomItem } from "../data/items.js";
import { logMessage, playEncounterAnimation } from "../ui/log.js";

// Deterministic 2D Perlin / Gradient Noise for realistic continental synthesis
class WorldNoise {
    constructor(seed = 1337421) {
        this.p = new Uint8Array(512);
        const perm = new Uint8Array(256);
        for (let i = 0; i < 256; i++) perm[i] = i;
        let s = seed >>> 0;
        for (let i = 255; i > 0; i--) {
            s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
            const j = s % (i + 1);
            const temp = perm[i];
            perm[i] = perm[j];
            perm[j] = temp;
        }
        for (let i = 0; i < 512; i++) {
            this.p[i] = perm[i & 255];
        }
    }

    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(t, a, b) { return a + t * (b - a); }
    grad(hash, x, y) {
        const h = hash & 7;
        const u = h < 4 ? x : y;
        const v = h < 4 ? y : x;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise2D(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);
        const u = this.fade(xf);
        const v = this.fade(yf);

        const A = this.p[X] + Y;
        const B = this.p[X + 1] + Y;

        return this.lerp(v,
            this.lerp(u, this.grad(this.p[A], xf, yf), this.grad(this.p[B], xf - 1, yf)),
            this.lerp(u, this.grad(this.p[A + 1], xf, yf - 1), this.grad(this.p[B + 1], xf - 1, yf - 1))
        );
    }

    fractal(x, y, octaves = 3, persistence = 0.5, lacunarity = 2.0) {
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let maxValue = 0;
        for (let i = 0; i < octaves; i++) {
            total += this.noise2D(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        return total / maxValue;
    }
}

// Seeded pseudorandom generator
export function withSeed(seed, fn) {
    const orig = Math.random; 
    let a = seed >>> 0;
    Math.random = function() {
        a |= 0; 
        a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    try { 
        return fn(); 
    } finally { 
        Math.random = orig; 
    }
}

export function generateWorld(forceSeed = null) {
    let player = gameState.player;
    if (forceSeed) {
        player.worldSeed = forceSeed;
    } else if (!player.worldSeed) {
        player.worldSeed = SHARED_WORLD_SEED;
    }
    withSeed(player.worldSeed, buildWorld);
}

export function buildWorld() {
    gameState.worldMap = [];
    gameState.pois = {};
    let seed = gameState.player?.worldSeed || SHARED_WORLD_SEED;
    let noise = new WorldNoise(seed);

    // 6 Continental Landmasses + Central Sacred Isle
    const CONTINENTS = [
        { id: 'T', cx: 55, cy: 38, rx: 36, ry: 24, name: "Borealis" },
        { id: 'F', cx: 48, cy: 92, rx: 28, ry: 30, name: "Sylva" },
        { id: 'P', cx: 135, cy: 85, rx: 38, ry: 32, name: "Crownlands" },
        { id: 'S', cx: 48, cy: 152, rx: 28, ry: 26, name: "Venomfang" },
        { id: 'D', cx: 152, cy: 152, rx: 34, ry: 28, name: "Solaris" },
        { id: '#', cx: 100, cy: 165, rx: 20, ry: 18, name: "Ashen Reach" },
        { id: 'Ω', cx: 98, cy: 92, rx: 11, ry: 11, name: "Sacred Isle" }
    ];

    // Generate base continental terrain matrix
    for (let y = 0; y < WORLD_SIZE; y++) {
        let row = [];
        for (let x = 0; x < WORLD_SIZE; x++) {
            // World edges are boundless deep ocean
            if (x < 3 || y < 3 || x >= WORLD_SIZE - 3 || y >= WORLD_SIZE - 3) {
                row.push('~');
                continue;
            }

            // Calculate continental landmass influence
            let maxInfluence = 0;
            let closestContinent = CONTINENTS[0];

            CONTINENTS.forEach(c => {
                let dx = (x - c.cx) / c.rx;
                let dy = (y - c.cy) / c.ry;
                let dist = Math.sqrt(dx * dx + dy * dy);
                let influence = Math.max(0, 1.0 - dist);
                if (influence > maxInfluence) {
                    maxInfluence = influence;
                    closestContinent = c;
                }
            });

            // Multi-frequency fractal noise for coastlines, bays, and natural shorelines
            let n1 = noise.fractal(x * 0.045, y * 0.045, 3, 0.5, 2.0);
            let n2 = noise.fractal(x * 0.09 + 50, y * 0.09 + 50, 2, 0.5, 2.0);
            let elevation = (maxInfluence * 1.3) + (n1 * 0.52) + (n2 * 0.18) - 0.28;

            // Smooth coastal falloff at outer perimeter
            let edgeDist = Math.min(x, WORLD_SIZE - 1 - x, y, WORLD_SIZE - 1 - y);
            if (edgeDist < 12) {
                elevation *= (edgeDist / 12);
            }

            // Elevation classification
            if (elevation < 0.0) {
                // Deep Ocean
                row.push('~');
            } else if (elevation < 0.12) {
                // Coastal Shallows / Sea Waters
                row.push('≈');
            } else if (elevation < 0.20) {
                // Coastal Beaches & Sand
                row.push('.');
            } else if (elevation > 0.84) {
                // High Mountain Peaks (Impassable)
                row.push('▲');
            } else if (elevation > 0.72) {
                // Foothills & Mountain Passes (Passable)
                row.push('^');
            } else {
                // Continental Landmasses & Biomes
                let r = Math.random();
                let b = closestContinent.id;

                if (b === 'T') {
                    // Borealis (Arctic Glacier & Snowfields)
                    if (r < 0.35) row.push('∆');
                    else if (r < 0.65) row.push('*');
                    else if (r < 0.85) row.push('♣');
                    else row.push('o');
                } else if (b === 'F') {
                    // Sylva (Verdant Ancient Forest)
                    if (r < 0.55) row.push('♣');
                    else if (r < 0.80) row.push('"');
                    else if (r < 0.90) row.push('s');
                    else row.push('t');
                } else if (b === 'P') {
                    // Crownlands (Rolling Meadows & Plains)
                    if (r < 0.60) row.push('"');
                    else if (r < 0.80) row.push('♣');
                    else if (r < 0.90) row.push('s');
                    else row.push('o');
                } else if (b === 'D') {
                    // Solaris (Scorched Sand Dunes & Cacti)
                    if (r < 0.60) row.push('.');
                    else if (r < 0.75) row.push('╤');
                    else if (r < 0.88) row.push('o');
                    else row.push('.');
                } else if (b === 'S') {
                    // Venomfang (Shadowmire & Mangroves)
                    if (r < 0.40) row.push('p');
                    else if (r < 0.70) row.push('T');
                    else if (r < 0.85) row.push('s');
                    else row.push('≈');
                } else if (b === '#') {
                    // Ashen Reach (Volcanic Caldera & Ashfields)
                    if (r < 0.35) row.push('v');
                    else if (r < 0.70) row.push('.');
                    else if (r < 0.85) row.push('▲');
                    else row.push('o');
                } else {
                    // Sacred Isle
                    if (r < 0.50) row.push('"');
                    else row.push('♣');
                }
            }
        }
        gameState.worldMap.push(row);
    }

    // Inter-Continental Stone Bridges & Causeways ('=')
    function carveBridge(x1, y1, x2, y2, width = 2) {
        let dx = x2 - x1;
        let dy = y2 - y1;
        let steps = Math.max(Math.abs(dx), Math.abs(dy));
        for (let s = 0; s <= steps; s++) {
            let cx = Math.round(x1 + (dx * s) / steps);
            let cy = Math.round(y1 + (dy * s) / steps);
            for (let ox = 0; ox < width; ox++) {
                for (let oy = 0; oy < width; oy++) {
                    let bx = cx + ox;
                    let by = cy + oy;
                    if (bx >= 0 && bx < WORLD_SIZE && by >= 0 && by < WORLD_SIZE) {
                        gameState.worldMap[by][bx] = '=';
                    }
                }
            }
        }
    }

    // 1. High King's Bridge: Kingsfall mainland across strait to Sacred Isle
    carveBridge(108, 92, 122, 92, 2);
    // 2. Elderwood Viaduct: Sylva across strait to Sacred Isle
    carveBridge(74, 92, 88, 92, 2);
    // 3. Northern Glacial Span: Crownlands north across sea to Borealis
    carveBridge(95, 48, 95, 62, 2);
    // 4. Golden Sun Bridge: Crownlands south across sea to Solaris
    carveBridge(136, 116, 136, 128, 2);
    // 5. Mire Causeway: Sylva south across estuary into Venomfang
    carveBridge(48, 120, 48, 132, 2);
    // 6. Dragon's Viaduct: Mainland south to Mount Caldera / Embergard
    carveBridge(100, 144, 100, 156, 2);

    // Place The Grand Shrine of the Ascendant on the Sacred Isle at (98, 92)
    gameState.worldMap[92][98] = 'Ω';
    gameState.worldMap[92][97] = '=';
    gameState.worldMap[92][99] = '=';
    gameState.worldMap[91][98] = '=';
    gameState.worldMap[93][98] = '=';

    // Regional Ancient Shrines
    const REGIONAL_SHRINES = [
        { x: 52, y: 28 }, // Borealis Glacier Shrine
        { x: 38, y: 80 }, // Elderwood Nature Shrine
        { x: 145, y: 75 }, // Crownlands Sun Shrine
        { x: 165, y: 160 }, // Solaris Desert Shrine
        { x: 38, y: 160 }, // Venomfang Mire Shrine
        { x: 105, y: 172 }  // Caldera Core Shrine
    ];
    REGIONAL_SHRINES.forEach(s => {
        if (gameState.worldMap[s.y] && gameState.worldMap[s.y][s.x]) {
            gameState.worldMap[s.y][s.x] = 'Ω';
        }
    });

    // Clear safe land around cities and spawn city POIs
    CITIES.forEach((city, index) => {
        // Guarantee solid walkable terrain around the city gate
        for (let dy = -2; dy <= 4; dy++) {
            for (let dx = -2; dx <= 4; dx++) {
                let cy = city.y + dy;
                let cx = city.x + dx;
                if (cy >= 0 && cy < WORLD_SIZE && cx >= 0 && cx < WORLD_SIZE) {
                    if (city.biome === 'F') gameState.worldMap[cy][cx] = '"';
                    else if (city.biome === 'D') gameState.worldMap[cy][cx] = '.';
                    else if (city.biome === 'T') gameState.worldMap[cy][cx] = '*';
                    else if (city.biome === 'S') gameState.worldMap[cy][cx] = '"';
                    else if (city.biome === 'P') gameState.worldMap[cy][cx] = '"';
                    else gameState.worldMap[cy][cx] = '.';
                }
            }
        }

        placePOI('C', city.name, city.x, city.y, city.biome, index, 3, 3);
        generateNPCsForCity(city.x, city.y); 
    });

    // Spawn dungeons, caves, and fortresses across the continents
    const biomes = ['F', 'D', 'T', 'S', 'P', '#'];
    biomes.forEach(b => {
        spawnQuota(b, 'D', 1, 2, 2); 
        spawnQuota(b, '^', Math.floor(Math.random() * 2) + 1, 3, 3); 
        spawnQuota(b, '*', Math.floor(Math.random() * 2) + 2, 2, 2); 
    });
    
    spawnWorldBoss(); 
}

export function spawnQuota(targetBiome, type, count, w, h) {
    let placed = 0;
    let attempts = 0;
    const POI_NAMES = {
        'F': { 'D': 'Verdant Barrow', '*': 'Whispering Cavern', '^': 'Elderwood Bastion' },
        'D': { 'D': 'Sunken Sun-Temple', '*': 'Scorpion Crypt', '^': 'Sandstone Citadel' },
        'T': { 'D': 'Glacial Vault', '*': 'Frost-Bitten Cavern', '^': 'Citadel of the Wyrm' },
        'S': { 'D': 'Murkwater Catacombs', '*': 'Sunken Fane', '^': 'Witch-Grave Fortress' },
        'P': { 'D': 'Fallen Star Bastion', '*': 'Forgotten Royal Vault', '^': 'Crownland Keep' },
        '#': { 'D': 'Brimstone Forge Crypt', '*': 'Obsidian Caverns', '^': 'Caldera Stronghold' }
    };

    while (placed < count && attempts < 1500) {
        let rx = Math.floor(Math.random() * (WORLD_SIZE - 12)) + 6;
        let ry = Math.floor(Math.random() * (WORLD_SIZE - 12)) + 6;
        let tile = gameState.worldMap[ry]?.[rx];

        if (tile && tile !== '~' && tile !== '=' && tile !== '▲' && tile !== '#' && getTileBiome(tile) === targetBiome) {
            let name = POI_NAMES[targetBiome]?.[type] || (type === 'D' ? 'Ancient Dungeon' : type === '*' ? 'Deep Cave' : 'Ruined Fortress');
            if (placePOI(type, name, rx, ry, targetBiome, null, w, h)) {
                placed++;
            }
        }
        attempts++;
    }
}

export function placePOI(type, name, rx, ry, biome, id, w, h) {
    if (rx < 1 || ry < 1 || rx + w >= WORLD_SIZE - 1 || ry + h >= WORLD_SIZE - 1) return false;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (gameState.pois[`${rx+x},${ry+y}`]) return false;
            let tile = gameState.worldMap[ry+y][rx+x];
            if (tile === '~' || tile === '=' || (type !== 'C' && (tile === '#' || tile === '▲'))) return false;
        }
    }
    let mainPOI = { type: type, id: id, name: name, biome: biome, rootX: rx, rootY: ry, w: w, h: h };
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            gameState.worldMap[ry+y][rx+x] = 'P'; 
            gameState.pois[`${rx+x},${ry+y}`] = mainPOI;
        }
    }
    return true;
}

export function enterLocalZone(poiKey, poi) {
    let player = gameState.player;
    player.inCombat = false;
    player.currentEnemy = null;
    player.combatTarget = null;
    player.zone = `${poiKey}_0`;
    if (!gameState.localMaps[player.zone]) {
        if(poi.type === 'C') generateCity(poiKey, poi);
        else if(poi.type === '^') generateFort(poiKey, poi);
        else generateMultiLevel(poiKey, poi);
    }
    
    let lMap = gameState.localMaps[player.zone];

    if ((poi.type === 'C' || poi.name === "Liberated Town") && lMap.map[19][22] !== 'C') {
        lMap.map[19][22] = 'C';
    }

    for(let y=0; y<LOCAL_SIZE; y++){
        for(let x=0; x<LOCAL_SIZE; x++){
            if(lMap.map[y][x] === '<') {
                player.localX = x; 
                if (poi.type === 'C' || poi.type === '^') {
                    player.localY = y - 1;
                } else {
                    player.localY = y;
                }
            }
        }
    }
}

export function enterFloor(zoneId, spawnChar) {
    let lMap = gameState.localMaps[zoneId];
    if (!lMap) return;
    for(let y=0; y<LOCAL_SIZE; y++){
        for(let x=0; x<LOCAL_SIZE; x++){
            if(lMap.map[y][x] === spawnChar) {
                gameState.player.localX = x; 
                gameState.player.localY = y; 
                return;
            }
        }
    }
}

export function createRect(map, x, y, w, h, wallChar, floorChar) {
    for (let i = y; i < y + h; i++) {
        for (let j = x; j < x + w; j++) {
            if (i === y || i === y + h - 1 || j === x || j === x + w - 1) {
                map[i][j] = wallChar;
            } else {
                map[i][j] = floorChar;
            }
        }
    }
}

export function drawMultiTileFeature(map, cx, cy, type, w, h) {
    let coords = [];
    for(let y=0; y<h; y++) {
        for(let x=0; x<w; x++) {
            let mx = cx + x - Math.floor(w/2);
            let my = cy + y - Math.floor(h/2);
            
            if (mx >= 2 && mx < LOCAL_SIZE-2 && my >= 2 && my < LOCAL_SIZE-2) {
                let dx = x - w/2 + 0.5;
                let dy = y - h/2 + 0.5;
                if ((dx*dx)/(w*w/4) + (dy*dy)/(h*h/4) <= 1.2) {
                    coords.push({x: mx, y: my});
                }
            }
        }
    }

    if (type === 'tree') {
        coords.forEach(c => { map[c.y][c.x] = 'l'; }); 
        if (coords.length > 0) {
            let tx = cx;
            let ty = cy + Math.floor(h/2) - 1;
            if(tx >=2 && tx < LOCAL_SIZE-2 && ty >=2 && ty < LOCAL_SIZE-2) map[ty][tx] = 't'; 
        }
    } else if (type === 'rock' || type === 'ice') {
        let char = type === 'ice' ? 'i' : 'r';
        coords.forEach(c => { map[c.y][c.x] = char; });
    } else if (type === 'shrub') {
        coords.forEach(c => { map[c.y][c.x] = 's'; });
    } else if (type === 'water') {
        coords.forEach(c => { map[c.y][c.x] = 'w'; });
    } else if (type === 'cactus') {
        let tx = cx;
        for(let i=0; i<h; i++) {
            let ty = cy - i;
            if(ty >=2 && ty < LOCAL_SIZE-2) map[ty][tx] = 'c';
        }
    } else if (type === 'dead_tree') {
        let tx = cx;
        for(let i=0; i<h; i++) {
            let ty = cy - i;
            if(ty >=2 && ty < LOCAL_SIZE-2) map[ty][tx] = 'd';
        }
    }
}

export function generateCity(poiKey, poi) {
    let map = Array(LOCAL_SIZE).fill(0).map(() => Array(LOCAL_SIZE).fill(' '));
    let entities = {};
    
    createRect(map, 2, 2, 36, 36, '#', '.');
    for(let i=3; i<37; i++) { map[20][i] = ','; map[i][20] = ','; }
    
    // Top Left Building (Alchemy)
    createRect(map, 5, 5, 12, 12, 'W', 'W'); map[16][10] = '+';
    // Top Right Building (Weapon)
    createRect(map, 23, 5, 12, 12, 'W', 'W'); map[16][28] = '+';
    // Bottom Left Building (Armor)
    createRect(map, 5, 23, 12, 12, 'W', 'W'); map[23][10] = '+';
    // Bottom Right Building (Tavern)
    createRect(map, 23, 23, 12, 12, 'W', 'W'); map[23][28] = '+';
    
    map[37][20] = '<'; 
    map[19][22] = 'C'; 
    
    // Town Square Garden Greenery & Herbs
    map[18][18] = 's'; map[18][19] = 's';
    map[22][18] = 's'; map[22][19] = 's';
    map[18][21] = 't'; map[17][21] = 'l';
    
    let doors = {
        '10,16': { type: 'Alchemy', returnX: 10, returnY: 17 },
        '28,16': { type: 'Weapon', returnX: 28, returnY: 17 },
        '10,23': { type: 'Armor', returnX: 10, returnY: 22 },
        '28,23': { type: 'Tavern', returnX: 28, returnY: 22 }
    };
    
    let cityNPCs = gameState.npcs[`${poi.rootX},${poi.rootY}`] || [];
    cityNPCs.forEach((npc) => {
        let spot = findEmptySpot(map, ',');
        if(spot) {
            map[spot.y][spot.x] = 'N';
            entities[`${spot.x},${spot.y}`] = { type: 'npc', data: npc };
        }
    });
    gameState.localMaps[`${poiKey}_0`] = { map, entities, name: poi.name, type: poi.type, doors: doors };
}

export function generateBuildingInterior(poiKey, bldType, returnX, returnY) {
    let map = Array(LOCAL_SIZE).fill(0).map(() => Array(LOCAL_SIZE).fill(' '));
    let entities = {};
    
    createRect(map, 13, 13, 14, 14, 'W', '-');
    map[26][20] = '<';
    map[27][20] = '<';
    
    for(let y=17; y<=22; y++) {
        for(let x=17; x<=22; x++) {
            map[y][x] = '=';
        }
    }
    
    let npcData = { name: NPC_NAMES[Math.floor(Math.random()*NPC_NAMES.length)], isVendor: true, inventory: [] };
    
    if (bldType === 'Weapon') {
        map[14][14] = 'F'; map[14][15] = 'F';
        map[16][14] = 'I'; map[17][14] = 'I';
        map[14][25] = '/'; map[15][25] = '/'; map[16][25] = '/';
        npcData.profession = "Blacksmith";
        npcData.dialogue = "I craft the sharpest steel in this forsaken land.";
        npcData.inventory = [
            generateRandomItem('Rare', 'sword'), generateRandomItem('Magic', 'axe'), 
            generateRandomItem('Basic', 'mace'), generateRandomItem('Basic', 'dagger')
        ];
    } else if (bldType === 'Armor') {
        map[14][14] = 'T'; map[15][14] = 'T'; map[16][14] = 'T';
        map[14][25] = 'O'; map[15][25] = 'O'; map[16][25] = 'O';
        map[19][15] = '╥'; map[20][15] = '╥';
        npcData.profession = "Armorer";
        npcData.dialogue = "A good shield will save your life out there.";
        npcData.inventory = [
            generateRandomItem('Rare', 'armor'), generateRandomItem('Magic', 'shield'), 
            generateRandomItem('Basic', 'helm'), generateRandomItem('Basic', 'boots')
        ];
    } else if (bldType === 'Alchemy') {
        map[14][14] = 'U'; map[14][15] = 'U';
        map[14][24] = 'K'; map[14][25] = 'K'; map[15][25] = 'K';
        map[19][15] = 's'; map[20][15] = 's';
        npcData.profession = "Alchemist";
        npcData.dialogue = "Potions, elixirs, and strange brews.";
        npcData.inventory = [
            generateRandomItem('Magic', 'staff'), generateRandomItem('Magic', 'wand'),
            {id: 'potion_health', category: 'consumable', type: 'consumable', name: 'Health Potion', price: 20, rarity: 'Basic', stats: {}, desc: 'Restores 30 HP', count: 5},
            {id: 'potion_mana', category: 'consumable', type: 'consumable', name: 'Mana Potion', price: 20, rarity: 'Basic', stats: {}, desc: 'Restores 30 MP', count: 5}
        ];
    } else {
        // Tavern
        map[14][18] = 'K'; map[14][19] = 'K'; map[14][20] = 'K'; map[14][21] = 'K';
        map[16][18] = '╥'; map[16][19] = '╥'; map[16][20] = '╥'; map[16][21] = '╥';
        map[17][18] = 'h'; map[17][19] = 'h'; map[17][20] = 'h'; map[17][21] = 'h';
        map[21][15] = '╥'; map[21][16] = 'h'; map[20][15] = 'h';
        map[21][24] = '╥'; map[21][25] = 'h'; map[22][24] = 'h';
        npcData.profession = "Tavern Keeper";
        npcData.dialogue = "Stay awhile and rest your weary bones.";
        npcData.inventory = [
            {id: 'potion_health', category: 'consumable', type: 'consumable', name: 'Stout Ale', price: 10, rarity: 'Basic', stats: {}, desc: 'Restores 30 HP. Takes the edge off.', count: 10},
            {id: 'torch', category: 'consumable', type: 'consumable', name: 'Pine Torch', life: 100, maxLife: 100, rarity: 'Basic', stats: {}, desc: 'Provides light. Decays over time.', price: 15}
        ];
    }
    
    map[18][20] = 'M';
    entities[`20,18`] = { type: 'npc', data: npcData };

    let numShoppers = Math.floor(Math.random() * 6);
    let possibleSpots = [];
    for(let y=14; y<=25; y++) {
        for(let x=14; x<=25; x++) {
            if (map[y][x] === '-' || map[y][x] === '=') possibleSpots.push({x,y});
        }
    }

    for (let i=0; i<numShoppers; i++) {
        if (possibleSpots.length > 0) {
            let idx = Math.floor(Math.random() * possibleSpots.length);
            let spot = possibleSpots.splice(idx, 1)[0];
            map[spot.y][spot.x] = 'N';
            entities[`${spot.x},${spot.y}`] = { 
                type: 'npc', 
                data: {
                    id: 'npc_' + Math.random().toString(36).substr(2, 9),
                    name: NPC_NAMES[Math.floor(Math.random()*NPC_NAMES.length)],
                    profession: "Townsfolk",
                    quirk: NPC_QUIRKS[Math.floor(Math.random()*NPC_QUIRKS.length)],
                    isVendor: false,
                    backstory: "Just picking up some supplies.",
                    dialogue: "Hmm... so many choices. I'm just browsing.",
                    questToGive: null,
                    inventory: []
                }
            };
        }
    }
    
    gameState.localMaps[`${poiKey}_${bldType}`] = { 
        map, entities, name: `${bldType} Shop`, type: 'shop',
        exitX: returnX, exitY: returnY
    };
}

export function generateArena(type, context) {
    let map = Array(LOCAL_SIZE).fill(0).map(() => Array(LOCAL_SIZE).fill(' '));
    let entities = {};
    let groundChar = '.';
    let borderChar = '#';
    let biome = context.biome || 'P';
    
    let cx = LOCAL_SIZE/2, cy = LOCAL_SIZE/2;
    let radius = 12;
    for(let y=2; y<LOCAL_SIZE-2; y++) {
        for(let x=2; x<LOCAL_SIZE-2; x++) {
            let dist = Math.sqrt(Math.pow(x-cx, 2) + Math.pow(y-cy, 2));
            let noisyRadius = radius + (Math.sin(x*0.5) * 2) + (Math.cos(y*0.5) * 2);
            if (dist < noisyRadius) {
                map[y][x] = groundChar;
            } else if (dist < noisyRadius + 2) {
                map[y][x] = borderChar;
            }
        }
    }
    
    let numObstacles = Math.floor(Math.random() * 8) + 6;
    for(let i=0; i<numObstacles; i++) {
        let rx = Math.floor(Math.random() * (LOCAL_SIZE - 10)) + 5;
        let ry = Math.floor(Math.random() * (LOCAL_SIZE - 10)) + 5;
        if(map[ry][rx] === groundChar && Math.sqrt(Math.pow(rx-cx, 2) + Math.pow(ry-cy, 2)) < radius - 2) {
            let sizeW = Math.floor(Math.random()*3)+2; 
            let sizeH = Math.floor(Math.random()*3)+2;
            
            if (biome === 'F') { 
                let r = Math.random();
                if(r < 0.6) drawMultiTileFeature(map, rx, ry, 'tree', sizeW+1, sizeH+2); 
                else if(r < 0.8) drawMultiTileFeature(map, rx, ry, 'shrub', sizeW, sizeH);
                else drawMultiTileFeature(map, rx, ry, 'rock', sizeW, sizeH-1);
            } 
            else if (biome === 'D') { 
                let r = Math.random();
                if(r < 0.4) drawMultiTileFeature(map, rx, ry, 'rock', sizeW, sizeH);
                else if(r < 0.8) drawMultiTileFeature(map, rx, ry, 'cactus', 1, sizeH+1);
                else drawMultiTileFeature(map, rx, ry, 'shrub', 2, 2); 
            }
            else if (biome === 'T') { 
                let r = Math.random();
                if(r < 0.5) drawMultiTileFeature(map, rx, ry, 'ice', sizeW, sizeH);
                else if(r < 0.8) drawMultiTileFeature(map, rx, ry, 'rock', sizeW, sizeH);
                else drawMultiTileFeature(map, rx, ry, 'dead_tree', 1, sizeH);
            }
            else if (biome === 'S') { 
                let r = Math.random();
                if(r < 0.4) drawMultiTileFeature(map, rx, ry, 'water', sizeW, sizeH);
                else if(r < 0.7) drawMultiTileFeature(map, rx, ry, 'tree', sizeW, sizeH);
                else drawMultiTileFeature(map, rx, ry, 'shrub', sizeW, sizeH);
            }
            else if (biome === '#') { 
                let r = Math.random();
                if(r < 0.8) drawMultiTileFeature(map, rx, ry, 'rock', sizeW+1, sizeH+1); 
                else drawMultiTileFeature(map, rx, ry, 'shrub', 2, 2);
            }
            else { 
                let r = Math.random();
                if(r < 0.4) drawMultiTileFeature(map, rx, ry, 'shrub', sizeW, sizeH);
                else if(r < 0.7) drawMultiTileFeature(map, rx, ry, 'tree', sizeW, sizeH+1);
                else drawMultiTileFeature(map, rx, ry, 'rock', 2, 2);
            }
        }
    }
    
    let exitPlaced = false;
    for(let y=LOCAL_SIZE-5; y>5; y--) {
        for(let x=5; x<LOCAL_SIZE-5; x++) {
             if (map[y][x] === groundChar && !exitPlaced) {
                 map[y][x] = '<';
                 map[y-1][x] = '<'; 
                 exitPlaced = true;
                 break;
             }
        }
        if(exitPlaced) break;
    }

    if (type === 'ambush') {
        populateEnemies(map, entities, Math.floor(Math.random()*3)+3, 'arena', { biome: context.biome, type: '*' }, true);
        gameState.localMaps['arena_0'] = { map, entities, name: "Ambush Arena", type: 'arena' };
    } else if (type === 'merchant') {
        let spot = findEmptySpot(map, '.');
        if (spot) {
            map[spot.y][spot.x] = 'M';
            entities[`${spot.x},${spot.y}`] = { 
                type: 'npc', 
                data: { name: 'Wandering Collector', isVendor: true, dialogue: 'I deal in rare goods...', inventory: [generateRandomItem('Legendary'), generateRandomItem('Rare'), generateRandomItem('Rare')] }
            };
        }
        gameState.localMaps['arena_0'] = { map, entities, name: "Hidden Campsite", type: 'arena' };
    } else if (type === 'world_boss') {
        let spot = findEmptySpot(map, '.');
        if (spot) {
            map[spot.y][spot.x] = 'B';
            entities[`${spot.x},${spot.y}`] = { 
                type: 'enemy', 
                data: { name: context.name, hp: context.hp, maxHp: context.hp, damage: context.damage, isBoss: true, aggro: 20, level: context.level, biome: context.biome, elite: null }
            };
        }
        gameState.localMaps['arena_0'] = { map, entities, name: "World Boss Lair", type: 'arena' };
    }
    
    gameState.player.zone = 'arena_0';
    gameState.player.inCombat = false;
    gameState.player.currentEnemy = null;
    gameState.player.combatTarget = null;
    
    let spawned = false;
    for(let y=0; y<LOCAL_SIZE; y++){
        for(let x=0; x<LOCAL_SIZE; x++){
            if(map[y][x] === '<') {
                gameState.player.localX = x;
                gameState.player.localY = y - 2;
                spawned = true;
                break;
            }
        }
        if(spawned) break;
    }
    
    if (!spawned) {
         let backup = findEmptySpot(map, '.');
         gameState.player.localX = backup ? backup.x : LOCAL_SIZE/2;
         gameState.player.localY = backup ? backup.y : LOCAL_SIZE/2;
    }

    if (window.renderMap) window.renderMap();
}

export function generateFort(poiKey, poi) {
    let map = Array(LOCAL_SIZE).fill(0).map(() => Array(LOCAL_SIZE).fill(' '));
    let entities = {};
    createRect(map, 4, 4, 32, 32, '#', '.');
    createRect(map, 12, 12, 16, 16, '#', '.'); map[27][20] = '+'; 
    map[35][20] = '<'; 
    
    populateEnemies(map, entities, 12, poiKey, poi, true); 
    gameState.localMaps[`${poiKey}_0`] = { map, entities, name: poi.name, type: poi.type };
}

export function generateMultiLevel(poiKey, poi) {
    let floors = poi.type === 'D' ? Math.floor(Math.random() * 5) + 2 : Math.floor(Math.random() * 3) + 1; 
    
    for(let z=0; z<floors; z++) {
        let map = Array(LOCAL_SIZE).fill(0).map(() => Array(LOCAL_SIZE).fill(' '));
        let entities = {};
        
        if (poi.type === 'D') {
            let rooms = [];
            for(let r=0; r<8; r++) {
                let w = Math.floor(Math.random()*6)+5;
                let h = Math.floor(Math.random()*6)+5;
                let x = Math.floor(Math.random()*(LOCAL_SIZE-w-4))+2;
                let y = Math.floor(Math.random()*(LOCAL_SIZE-h-4))+2;
                createRect(map, x, y, w, h, '#', '.');
                rooms.push({cx: Math.floor(x+w/2), cy: Math.floor(y+h/2)});
            }
            for(let i=1; i<rooms.length; i++) {
                let prev = rooms[i-1];
                let curr = rooms[i];
                let minX = Math.min(prev.cx, curr.cx);
                let maxX = Math.max(prev.cx, curr.cx);
                for(let x=minX; x<=maxX; x++) {
                    if(map[prev.cy][x] === ' ') map[prev.cy][x] = '#';
                    map[prev.cy][x] = '.';
                    if(map[prev.cy-1][x] === ' ') map[prev.cy-1][x] = '#';
                    if(map[prev.cy+1][x] === ' ') map[prev.cy+1][x] = '#';
                }
                let minY = Math.min(prev.cy, curr.cy);
                let maxY = Math.max(prev.cy, curr.cy);
                for(let y=minY; y<=maxY; y++) {
                    if(map[y][curr.cx] === ' ') map[y][curr.cx] = '#';
                    map[y][curr.cx] = '.';
                    if(map[y][curr.cx-1] === ' ') map[y][curr.cx-1] = '#';
                    if(map[y][curr.cx+1] === ' ') map[y][curr.cx+1] = '#';
                }
            }
            for (let y = 1; y < LOCAL_SIZE - 1; y++) {
                for (let x = 1; x < LOCAL_SIZE - 1; x++) {
                    if (map[y][x] === '.') {
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (map[y + dy][x + dx] === ' ') {
                                    map[y + dy][x + dx] = '#';
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // Caves
            for(let y=0; y<LOCAL_SIZE; y++) {
                for(let x=0; x<LOCAL_SIZE; x++) {
                    map[y][x] = Math.random() < 0.45 ? '#' : '.';
                }
            }
            for(let it=0; it<4; it++) {
                let temp = Array(LOCAL_SIZE).fill(0).map(() => Array(LOCAL_SIZE).fill('.'));
                for(let y=0; y<LOCAL_SIZE; y++) {
                    for(let x=0; x<LOCAL_SIZE; x++) {
                        let walls = 0;
                        for(let dy=-1; dy<=1; dy++) {
                            for(let dx=-1; dx<=1; dx++) {
                                if(y+dy < 0 || y+dy >= LOCAL_SIZE || x+dx < 0 || x+dx >= LOCAL_SIZE) walls++;
                                else if(map[y+dy][x+dx] === '#') walls++;
                            }
                        }
                        temp[y][x] = walls >= 5 ? '#' : '.';
                    }
                }
                map = temp;
            }
        }

        // Environmental Hazards
        for (let y = 2; y < LOCAL_SIZE - 2; y++) {
            for (let x = 2; x < LOCAL_SIZE - 2; x++) {
                if (map[y][x] === '.') {
                    let r = Math.random();
                    if (r < 0.015) map[y][x] = '&'; 
                    else if (r < 0.025) map[y][x] = 'p'; 
                    else if (r < 0.035) map[y][x] = 'x'; 
                    else if (r < 0.045 && poi.biome === '#') map[y][x] = 'v'; 
                }
            }
        }
        
        let startChar = z === 0 ? '<' : '▲';
        let spot1 = findEmptySpot(map, '.');
        if(spot1) map[spot1.y][spot1.x] = startChar;
        
        if(z < floors - 1) {
            let spot2 = findEmptySpot(map, '.');
            if(spot2) map[spot2.y][spot2.x] = '▼';
        }
        
        let hasBoss = (z === floors - 1);
        populateEnemies(map, entities, 8, poiKey, poi, hasBoss);
        
        if (z < floors - 1) {
            let enemyKeys = Object.keys(entities).filter(k => entities[k].type === 'enemy');
            if (enemyKeys.length > 0) {
                let keyWithKey = enemyKeys[Math.floor(Math.random() * enemyKeys.length)];
                entities[keyWithKey].data.hasKey = true;
            }
        }

        gameState.localMaps[`${poiKey}_${z}`] = { map, entities, name: `${poi.name} (Floor ${z+1})`, type: poi.type };
    }
}

export function spawnWorldBoss() {
    if (!gameState.player.worldBosses) gameState.player.worldBosses = [];
    gameState.player.worldBosses = [];

    const biomes = ['F', 'D', 'T', 'S', 'P', '#'];
    biomes.forEach(b => {
        let attempts = 0;
        while (attempts < 200) {
            let rx = Math.floor(Math.random() * (WORLD_SIZE - 24)) + 12;
            let ry = Math.floor(Math.random() * (WORLD_SIZE - 24)) + 12;
            let tile = gameState.worldMap[ry]?.[rx];
            if (tile && tile !== '~' && tile !== '=' && tile !== '▲' && tile !== '#' && getTileBiome(tile) === b && !gameState.pois[`${rx},${ry}`]) {
                let bInfo = BIOME_BOSSES[b] || BIOME_BOSSES['P'];
                gameState.player.worldBosses.push({
                    x: rx, y: ry,
                    biome: b,
                    name: bInfo.name,
                    symbol: 'Ω',
                    color: '#ff00ff',
                    hp: 500,
                    damage: 25,
                    level: 10
                });
                break;
            }
            attempts++;
        }
    });
}

export function findEmptySpot(map, char) {
    let spots = [];
    for(let y=1; y<LOCAL_SIZE-1; y++) {
        for(let x=1; x<LOCAL_SIZE-1; x++) {
            if(map[y][x] === char) spots.push({x,y});
        }
    }
    return spots.length ? spots[Math.floor(Math.random()*spots.length)] : null;
}

export function generateNPCsForCity(x, y) {
    gameState.npcs[`${x},${y}`] = [];
    
    // Find city definition
    let city = CITIES.find(c => c.x === x && c.y === y);
    if (!city) {
        city = CITIES.reduce((closest, c) => {
            let d = Math.hypot(c.x - x, c.y - y);
            return (!closest || d < closest.d) ? { c, d } : closest;
        }, null)?.c || CITIES[4];
    }

    let cityName = city.name;
    let craftedNpcs = CITY_NPCS_DATA[cityName] || [];

    // 1. Add all crafted, storied NPCs for this city
    craftedNpcs.forEach((npcDef, idx) => {
        let quest = null;
        if (npcDef.questToGive) {
            quest = JSON.parse(JSON.stringify(npcDef.questToGive));
        }

        gameState.npcs[`${x},${y}`].push({
            id: `npc_${cityName.toLowerCase()}_${idx}`,
            name: npcDef.name,
            profession: npcDef.profession,
            quirk: npcDef.quirk,
            dialogue: npcDef.dialogue,
            backstory: npcDef.backstory,
            lore: npcDef.lore,
            rumor: npcDef.rumor,
            isVendor: false,
            questToGive: quest,
            inventory: []
        });
    });

    // 2. Add ambient procedural citizens for living city atmosphere
    let citizenCount = Math.floor(Math.random() * 2) + 2;
    for(let i=0; i<citizenCount; i++) {
        let name = NPC_NAMES[Math.floor(Math.random()*NPC_NAMES.length)];
        let prof = NPC_PROFESSIONS[Math.floor(Math.random()*NPC_PROFESSIONS.length)];
        let quirk = NPC_QUIRKS[Math.floor(Math.random()*NPC_QUIRKS.length)];
        let secret = NPC_SECRETS[Math.floor(Math.random()*NPC_SECRETS.length)];
        let motive = NPC_MOTIVATIONS[Math.floor(Math.random()*NPC_MOTIVATIONS.length)];
        
        let quest = null;
        if (Math.random() < 0.4) {
            let pool = ENEMIES[city.biome] || ENEMIES['P'];
            let targetMob = pool[Math.floor(Math.random() * pool.length)];
            let reqCount = Math.floor(Math.random() * 4) + 3; 
            quest = {
                id: 'q_bounty_' + Math.random().toString(36).substr(2, 8),
                category: 'Local Bounty',
                title: `Cull the ${targetMob}s`,
                desc: `The outskirts of ${cityName} are overrun by predators. Slay ${reqCount} ${targetMob}s to keep travelers safe.`,
                target: targetMob,
                targets: [targetMob],
                progress: 0,
                maxProgress: reqCount,
                rewardGold: reqCount * 18,
                rewardXp: reqCount * 35,
                patronCity: cityName,
                turnInDialogue: `Splendid job! ${cityName} sleeps safer because of your valor. Take this bounty!`,
                isComplete: false,
                isTurnedIn: false
            };
        }

        gameState.npcs[`${x},${y}`].push({
            id: 'npc_' + Math.random().toString(36).substr(2, 9),
            name: name,
            profession: prof,
            quirk: quirk,
            isVendor: false,
            backstory: `${secret} ${motive}`,
            lore: `I have lived in ${cityName} for many cycles. When night falls over the continent of ${city.region}, stay within the city walls or keep a torch lit.`,
            rumor: `There are ancient dungeons and forgotten caves dotting the wilderness. Look for entrances near mountain foothills.`,
            dialogue: `Greetings, traveler. I am ${name}, a ${prof}. Things have been ${quirk} around here lately.`,
            questToGive: quest,
            inventory: []
        });
    }
}

export function populateEnemies(map, entities, count, poiKey, poi, spawnBoss) {
    let pool = ENEMIES[poi.biome] || ENEMIES['P'];
    let pLevel = gameState.player.level || 1;
    
    function modifyRangedName(name) {
         if (name.includes('Goblin') || name.includes('Orc') || name.includes('Bandit') || name.includes('Thief') || name.includes('Nomad')) {
              let suffixes = ['Archer', 'Slinger', 'Marksman', 'Mage'];
              return name + ' ' + suffixes[Math.floor(Math.random()*suffixes.length)];
         }
         return 'Spitting ' + name;
    }

    for(let i=0; i<count; i++) {
        let spot = findEmptySpot(map, '.');
        if(spot) {
            let eName = pool[Math.floor(Math.random()*pool.length)];
            let stat = ENEMY_STATS[eName] || { hp: 30, damage: 5 };
            
            let eLevel = Math.max(1, pLevel + Math.floor(Math.random() * 2));
            let hpScaled = stat.hp + (eLevel * 10);
            let dmgScaled = stat.damage + (eLevel * 3);
            
            let isElite = Math.random() < 0.10;
            let elitePrefix = null;
            if (isElite) {
                elitePrefix = ELITE_PREFIXES[Math.floor(Math.random() * ELITE_PREFIXES.length)];
                eName = `${elitePrefix} ${eName}`;
                hpScaled = Math.floor(hpScaled * 2.0);
                dmgScaled = Math.floor(dmgScaled * 1.5);
            }

            let isRanged = Math.random() < 0.20;
            let rSkill = null;
            if (isRanged) {
                eName = modifyRangedName(eName);
                let possibleSkills = ACTIVES.filter(s => s.type === 'combat' && s.targetType === 'enemy' && s.speed && s.speed > 0);
                rSkill = possibleSkills[Math.floor(Math.random() * possibleSkills.length)].id;
            }

            map[spot.y][spot.x] = 'e';
            entities[`${spot.x},${spot.y}`] = { 
                type: 'enemy', 
                data: { name: eName, hp: hpScaled, maxHp: hpScaled, damage: dmgScaled, isBoss: false, aggro: Math.floor(Math.random()*3)+3, level: eLevel, elite: elitePrefix, dropBase: stat.dropBase || null, isRanged: isRanged, rangedSkill: rSkill, cooldowns: 0 } 
            };
        }
    }
    if(spawnBoss) {
        let spot = findEmptySpot(map, '.');
        if(spot) {
            map[spot.y][spot.x] = 'B';
            let bInfo = BIOME_BOSSES[poi.biome] || BIOME_BOSSES['P'];
            let bLevel = pLevel + 3;
            entities[`${spot.x},${spot.y}`] = { 
                type: 'enemy', 
                data: { name: bInfo.name, hp: 100 + (bLevel * 20), maxHp: 100 + (bLevel * 20), damage: 15 + (bLevel * 4), isBoss: true, poiRef: poiKey, biome: poi.biome, aggro: 8, level: bLevel, elite: null } 
            };
        }
    }
}
