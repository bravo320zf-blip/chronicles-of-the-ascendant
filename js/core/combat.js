// Combat Engine, Projectiles, Targeting, Active Skills, and Passive Synergy
import { gameState, passiveRank } from "./state.js";
import { ENEMIES, ENEMY_STATS, ELITE_PREFIXES, BIOME_BOSSES, baseName, getTileBiome } from "../data/worldData.js";
import { ACTIVES } from "../data/skills.js";
import { MATERIALS, generateRandomItem } from "../data/items.js";
import { logMessage, playEncounterAnimation } from "../ui/log.js";
import { generateArena, generateNPCsForCity } from "./worldGen.js";
import { updateTimeUI } from "./time.js";
import { applyGuardDeathPenalty, moveEntities } from "./entities.js";

export function registerAction() {
    let player = gameState.player;
    if (player.hp <= 0) return;
    if (!player.actionCount) player.actionCount = 0;
    if (!player.cooldowns) player.cooldowns = {};
    if (!player.activeBuffs) player.activeBuffs = {};
    
    player.actionCount++;
    
    if (player.torchActive) {
        if (player.equipment && player.equipment.light) {
            player.equipment.light.life -= 1;
            if (player.equipment.light.life <= 0) {
                logMessage("Your torch has burned out!", "text-red-500 blink font-bold");
                player.equipment.light = null; 
                player.torchActive = false;
            }
        } else { 
            player.torchActive = false; 
        }
    }

    if (player.actionCount % 3 === 0 && player.mp < player.maxMp) {
        player.mp = Math.min(player.maxMp, player.mp + 1);
    }
    for (let key in player.cooldowns) { 
        if (player.cooldowns[key] > 0) player.cooldowns[key]--; 
    }
    
    // Process Active Buffs
    if (player.activeBuffs.healingSalve > 0) {
        player.hp = Math.min(player.maxHp, player.hp + 1);
        player.activeBuffs.healingSalve--;
        if (player.activeBuffs.healingSalve <= 0) logMessage("The Healing Salve wears off.", "text-gray-400");
    }
    if (player.activeBuffs.strengthSalve > 0) {
        player.activeBuffs.strengthSalve--;
        if (player.activeBuffs.strengthSalve <= 0) {
            logMessage("The Strength Salve wears off.", "text-gray-400");
            if (window.calculateStats) window.calculateStats();
        }
    }

    updateProjectiles();
    if (window.updateStatus) window.updateStatus();
}

export function hasLineOfSight(x1, y1, x2, y2, lMap) {
    let dx = Math.abs(x2 - x1); let dy = Math.abs(y2 - y1);
    let sx = x1 < x2 ? 1 : -1; let sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    let cx = x1; let cy = y1;
    while(true) {
        if(cx === x2 && cy === y2) return true;
        if(lMap.map[cy] && (lMap.map[cy][cx] === '#' || lMap.map[cy][cx] === 'W')) return false;
        let e2 = 2 * err;
        if (e2 > -dy) { err -= dy; cx += sx; }
        if (e2 < dx) { err += dx; cy += sy; }
    }
}

export function updateProjectiles() {
    let player = gameState.player;
    if (player.zone === 'world') return;
    let lMap = gameState.localMaps[player.zone];
    if (!lMap || !lMap.projectiles) return;

    let activeProjs = [];
    for (let i = 0; i < lMap.projectiles.length; i++) {
        let p = lMap.projectiles[i];
        let reached = false;
        
        for(let step=0; step < p.skill.speed; step++) {
            if(p.x === p.targetX && p.y === p.targetY) { reached = true; break; }
            
            let dx = Math.sign(p.targetX - p.x);
            let dy = Math.sign(p.targetY - p.y);
            
            if (Math.abs(p.targetX - p.x) > Math.abs(p.targetY - p.y)) p.x += dx;
            else if (Math.abs(p.targetX - p.x) < Math.abs(p.targetY - p.y)) p.y += dy;
            else { p.x += dx; p.y += dy; }
            
            if(lMap.map[p.y] && (lMap.map[p.y][p.x] === '#' || lMap.map[p.y][p.x] === 'W')) { 
                logMessage(`The ${p.skill.name} hit a wall and dissipated.`, "text-gray-500");
                reached = 'wall';
                break;
            }
            if(p.x === p.targetX && p.y === p.targetY) { reached = true; break; }
        }
        
        if (reached === true) {
            resolveSkillHit(p.skill, p.targetX, p.targetY, p.caster, lMap);
        } else if (reached !== 'wall') {
            activeProjs.push(p);
        }
    }
    lMap.projectiles = activeProjs;
}

