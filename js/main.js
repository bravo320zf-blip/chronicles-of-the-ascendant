// Master Entry Point, Command Parser, and Input Handler
import { gameState, createDefaultPlayer } from "./core/state.js";
import { initAuthListener } from "./network/auth.js";
import { loadUserCharacters, activateCharacter, triggerAutoSave, flushSave } from "./network/characterSave.js";
import { initMultiplayer, broadcastPresence, sendChatMessage, listOnlinePlayers } from "./network/multiplayer.js";
import { generateWorld, enterLocalZone, enterFloor, generateBuildingInterior, generateArena, spawnQuota, spawnWorldBoss } from "./core/worldGen.js";
import { renderMap, updateStatus } from "./ui/renderer.js";
import { toggleTorch, updateTimeUI, startTimeLoop, getGlobalWorldTimeMinutes, formatTime, isWorldNight } from "./core/time.js";
import { logMessage, playEncounterAnimation } from "./ui/log.js";
import { moveEntities, moveWorldEntities, talkToNPC, handleDialogue, showDialogueOptions, showWares, spawnGuard, applyGuardDeathPenalty } from "./core/entities.js";
import { registerAction, hasLineOfSight, updateProjectiles, resolveSkillHit, triggerCombat, triggerLocalCombat, gainXP, handleCombatTurn, useActiveSkill, confirmCast, executeTargeting, triggerBossDefeat } from "./core/combat.js";
import { calculateStats, renderInventory, closeInventory, sortInventory, useItem, equipItem, unequipItem, sellItem, renderEquipment, renderCrafting, selectRecipe, craftItem, depositItem, withdrawItem, handleGoldStash, gainProfessionXP } from "./core/inventory.js";
import { toggleModal, renderStats, renderJournal, renderStash, renderSkills, unlockSkill, upgradeSkill, assignHotkey, renderPassives, upgradePassive } from "./ui/modals.js";
import { showAuthModal, showCharSelectModal, showCharCreationModal, showMainGame, initAuthUIEvents, updateAccountBadge } from "./ui/authUI.js";
import { openPlayerInteraction, closePlayerInteraction, inviteToParty, startTrade, cancelTrade, showEmoteList, performEmote, initTradeEventListeners } from "./ui/trade.js";
import { CITIES } from "./data/worldData.js";
import { MATERIALS, generateRandomItem } from "./data/items.js";
import { LOCAL_TILES } from "./data/terrain.js";
import { WORLD_SIZE, LOCAL_SIZE } from "./data/constants.js";
import { passiveRank } from "./core/state.js";

// ==========================================
// EXPOSE CORE FUNCTIONS TO GLOBAL WINDOW API
// (Ensures seamless HTML onclick compatibility)
// ==========================================
window.gameState = gameState;
window.renderMap = renderMap;
window.updateStatus = updateStatus;
window.toggleModal = toggleModal;
window.toggleTorch = toggleTorch;
window.useItem = useItem;
window.equipItem = equipItem;
window.unequipItem = unequipItem;
window.sellItem = sellItem;
window.selectRecipe = selectRecipe;
window.craftItem = craftItem;
window.sortInventory = sortInventory;
window.closeInventory = closeInventory;
window.depositItem = depositItem;
window.withdrawItem = withdrawItem;
window.handleGoldStash = handleGoldStash;
window.unlockSkill = unlockSkill;
window.upgradeSkill = upgradeSkill;
window.assignHotkey = assignHotkey;
window.upgradePassive = upgradePassive;
window.useActiveSkill = useActiveSkill;
window.handleDialogue = handleDialogue;
window.showDialogueOptions = showDialogueOptions;
window.gainXP = gainXP;
window.gainProfessionXP = gainProfessionXP;
window.savePlayerData = triggerAutoSave;
window.flushSave = flushSave;
window.playEncounterAnimation = playEncounterAnimation;
window.hasLineOfSight = hasLineOfSight;
window.triggerLocalCombat = triggerLocalCombat;
window.generateBuildingInterior = generateBuildingInterior;
window.generateArena = generateArena;
window.calculateStats = calculateStats;
window.openPlayerInteraction = openPlayerInteraction;
window.closePlayerInteraction = closePlayerInteraction;
window.inviteToParty = inviteToParty;
window.startTrade = startTrade;
window.cancelTrade = cancelTrade;
window.showEmoteList = showEmoteList;
window.performEmote = performEmote;
window.switchCharacter = async function() {
    await flushSave();
    const chars = await loadUserCharacters(gameState.currentUser?.uid);
    showCharSelectModal(chars);
};

