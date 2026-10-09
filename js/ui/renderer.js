// ASCII Map Rendering, Fog of War, Player & Multiplayer Entity Rendering
import { gameState, passiveRank } from "../core/state.js";
import { TERRAIN, LOCAL_TILES } from "../data/terrain.js";
import { WORLD_SIZE, LOCAL_SIZE, VIEW_RADIUS } from "../data/constants.js";
import { updateTimeUI, isWorldNight } from "../core/time.js";

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

    let isNight = isWorldNight(); 
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
                let heroChar = player.symbol || '@';
                asciiHTML += `<span class="map-tile map-player text-white font-bold" title="You (${player.name})">${heroChar}</span>`;
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
                const isPartied = (player.party && (player.party.includes(otherPlayer.uid) || player.party.includes(otherPlayer.name)));
                const pColorClass = isPartied ? "map-party-player text-white font-bold" : "map-online-player text-green-400 font-bold";
                const pChar = otherPlayer.symbol || '@';
                asciiHTML += `<span class="map-tile ${pColorClass} cursor-pointer" title="${otherPlayer.name}">${pChar}</span>`;
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
                                    let hasActiveQuest = false;
                                    for (let npc of cityNPCs) {
                                        if (npc.questToGive && player.quests) {
                                            let q = player.quests.find(q => q.id === npc.questToGive.id);
                                            if (q && q.isComplete && !q.isTurnedIn) hasTurnIn = true;
                                            else if (q && !q.isComplete && !q.isTurnedIn) hasActiveQuest = true;
                                        }
                                    }
                                    if (hasTurnIn) {
                                        asciiHTML += `<span class="map-tile pulsing-yellow-npc font-bold" title="Quest Ready to Turn In">⚑</span>`;
                                        continue;
                                    } else if (hasActiveQuest) {
                                        asciiHTML += `<span class="map-tile text-orange-400 font-bold" title="Quest in Progress">⚑</span>`;
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
                        let extraClass = tile === 'Ω' ? 'map-shrine' : (tile === '=' ? 'map-bridge' : '');
                        asciiHTML += `<span class="map-tile ${extraClass}" style="color: ${tObj.color}" title="${tObj.name}">${tObj.char}</span>`;
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
                    let c = tile === 'B' ? 'map-dungeon blink' : '';
                    let tileColor = lObj.color;
                    let bgStyle = "";
                    let tileTitle = lObj.name || "";

                    if (tile === '▼') {
                        let isUnlocked = (player.unlockedFloors && player.unlockedFloors[player.zone]) || gameState.localMaps[player.zone]?.stairUnlocked;
                        if (isUnlocked) {
                            tileColor = '#4ade80';
                            c = 'text-green-400 font-bold';
                            tileTitle = 'Stairs Down (Unlocked)';
                        } else {
                            tileColor = '#f59e0b';
                            c = 'text-amber-400 font-bold';
                            tileTitle = 'Locked Staircase (Requires Dungeon Key)';
                        }
                    }

                    if (tile === 'e' || tile === 'B') {
                        let entity = gameState.localMaps[player.zone]?.entities?.[`${x},${y}`];
                        if (entity?.data?.hasKey) {
                            tileColor = '#facc15';
                            c = 'text-yellow-300 font-bold';
                            tileTitle = `${entity.data.name}`;
                        } else if (entity?.data?.name) {
                            tileTitle = entity.data.name;
                        }
                    }
                    
                    if (tile === 'N' || tile === 'M') {
                        let entity = gameState.localMaps[player.zone]?.entities?.[`${x},${y}`];
                        let qId = entity?.data?.questToGive?.id;
                        let playerQuest = (qId && player.quests) ? player.quests.find(q => q.id === qId) : null;
                        tileTitle = entity?.data?.name || (tile === 'M' ? 'Merchant' : 'NPC');

                        if (playerQuest && playerQuest.isComplete && !playerQuest.isTurnedIn) {
                            // Completed quest ready to turn in: Pulsing Yellow
                            tileColor = '#fef08a';
                            c = 'pulsing-yellow-npc font-bold';
                        } else if (playerQuest && !playerQuest.isComplete && !playerQuest.isTurnedIn) {
                            // Currently working on a quest for this NPC: Orange
                            tileColor = '#fb923c';
                            c = 'text-orange-400 font-bold';
                        } else {
                            // Default NPC: Yellow
                            tileColor = '#facc15';
                            c = 'text-yellow-400 font-bold';
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

                    asciiHTML += `<span class="map-tile ${c}" style="color: ${tileColor}; ${bgStyle}" title="${tileTitle}">${lObj.char}</span>`;
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