export function resolveSkillHit(skill, tx, ty, caster, lMap) {
    let player = gameState.player;
    // Environmental Spell Interactions
    if (lMap.map[ty] && lMap.map[ty][tx]) {
        let hitTile = lMap.map[ty][tx];
        if (hitTile === '&') {
            logMessage("*** The EXPLOSIVE BARREL detonates! ***", "text-orange-500 font-bold blink");
            lMap.map[ty][tx] = '.';
            for(let y = ty-2; y <= ty+2; y++) {
                for(let x = tx-2; x <= tx+2; x++) {
                    if (x === player.localX && y === player.localY) {
                        player.hp -= 50; 
                        logMessage("You are caught in the explosion!", "text-red-500");
                        if (player.hp <= 0) { player.hp = 0; logMessage("You blew yourself up. Type /respawn", "combat"); }
                    }
                    let ent = lMap.entities[`${x},${y}`];
                    if (ent && ent.type === 'enemy') {
                        ent.data.hp -= 150;
                        logMessage(`${ent.data.name} is caught in the explosion!`, "text-yellow-400");
                        if (ent.data.hp <= 0) { lMap.map[y][x] = '.'; delete lMap.entities[`${x},${y}`]; }
                    }
                    if (lMap.map[y] && lMap.map[y][x] === '&' && (x!==tx || y!==ty)) lMap.map[y][x] = 'v';
                }
            }
            return;
        } else if (hitTile === 'p' && (skill.id === 'fireball' || skill.id === 'meteor')) {
            logMessage("The poison pool IGNITES into roaring lava!", "text-orange-400 font-bold");
            for(let y = ty-1; y <= ty+1; y++) {
                for(let x = tx-1; x <= tx+1; x++) {
                    if (lMap.map[y] && lMap.map[y][x] === 'p') lMap.map[y][x] = 'v';
                }
            }
            return;
        }
    }
    let targets = [];
    if (skill.targetType === 'aoe') {
        for(let y = ty - skill.aoeRadius; y <= ty + skill.aoeRadius; y++) {
            for(let x = tx - skill.aoeRadius; x <= tx + skill.aoeRadius; x++) {
                if (lMap.entities[`${x},${y}`]) targets.push({x: x, y: y, data: lMap.entities[`${x},${y}`].data});
                else if (x === player.localX && y === player.localY) targets.push({x: x, y: y, isPlayer: true});
            }
        }
    } else {
        if (lMap.entities[`${tx},${ty}`]) targets.push({x: tx, y: ty, data: lMap.entities[`${tx},${ty}`].data});
        else if (tx === player.localX && ty === player.localY) targets.push({x: tx, y: ty, isPlayer: true});
        else { logMessage(`The ${skill.name} hits the ground harmlessly.`, "text-gray-500"); return; }
    }

    let pStr = 10, pInt = 10, pDex = 10;
    let sLvl = 1; let casterName = "You";

    if (caster === 'player') {
        pStr = player.calcStats.str; pInt = player.calcStats.int; pDex = player.calcStats.dex;
        sLvl = player.skillLevels?.[skill.id] || 1;
    } else {
        pStr = caster.damage; pInt = caster.damage; pDex = caster.damage;
        casterName = caster.name;
    }

    targets.forEach((t) => {
        let baseDmg = 0, baseHeal = 0, skipEnemyTurn = false;
        switch(skill.id) {
            case 'minor_heal': baseHeal = 30 + pInt; break;
            case 'major_heal': baseHeal = 80 + pInt * 2; break;
            case 'fireball': baseDmg = 25 + pInt * 2; break;
            case 'frostbolt': baseDmg = 15 + pInt; skipEnemyTurn = true; break;
            case 'lightning': baseDmg = 35 + pInt; break;
            case 'meteor': baseDmg = 80 + pInt * 3; break;
            case 'mana_drain': baseDmg = 5; if(caster==='player') player.mp += 20; break;
            case 'power_strike': baseDmg = 10 + pStr * 2; break;
            case 'execute': baseDmg = (t.data && t.data.hp < t.data.maxHp * 0.4) ? 999 : 10; break;
            case 'shield_bash': baseDmg = 10 + pStr; skipEnemyTurn = true; break;
            case 'sunder': baseDmg = 20 + pStr; break;
            case 'bloodthirst': baseDmg = 25; baseHeal = 25; break;
            case 'backstab': baseDmg = 15 + pDex * 3; break;
            case 'poison_dart': baseDmg = 30 + pDex; break;
            case 'holy_light': baseDmg = 30 + pInt; baseHeal = 30 + pInt; break;
            case 'smite': baseDmg = 40 + pInt; break;
            case 'arcane_missiles': baseDmg = 45 + pInt; break;
            case 'whirlwind': baseDmg = 30 + pStr; baseHeal = 10; break;
            case 'earthquake': baseDmg = 50 + pStr; break;
            case 'blizzard': baseDmg = 40 + pInt; skipEnemyTurn = true; break;
            case 'shadow_step': baseDmg = 25 + pDex * 2; break;
            case 'vampiric_touch': baseDmg = 20 + pInt; baseHeal = 20 + pInt; break;
            case 'time_warp': baseDmg = 100 + pInt * 2; skipEnemyTurn = true; break;
            case 'aimed_shot': baseDmg = Math.floor(30 + pDex * 2.5); break;
            case 'corpse_explosion': baseDmg = 50 + pInt * 2; break;
            case 'chain_lightning': baseDmg = Math.floor(50 + pInt * 1.5); break;
            case 'ice_barrier': if (caster === 'player') { player.shield = (player.shield || 0) + 40; logMessage("Rime ice envelops you in a +40 protective barrier!", "text-cyan-400"); } break;
            case 'ignite': baseDmg = 20 + pInt; if (t.data) t.data.bleed = (t.data.bleed || 0) + 15; break;
        }

        if (sLvl > 1) {
            if (baseDmg > 0) baseDmg = Math.floor(baseDmg * (1 + (sLvl - 1) * 0.3));
            if (baseHeal > 0) baseHeal = Math.floor(baseHeal * (1 + (sLvl - 1) * 0.3));
        }

        if (caster === 'player') {
            if (passiveRank('vital_surge') && baseHeal > 0) baseHeal = Math.floor(baseHeal * (1 + (player.passives.vital_surge * 0.25)));
            if (passiveRank('glass_cannon') && baseDmg > 0) baseDmg *= 1 + (player.passives.glass_cannon * 0.3);
            if (passiveRank('overload') && baseDmg > 0 && Math.random() < (player.passives.overload * 0.05)) baseDmg *= 3;
        }

        if (t.isPlayer) {
            if (baseHeal > 0) {
                player.hp = Math.min(player.maxHp, player.hp + baseHeal);
                logMessage(`${casterName}'s ${skill.name} heals you for ${Math.floor(baseHeal)} HP!`, "success");
            }
            if (baseDmg > 0) {
                player.hp -= baseDmg;
                logMessage(`${casterName}'s ${skill.name} hits you for ${Math.floor(baseDmg)} damage!`, "combat");
                if (skipEnemyTurn) logMessage("You are stunned/frozen by the impact!", "text-cyan-400");
                if (player.hp <= 0) { player.hp = 0; logMessage("You have died. Type /respawn", "combat"); }
            }
        } else if (t.data) {
            if (baseHeal > 0) {
                t.data.hp = Math.min(t.data.maxHp || 100, t.data.hp + baseHeal);
                logMessage(`${t.data.name} is healed for ${Math.floor(baseHeal)} HP!`, "success");
            }
            if (baseDmg > 0) {
                t.data.hp -= baseDmg;
                if (caster === 'player') {
                    logMessage(`Your ${skill.name} hits ${t.data.name} for ${Math.floor(baseDmg)} damage!`, "combat");
                    if (!player.inCombat && t.data.isBoss === false) triggerLocalCombat(t.data, t.x, t.y);
                } else { 
                    logMessage(`${casterName}'s ${skill.name} hits ${t.data.name} for ${Math.floor(baseDmg)} damage!`, "text-yellow-400"); 
                }
                
                if (skipEnemyTurn) t.data.stunned = true;
                
                if (t.data.hp <= 0) {
                    lMap.map[t.y][t.x] = '.'; 
                    delete lMap.entities[`${t.x},${t.y}`];
                    logMessage(`${t.data.name} was destroyed!`, "success");
                    if (caster === 'player') {
                        if (t.data.hasKey) {
                            if (!player.inventory) player.inventory = [];
                            let existingKey = player.inventory.find(i => i.id === 'dungeon_key');
                            if (existingKey) {
                                existingKey.count = (existingKey.count || 1) + 1;
                            } else {
                                player.inventory.push({ id: 'dungeon_key', name: 'Dungeon Key', desc: 'Unlocks the barred staircase gate (▼) to the next floor.', type: 'quest', count: 1, rarity: 'Legendary', price: 0 });
                            }
                            logMessage(`*** The ${t.data.name} drops a Dungeon Key! ***`, "text-yellow-400 font-bold blink");
                            if (window.sortInventory) window.sortInventory();
                        }
                        let goldGain = t.data.isBoss ? 50 : 10;
                        if (passiveRank('scavenger_king')) goldGain += Math.floor(goldGain * (player.passives.scavenger_king * 0.5));
                        player.gold += goldGain;
                        gainXP(Math.max(1, Math.floor(t.data.maxHp / 5 + t.data.damage)));
                    }
                }
            }
        }
    });
}

