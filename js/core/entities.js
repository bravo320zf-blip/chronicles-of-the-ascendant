// NPC AI, Enemy Movement, Guards, City Bans, and NPC Interactions
import { gameState, passiveRank } from "./state.js";
import { LOCAL_SIZE } from "../data/constants.js";
import { CITIES } from "../data/worldData.js";
import { ACTIVES } from "../data/skills.js";
import { logMessage, playEncounterAnimation } from "../ui/log.js";
import { generateArena, findEmptySpot } from "./worldGen.js";

export function moveWorldEntities() {
    let player = gameState.player;
    if (!player.worldBosses) player.worldBosses = [];
    let triggeredBossIndex = -1;

    player.worldBosses.forEach((boss, i) => {
        let dist = Math.abs(player.worldX - boss.x) + Math.abs(player.worldY - boss.y);
        
        if (dist <= 15 && dist > 0) { 
            let dx = Math.sign(player.worldX - boss.x);
            let dy = Math.sign(player.worldY - boss.y);
            if (gameState.worldMap[boss.y + dy]?.[boss.x + dx] !== '#') {
                boss.x += dx; boss.y += dy;
            }
        } else if (Math.random() < 0.3) { 
            let dirs = [[0,1], [0,-1], [1,0], [-1,0]];
            let d = dirs[Math.floor(Math.random()*dirs.length)];
            if (gameState.worldMap[boss.y + d[1]]?.[boss.x + d[0]] !== '#') {
                boss.x += d[0]; boss.y += d[1];
            }
        }
        
        if (boss.x === player.worldX && boss.y === player.worldY) {
            triggeredBossIndex = i;
        }
    });

    if (triggeredBossIndex !== -1) {
        let boss = player.worldBosses[triggeredBossIndex];
        playEncounterAnimation('world_boss', "WORLD BOSS!", () => {
            logMessage(`*** YOU ARE AMBUSHED BY A WORLD BOSS: ${boss.name}! ***`, "text-red-500 font-bold blink");
            generateArena('world_boss', boss);
        });
        player.worldBosses.splice(triggeredBossIndex, 1);
    }
}

