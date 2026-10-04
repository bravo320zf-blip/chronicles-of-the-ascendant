// Procedural World Generation, Cities, Dungeons, Interiors, and Spawns
import { gameState } from "./state.js";
import { WORLD_SIZE, LOCAL_SIZE, SHARED_WORLD_SEED } from "../data/constants.js";
import { CITIES, ENEMIES, ENEMY_STATS, ELITE_PREFIXES, BIOME_BOSSES, NPC_NAMES, NPC_PROFESSIONS, NPC_QUIRKS, NPC_SECRETS, NPC_MOTIVATIONS } from "../data/worldData.js";
import { ACTIVES } from "../data/skills.js";
import { generateRandomItem } from "../data/items.js";
import { logMessage, playEncounterAnimation } from "../ui/log.js";

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
    let baseBiomes = [];
    
    const seeds = [
        { x: 30, y: 30, type: 'F' },
        { x: 170, y: 30, type: 'D' },
        { x: 30, y: 170, type: 'T' },
        { x: 170, y: 170, type: 'S' },
        { x: 100, y: 100, type: 'P' },
        { x: 100, y: 150, type: '#' }
    ];

    for (let y = 0; y < WORLD_SIZE; y++) {
        let row = [];
        for (let x = 0; x < WORLD_SIZE; x++) {
            if (x === 0 || y === 0 || x === WORLD_SIZE-1 || y === WORLD_SIZE-1) {
                row.push('#');
            } else {
                let closest = seeds[0];
                let minDist = Infinity;
                seeds.forEach(s => {
                    let d = Math.sqrt(Math.pow(s.x - x, 2) + Math.pow(s.y - y, 2));
                    d += (Math.random() * 20 - 10);
                    if (d < minDist) { minDist = d; closest = s; }
                });
                row.push(closest.type);
            }
        }
        baseBiomes.push(row);
    }
    
    for (let y = 0; y < WORLD_SIZE; y++) {
        let row = [];
        for (let x = 0; x < WORLD_SIZE; x++) {
            let base = baseBiomes[y][x];
            if (base === '#') row.push('#');
            else {
                let rand = Math.random();
                if (rand > 0.9995 && !['#', 'w'].includes(base)) {
                    row.push('Ω');
                } else if (base === 'F') row.push(rand > 0.8 ? 't' : (rand > 0.7 ? 's' : (rand > 0.5 ? 'g' : 'F')));
                else if (base === 'D') row.push(rand > 0.95 ? 'c' : (rand > 0.9 ? 'r' : 'D'));
                else if (base === 'T') row.push(rand > 0.9 ? 'i' : (rand > 0.8 ? 's' : (rand > 0.75 ? 'r' : 'T')));
                else if (base === 'S') row.push(rand > 0.8 ? 'w' : (rand > 0.7 ? 't' : (rand > 0.6 ? 's' : 'S')));
                else if (base === 'P') row.push(rand > 0.8 ? 'g' : (rand > 0.75 ? 's' : (rand > 0.65 ? 't' : 'P')));
                else row.push(base);
            }
        }
        gameState.worldMap.push(row);
    }

    CITIES.forEach((city, index) => {
        placePOI('C', city.name, city.x, city.y, city.biome, index, 3, 3);
        generateNPCsForCity(city.x, city.y); 
    });

    const biomes = ['F', 'D', 'T', 'S', 'P', '#'];
    biomes.forEach(b => {
        spawnQuota(b, 'D', 1, 1, 2, 2); 
        spawnQuota(b, '^', Math.floor(Math.random()*3)+1, 3, 3); 
        spawnQuota(b, '*', Math.floor(Math.random()*3)+2, 2, 2); 
    });
    
    spawnWorldBoss(); 
}

export function spawnQuota(targetBiome, type, count, w, h) {
    let placed = 0;
    let attempts = 0;
    while(placed < count && attempts < 1000) {
        let rx = Math.floor(Math.random() * (WORLD_SIZE - 6)) + 3;
        let ry = Math.floor(Math.random() * (WORLD_SIZE - 6)) + 3;
        if (gameState.worldMap[ry][rx] === targetBiome || (targetBiome === 'P' && ['t','g'].includes(gameState.worldMap[ry][rx]))) {
            let name = type === 'D' ? 'Dark Dungeon' : type === '*' ? 'Damp Cave' : 'Ruined Fortress';
            if (placePOI(type, name, rx, ry, targetBiome, null, w, h)) {
                placed++;
            }
        }
        attempts++;
    }
}

export function placePOI(type, name, rx, ry, biome, id, w, h) {
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (gameState.pois[`${rx+x},${ry+y}`] || gameState.worldMap[ry+y][rx+x] === '#' || gameState.worldMap[ry+y][rx+x] === 'P') return false; 
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
        while (attempts < 100) {
            let rx = Math.floor(Math.random() * (WORLD_SIZE - 20)) + 10;
            let ry = Math.floor(Math.random() * (WORLD_SIZE - 20)) + 10;
            if (gameState.worldMap[ry] && gameState.worldMap[ry][rx] === b && !gameState.pois[`${rx},${ry}`]) {
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
    let count = Math.floor(Math.random() * 4) + 4;
    let allEnemies = Object.values(ENEMIES).flat();

    for(let i=0; i<count; i++) {
        let name = NPC_NAMES[Math.floor(Math.random()*NPC_NAMES.length)];
        let prof = NPC_PROFESSIONS[Math.floor(Math.random()*NPC_PROFESSIONS.length)];
        let quirk = NPC_QUIRKS[Math.floor(Math.random()*NPC_QUIRKS.length)];
        let secret = NPC_SECRETS[Math.floor(Math.random()*NPC_SECRETS.length)];
        let motive = NPC_MOTIVATIONS[Math.floor(Math.random()*NPC_MOTIVATIONS.length)];
        
        let quest = null;
        if (Math.random() < 0.6) {
            let targetMob = allEnemies[Math.floor(Math.random() * allEnemies.length)];
            let reqCount = Math.floor(Math.random() * 5) + 3; 
            quest = {
                id: 'q_' + Math.random().toString(36).substr(2, 9),
                title: `Cull the ${targetMob}s`,
                desc: `The wilderness is getting far too dangerous. I need someone capable to hunt down ${reqCount} ${targetMob}s.`,
                target: targetMob,
                progress: 0,
                maxProgress: reqCount,
                rewardGold: reqCount * 15,
                rewardXp: reqCount * 30,
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
            dialogue: `Ah, an adventurer... I am feeling quite ${quirk} today.`,
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