// ==========================================
// MOVEMENT CONTROLLER
// ==========================================
window.movePlayer = function(dx, dy) {
    let player = gameState.player;
    if (player.hp <= 0 || player.inCombat || gameState.isAnimating) return;
    if (player.activeDialogue) { player.activeDialogue = null; logMessage("Conversation ended.", "system"); }

    // Check for bumping into another online player
    const targetX = player.zone === 'world' ? (player.worldX + dx) : (player.localX + dx);
    const targetY = player.zone === 'world' ? (player.worldY + dy) : (player.localY + dy);

    let bumpedPlayer = null;
    for (let [uid, op] of gameState.onlinePlayers.entries()) {
        if (op.zone === player.zone) {
            let opX = player.zone === 'world' ? op.worldX : op.localX;
            let opY = player.zone === 'world' ? op.worldY : op.localY;
            if (opX === targetX && opY === targetY) {
                bumpedPlayer = op;
                break;
            }
        }
    }

    if (bumpedPlayer) {
        openPlayerInteraction(bumpedPlayer);
        return;
    }

    if (player.zone === 'world') {
        let nx = player.x + dx; 
        let ny = player.y + dy;
        if (nx < 0 || nx >= WORLD_SIZE || ny < 0 || ny >= WORLD_SIZE) return;
        
        let destTile = gameState.worldMap[ny][nx];
        if (destTile === '#' || destTile === '▲' || destTile === '~') {
            if (destTile === '~') {
                logMessage("The ocean depths are impassable on foot. Seek a bridge or coastal shallows.", "text-blue-400 text-xs");
            } else {
                logMessage("These steep mountain peaks are impassable. Look for a mountain pass.", "text-gray-500 text-xs");
            }
            return;
        }
        
        player.x = nx; player.y = ny; player.worldX = nx; player.worldY = ny;
        let tile = gameState.worldMap[ny][nx];
        
        let skipAction = passiveRank('phase_shift') && Math.random() < (player.passives.phase_shift * 0.1);
        if (!skipAction) registerAction();
        
        if (passiveRank('momentum')) player.momentumStacks = Math.min(5, (player.momentumStacks || 0) + 1);
        
        if (tile === 'Ω') {
            logMessage("*** You touch the Ancient Shrine of the Ascendant! ***", "text-yellow-400 font-bold blink");
            let xpBonus = (player.level || 1) * 35 + 100;
            logMessage(`You receive a celestial blessing! HP and MP fully restored! +${xpBonus} XP!`, "success");
            player.hp = player.maxHp;
            player.mp = player.maxMp;
            gainXP(xpBonus);

            if (player.quests) {
                player.quests.forEach(q => {
                    if (!q.isComplete && !q.isTurnedIn && (q.target === 'Ancient Shrine' || q.target === 'Ω' || q.title.includes('Awakening') || q.title.includes('Sanctuary'))) {
                        q.progress = q.maxProgress;
                        q.isComplete = true;
                        logMessage(`*** Quest Objective Complete: ${q.title} ***`, "text-yellow-400 font-bold blink");
                        logMessage(`Return to your patron in ${q.patronCity || 'Kingsfall'} to complete the Ascendant Awakening!`, "text-green-400 font-bold");
                    }
                });
            }

            moveWorldEntities();
            renderMap(); 
            triggerAutoSave(); 
            broadcastPresence();
            return;
        }

        if (tile === 'P' && gameState.pois[`${nx},${ny}`]) {
            let poi = gameState.pois[`${nx},${ny}`];
            
            if (poi.type === 'C') {
                if (player.cityBans && player.cityBans[poi.id] && player.actionCount < player.cityBans[poi.id]) {
                    let remaining = player.cityBans[poi.id] - player.actionCount;
                    logMessage(`*** HALT! You are banned from ${poi.name} for ${remaining} more actions! ***`, "text-red-500 font-bold blink");
                    return;
                }
                logMessage(`*** You have entered the city of ${poi.name} ***`, "text-cyan-400 font-bold");
            } else {
                logMessage(`*** You enter ${poi.name} ***`, "system");
            }
            enterLocalZone(`${poi.rootX},${poi.rootY}`, poi);
        } else if (Math.random() < 0.10) {
            triggerCombat(tile);
        }
        
        if (player.zone === 'world') {
            moveWorldEntities();
        }
    } else {
        let nx = player.localX + dx; 
        let ny = player.localY + dy;
        let lMap = gameState.localMaps[player.zone];
        if (!lMap || nx < 0 || nx >= LOCAL_SIZE || ny < 0 || ny >= LOCAL_SIZE) return;
        
        let tile = lMap.map[ny][nx];
        if (['#', 'W', 'K', 'R', '&', 'F', 't', 'l', 'r', 'i', 'd', 'w', 'c', 'I', '/', 'T', 'O', 'U', '╥', 'h'].includes(tile)) return;
        
        if (passiveRank('momentum')) player.momentumStacks = Math.min(5, (player.momentumStacks || 0) + 1);

        if (tile === '<') {
            registerAction();
            if (lMap.type === 'shop') {
                let activeGuards = 0;
                if (lMap.entities) {
                    for (let key in lMap.entities) {
                        if (lMap.entities[key].data && lMap.entities[key].data.isGuard) activeGuards++;
                    }
                }

                player.zone = `${player.zone.split('_')[0]}_0`; 
                player.localX = lMap.exitX;
                player.localY = lMap.exitY; 
                logMessage(`You exit the shop.`, "system");

                if (activeGuards > 0) {
                    logMessage(`*** The guards pursue you into the streets! ***`, "text-red-500 font-bold blink");
                    for (let i = 0; i < activeGuards; i++) {
                        spawnGuard(player.localX, player.localY);
                    }
                }

                renderMap(); 
                triggerAutoSave(); 
                broadcastPresence();
                return;
            }
            
            let isArena = lMap.type === 'arena';
            let enemiesLeft = Object.values(lMap.entities || {}).some(e => e.type === 'enemy');
            
            if (isArena && enemiesLeft) {
                let goldLost = Math.floor(player.gold * 0.15);
                let hpLost = Math.floor(player.maxHp * 0.10);
                player.gold = Math.max(0, player.gold - goldLost);
                player.hp = Math.max(1, player.hp - hpLost);
                logMessage(`*** You flee the encounter in panic! You drop ${goldLost} gold and take ${hpLost} damage while escaping! ***`, "text-red-500 font-bold blink");
            } else {
                logMessage(`You return to the overworld.`, "system");
            }
            
            player.zone = 'world'; 
            player.x = player.worldX; 
            player.y = player.worldY;
            player.inCombat = false; 
            player.currentEnemy = null; 
            player.combatTarget = null;
            renderMap(); 
            broadcastPresence();
            return;
        }
        if (tile === '▼') {
            registerAction();
            let [p, z] = player.zone.split('_');
            player.zone = `${p}_${parseInt(z)+1}`;
            logMessage("You descend deeper...", "system");
            enterFloor(player.zone, '▲'); 
            renderMap(); 
            broadcastPresence();
            return;
        }
        if (tile === '▲') {
            registerAction();
            let [p, z] = player.zone.split('_');
            player.zone = `${p}_${parseInt(z)-1}`;
            logMessage("You climb up...", "system");
            enterFloor(player.zone, '▼'); 
            renderMap(); 
            broadcastPresence();
            return;
        }
        if (tile === '+' || tile === 'e' || tile === 'B' || tile === 'N' || tile === 'M' || tile === 'C') {
            if (tile === 'C') { toggleModal('stash-modal'); return; }
            
            if (tile === '+') { 
                if (lMap.doors && lMap.doors[`${nx},${ny}`]) {
                    let doorObj = lMap.doors[`${nx},${ny}`];
                    let bldType = doorObj.type;
                    let bldZone = `${player.zone.split('_')[0]}_${bldType}`;
                    if (!gameState.localMaps[bldZone]) {
                        generateBuildingInterior(player.zone.split('_')[0], bldType, doorObj.returnX, doorObj.returnY);
                    }
                    player.zone = bldZone;
                    player.localX = 20; player.localY = 24; 
                    logMessage(`You enter the ${bldType} shop.`, "system");
                    renderMap(); 
                    triggerAutoSave(); 
                    broadcastPresence();
                    return;
                } else {
                    player.localX = nx; player.localY = ny; return; 
                }
            }
            
            let entity = lMap.entities[`${nx},${ny}`];
            if (entity) {
                if (entity.type === 'enemy') triggerLocalCombat(entity.data, nx, ny);
                else if (entity.type === 'npc') talkToNPC(entity.data);
                return; 
            }
        }
        player.localX = nx; player.localY = ny;
        
        let skipAction = passiveRank('phase_shift') && Math.random() < (player.passives.phase_shift * 0.1);
        if (!skipAction) {
            registerAction();
            moveEntities();
        }
    }
    renderMap(); 
    triggerAutoSave();
    broadcastPresence();
};