export function moveEntities() {
    let player = gameState.player;
    if (player.hp <= 0 || player.zone === 'world') return;
    let lMap = gameState.localMaps[player.zone];
    if (!lMap || !lMap.entities) return;

    let newEntities = {};
    for (let key in lMap.entities) {
        let [ex, ey] = key.split(',').map(Number);
        let char = lMap.map[ey][ex];
        if (['e', 'B', 'N', 'M'].includes(char)) lMap.map[ey][ex] = '.'; 
    }

    for (let key in lMap.entities) {
        let entity = lMap.entities[key];
        let [ex, ey] = key.split(',').map(Number);
        let nx = ex, ny = ey;

        if (entity.data && entity.data.stunned) {
            entity.data.stunned = false; 
            newEntities[`${nx},${ny}`] = entity;
            let char = 'N';
            if (entity.type === 'enemy') char = entity.data.isBoss ? 'B' : 'e';
            if (entity.type === 'npc') char = entity.data.isVendor ? 'M' : 'N';
            lMap.map[ny][nx] = char;
            continue;
        }

        if (entity.type === 'enemy' && !entity.data.isBoss) {
            let dist = Math.abs(player.localX - nx) + Math.abs(player.localY - ny);
            let aggro = entity.data.aggro || 4;

            if (entity.data.isRanged && entity.data.rangedSkill && dist <= aggro && dist > 1) {
                let skill = ACTIVES.find(s => s.id === entity.data.rangedSkill);
                if (skill && dist <= skill.range && window.hasLineOfSight && window.hasLineOfSight(nx, ny, player.localX, player.localY, lMap)) {
                    if (entity.data.cooldowns <= 0) {
                        if (!lMap.projectiles) lMap.projectiles = [];
                        lMap.projectiles.push({
                            skill: skill, caster: entity.data,
                            targetX: player.localX, targetY: player.localY,
                            x: nx, y: ny
                        });
                        logMessage(`The ${entity.data.name} fires ${skill.name}!`, "text-purple-400");
                        entity.data.cooldowns = skill.cd || 3;
                        
                        newEntities[`${nx},${ny}`] = entity;
                        lMap.map[ny][nx] = 'e';
                        continue;
                    } else {
                        entity.data.cooldowns--;
                    }
                }
            }

            let moves = entity.data.isGuard ? 2 : 1;
            for (let m = 0; m < moves; m++) {
                dist = Math.abs(player.localX - nx) + Math.abs(player.localY - ny);
                
                if (dist === 1 && !player.inCombat) {
                    logMessage(`A <span class="text-red-500">${entity.data.name}</span> attacks!`, "combat");
                    if (window.triggerLocalCombat) window.triggerLocalCombat(entity.data, nx, ny);
                    break;
                } else if (dist <= aggro && dist > 1) {
                    let dx = Math.sign(player.localX - nx);
                    let dy = Math.sign(player.localY - ny);

                    if (Math.abs(player.localX - nx) > Math.abs(player.localY - ny)) {
                        if (canMoveTo(nx + dx, ny, lMap, newEntities)) nx += dx;
                        else if (canMoveTo(nx, ny + dy, lMap, newEntities)) ny += dy;
                    } else {
                        if (canMoveTo(nx, ny + dy, lMap, newEntities)) ny += dy;
                        else if (canMoveTo(nx + dx, ny, lMap, newEntities)) nx += dx;
                    }
                } else if (Math.random() < 0.3) {
                    let dirs = [[0,1], [0,-1], [1,0], [-1,0]];
                    let d = dirs[Math.floor(Math.random()*dirs.length)];
                    if (canMoveTo(nx + d[0], ny + d[1], lMap, newEntities)) { nx += d[0]; ny += d[1]; }
                }
            }
        } else if (entity.type === 'npc' && Math.random() < 0.2) {
             let dirs = [[0,1], [0,-1], [1,0], [-1,0]];
             let d = dirs[Math.floor(Math.random()*dirs.length)];
             if (canMoveTo(nx + d[0], ny + d[1], lMap, newEntities)) { nx += d[0]; ny += d[1]; }
        }

        if (player.inCombat && player.combatTarget && player.combatTarget.x === ex && player.combatTarget.y === ey) {
             player.combatTarget = {x: nx, y: ny};
        }

        newEntities[`${nx},${ny}`] = entity;
        let char = 'N';
        if (entity.type === 'enemy') char = entity.data.isBoss ? 'B' : 'e';
        if (entity.type === 'npc') char = entity.data.isVendor ? 'M' : 'N';
        lMap.map[ny][nx] = char;
    }
    lMap.entities = newEntities;
}

export function canMoveTo(x, y, lMap, newEntities) {
    let player = gameState.player;
    if (x < 0 || x >= LOCAL_SIZE || y < 0 || y >= LOCAL_SIZE) return false;
    let tile = lMap.map[y][x];
    if (['#', 'W', 'K', 'R', '+', '▼', '▲', '<', 'C', 'B', 'F', 't', 'l', 'r', 'i', 'd', 'w', 'c', 'I', '/', 'T', 'O', 'U', '╥', 'h', '&', 'x', 'p', 'v'].includes(tile)) return false;
    if (newEntities[`${x},${y}`]) return false;
    if (player.localX === x && player.localY === y) return false;
    return true;
}

export function spawnGuard(px, py) {
    let player = gameState.player;
    let lMap = gameState.localMaps[player.zone];
    if (!lMap) return;
    let spot = null;
    
    for (let r = 1; r <= 3; r++) {
        for(let y = py - r; y <= py + r; y++) {
            for(let x = px - r; x <= px + r; x++) {
                if (y > 0 && y < LOCAL_SIZE - 1 && x > 0 && x < LOCAL_SIZE - 1 && lMap.map[y][x] === '.' && !lMap.entities[`${x},${y}`]) {
                    spot = {x, y};
                    break;
                }
            }
            if (spot) break;
        }
        if (spot) break;
    }
    
    if (!spot) spot = findEmptySpot(lMap.map, '.');
    if (!spot) spot = {x: px, y: py}; 
    
    let pLevel = player.level || 1;
    let hpScaled = 150 + (pLevel * 30);
    let dmgScaled = 15 + (pLevel * 8);

    let guard = { 
        type: 'enemy', 
        data: { name: 'City Guard', hp: hpScaled, maxHp: hpScaled, damage: dmgScaled, isBoss: false, isGuard: true, aggro: 50, level: pLevel + 4, elite: 'Armored', dropBase: null } 
    };
    lMap.map[spot.y][spot.x] = 'e';
    lMap.entities[`${spot.x},${spot.y}`] = guard;
    logMessage(`*** HALT! A City Guard is pursuing you! ***`, "text-red-500 font-bold");
}