export function triggerCombat(tile) {
    let player = gameState.player;
    if (Math.random() < 0.15) { 
        let eventRoll = Math.random();
        if (eventRoll < 0.2) {
            playEncounterAnimation('merchant', "HIDDEN CAMP", () => {
                logMessage("*** You discover a Wandering Merchant's hidden camp! ***", "text-cyan-400 font-bold");
                generateArena('merchant', { biome: tile });
            });
        } else {
            playEncounterAnimation('ambush', "AMBUSH!", () => {
                logMessage("*** IT'S AN AMBUSH! YOU ARE TRAPPED! ***", "text-red-500 font-bold blink");
                generateArena('ambush', { biome: tile });
            });
        }
        return;
    }
    
    let biome = getTileBiome(tile);
    let pool = ENEMIES[biome] || ENEMIES['P'];
    let eName = pool[Math.floor(Math.random()*pool.length)];
    let stat = ENEMY_STATS[eName] || { hp: 30, damage: 5 };
    
    let pLevel = player.level || 1;
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
    
    player.inCombat = true;
    player.currentEnemy = { name: eName, hp: hpScaled, maxHp: hpScaled, damage: dmgScaled, isBoss: false, aggro: Math.floor(Math.random()*3)+3, level: eLevel, elite: elitePrefix };
    
    let cName = isElite ? `<span class="text-purple-400 blink">${eName}</span>` : `<span class="text-red-500">${eName}</span>`;
    logMessage(`A wild ${cName} (Lvl ${eLevel}) attacks!`, "combat");
    logMessage(`Type /flee or move to run away, or press [A] to attack!`, "text-yellow-400 text-xs");
    if (window.updateStatus) window.updateStatus();
}