// ==========================================
// ACTIONS CONTROLLER (Attack, Gather, Rest)
// ==========================================
window.executeAction = function(action) {
    let player = gameState.player;
    if ((player.hp <= 0 && action !== 'respawn') || gameState.isAnimating) return;
    
    if (action === 'gather') {
        registerAction();
        let gathered = false;
        let px = player.zone === 'world' ? (player.worldX ?? player.x) : player.localX;
        let py = player.zone === 'world' ? (player.worldY ?? player.y) : player.localY;
        let mapData = player.zone === 'world' ? gameState.worldMap : gameState.localMaps[player.zone]?.map;
        let bound = player.zone === 'world' ? WORLD_SIZE : LOCAL_SIZE;
        
        if (!mapData) {
            logMessage("Cannot gather here.", "text-gray-500");
            return;
        }

        const dirs = [[0,0], [0,-1], [0,1], [-1,0], [1,0], [-1,-1], [1,-1], [-1,1], [1,1]];
        
        for (let d of dirs) {
            let tx = px + d[0]; let ty = py + d[1];
            if (tx >= 0 && tx < bound && ty >= 0 && ty < bound) {
                let tile = mapData[ty][tx];
                let matId = null; let replacement = '.'; let prof = null;
                
                let biome = 'P';
                if (player.zone === 'world') {
                    let minDist = Infinity;
                    CITIES.forEach(c => {
                        let dist = Math.hypot(c.x - px, c.y - py);
                        if (dist < minDist) { minDist = dist; biome = c.biome; }
                    });
                } else {
                    let poiKey = player.zone.split('_')[0];
                    biome = gameState.pois[poiKey]?.biome || 'P';
                }
                let isCave = !['world'].includes(player.zone) && ['D', '*'].includes(gameState.localMaps[player.zone]?.type);

                // Determine Profession & Base Material
                if (tile === 't' || tile === 'l' || tile === '♣') { 
                    prof = 'Woodworking'; matId = 'wood_oak'; replacement = 'T'; 
                } else if (tile === 'd' || tile === 'T') {
                    prof = 'Woodworking'; matId = 'wood_oak'; replacement = (player.zone === 'world' ? '"' : '.');
                } else if (tile === 'r' || tile === 'o' || tile === '#' || tile === '▲' || tile === '^' || tile === 'W') { 
                    prof = 'Metalworking'; matId = 'ore_copper'; replacement = (player.zone === 'world' ? '"' : 'R'); 
                } else if (tile === 's' || tile === 'c' || tile === '╤') { 
                    prof = 'Alchemy'; matId = 'herb_mudleaf'; replacement = (player.zone === 'world' ? '.' : '.'); 
                } else if (tile === 'g' || tile === '"' || tile === 'p') { 
                    prof = 'Alchemy'; matId = 'herb_mudleaf'; replacement = (player.zone === 'world' ? '"' : '.'); 
                } else if (tile === 'i' || tile === '∆' || tile === '*') {
                    prof = 'Alchemy'; matId = 'herb_frostbloom'; replacement = (player.zone === 'world' ? '*' : '.');
                }
                
                if (matId && prof) {
                    let profLvl = player.professions?.[prof]?.level || 1;
                    let roll = Math.random();

                    // Level-Gated Rarity Rolls & Biome specifics
                    if (profLvl >= 15 && roll < 0.15) {
                        if (prof === 'Woodworking' && ['S', 'T'].includes(biome)) matId = 'wood_ghost';
                        if (prof === 'Metalworking' && (isCave || biome === 'D')) matId = 'ore_starmetal';
                        if (prof === 'Alchemy' && biome === 'T') matId = 'herb_frostbloom';
                        if (prof === 'Alchemy' && ['F', 'P', 'S'].includes(biome)) matId = 'herb_starlight';
                    } 
                    else if (profLvl >= 5 && roll < 0.35) {
                        if (prof === 'Woodworking' && ['F', 'P'].includes(biome)) matId = 'wood_ironwood';
                        if (prof === 'Metalworking' && (isCave || biome === '#')) matId = 'ore_silver';
                        if (prof === 'Alchemy' && ['D', 'P'].includes(biome)) matId = 'herb_sunspore';
                    }

                    let item = MATERIALS[matId];
                    if (!item) continue;
                    
                    if (!player.inventory) player.inventory = [];
                    player.inventory.push({...item, count: 1});
                    
                    let rColor = item.rarity === 'Rare' ? 'text-purple-400' : (item.rarity === 'Uncommon' ? 'text-blue-400' : 'text-yellow-400');
                    let xpGain = item.rarity === 'Rare' ? 25 : (item.rarity === 'Uncommon' ? 15 : 5);
                    logMessage(`You gathered <span class="${rColor} font-bold">${item.name}</span>! (+${xpGain} ${prof} XP)`, "system");
                    mapData[ty][tx] = replacement;
                    gathered = true;
                    
                    gainProfessionXP(prof, xpGain);

                    // Check for Vandalism
                    if (prof === 'Metalworking' && (tile === '#' || tile === 'W') && player.zone !== 'world') {
                        let lMap = gameState.localMaps[player.zone];
                        if (lMap && (lMap.type === 'C' || lMap.type === 'shop')) spawnGuard(px, py);
                    }

                    // Rare Treasure Roll
                    if (Math.random() < 0.05) {
                        let rare = generateRandomItem('Magic');
                        player.inventory.push(rare);
                        logMessage(`You uncovered a hidden treasure: <span class="text-blue-400 font-bold">${rare.name}</span>!`, "success");
                    }

                    break; 
                }
            }
        }
        if (!gathered) {
            logMessage("There is nothing to gather nearby. Look for trees (♣), rocks (o), shrubs (w), grass (\"), or cactus (╤).", "text-gray-500");
        } else { 
            sortInventory(); 
            renderMap(); 
            triggerAutoSave(); 
        }
        return;
    }
    
    if (action === 'legend') {
        logMessage("--- MAP KEY ---", "system");
        for (const [k, v] of Object.entries(LOCAL_TILES)) logMessage(`<span style="color:${v.color}">${v.char}</span> : ${v.name}`);
        return;
    }
    if (action === 'rest' && !player.inCombat) {
        let mult = 1;
        if (passiveRank('survivalist')) mult += player.passives.survivalist * 0.5;
        player.hp = Math.min(player.maxHp, player.hp + (20 * mult));
        player.mp = Math.min(player.maxMp, player.mp + (10 * mult));
        logMessage("You rest and recover HP and MP.", "success");
        registerAction();
        if (player.zone === 'world') moveWorldEntities();
        else moveEntities(); 
        updateStatus(); 
        renderMap(); 
        return;
    }
    if (action === 'attack' && player.inCombat) {
        handleCombatTurn(false);
        return;
    }
    if (action === 'look') {
        let biomeName = player.zone === 'world' ? 'Wilderness' : gameState.localMaps[player.zone]?.name;
        logMessage(`You look around. Current location: ${biomeName}. Coordinates: (${player.x}, ${player.y})`, "system");
        // Print nearby online players
        let nearby = [];
        gameState.onlinePlayers.forEach(op => {
            if (op.zone === player.zone) nearby.push(op.name);
        });
        if (nearby.length > 0) {
            logMessage(`Other adventurers in this area: <span class="text-cyan-400 font-bold">${nearby.join(', ')}</span>`, "chat");
        }
    }
};