export function applyGuardDeathPenalty() {
    let player = gameState.player;
    logMessage(`*** YOU WERE EXECUTED BY THE CITY GUARD! ***`, "text-red-500 font-bold blink");
    
    let currentCityId = player.boundCity;
    let rootZone = player.zone.split('_')[0]; 
    let poi = gameState.pois[rootZone];
    if (poi && poi.type === 'C') currentCityId = poi.id;

    if (!player.cityBans) player.cityBans = {};
    if (!player.actionCount) player.actionCount = 0;
    player.cityBans[currentCityId] = player.actionCount + 1000;
    logMessage(`You are BANNED from this city for 1000 actions.`, "text-yellow-400");

    let minDist = Infinity;
    let closestCityId = -1;
    
    CITIES.forEach((c, idx) => {
        if (idx !== currentCityId) {
            let isBanned = player.cityBans[idx] && player.actionCount < player.cityBans[idx];
            if (!isBanned) {
                let dist = Math.abs(player.worldX - c.x) + Math.abs(player.worldY - c.y);
                if (dist < minDist) { minDist = dist; closestCityId = idx; }
            }
        }
    });
    
    if (closestCityId === -1) {
         closestCityId = (currentCityId + 1) % CITIES.length;
    }

    player.boundCity = closestCityId;
    logMessage(`Your respawn point has been forcibly relocated to ${CITIES[closestCityId].name}.`, "text-gray-400");

    if (player.quests && player.quests.length > 0) {
        let removed = 0;
        player.quests = player.quests.filter(q => {
            if (!q.isComplete && !q.isTurnedIn) { removed++; return false; }
            return true;
        });
        if (removed > 0) logMessage(`All active quests have been abandoned!`, "text-red-400");
    }
}

export function talkToNPC(npc) {
    let player = gameState.player;
    player.activeDialogue = { npc: npc, state: 'root' };
    logMessage(`[${npc.name} the ${npc.profession}]: "${npc.dialogue}"`, "npc");
    showDialogueOptions();
}

export function showDialogueOptions() {
    let player = gameState.player;
    let state = player.activeDialogue;
    if (!state) return;
    let npc = state.npc;
    
    logMessage(`<span class="cursor-pointer text-yellow-400 hover:text-white underline decoration-dotted" data-dlg="story">[1] "Tell me about yourself."</span>`);
    let optIndex = 2;
    
    if (npc.questToGive && !npc.questToGive.isTurnedIn) {
        let playerHasQuest = player.quests && player.quests.find(q => q.id === npc.questToGive.id);
        
        if (!playerHasQuest) {
            logMessage(`<span class="cursor-pointer text-yellow-400 hover:text-white underline decoration-dotted" data-dlg="take_quest">[${optIndex}] "Do you need any help?"</span>`);
            optIndex++;
        } else if (playerHasQuest && playerHasQuest.isComplete && !playerHasQuest.isTurnedIn) {
            logMessage(`<span class="cursor-pointer text-green-400 font-bold hover:text-white underline decoration-dotted" data-dlg="turn_in_quest">[${optIndex}] "I finished your task. (Turn In)"</span>`);
            optIndex++;
        } else if (playerHasQuest && !playerHasQuest.isComplete) {
            logMessage(`<span class="text-gray-500">[${optIndex}] (You are still working on their task...)</span>`);
            optIndex++;
        }
    }

    if (npc.isVendor) {
        logMessage(`<span class="cursor-pointer text-yellow-400 hover:text-white underline decoration-dotted" data-dlg="buy">[${optIndex}] "Show me your wares."</span>`);
        optIndex++;
        logMessage(`<span class="cursor-pointer text-yellow-400 hover:text-white underline decoration-dotted" data-dlg="sell">[${optIndex}] "I want to sell items."</span>`);
        optIndex++;
    }
    logMessage(`<span class="cursor-pointer text-gray-400 hover:text-white underline decoration-dotted" data-dlg="exit">[${optIndex}] "Goodbye."</span>`);
}