export function attemptFlee() {
    let player = gameState.player;
    if (!player.inCombat) {
        logMessage("You are not currently in combat.", "system");
        return false;
    }
    
    let enemy = player.currentEnemy;
    let eName = enemy ? enemy.name : "enemy";
    registerAction();
    
    let dex = player.calcStats?.dex || 10;
    let fleeChance = 0.60 + (dex * 0.01);
    if (enemy && enemy.isBoss) fleeChance = 0.35;
    if (passiveRank('smoke_screen')) fleeChance += 0.25;
    
    if (Math.random() < fleeChance) {
        logMessage(`*** You successfully fled from the ${eName}! ***`, "success");
        player.inCombat = false;
        player.currentEnemy = null;
        player.combatTarget = null;
        if (window.updateStatus) window.updateStatus();
        if (window.renderMap) window.renderMap();
        return true;
    } else {
        logMessage(`*** You failed to flee from the ${eName}! It strikes as you turn to run! ***`, "combat");
        handleCombatTurn(true);
        if (window.updateStatus) window.updateStatus();
        return false;
    }
}

export function triggerLocalCombat(eData, lx, ly) {
    let player = gameState.player;
    player.inCombat = true;
    player.currentEnemy = eData;
    player.combatTarget = {x: lx, y: ly};
    let lvlStr = eData.level ? ` (Lvl ${eData.level})` : '';
    let cName = eData.elite ? `<span class="text-purple-400 blink">${eData.name}</span>` : `<span class="text-red-500">${eData.name}</span>`;
    logMessage(`You engage a ${cName}${lvlStr}!`, "combat");
}

export function gainXP(amount) {
    let player = gameState.player;
    if (player.xp === undefined) player.xp = 0;
    if (player.level === undefined) player.level = 1;
    if (player.nextLevelXp === undefined) player.nextLevelXp = 100;
    if (player.skillPoints === undefined) player.skillPoints = 0;

    player.xp += amount;
    logMessage(`You gained ${amount} XP!`, "text-purple-400");

    while (player.xp >= player.nextLevelXp) {
        player.xp -= player.nextLevelXp;
        player.level++;
        player.nextLevelXp = Math.floor(player.nextLevelXp * 1.5);
        player.skillPoints++;
        player.baseStats.con += 1; 
        if (window.calculateStats) window.calculateStats();
        logMessage(`*** LEVEL UP! You reached Level ${player.level}! +1 Skill Point, +1 Base CON! ***`, "text-yellow-400 font-bold blink");
    }
    if (window.updateStatus) window.updateStatus();
}

