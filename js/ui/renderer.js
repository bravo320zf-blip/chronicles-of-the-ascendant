// ASCII Map Rendering, Fog of War, Player & Multiplayer Entity Rendering
import { gameState, passiveRank } from "../core/state.js";
import { TERRAIN, LOCAL_TILES } from "../data/terrain.js";
import { WORLD_SIZE, LOCAL_SIZE, VIEW_RADIUS } from "../data/constants.js";
import { updateTimeUI } from "../core/time.js";

export function updateStatus() {
    let player = gameState.player;
    let nameEl = document.getElementById('ui-name');
    if (nameEl) nameEl.innerText = `Lvl ${player.level || 1} ${player.name}`;
    
    let hpEl = document.getElementById('ui-hp');
    if (hpEl) hpEl.innerText = `HP: ${Math.floor(player.hp)}/${player.maxHp}`;
    
    let xpEl = document.getElementById('ui-xp');
    if (xpEl) xpEl.innerText = `XP: ${Math.floor(player.xp || 0)}/${player.nextLevelXp || 100}`;
    
    let mpEl = document.getElementById('ui-mp');
    if (mpEl) mpEl.innerText = `MP: ${Math.floor(player.mp)}/${player.maxMp}`;
    
    updateTimeUI();
}

export function renderMap() {
    let player = gameState.player;
    let asciiHTML = "";
    let inWorld = player.zone === 'world';
    let px = inWorld ? player.worldX : player.localX;
    let py = inWorld ? player.worldY : player.localY;
    let mapData = inWorld ? gameState.worldMap : gameState.localMaps[player.zone]?.map;
    let bound = inWorld ? WORLD_SIZE : LOCAL_SIZE;
    
    if (!mapData) return;

    let isNight = (player.time % 1440) >= 1080 || (player.time % 1440) < 360; 
    let isDarkArea = !inWorld && (gameState.localMaps[player.zone]?.type === 'D' || gameState.localMaps[player.zone]?.type === '*');
    let effectivelyNight = isNight || isDarkArea;

    let baseRadius = VIEW_RADIUS + (passiveRank('omniscience') ? player.passives.omniscience * 2 : 0);
    let currentViewRadius = (effectivelyNight && !player.torchActive) ? 8 : baseRadius;

    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
        if (effectivelyNight && !player.torchActive) {
            mapContainer.classList.add('fow-mask-night');
            mapContainer.classList.remove('fow-mask');
        } else {
            mapContainer.classList.add('fow-mask');
            mapContainer.classList.remove('fow-mask-night');
        }
    }

    for (let y = py - currentViewRadius; y <= py + currentViewRadius; y++) {
        for (let x = px - currentViewRadius; x <= px + currentViewRadius; x++) {
            
            let dist = Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2));
            if (dist > currentViewRadius + 0.5) {
                asciiHTML += `<span class="map-tile"> </span>`;
                continue;
            }

            // Current Player
            if (x === px && y === py) {
                asciiHTML += `<span class="map-tile map-player" title="You (${player.name})">@</span>`;
                continue;
            }

            // Other Online MMORPG Players in the same zone
            let otherPlayer = null;
            for (let [uid, op] of gameState.onlinePlayers.entries()) {
                if (op.zone === player.zone) {
                    let opX = inWorld ? op.worldX : op.localX;
                    let opY = inWorld ? op.worldY : op.localY;
                    if (opX === x && opY === y) {
                        otherPlayer = op;
                        break;
                    }
                }
            }

            if (otherPlayer) {
                asciiHTML += `<span class="map-tile map-online-player blink" title="Player: ${otherPlayer.name} (Lvl ${otherPlayer.level || 1})">@</span>`;
                continue;
            }

            if (y >= 0 && y < bound && x >= 0 && x < bound) {
                let tile = mapData[y][x];
                if (inWorld) {
                    let isBoss = player.worldBosses?.find(b => b.x === x && b.y === y);
                    if (isBoss) {
                        asciiHTML += `<span class="map-tile blink" style="color:${isBoss.color}">${isBoss.symbol}</span>`;
                        continue;
                    }
                    
                    if (tile === 'P') {
                        let poiObj = gameState.pois[`${x},${y}`];
                        if (poiObj) {
                            if (poiObj.type === 'C') {
                                let isBottomLeft = (x === poiObj.rootX && y === poiObj.rootY + poiObj.h - 1);
                                let isBottomRight = (x === poiObj.rootX + poiObj.w - 1 && y === poiObj.rootY + poiObj.h - 1);
                                
                                if (isBottomLeft && poiObj.id === player.boundCity) {
                                    asciiHTML += `<span class="map-tile text-red-500 font-bold" title="Home City">⚑</span>`;
                                    continue;
                                }
                                
                                if (isBottomRight) {
                                    let cityNPCs = gameState.npcs[`${poiObj.rootX},${poiObj.rootY}`] || [];
                                    let hasTurnIn = false;
                                    for (let npc of cityNPCs) {
                                        if (npc.questToGive && player.quests) {
                                            let q = player.quests.find(q => q.id === npc.questToGive.id);
                                            if (q && q.isComplete && !q.isTurnedIn) hasTurnIn = true;
                                        }
                                    }
                                    if (hasTurnIn) {
                                        asciiHTML += `<span class="map-tile text-yellow-400 font-bold blink" title="Quest Ready to Turn In">⚑</span>`;
                                        continue;
                                    }
                                }
                            }
                            let c = poiObj.type === 'C' ? 'map-city' : (poiObj.type === '^' ? 'map-fort' : (poiObj.type === 'D' ? 'map-dungeon' : 'map-cave'));
                            asciiHTML += `<span class="map-tile ${c}" title="${poiObj.name}">${poiObj.type === 'C' ? '⌂' : poiObj.type}</span>`;
                        } else {
                            asciiHTML += `<span class="map-tile">?</span>`;
                        }
                    } else {
                        let tObj = TERRAIN[tile] || { color: '#fff', char: ' ' };
                        asciiHTML += `<span class="map-tile" style="color: ${tObj.color}">${tObj.char}</span>`;
                    }
                } else {
                    // LOCAL MAP RENDERING
                    let lMap = gameState.localMaps[player.zone];
                    let isProj = false;
                    let projChar = ''; let projColor = '';
                    
                    if (lMap.projectiles) {
                         let p = lMap.projectiles.find(pr => pr.x === x && pr.y === y);
                         if (p) { isProj = true; projChar = p.skill.projChar || '*'; projColor = p.skill.projColor || '#ff0000'; }
                    }
                    
                    if (isProj) {
                         asciiHTML += `<span class="map-tile blink" style="color: ${projColor}; font-weight: bold; text-shadow: 0 0 5px ${projColor};">${projChar}</span>`;
                         continue; 
                    }

                    let lObj = LOCAL_TILES[tile] || { color: '#fff', char: tile };
                    let c = tile === 'B' ? 'map-dungeon blink' : (tile === 'M' ? 'text-cyan-400 font-bold' : (tile === 'N' ? 'map-city' : ''));
                    let tileColor = lObj.color;
                    let bgStyle = "";
                    
                    if (tile === 'N' || tile === 'M') {
                        let entity = gameState.localMaps[player.zone].entities[`${x},${y}`];
                        if (entity && entity.type === 'npc' && entity.data.questToGive && player.quests) {
                            let q = player.quests.find(q => q.id === entity.data.questToGive.id);
                            if (q && q.isComplete && !q.isTurnedIn) {
                                tileColor = '#ffd700';
                                c = 'font-bold blink';
                            }
                        }
                    }

                    if (player.targetingMode) {
                        let skill = player.activeSpell;
                        const MULTI_COLORS = ['rgba(255, 0, 0, 0.6)', 'rgba(255, 128, 0, 0.6)', 'rgba(255, 255, 0, 0.6)', 'rgba(0, 255, 0, 0.6)'];

                        if (skill.targetType === 'aoe') {
                            if (Math.abs(x - player.aoeCenter.x) <= skill.aoeRadius && Math.abs(y - player.aoeCenter.y) <= skill.aoeRadius) {
                                bgStyle = `background-color: rgba(0, 255, 255, 0.4); color: white;`;
                            }
                        } else {
                            let selectedIndex = player.selectedTargets.findIndex(t => t.x === x && t.y === y);
                            if (selectedIndex !== -1) {
                                bgStyle = `background-color: ${MULTI_COLORS[selectedIndex]}; color: white;`;
                            } else if (player.validTargets[player.currentTargetIdx] && player.validTargets[player.currentTargetIdx].x === x && player.validTargets[player.currentTargetIdx].y === y) {
                                bgStyle = `background-color: rgba(255, 255, 255, 0.5); color: black;`;
                            }
                        }
                    }

                    asciiHTML += `<span class="map-tile ${c}" style="color: ${tileColor}; ${bgStyle}">${lObj.char}</span>`;
                }
            } else {
                asciiHTML += `<span class="map-tile text-gray-800">#</span>`;
            }
        }
        asciiHTML += "<br>";
    }
    
    const mapEl = document.getElementById('ascii-map');
    if (mapEl) mapEl.innerHTML = asciiHTML;
    
    const coordsEl = document.getElementById('ui-coords');
    if (coordsEl) coordsEl.innerText = `${px},${py}`;
    
    let biomeName = 'Wilderness';
    if (inWorld) {
        let t = gameState.worldMap[py]?.[px];
        if (t === 'P' && gameState.pois[`${px},${py}`]) biomeName = gameState.pois[`${px},${py}`].name;
        else if (TERRAIN[t]) biomeName = TERRAIN[t].name;
    } else {
        biomeName = gameState.localMaps[player.zone]?.name || 'Local Area';
    }
    
    const biomeEl = document.getElementById('ui-biome');
    if (biomeEl) biomeEl.innerText = biomeName;
    
    updateStatus();
}
