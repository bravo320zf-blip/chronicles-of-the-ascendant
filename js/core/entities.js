// NPC AI, Enemy Movement, Guards, City Bans, and NPC Interactions
import { gameState, passiveRank } from "./state.js";
import { LOCAL_SIZE } from "../data/constants.js";
import { CITIES } from "../data/worldData.js";
import { ACTIVES } from "../data/skills.js";
import { logMessage, playEncounterAnimation } from "../ui/log.js";
import { generateArena, findEmptySpot } from "./worldGen.js";

export function moveWorldEntities() {
    let player = gameState.player;
    if (player.hp <= 0 || player.zone !== 'world' || player.inCombat) return;

    if (!gameState.worldBosses) gameState.worldBosses = [];
    gameState.player.worldBosses = gameState.worldBosses;

    let triggeredBossIndex = -1;

    gameState.worldBosses.forEach((boss, i) => {
        // If boss is defeated, check respawn timer
        if (boss.isDefeated) {
            if (boss.respawnAt && Date.now() >= boss.respawnAt) {
                boss.isDefeated = false;
                boss.hp = boss.maxHp;
                boss.x = boss.anchorX;
                boss.y = boss.anchorY;
                logMessage(`*** A terrifying roar echoes across the realm! ${boss.name} has awakened! ***`, "text-red-500 font-bold blink");
                if (window.broadcastPresence) window.broadcastPresence();
            }
            return;
        }

        let dist = Math.abs(player.worldX - boss.x) + Math.abs(player.worldY - boss.y);
        
        // AGGRO: Only engage if player approaches dangerously close (4 tiles or less)
        if (dist <= 4 && dist > 0) { 
            let dx = Math.sign(player.worldX - boss.x);
            let dy = Math.sign(player.worldY - boss.y);
            let targetTile = gameState.worldMap[boss.y + dy]?.[boss.x + dx];
            if (targetTile && targetTile !== '~' && targetTile !== '#' && targetTile !== '▲') {
                boss.x += dx; boss.y += dy;
            }
            if (dist === 4) {
                logMessage(`[Danger]: You sense the crushing presence of <span class="text-red-500 font-bold">${boss.name}</span> nearby!`, "combat");
            }
        } else {
            // PATROL: Slowly roam around territorial domain anchor (max 8 tiles from anchor)
            if (Math.random() < 0.25) { 
                let dirs = [[0,1], [0,-1], [1,0], [-1,0]];
                let d = dirs[Math.floor(Math.random()*dirs.length)];
                let nx = boss.x + d[0];
                let ny = boss.y + d[1];
                let distToAnchor = Math.abs(nx - boss.anchorX) + Math.abs(ny - boss.anchorY);
                let targetTile = gameState.worldMap[ny]?.[nx];
                if (distToAnchor <= 8 && targetTile && targetTile !== '~' && targetTile !== '#' && targetTile !== '▲') {
                    boss.x = nx; boss.y = ny;
                }
            }
        }
        
        if (boss.x === player.worldX && boss.y === player.worldY) {
            triggeredBossIndex = i;
        }
    });

    if (triggeredBossIndex !== -1) {
        let boss = gameState.worldBosses[triggeredBossIndex];
        playEncounterAnimation('world_boss', "WORLD BOSS!", () => {
            logMessage(`*** YOU ARE AMBUSHED BY A WORLD BOSS: ${boss.name}! ***`, "text-red-500 font-bold blink");
            generateArena('world_boss', boss);
        });
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
}

export function talkToNPC(npc) {
    let player = gameState.player;
    player.activeDialogue = { npc: npc, state: 'root', options: [] };
    let profTitle = npc.profession ? ` the ${npc.profession}` : '';
    logMessage(`[${npc.name}${profTitle}]: "${npc.dialogue}"`, "npc");
    showDialogueOptions();
}

export function showDialogueOptions() {
    let player = gameState.player;
    let state = player.activeDialogue;
    if (!state) return;
    let npc = state.npc;
    
    state.options = [];

    // 1. Personal Story
    state.options.push({ key: 'story', label: `"Tell me about yourself."`, color: 'text-yellow-400 hover:text-white' });

    // 2. World & Regional Lore
    if (npc.lore) {
        state.options.push({ key: 'lore', label: `"What can you tell me of this land and the Ascendant?"`, color: 'text-cyan-400 hover:text-white' });
    }

    // 3. Local Rumors & Secrets
    if (npc.rumor) {
        state.options.push({ key: 'rumor', label: `"Have you heard any rumors or secrets?"`, color: 'text-amber-400 hover:text-white' });
    }

    // 4. Quest Handling
    if (npc.questToGive && !npc.questToGive.isTurnedIn) {
        let playerHasQuest = player.quests && player.quests.find(q => q.id === npc.questToGive.id);
        
        if (!playerHasQuest) {
            state.options.push({ key: 'take_quest', label: `"Do you need any help? (Quest)"`, color: 'text-yellow-300 font-bold hover:text-white' });
        } else if (playerHasQuest.isComplete && !playerHasQuest.isTurnedIn) {
            state.options.push({ key: 'turn_in_quest', label: `"I finished your task. (Complete Quest)"`, color: 'text-green-400 font-bold hover:text-white' });
        } else if (!playerHasQuest.isComplete) {
            state.options.push({ key: 'quest_status', label: `(Working on: ${playerHasQuest.title} - ${playerHasQuest.progress}/${playerHasQuest.maxProgress})`, color: 'text-gray-400 hover:text-gray-200' });
        }
    }

    // 5. Vendor Options
    if (npc.isVendor) {
        state.options.push({ key: 'buy', label: `"Show me your wares."`, color: 'text-yellow-400 hover:text-white' });
        state.options.push({ key: 'sell', label: `"I want to sell items."`, color: 'text-yellow-400 hover:text-white' });
    }

    // 6. Exit
    state.options.push({ key: 'exit', label: `"Goodbye."`, color: 'text-gray-400 hover:text-white' });

    // Render numbered options
    state.options.forEach((opt, idx) => {
        let num = idx + 1;
        logMessage(`<span class="cursor-pointer ${opt.color} underline decoration-dotted" data-dlg="${opt.key}">[${num}] ${opt.label}</span>`);
    });
}

export function handleDialogue(choice) {
    let player = gameState.player;
    let d = player.activeDialogue; 
    if (!d) return;
    let npc = d.npc;

    if (d.state === 'root') {
        // Map numeric choice to option key if needed
        let key = choice;
        if (typeof choice === 'number' && d.options && d.options[choice - 1]) {
            key = d.options[choice - 1].key;
        }

        if (key === 'story') { 
            logMessage(`[${npc.name}]: "${npc.backstory || 'I am just an adventurer in these troubled times.'}"`, "npc"); 
            showDialogueOptions(); 
        }
        else if (key === 'lore') {
            logMessage(`[${npc.name}]: "${npc.lore || 'The realm of Aethelgard has forgotten much since the Fallen Star struck our skies.'}"`, "npc");
            showDialogueOptions();
        }
        else if (key === 'rumor') {
            logMessage(`[${npc.name}]: "${npc.rumor || 'Keep your blade sharp. The wild places are not kind.'}"`, "npc");
            showDialogueOptions();
        }
        else if (key === 'take_quest') {
            if (!player.quests) player.quests = [];
            player.quests.push({...npc.questToGive});
            logMessage(`[${npc.name}]: "${npc.questToGive.desc}"`, "npc");
            logMessage(`*** New Quest Added: ${npc.questToGive.title} ***`, "text-yellow-400 font-bold");
            logMessage(`Objective: Slay ${npc.questToGive.target} (0/${npc.questToGive.maxProgress}) | Rewards: ${npc.questToGive.rewardGold}g, ${npc.questToGive.rewardXp} XP`, "text-cyan-400 text-xs");
            if (window.renderMap) window.renderMap();
            showDialogueOptions();
        }
        else if (key === 'turn_in_quest') {
            let q = player.quests.find(x => x.id === npc.questToGive.id);
            if (q && q.isComplete) {
                q.isTurnedIn = true;
                npc.questToGive.isTurnedIn = true;
                player.gold += q.rewardGold;
                if (window.gainXP) window.gainXP(q.rewardXp);

                if (q.rewardItem) {
                    player.inventory.push({ ...q.rewardItem });
                    logMessage(`Received special item: [${q.rewardItem.name}]!`, "text-yellow-400 font-bold");
                }

                let reply = q.turnInDialogue || "You actually did it! Thank you! Here is your reward.";
                logMessage(`[${npc.name}]: "${reply}"`, "npc");
                logMessage(`Received ${q.rewardGold}g and ${q.rewardXp} XP!`, "success");
                if (window.updateStatus) window.updateStatus();
                if (window.renderMap) window.renderMap();
                if (window.savePlayerData) window.savePlayerData();
            }
            showDialogueOptions();
        }
        else if (key === 'quest_status') {
            let q = player.quests.find(x => x.id === npc.questToGive.id);
            if (q) {
                logMessage(`[${npc.name}]: "You still need to hunt down ${q.maxProgress - q.progress} more ${q.target}. Return when you have completed the task!"`, "npc");
            }
            showDialogueOptions();
        }
        else if (key === 'buy' && npc.isVendor) { 
            d.state = 'wares'; 
            showWares(npc); 
        }
        else if (key === 'sell' && npc.isVendor) { 
            player.sellingMode = true; 
            if (window.toggleModal) window.toggleModal('inventory-modal'); 
            const titleEl = document.getElementById('backpack-title');
            if (titleEl) titleEl.innerText = "Select Items to Sell";
        }
        else if (key === 'exit') { 
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