export function handleCombatTurn(skipPlayerAttack = false) {
    let player = gameState.player;
    let e = player.currentEnemy;
    if (!e) return;
    
    if (!skipPlayerAttack) {
        registerAction();
        let pDmg = Math.max(1, Math.floor(Math.random() * 6) + Math.max(player.calcStats.str, player.calcStats.dex)/2 + player.calcStats.atk);
        
        if (player.passives) {
            if (player.passives.glass_cannon) pDmg *= 1 + (player.passives.glass_cannon * 0.3);
            if (player.passives.lone_wolf && e.isBoss) pDmg *= 1 + (player.passives.lone_wolf * 0.15);
            if (player.passives.overload && Math.random() < (player.passives.overload * 0.05)) {
                pDmg *= 3;
                logMessage(`OVERLOAD! Triple Damage!`, "text-yellow-400 blink font-bold");
            }
            if (player.passives.berserker_rage) {
                let missingHpPct = 100 - ((player.hp / player.maxHp) * 100);
                pDmg *= 1 + (missingHpPct * (player.passives.berserker_rage * 0.005));
            }
            if (player.passives.momentum && player.momentumStacks) {
                pDmg *= 1 + (player.momentumStacks * 0.03);
                player.momentumStacks = 0; 
            }
            if (player.passives.spellblade && player.spellbladeActive) {
                pDmg += player.spellbladeActive * (player.passives.spellblade * 0.5);
                logMessage(`Spellblade discharged!`, "text-cyan-400");
                player.spellbladeActive = 0;
            }
        }

        e.hp -= pDmg;
        logMessage(`You strike the ${e.name} for ${Math.floor(pDmg)} damage!`);
        
        if (passiveRank('festering_wounds')) {
            let dot = pDmg * (player.passives.festering_wounds * 0.1);
            if (dot > (e.bleed || 0)) {
                e.bleed = dot;
                logMessage(`Festering Wound applied!`, "text-red-500");
            }
        }
    }

    if (player.burn > 0) {
        player.hp -= player.burn;
        logMessage(`You take ${Math.floor(player.burn)} burn damage!`, "text-red-500");
        player.burn = Math.floor(player.burn / 2);
        if(player.hp <= 0) {
            player.hp = 0; logMessage("You burned to death. Type /respawn", "combat"); player.inCombat = false; 
            if (e.isGuard) applyGuardDeathPenalty();
            return;
        }
    }
    
    if (e.hp <= 0 || (passiveRank('executioner') && !e.isBoss && e.hp < (e.maxHp * player.passives.executioner * 0.1))) {
        if (e.hp > 0) logMessage(`Executed!`, "text-red-500 font-bold");
        
        if (passiveRank('chain_reaction') && player.zone !== 'world') {
            let splash = e.maxHp * (player.passives.chain_reaction * 0.1);
            logMessage(`Corpse explosion hits nearby enemies for ${Math.floor(splash)}!`, "text-orange-400");
            let lMap = gameState.localMaps[player.zone];
            for (let key in lMap.entities) {
                let ent = lMap.entities[key];
                if (ent.type === 'enemy' && ent.data !== e) {
                    let [ex, ey] = key.split(',').map(Number);
                    if (Math.abs(player.localX - ex) <= 3 && Math.abs(player.localY - ey) <= 3) {
                        ent.data.hp -= splash;
                    }
                }
            }
        }
        
        logMessage(`You defeated the ${e.name}!`, "success");
        
        if (e.hasKey) {
            if (!player.inventory) player.inventory = [];
            let existingKey = player.inventory.find(i => i.id === 'dungeon_key');
            if (existingKey) {
                existingKey.count = (existingKey.count || 1) + 1;
            } else {
                player.inventory.push({ id: 'dungeon_key', name: 'Dungeon Key', desc: 'Unlocks the barred staircase gate (▼) to the next floor.', type: 'quest', count: 1, rarity: 'Legendary', price: 0 });
            }
            logMessage(`*** The ${e.name} drops a Dungeon Key! ***`, "text-yellow-400 font-bold blink");
            if (window.sortInventory) window.sortInventory();
        }
        
        if (player.quests) {
            player.quests.forEach(q => {
                if (!q.isComplete && !q.isTurnedIn) {
                    let bName = baseName(e.name);
                    let matched = false;
                    if (q.target === 'Any' || q.target === bName) matched = true;
                    else if (Array.isArray(q.targets) && q.targets.includes(bName)) matched = true;
                    else if (typeof q.target === 'string' && q.target.includes('/')) {
                        let parts = q.target.split('/').map(s => s.trim());
                        if (parts.includes(bName)) matched = true;
                    }

                    if (matched) {
                        q.progress++;
                        if (q.progress >= q.maxProgress) {
                            q.isComplete = true;
                            logMessage(`*** Quest Objective Complete: ${q.title} ***`, "text-yellow-400 font-bold blink");
                            logMessage(`Return to your patron in ${q.patronCity || 'the city'} to turn in your quest!`, "text-green-400 font-bold");
                        } else {
                            logMessage(`Quest Progress: ${q.title} (${q.progress}/${q.maxProgress})`, "text-blue-400 text-xs");
                        }
                    }
                }
            });
        }
        
        let goldGain = e.isBoss ? Math.floor(Math.random()*50)+50 : Math.floor(Math.random()*10)+1;
        if (passiveRank('scavenger_king')) goldGain += Math.floor(goldGain * (player.passives.scavenger_king * 0.5));
        player.gold += goldGain;
        
        let xpEarned = Math.floor(e.maxHp / 5 + e.damage);
        if (xpEarned < 1) xpEarned = 1;
        if (e.isBoss) xpEarned *= 5;
        if (e.elite) xpEarned = Math.floor(xpEarned * 1.5);
        gainXP(xpEarned);
        
        if (passiveRank('soul_eater')) {
            let rec = player.passives.soul_eater * 5;
            player.hp = Math.min(player.maxHp, player.hp + rec);
            player.mp = Math.min(player.maxMp, player.mp + rec);
            logMessage(`Soul Eater restores ${rec} HP/MP!`, "text-purple-400");
        }
        
        if (passiveRank('death_defiance')) {
            player.shield = player.passives.death_defiance * 10;
            logMessage(`Death Defiance shield active! (${player.shield})`, "text-cyan-400");
        }

        // Monster Drops (Hunting Progression)
        let isBeast = ['Timber Wolf', 'Polar Bear', 'Wild Boar', 'Crocodile'].includes(baseName(e.name));
        let isHumanoid = ['Goblin', 'Bandit', 'Thief', 'Orc'].includes(baseName(e.name));

        if (isBeast || isHumanoid) {
            let huntLvl = player.professions['Hunting'].level;
            let dropId = 'hide_scraps';
            let dropChance = 0.5 + (huntLvl * 0.02);

            if (Math.random() < dropChance) {
                if (huntLvl >= 15 && Math.random() < 0.15) {
                    dropId = isBeast ? 'scale_dragon' : 'bone_troll';
                } else if (huntLvl >= 5 && Math.random() < 0.35) {
                    dropId = isBeast ? 'hide_wolf' : 'tooth_goblin';
                }

                let dropItem = MATERIALS[dropId];
                if (dropItem) {
                    player.inventory.push({...dropItem, count: 1});
                    let rColor = dropItem.rarity === 'Rare' ? 'text-purple-400' : (dropItem.rarity === 'Uncommon' ? 'text-blue-400' : 'text-yellow-400');
                    logMessage(`Harvested: <span class="${rColor} font-bold">${dropItem.name}</span>`);
                    if (window.gainProfessionXP) window.gainProfessionXP('Hunting', dropItem.rarity === 'Rare' ? 30 : (dropItem.rarity === 'Uncommon' ? 15 : 5));
                }
            }
        }

        if(e.isBoss) {
            logMessage(`BOSS DEFEATED!`, "success");
            triggerBossDefeat(e);
            let roll = Math.random();
            if (passiveRank('treasure_hunter')) roll -= (player.passives.treasure_hunter * 0.05);
            if (roll <= 0.15) {
                let bInfo = BIOME_BOSSES[e.biome] || BIOME_BOSSES['P'];
                let art = bInfo.legendary.toLowerCase().includes('staff') ? 'staff' : (bInfo.legendary.toLowerCase().includes('amulet') ? 'amulet' : (bInfo.legendary.toLowerCase().includes('maul') ? 'mace' : (bInfo.legendary.toLowerCase().includes('crown') ? 'helm' : 'sword')));
                player.inventory.push({...generateRandomItem('Legendary'), name: bInfo.legendary, id: art, desc: "+15 ATK, +5 STR (Legendary)"});
                logMessage(`*** EPIC LOOT: ${bInfo.legendary} ***`, "text-yellow-400 font-bold blink");
            } else player.inventory.push(generateRandomItem('Rare'));
        } else {
            let roll = Math.random();
            if (passiveRank('treasure_hunter')) roll -= (player.passives.treasure_hunter * 0.05);
            
            if (e.elite) {
                 if(roll < 0.3) { player.inventory.push(generateRandomItem('Rare')); logMessage(`Looted: <span class="text-purple-400">Rare Item</span>`); }
                 else { player.inventory.push(generateRandomItem('Magic')); logMessage(`Looted: <span class="text-blue-400">Magic Item</span>`); }
            } else {
                if(roll < 0.02) { player.inventory.push(generateRandomItem('Rare')); logMessage(`Looted: <span class="text-purple-400">Rare Item</span>`); }
                else if(roll < 0.08) { player.inventory.push(generateRandomItem('Magic')); logMessage(`Looted: <span class="text-blue-400">Magic Item</span>`); }
                else if(roll < 0.25) { player.inventory.push(generateRandomItem('Basic')); logMessage(`Looted: <span class="text-green-400">Common Item</span>`); }
            }
        }

        if (player.zone !== 'world' && player.combatTarget) {
            let lMap = gameState.localMaps[player.zone];
            lMap.map[player.combatTarget.y][player.combatTarget.x] = '.';
            delete lMap.entities[`${player.combatTarget.x},${player.combatTarget.y}`];
        }
        player.inCombat = false; player.currentEnemy = null; player.combatTarget = null;
        player.momentumStacks = 0; 
        if (window.sortInventory) window.sortInventory(); 
    } else {
        // ENEMY TURN BEGINS
        let eDist = 1;
        if (player.combatTarget && player.zone !== 'world') {
            eDist = Math.abs(player.localX - player.combatTarget.x) + Math.abs(player.localY - player.combatTarget.y);
        }
        
        if (e.bleed) {
            e.hp -= e.bleed;
            logMessage(`${e.name} takes ${Math.floor(e.bleed)} bleed damage!`, "text-red-500");
            if (e.hp <= 0) return handleCombatTurn(true);
        }
        
        if (e.stunned) {
            logMessage(`${e.name} is stunned and skips their turn!`, "text-cyan-400");
            e.stunned = false;
        } else if (eDist > 1) {
            // Out of melee range
        } else {
            let dodgeChance = (passiveRank('ethereal_form') && !player.passives.juggernaut) ? player.passives.ethereal_form * 0.10 : 0;
            if(Math.random() < dodgeChance) {
                logMessage(`You dodged the ${e.name}'s attack!`, "text-blue-400");
            } else {
                let numAttacks = (e.elite === 'Swift' && Math.random() < 0.20) ? 2 : 1;
                if (numAttacks > 1) logMessage(`${e.name} strikes with blinding speed!`, "text-purple-400 blink");
                
                for(let atk=0; atk<numAttacks; atk++) {
                    let rawDmg = Math.floor(Math.random() * (e.damage * 0.5)) + Math.ceil(e.damage * 0.75); 
                    
                    let minDmg = Math.max(1, Math.floor(rawDmg * 0.15)); 
                    let eDmg = Math.max(minDmg, rawDmg - player.calcStats.def);
                    
                    if (passiveRank('spiked_armor') && rawDmg > 0) {
                        let reflect = Math.ceil(rawDmg * (player.passives.spiked_armor * 0.15));
                        e.hp -= reflect;
                        logMessage(`Spiked Armor reflects ${reflect} damage!`, "text-yellow-400");
                    }

                    if (passiveRank('adaptive_plating')) {
                        e.adaptiveStacks = (e.adaptiveStacks || 0) + 1;
                        let adaptReduc = Math.min(0.5, e.adaptiveStacks * player.passives.adaptive_plating * 0.1);
                        eDmg *= (1 - adaptReduc);
                    }
                    
                    if (player.shield > 0) {
                        let blocked = Math.min(player.shield, eDmg);
                        player.shield = 0; 
                        eDmg -= blocked;
                        if (blocked > 0) logMessage(`Shield shattered, absorbing ${Math.ceil(blocked)} damage!`, "text-cyan-400");
                    }
                    
                    if (passiveRank('unyielding')) {
                        let maxHit = player.maxHp * (0.5 - (player.passives.unyielding * 0.1));
                        if (eDmg > maxHit) {
                            eDmg = maxHit;
                            logMessage(`Unyielding mitigated massive damage!`, "text-yellow-400");
                        }
                    }

                    if (passiveRank('mana_shield') && player.mp > 0 && eDmg > 0) {
                        let drainPct = player.passives.mana_shield * 0.15;
                        let mpDrain = Math.min(player.mp, eDmg * drainPct);
                        player.mp -= mpDrain;
                        eDmg -= mpDrain;
                        logMessage(`Mana Shield absorbed damage!`, "text-cyan-400");
                    }
                    
                    if (passiveRank('masochist') && eDmg > 0) {
                        let mpRegen = eDmg * (player.passives.masochist * 0.20);
                        player.mp = Math.min(player.maxMp, player.mp + mpRegen);
                    }

                    eDmg = Math.max(0, Math.ceil(eDmg));
                    player.hp -= eDmg;
                    logMessage(`The ${e.name} hits you for ${eDmg} damage!`, "combat");
                    
                    if (e.elite === 'Vampiric' && eDmg > 0) {
                        let leech = Math.floor(eDmg * 0.5);
                        e.hp = Math.min(e.maxHp, e.hp + leech);
                    }
                    if (e.elite === 'Fiery' && eDmg > 0) {
                        player.burn = (player.burn || 0) + Math.floor(eDmg * 0.5);
                        logMessage(`You are set on fire!`, "text-orange-400");
                    }

                    if (player.hp <= 0 && passiveRank('second_wind') && !player.secondWindUsed) {
                        player.hp = Math.floor(player.maxHp * 0.5);
                        player.secondWindUsed = true;
                        logMessage(`*** SECOND WIND! You refuse to die! ***`, "text-yellow-400 font-bold blink");
                    } else if (player.hp <= 0) {
                        player.hp = 0; logMessage("You have died. Type /respawn", "combat"); player.inCombat = false; 
                        if (e.isGuard) applyGuardDeathPenalty();
                        break;
                    }
                }
            }
        }
    }
    
    moveEntities(); 
    if (window.updateStatus) window.updateStatus(); 
    if (window.renderMap) window.renderMap(); 
    if (window.savePlayerData) window.savePlayerData();
}