// ==========================================
// MUD COMMAND PARSER & TERMINAL INPUT
// ==========================================
function initCommandInput() {
    const inputEl = document.getElementById('cmd-input');
    if (!inputEl) return;

    inputEl.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim()) {
            if (gameState.isAnimating) return;
            let cmd = this.value.trim();
            logMessage(`<span class="text-gray-500">&gt; ${cmd}</span>`);

            // Dialogue choice numbers
            if (/^\d+$/.test(cmd) && gameState.player.activeDialogue) {
                handleDialogue(parseInt(cmd));
            }
            // MUD Chat commands
            else if (cmd.startsWith('/say ') || cmd.startsWith('say ')) {
                const text = cmd.replace(/^(?:\/say|say)\s+/, '');
                sendChatMessage('say', text);
            }
            else if (cmd.startsWith('/shout ') || cmd.startsWith('shout ')) {
                const text = cmd.replace(/^(?:\/shout|shout)\s+/, '');
                sendChatMessage('shout', text);
            }
            else if (cmd === '/who' || cmd === 'who') {
                listOnlinePlayers();
            }
            // Standard MUD actions
            else if (cmd === '/torch' || cmd === 'torch') toggleTorch();
            else if (cmd === '/gather' || cmd === 'gather') executeAction('gather');
            else if (cmd === '/rest' || cmd === 'rest') executeAction('rest');
            else if (cmd === '/look' || cmd === 'look' || cmd === 'l') executeAction('look');
            else if (['n', 'north'].includes(cmd.toLowerCase())) movePlayer(0, -1);
            else if (['s', 'south'].includes(cmd.toLowerCase())) movePlayer(0, 1);
            else if (['w', 'west'].includes(cmd.toLowerCase())) movePlayer(-1, 0);
            else if (['e', 'east'].includes(cmd.toLowerCase())) movePlayer(1, 0);
            else if (cmd === '/time' || cmd === 'time' || cmd === '/clock' || cmd === 'clock') {
                let m = getGlobalWorldTimeMinutes();
                let night = isWorldNight(m);
                logMessage(`The server world clock reads: <span class="${night ? 'text-blue-300' : 'text-yellow-400'} font-bold">${formatTime(m)} (${night ? 'Night' : 'Day'})</span>.`, "system");
            }
            else if (cmd === '/help' || cmd === 'help') {
                logMessage("=== MUD COMMAND GUIDE ===", "system");
                logMessage("Movement: [Arrow Keys] or 'n', 's', 'e', 'w'");
                logMessage("Chat: '/say <msg>' (local) | '/shout <msg>' (global) | '/who' (online players)");
                logMessage("Shortcuts: [C] Character, [I] Inventory, [S] Skills, [R] Crafting, [P] Passives, [J] Journal, [F] Torch, [A] Attack, [G] Gather, [Q]/[E] Cast Spells");
                logMessage("Commands: /look, /gather, /rest, /torch, /time, /respawn");
            }
            else if (cmd === '/respawn') {
                let player = gameState.player;
                player.hp = player.maxHp; 
                player.inCombat = false;
                let c = CITIES[player.boundCity];
                player.x = c.x; player.y = c.y; player.worldX = c.x; player.worldY = c.y;
                logMessage("You respawn at your bound city.", "success");
                
                let poi = gameState.pois[`${c.x},${c.y}`];
                if (poi) {
                    let isBanned = player.cityBans && player.cityBans[player.boundCity] && player.actionCount < player.cityBans[player.boundCity];
                    if (isBanned) {
                        logMessage(`You are banned from this city! You respawn outside its gates.`, "text-red-400");
                        player.zone = 'world';
                    } else {
                        enterLocalZone(`${c.x},${c.y}`, poi);
                    }
                } else {
                    player.zone = 'world';
                }
                renderMap(); 
                triggerAutoSave();
            } else {
                logMessage(`Unknown command: '${cmd}'. Type /help for a list of commands.`, "text-gray-400");
            }
            this.value = '';
        }
    });

    // Clickable dialogue options in terminal log
    document.getElementById('game-log')?.addEventListener('click', e => {
        const t = e.target.closest('[data-dlg]');
        if (!t) return;
        const v = t.dataset.dlg;
        handleDialogue(/^\d+$/.test(v) ? Number(v) : v);
    });
}