export function handleDialogue(choice) {
    let player = gameState.player;
    let d = player.activeDialogue; 
    if (!d) return;
    let npc = d.npc;

    if (d.state === 'root') {
        if (choice === 'story') { 
            logMessage(`[${npc.name}]: "${npc.backstory}"`, "npc"); 
            showDialogueOptions(); 
        }
        else if (choice === 'take_quest') {
            if (!player.quests) player.quests = [];
            player.quests.push({...npc.questToGive});
            logMessage(`[${npc.name}]: "${npc.questToGive.desc}"`, "npc");
            logMessage(`*** New Quest Added: ${npc.questToGive.title} ***`, "text-yellow-400 font-bold");
            showDialogueOptions();
        }
        else if (choice === 'turn_in_quest') {
            let q = player.quests.find(x => x.id === npc.questToGive.id);
            if (q && q.isComplete) {
                q.isTurnedIn = true;
                npc.questToGive.isTurnedIn = true;
                player.gold += q.rewardGold;
                if (window.gainXP) window.gainXP(q.rewardXp);
                logMessage(`[${npc.name}]: "You actually did it! Thank you! Here is your reward."`, "npc");
                logMessage(`Received ${q.rewardGold}g and ${q.rewardXp} XP!`, "success");
                if (window.updateStatus) window.updateStatus();
                if (window.renderMap) window.renderMap();
            }
            showDialogueOptions();
        }
        else if (choice === 'buy' && npc.isVendor) { 
            d.state = 'wares'; 
            showWares(npc); 
        }
        else if (choice === 'sell' && npc.isVendor) { 
            player.sellingMode = true; 
            if (window.toggleModal) window.toggleModal('inventory-modal'); 
            const titleEl = document.getElementById('backpack-title');
            if (titleEl) titleEl.innerText = "Select Items to Sell";
        }
        else if (choice === 'exit') { 
            player.activeDialogue = null; 
            logMessage("Conversation ended.", "system"); 
        }
    } else if (d.state === 'wares') {
        if (typeof choice === 'number' && choice <= npc.inventory.length) {
            let item = npc.inventory[choice-1];
            let price = item.price || 15;
            if (passiveRank('haggler_supreme')) price = Math.floor(price * (1 - (player.passives.haggler_supreme * 0.15)));
            
            if (player.gold >= price) {
                player.gold -= price;
                player.inventory.push({...item, count: 1});
                logMessage(`Purchased ${item.name}.`, "success"); 
                if (window.updateStatus) window.updateStatus();
            } else {
                logMessage("Not enough gold!", "combat");
            }
            showWares(npc);
        } else { 
            d.state = 'root'; 
            showDialogueOptions(); 
        }
    }
    if (window.savePlayerData) window.savePlayerData();
}

export function showWares(npc) {
    let player = gameState.player;
    logMessage(`[${npc.name}]: "Here are my goods."`, "npc");
    npc.inventory.forEach((item, i) => {
        let rColor = item.rarity==='Legendary'?'text-yellow-400':item.rarity==='Rare'?'text-purple-400':item.rarity==='Magic'?'text-blue-400':'text-green-400';
        let price = item.price || 15;
        if (passiveRank('haggler_supreme')) price = Math.floor(price * (1 - (player.passives.haggler_supreme * 0.15)));
        logMessage(`<span class="cursor-pointer text-yellow-400 hover:text-white underline decoration-dotted" data-dlg="${i+1}">[${i+1}] Buy <span class="${rColor}">${item.name}</span> (${price}g) <span class="text-gray-400 text-xs">- ${item.desc}</span></span>`);
    });
    logMessage(`<span class="cursor-pointer text-yellow-400 hover:text-white underline decoration-dotted" data-dlg="${npc.inventory.length+1}">[${npc.inventory.length+1}] Back</span>`);
}