export function useActiveSkill(id) {
    let player = gameState.player;
    if (player.hp <= 0 || gameState.isAnimating || player.targetingMode) return;
    let skill = ACTIVES.find(s => s.id === id);
    if (!skill) return;

    let actualCost = skill.cost;
    let isBloodMagic = passiveRank('blood_magic') && skill.cost > 0;
    if (isBloodMagic && player.hp <= actualCost) { logMessage("Not enough HP to blood cast!", "text-red-400"); return; }
    if (!isBloodMagic && skill.cost > 0 && player.mp < skill.cost) { logMessage(`Not enough MP to cast ${skill.name}!`, "text-gray-400"); return; }
    if (player.cooldowns && player.cooldowns[id] > 0) { logMessage(`${skill.name} is on cooldown for ${player.cooldowns[id]} turns!`, "text-yellow-400"); return; }

    if (skill.targetType === 'self' || skill.range === 0) {
        confirmCast(skill, [{x: player.localX, y: player.localY, isSelf: true}]);
        return;
    }

    if (player.zone === 'world') {
        logMessage(`You cannot target specific entities in the wilderness.`, "text-gray-400");
        return;
    }

    player.activeSpell = skill;
    player.targetingMode = true;
    player.validTargets = [];
    player.selectedTargets = [];
    
    let lMap = gameState.localMaps[player.zone];

    if (skill.targetType === 'aoe') {
        player.aoeCenter = { x: player.localX, y: player.localY };
        logMessage(`Use Arrow Keys to move the AOE. Press Enter to cast, Escape to cancel.`, "text-cyan-400");
        if (window.renderMap) window.renderMap();
        return;
    }

    for (let key in lMap.entities) {
        let ent = lMap.entities[key];
        let [ex, ey] = key.split(',').map(Number);
        let dist = Math.abs(player.localX - ex) + Math.abs(player.localY - ey);
        
        if (dist <= skill.range) {
            if (skill.targetType === 'enemy' && ent.type === 'enemy') player.validTargets.push({x: ex, y: ey, data: ent.data});
            if (skill.targetType === 'friendly' && ent.type === 'npc') player.validTargets.push({x: ex, y: ey, data: ent.data});
            if (skill.targetType === 'multi' && ent.type === 'enemy') player.validTargets.push({x: ex, y: ey, data: ent.data});
        }
    }
    
    if (skill.targetType === 'friendly') {
        player.validTargets.push({x: player.localX, y: player.localY, isSelf: true});
    }

    if (player.validTargets.length === 0) {
        logMessage(`No valid targets in range for ${skill.name}.`, "text-gray-400");
        player.targetingMode = false;
        player.activeSpell = null;
        return;
    }

    player.validTargets.sort((a, b) => {
        let distA = Math.abs(player.localX - a.x) + Math.abs(player.localY - a.y);
        let distB = Math.abs(player.localX - b.x) + Math.abs(player.localY - b.y);
        return distA - distB;
    });

    player.currentTargetIdx = 0;
    let multiText = skill.targetType === 'multi' ? ` Select up to ${skill.maxTargets} targets.` : '';
    logMessage(`Targeting ${skill.name}. Use Arrow Keys to switch targets, Enter to confirm, Escape to cancel.${multiText}`, "text-cyan-400");
    if (window.renderMap) window.renderMap();
}