// ==========================================
// KEYBOARD CONTROLLER
// ==========================================
function initKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if ((document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) || gameState.isAnimating) return;
        let player = gameState.player;
        
        const k = e.key.toLowerCase();
        const handledGameKeys = [
            'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'space',
            'c', 'i', 's', 'a', 'j', 'r', 'p', 'g', 'f', 'q', 'e', 'escape'
        ];

        // Prevent browser default behavior (focus cycling between buttons, container & page scrolling)
        if (handledGameKeys.includes(k) || e.key.startsWith('Arrow')) {
            e.preventDefault();
        }

        // --- TARGETING MODE OVERRIDES ---
        if (player.targetingMode) {
            if (e.key === 'Escape') {
                logMessage("Targeting cancelled.", "text-gray-400");
                player.targetingMode = false;
                player.activeSpell = null;
                renderMap();
                return;
            }
            if (e.key === 'Enter') {
                executeTargeting();
                return;
            }

            let skill = player.activeSpell;
            if (skill.targetType === 'aoe') {
                let nx = player.aoeCenter.x; let ny = player.aoeCenter.y;
                if (e.key === 'ArrowUp') ny--; else if (e.key === 'ArrowDown') ny++;
                else if (e.key === 'ArrowLeft') nx--; else if (e.key === 'ArrowRight') nx++;
                
                let maxDist = Math.abs(player.localX - nx) + Math.abs(player.localY - ny);
                if (maxDist + skill.aoeRadius <= skill.range) {
                    player.aoeCenter = { x: nx, y: ny };
                    renderMap();
                } else {
                    logMessage("Out of range!", "text-red-500");
                }
            } else {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    player.currentTargetIdx = (player.currentTargetIdx + 1) % player.validTargets.length;
                    renderMap();
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    player.currentTargetIdx = (player.currentTargetIdx - 1 + player.validTargets.length) % player.validTargets.length;
                    renderMap();
                }
            }
            return;
        }

        // --- STANDARD CONTROLS ---
        switch(k) {
            case 'arrowup': movePlayer(0, -1); break;
            case 'arrowdown': movePlayer(0, 1); break;
            case 'arrowleft': movePlayer(-1, 0); break;
            case 'arrowright': movePlayer(1, 0); break;
            case 'c': toggleModal('stats-modal'); break;
            case 'i': toggleModal('inventory-modal'); break;
            case 's': toggleModal('skills-modal'); break;
            case 'a': executeAction('attack'); break;
            case 'j': toggleModal('journal-modal'); break;
            case 'r': toggleModal('crafting-modal'); break;
            case 'p': toggleModal('passive-modal'); break;
            case 'g': executeAction('gather'); break;
            case 'f': toggleTorch(); break;
            case 'q': if(player.hotkeys && player.hotkeys.q) useActiveSkill(player.hotkeys.q); break;
            case 'e': if(player.hotkeys && player.hotkeys.e) useActiveSkill(player.hotkeys.e); break;
            case 'escape':
                ['stats-modal', 'inventory-modal', 'skills-modal', 'crafting-modal', 'passive-modal', 'journal-modal', 'stash-modal', 'settings-modal', 'player-interact-modal', 'trade-modal'].forEach(m => {
                    document.getElementById(m)?.classList.add('hidden-ui');
                });
                break;
        }
    });

    // Automatically blur buttons on click so they do not retain spatial focus / jump cursor
    document.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            setTimeout(() => {
                if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
                    document.activeElement.blur();
                }
            }, 10);
        }
    });
}