export function confirmCast(skill, targets) {
    let player = gameState.player;
    let actualCost = skill.cost;
    let isBloodMagic = passiveRank('blood_magic') && skill.cost > 0;
    if (isBloodMagic) player.hp -= actualCost; else player.mp -= actualCost;

    if (skill.cd > 0) {
        if (!player.cooldowns) player.cooldowns = {};
        let actualCd = skill.cd;
        if (passiveRank('time_weaver')) actualCd = Math.max(1, actualCd - player.passives.time_weaver);
        player.cooldowns[skill.id] = actualCd + 1;
    }

    if (passiveRank('spellblade') && skill.cost > 0) player.spellbladeActive = skill.cost;
    if (passiveRank('momentum')) player.momentumStacks = 0;

    let repeat = (passiveRank('spell_echo') && skill.cost > 0 && Math.random() < player.passives.spell_echo * 0.1) ? 2 : 1;
    if (repeat === 2) logMessage(`*** SPELL ECHO! The magic resonates! ***`, "text-cyan-400 font-bold");

    let lMap = gameState.localMaps[player.zone];
    if (lMap && !lMap.projectiles) lMap.projectiles = [];

    logMessage(`You cast <span class="text-cyan-400 font-bold">${skill.name}</span>!`);

    for (let i = 0; i < repeat; i++) {
        if (skill.speed && skill.speed > 0) {
            if (skill.targetType === 'aoe') {
                 lMap.projectiles.push({ skill: skill, caster: 'player', targetX: player.aoeCenter.x, targetY: player.aoeCenter.y, x: player.localX, y: player.localY });
            } else {
                 targets.forEach(t => { lMap.projectiles.push({ skill: skill, caster: 'player', targetX: t.x, targetY: t.y, x: player.localX, y: player.localY }); });
            }
        } else {
            if (skill.targetType === 'aoe') {
                 resolveSkillHit(skill, player.localX, player.localY, 'player', lMap);
            } else {
                 targets.forEach(t => resolveSkillHit(skill, t.x, t.y, 'player', lMap));
            }
        }
    }
    
    registerAction();
    if (player.mp > player.maxMp) player.mp = player.maxMp;
    if (window.updateStatus) window.updateStatus();

    if (player.inCombat && player.currentEnemy) {
        if (player.currentEnemy.hp <= 0) handleCombatTurn(true); 
        else if (!targets.some(t => t.data === player.currentEnemy)) handleCombatTurn(true); 
    } else {
        moveEntities(); 
        if (window.renderMap) window.renderMap();
    }
    if (window.savePlayerData) window.savePlayerData();
}