// ==========================================
// CHARACTER CREATION SUBMISSION
// ==========================================
function initCharacterCreation() {
    // Dynamic avatar glyph preview
    const symSelect = document.getElementById('cc-symbol');
    const updatePreview = () => {
        const preview = document.getElementById('cc-symbol-preview');
        if (preview && symSelect) preview.innerText = symSelect.value;
    };
    symSelect?.addEventListener('change', updatePreview);
    symSelect?.addEventListener('input', updatePreview);

    document.getElementById('btn-start-game')?.addEventListener('click', async () => {
        try {
            const chars = await loadUserCharacters(gameState.currentUser?.uid);
            if (chars.length >= 5) {
                alert("Account has reached maximum limit of 5 characters. Delete an existing adventurer to forge a new one.");
                return;
            }

            const name = document.getElementById('cc-name').value.replace(/[<>&"]/g, '').trim().slice(0, 20);
            if (!name) {
                alert("Please enter a character name!");
                return;
            }

            const chosenSymbol = document.getElementById('cc-symbol')?.value || '@';
            let newChar = createDefaultPlayer();
            newChar.name = name;
            newChar.symbol = chosenSymbol;
            newChar.party = [];
            newChar.backstory = document.getElementById('cc-backstory').value.trim();
            let cityIdx = parseInt(document.getElementById('cc-city')?.value);
            if (isNaN(cityIdx) || cityIdx < 0 || cityIdx >= CITIES.length) cityIdx = 4;
            newChar.boundCity = cityIdx;
            newChar.loadout = document.getElementById('cc-loadout')?.value || 'warrior';

            newChar.equipment.light = { id: 'torch', category: 'consumable', type: 'consumable', name: 'Pine Torch', life: 100, maxLife: 100, rarity: 'Basic', stats: {}, desc: 'Provides light. Decays over time.', price: 15 };

            if (newChar.loadout === 'warrior') {
                newChar.equipment.rightHand = { id: 'sword', name: 'Iron Sword', rarity: 'Basic', stats: { atk: 2 }, count: 1, desc: '+2 ATK', price: 15 };
                newChar.equipment.leftHand = { id: 'shield', name: 'Wooden Shield', rarity: 'Basic', stats: { def: 2 }, count: 1, desc: '+2 DEF', price: 15 };
                newChar.equipment.chest = { id: 'armor', name: 'Leather Armor', rarity: 'Basic', stats: { def: 3 }, count: 1, desc: '+3 DEF', price: 20 };
                newChar.unlockedActives.push('power_strike');
                newChar.hotkeys.q = 'power_strike';
            } else if (newChar.loadout === 'mage') {
                newChar.equipment.rightHand = { id: 'staff', name: 'Oak Staff', rarity: 'Basic', stats: { atk: 1, int: 2 }, count: 1, desc: '+1 ATK, +2 INT', price: 15 };
                newChar.equipment.chest = { id: 'cloak', name: 'Scholar Robes', rarity: 'Basic', stats: { def: 1, int: 1 }, count: 1, desc: '+1 DEF, +1 INT', price: 15 };
                newChar.unlockedActives.push('fireball');
                newChar.hotkeys.q = 'fireball';
            } else if (newChar.loadout === 'rogue') {
                newChar.equipment.rightHand = { id: 'dagger', name: 'Steel Dagger', rarity: 'Basic', stats: { atk: 2, dex: 1 }, count: 1, desc: '+2 ATK, +1 DEX', price: 15 };
                newChar.equipment.back = { id: 'cloak', name: 'Shadow Cloak', rarity: 'Basic', stats: { def: 1, dex: 2 }, count: 1, desc: '+1 DEF, +2 DEX', price: 15 };
                newChar.unlockedActives.push('backstab');
                newChar.hotkeys.q = 'backstab';
            }

            let startCity = CITIES[cityIdx];
            newChar.x = startCity.x; 
            newChar.y = startCity.y; 
            newChar.worldX = startCity.x; 
            newChar.worldY = startCity.y;
            newChar.zone = `${startCity.x},${startCity.y}_0`;

            activateCharacter(newChar);
            generateWorld();

            if (gameState.pois[`${startCity.x},${startCity.y}`]) {
                enterLocalZone(`${startCity.x},${startCity.y}`, gameState.pois[`${startCity.x},${startCity.y}`]);
            }

            await flushSave();
            showMainGame();
            logMessage(`Welcome to the realm, ${name}.`, "success");
            logMessage(`[Avatar]: Your map glyph is "${newChar.symbol}". (Press [C] anytime to change)`, "text-cyan-400");
        } catch (err) {
            console.error('Character start failed', err);
            const el = document.getElementById('cc-loading');
            if (el) {
                el.classList.remove('hidden-ui'); 
                el.classList.add('text-red-400'); 
                el.innerText = 'ERROR: ' + err.message;
            }
        }
    });

    document.getElementById('btn-cancel-char-create')?.addEventListener('click', async () => {
        const chars = await loadUserCharacters(gameState.currentUser?.uid);
        showCharSelectModal(chars);
    });
}

// ==========================================
// GAME INITIALIZATION
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    initCommandInput();
    initKeyboardControls();
    initAuthUIEvents();
    initCharacterCreation();
    initTradeEventListeners();
    startTimeLoop();
    initMultiplayer();

    // Start Authentication Flow - Always display Character Selection Modal on login
    initAuthListener(async (user) => {
        updateAccountBadge();
        if (!user) {
            showAuthModal();
        } else {
            const characters = await loadUserCharacters(user.uid);
            showCharSelectModal(characters);
        }
    });
});