export function executeTargeting() {
    let player = gameState.player;
    if (!player.targetingMode) return;
    
    let skill = player.activeSpell;
    let lMap = gameState.localMaps[player.zone];

    if (skill.targetType === 'aoe') {
        let targets = [];
        for(let y = player.aoeCenter.y - skill.aoeRadius; y <= player.aoeCenter.y + skill.aoeRadius; y++) {
            for(let x = player.aoeCenter.x - skill.aoeRadius; x <= player.aoeCenter.x + skill.aoeRadius; x++) {
                if (lMap.entities[`${x},${y}`]) targets.push({x: x, y: y, data: lMap.entities[`${x},${y}`].data});
            }
        }
        player.targetingMode = false;
        player.activeSpell = null;
        confirmCast(skill, targets);
    } 
    else if (skill.targetType === 'multi') {
        let target = player.validTargets[player.currentTargetIdx];
        if (!player.selectedTargets.includes(target)) {
            player.selectedTargets.push(target);
            logMessage(`Target ${player.selectedTargets.length}/${skill.maxTargets} locked: ${target.data.name}`, "text-yellow-400");
        }
        if (player.selectedTargets.length >= skill.maxTargets || player.selectedTargets.length === player.validTargets.length) {
            let finalTargets = [...player.selectedTargets];
            player.targetingMode = false;
            player.activeSpell = null;
            confirmCast(skill, finalTargets);
        } else {
            if (window.renderMap) window.renderMap();
        }
    } 
    else {
        let target = player.validTargets[player.currentTargetIdx];
        player.targetingMode = false;
        player.activeSpell = null;
        confirmCast(skill, [target]);
    }
}

export function triggerBossDefeat(e) {
    let player = gameState.player;
    player.inCombat = false;
    player.currentEnemy = null;
    player.combatTarget = null;
    
    if (e.isBoss) {
        let wb = (gameState.worldBosses || []).find(b => b.name === e.name);
        if (wb) {
            wb.isDefeated = true;
            wb.respawnAt = Date.now() + 1800000; // 30 minutes
            try {
                localStorage.setItem('cota_world_bosses', JSON.stringify(gameState.worldBosses));
            } catch (err) {}
        }
    }
    
    if (!e.poiRef || !gameState.pois[e.poiRef]) {
        logMessage("The area is secured. You return to the wilderness.", "success");
        player.zone = 'world'; 
        player.x = player.worldX || 30;
        player.y = player.worldY || 30;
        if (window.renderMap) window.renderMap();
        return;
    }
    
    let poi = gameState.pois[e.poiRef];
    
    if(poi.type === 'D' || poi.type === '*') {
        logMessage("The structure collapses! You flee to the surface.", "system");
        for(let key in gameState.pois) {
            if(gameState.pois[key] === poi) {
                gameState.worldMap[key.split(',')[1]][key.split(',')[0]] = poi.biome;
                delete gameState.pois[key];
            }
        }
    } else if(poi.type === '^') {
        logMessage("The fortress is liberated! Settlers arrive.", "success");
        poi.type = 'C'; poi.name = "Liberated Town";
        delete gameState.localMaps[`${poi.rootX},${poi.rootY}_0`]; 
        generateNPCsForCity(poi.rootX, poi.rootY);
    }
    player.zone = 'world'; 
    player.x = poi.rootX; 
    player.y = poi.rootY;
    if (window.renderMap) window.renderMap();
}
