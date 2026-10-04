// Modals and UI Sheets (Stats, Skills, Passives, Journal, Stash)
import { gameState, passiveRank } from "../core/state.js";
import { ACTIVES, PASSIVES } from "../data/skills.js";
import { ASCII_ITEMS } from "../data/items.js";
import { logMessage } from "./log.js";
import { renderInventory, closeInventory, renderCrafting, calculateStats, depositItem, withdrawItem } from "../core/inventory.js";

export function toggleModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    if (modal.classList.contains('hidden-ui')) {
        modal.classList.remove('hidden-ui');
        if(id === 'inventory-modal') renderInventory();
        if(id === 'stats-modal') renderStats();
        if(id === 'passive-modal') renderPassives();
        if(id === 'skills-modal') renderSkills();
        if(id === 'stash-modal') renderStash();
        if(id === 'journal-modal') renderJournal();
        if(id === 'crafting-modal') renderCrafting();
    } else {
        if (id === 'inventory-modal') closeInventory();
        else modal.classList.add('hidden-ui');
    }
}

export function renderStats() {
    let player = gameState.player;
    const container = document.getElementById('stats-content');
    if (!container) return;
    container.innerHTML = `
        <div class="grid grid-cols-2 gap-4">
            <div><span class="text-gray-400">Name:</span> <span class="text-green-400 font-bold">${player.name}</span></div>
            <div><span class="text-gray-400">Class:</span> <span class="text-green-400 font-bold capitalize">${player.loadout || 'Adventurer'}</span></div>
            
            <div class="col-span-2 border-t border-green-900/50 mt-2 pt-2 text-cyan-500 font-bold uppercase tracking-widest text-xs">Base Attributes</div>
            
            <div><span class="text-gray-400">Strength:</span> <span class="text-white">${player.calcStats.str}</span> <span class="text-[10px] text-gray-500">(Base: ${player.baseStats.str})</span></div>
            <div><span class="text-gray-400">Dexterity:</span> <span class="text-white">${player.calcStats.dex}</span> <span class="text-[10px] text-gray-500">(Base: ${player.baseStats.dex})</span></div>
            <div><span class="text-gray-400">Intelligence:</span> <span class="text-white">${player.calcStats.int}</span> <span class="text-[10px] text-gray-500">(Base: ${player.baseStats.int})</span></div>
            <div><span class="text-gray-400">Constitution:</span> <span class="text-white">${player.calcStats.con}</span> <span class="text-[10px] text-gray-500">(Base: ${player.baseStats.con})</span></div>

            <div class="col-span-2 border-t border-green-900/50 mt-2 pt-2 text-red-400 font-bold uppercase tracking-widest text-xs">Combat & Defense</div>

            <div><span class="text-gray-400">HP:</span> <span class="text-red-400">${Math.floor(player.hp)} / ${player.maxHp}</span></div>
            <div><span class="text-gray-400">MP:</span> <span class="text-blue-400">${Math.floor(player.mp)} / ${player.maxMp}</span></div>
            <div><span class="text-gray-400">Attack (ATK):</span> <span class="text-yellow-400">+${player.calcStats.atk}</span></div>
            <div><span class="text-gray-400">Defense (DEF):</span> <span class="text-yellow-400">+${player.calcStats.def}</span></div>
            
            <div class="col-span-2 border-t border-green-900/50 mt-2 pt-2 text-yellow-500 font-bold uppercase tracking-widest text-xs">Wealth</div>
            
            <div><span class="text-gray-400">Gold:</span> <span class="text-yellow-400">${player.gold}g</span></div>
        </div>
    `;
}

export function renderJournal() {
    let player = gameState.player;
    const container = document.getElementById('journal-content');
    if (!container) return;
    if (!player.quests || player.quests.length === 0) {
        container.innerHTML = `<div class="text-gray-500 text-center mt-10">Your journal is empty. Talk to NPCs in cities to find work.</div>`;
        return;
    }

    let html = '';
    player.quests.forEach(q => {
        if (q.isTurnedIn) return; 

        let statusColor = q.isComplete ? 'text-green-400' : 'text-yellow-400';
        let statusText = q.isComplete ? '(COMPLETE - Return to NPC)' : `(${q.progress}/${q.maxProgress})`;
        let barWidth = Math.min(100, (q.progress / q.maxProgress) * 100);

        html += `
            <div class="border border-blue-900/50 p-4 bg-black/60 mb-2">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-lg text-blue-400 tracking-wide">${q.title}</h3>
                    <span class="${statusColor} font-bold text-xs uppercase">${statusText}</span>
                </div>
                <p class="text-sm text-gray-400 italic mb-3">"${q.desc}"</p>
                
                <div class="w-full bg-gray-900 h-2 mb-3 border border-gray-700">
                    <div class="${q.isComplete ? 'bg-green-500' : 'bg-yellow-500'} h-full" style="width: ${barWidth}%"></div>
                </div>
                
                <div class="flex gap-4 text-xs font-bold uppercase tracking-widest text-gray-500 border-t border-blue-900/30 pt-2">
                    <span>Rewards:</span>
                    <span class="text-yellow-500">${q.rewardGold}g</span>
                    <span class="text-purple-400">${q.rewardXp} XP</span>
                </div>
            </div>
        `;
    });
    
    if (html === '') html = `<div class="text-gray-500 text-center mt-10">No active tasks.</div>`;
    container.innerHTML = html;
}

export function renderStash() {
    let player = gameState.player;
    if (!player.stash) player.stash = [];
    if (player.stashedGold === undefined) player.stashedGold = 0;
    
    let stashedEl = document.getElementById('ui-stashed-gold');
    let pocketEl = document.getElementById('ui-pocket-gold');
    if (stashedEl) stashedEl.innerText = `${player.stashedGold}g`;
    if (pocketEl) pocketEl.innerText = `${player.gold}g`;

    const invContainer = document.getElementById('stash-inventory-content');
    const stashContainer = document.getElementById('stash-box-content');
    if (!invContainer || !stashContainer) return;
    invContainer.innerHTML = ''; 
    stashContainer.innerHTML = '';

    function getDesc(item) {
        let displayDesc = item.desc;
        if (!displayDesc || displayDesc === 'undefined') {
            if (item.type === 'material' && item.stats) {
                let parts = [];
                if (item.stats.atk) parts.push(`+${item.stats.atk} ATK`);
                if (item.stats.def) parts.push(`+${item.stats.def} DEF`);
                if (item.stats.str) parts.push(`+${item.stats.str} STR`);
                if (item.stats.dex) parts.push(`+${item.stats.dex} DEX`);
                if (item.stats.int) parts.push(`+${item.stats.int} INT`);
                if (item.stats.con) parts.push(`+${item.stats.con} CON`);
                if (item.stats.maxHp) parts.push(`+${item.stats.maxHp} HP`);
                if (item.stats.maxMp) parts.push(`+${item.stats.maxMp} MP`);
                displayDesc = parts.length > 0 ? parts.join(', ') : 'Crafting component.';
                item.desc = displayDesc;
            } else {
                displayDesc = '';
            }
        }
        return displayDesc;
    }

    player.inventory.forEach((item, index) => {
        let rColor = item.rarity === 'Legendary' ? 'text-yellow-400' : (item.rarity === 'Rare' ? 'text-purple-400' : (item.rarity === 'Uncommon' ? 'text-blue-400' : (item.rarity === 'Magic' ? 'text-blue-400' : 'text-green-400')));
        let bColor = item.rarity === 'Legendary' ? 'border-yellow-900' : (item.rarity === 'Rare' ? 'border-purple-900' : (item.rarity === 'Uncommon' ? 'border-blue-900' : (item.rarity === 'Magic' ? 'border-blue-900' : 'border-green-900')));
        let ascii = ASCII_ITEMS[item.id] || (item.type === 'material' ? ASCII_ITEMS['material'] : ASCII_ITEMS['potion']);
        let displayDesc = getDesc(item);
        
        invContainer.innerHTML += `
            <div class="border ${bColor} p-2 flex flex-col justify-between transition-colors hover:bg-white/5 relative min-h-[140px]">
                <div class="text-center text-yellow-500 text-xs mb-2 whitespace-pre leading-none">${ascii}</div>
                <div>
                    <div class="font-bold ${rColor} text-xs">${item.name} ${item.count > 1 ? `x${item.count}` : ''}</div>
                    <div class="text-[10px] text-gray-400 mt-1">${displayDesc}</div>
                </div>
                <button class="w-full mt-2 text-[10px] uppercase font-bold tracking-widest text-black bg-green-600 hover:bg-green-500 py-1" onclick="depositItem(${index})">STORE ITEM</button>
            </div>
        `;
    });

    player.stash.forEach((item, index) => {
        let rColor = item.rarity === 'Legendary' ? 'text-yellow-400' : (item.rarity === 'Rare' ? 'text-purple-400' : (item.rarity === 'Uncommon' ? 'text-blue-400' : (item.rarity === 'Magic' ? 'text-blue-400' : 'text-green-400')));
        let bColor = item.rarity === 'Legendary' ? 'border-yellow-900' : (item.rarity === 'Rare' ? 'border-purple-900' : (item.rarity === 'Uncommon' ? 'border-blue-900' : (item.rarity === 'Magic' ? 'border-blue-900' : 'border-green-900')));
        let ascii = ASCII_ITEMS[item.id] || (item.type === 'material' ? ASCII_ITEMS['material'] : ASCII_ITEMS['potion']);
        let displayDesc = getDesc(item);
        
        stashContainer.innerHTML += `
            <div class="border ${bColor} p-2 flex flex-col justify-between transition-colors hover:bg-white/5 relative min-h-[140px]">
                <div class="text-center text-yellow-500 text-xs mb-2 whitespace-pre leading-none">${ascii}</div>
                <div>
                    <div class="font-bold ${rColor} text-xs">${item.name} ${item.count > 1 ? `x${item.count}` : ''}</div>
                    <div class="text-[10px] text-gray-400 mt-1">${displayDesc}</div>
                </div>
                <button class="w-full mt-2 text-[10px] uppercase font-bold tracking-widest text-black bg-cyan-600 hover:bg-cyan-500 py-1" onclick="withdrawItem(${index})">WITHDRAW</button>
            </div>
        `;
    });
}

export function renderSkills() {
    let player = gameState.player;
    if (!player.unlockedActives) player.unlockedActives = [];
    if (!player.hotkeys) player.hotkeys = { q: null, e: null };

    let modal = document.getElementById('skills-modal');
    if (!modal) return;
    let panel = modal.querySelector('.panel');

    let html = `
        <div class="flex justify-between items-center border-b border-green-900 pb-2 mb-4 shrink-0">
            <h2 class="text-xl font-bold text-cyan-400">SPELLS & SKILLS</h2>
            <div class="flex items-center gap-4">
                <span class="text-yellow-400 font-bold tracking-widest text-sm bg-yellow-900/20 px-3 py-1 border border-yellow-900">SKILL POINTS: <span>${player.skillPoints || 0}</span></span>
                <button class="text-red-500 hover:text-red-400 font-bold" onclick="toggleModal('skills-modal')">[X]</button>
            </div>
        </div>
        
        <div class="mb-4 p-4 border border-cyan-900 bg-cyan-900/10 shrink-0">
            <h3 class="text-cyan-400 font-bold mb-2 tracking-widest text-xs">ASSIGNED HOTKEYS</h3>
            <div class="grid grid-cols-2 gap-4">
                <div class="text-center p-2 border border-gray-700 bg-black cursor-pointer hover:border-gray-500 transition-colors" onclick="useActiveSkill(player.hotkeys.q)">
                    <span class="text-yellow-500 font-bold text-lg">[Q]</span><br>
                    <span class="text-white text-xs font-bold">${player.hotkeys.q ? ACTIVES.find(s=>s.id===player.hotkeys.q)?.name : 'Empty'}</span>
                </div>
                <div class="text-center p-2 border border-gray-700 bg-black cursor-pointer hover:border-gray-500 transition-colors" onclick="useActiveSkill(player.hotkeys.e)">
                    <span class="text-yellow-500 font-bold text-lg">[E]</span><br>
                    <span class="text-white text-xs font-bold">${player.hotkeys.e ? ACTIVES.find(s=>s.id===player.hotkeys.e)?.name : 'Empty'}</span>
                </div>
            </div>
            <div class="text-[10px] text-gray-500 mt-2 text-center">Press Q or E on your keyboard during combat or exploration to instantly cast.</div>
        </div>
        
        <div class="flex-1 overflow-y-auto log-container pr-2 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
    `;

    ACTIVES.forEach(s => {
        let unlocked = player.unlockedActives.includes(s.id);
        let btnHtml = '';
        
        if (unlocked) {
            let isQ = player.hotkeys.q === s.id;
            let isE = player.hotkeys.e === s.id;
            let sLvl = player.skillLevels?.[s.id] || 1;
            
            btnHtml = `
                <div class="flex gap-2 mt-2">
                    <button class="flex-1 text-[10px] uppercase font-bold tracking-widest py-1 border ${isQ ? 'border-yellow-500 text-yellow-500 bg-yellow-900/20' : 'border-gray-600 text-gray-400 hover:text-white hover:border-white'}" onclick="assignHotkey('q', '${s.id}')">${isQ ? 'BOUND [Q]' : 'BIND [Q]'}</button>
                    <button class="flex-1 text-[10px] uppercase font-bold tracking-widest py-1 border ${isE ? 'border-yellow-500 text-yellow-500 bg-yellow-900/20' : 'border-gray-600 text-gray-400 hover:text-white hover:border-white'}" onclick="assignHotkey('e', '${s.id}')">${isE ? 'BOUND [E]' : 'BIND [E]'}</button>
                </div>
                ${player.skillPoints > 0 ? `<button class="w-full mt-2 text-[10px] uppercase font-bold tracking-widest py-1 border border-yellow-600 text-yellow-500 hover:bg-yellow-900/50" onclick="upgradeSkill('${s.id}')">UPGRADE (Lvl ${sLvl+1})</button>` : ''}
            `;
        } else {
            btnHtml = `<button class="w-full mt-2 text-[10px] uppercase font-bold tracking-widest py-1 ${player.skillPoints > 0 ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-gray-800 text-gray-500'}" onclick="unlockSkill('${s.id}')">UNLOCK (1 SP)</button>`;
        }

        html += `
            <div class="border ${unlocked ? 'border-cyan-900' : 'border-green-900/30'} p-3 bg-black/60 flex flex-col justify-between min-h-[110px]">
                <div>
                    <div class="flex justify-between items-start border-b border-gray-800 pb-1 mb-1">
                        <span class="font-bold ${unlocked ? 'text-cyan-400' : 'text-gray-500'}">${s.name} ${unlocked ? `<span class="text-xs text-yellow-500">(Lvl ${player.skillLevels?.[s.id] || 1})</span>` : ''} ${unlocked && player.cooldowns && player.cooldowns[s.id] > 0 ? `<span class="text-yellow-500 text-xs ml-1">(CD: ${player.cooldowns[s.id]})</span>` : ''}</span>
                        <span class="text-blue-400 font-bold text-xs shrink-0">${s.cost > 0 ? s.cost + ' MP' : s.cd + ' Turn CD'}</span>
                    </div>
                    <div class="text-[10px] text-gray-400 mt-1 leading-tight">${s.desc}</div>
                </div>
                ${btnHtml}
            </div>
        `;
    });

    html += `</div>`;
    panel.innerHTML = html;
    panel.className = "panel w-full max-w-4xl max-h-[90vh] flex flex-col p-6"; 
}

export function unlockSkill(id) {
    let player = gameState.player;
    if (!player.unlockedActives) player.unlockedActives = [];
    if (!player.skillLevels) player.skillLevels = {};
    if (player.skillPoints > 0 && !player.unlockedActives.includes(id)) {
        player.skillPoints--;
        player.unlockedActives.push(id);
        player.skillLevels[id] = 1;
        logMessage(`Learned Spell/Skill: <span class="text-cyan-400 font-bold">${ACTIVES.find(s=>s.id===id).name}</span>!`, "success");
        renderSkills();
        if (window.savePlayerData) window.savePlayerData();
    }
}

export function upgradeSkill(id) {
    let player = gameState.player;
    if (!player.skillLevels) player.skillLevels = {};
    if (player.skillPoints > 0) {
        player.skillPoints--;
        player.skillLevels[id] = (player.skillLevels[id] || 1) + 1;
        logMessage(`Upgraded Spell/Skill: <span class="text-cyan-400 font-bold">${ACTIVES.find(s=>s.id===id).name}</span> to Level ${player.skillLevels[id]}!`, "success");
        renderSkills();
        if (window.savePlayerData) window.savePlayerData();
    }
}

export function assignHotkey(key, id) {
    let player = gameState.player;
    if (!player.hotkeys) player.hotkeys = { q: null, e: null };
    if (player.hotkeys[key === 'q' ? 'e' : 'q'] === id) {
        player.hotkeys[key === 'q' ? 'e' : 'q'] = null;
    }
    player.hotkeys[key] = id;
    renderSkills();
    if (window.savePlayerData) window.savePlayerData();
}

export function renderPassives() {
    let player = gameState.player;
    if (!player.passives) player.passives = {};
    
    let spEl = document.getElementById('ui-sp');
    if(spEl) spEl.innerText = player.skillPoints || 0;
    
    const container = document.getElementById('passive-content');
    if(!container) return;
    
    let html = '';
    ['Combat', 'Defense', 'Utility'].forEach(cat => {
        html += `<div class="flex flex-col gap-3">
            <h3 class="text-cyan-400 border-b border-cyan-900 pb-1 mb-1 font-bold uppercase tracking-widest sticky top-0 bg-black/90 z-10">${cat}</h3>`;
        
        PASSIVES.filter(p => p.category === cat).forEach(p => {
            let lvl = player.passives[p.id] || 0;
            let maxed = lvl >= p.max;
            let borderColor = maxed ? 'border-yellow-600' : (lvl > 0 ? 'border-green-600' : 'border-gray-800');
            let titleColor = lvl > 0 ? 'text-green-400' : 'text-gray-400';
            
            html += `
                <div class="border ${borderColor} p-3 bg-black/60 flex flex-col justify-between transition-colors hover:bg-gray-900 min-h-[90px]">
                    <div>
                        <div class="flex justify-between items-start mb-1">
                            <span class="font-bold ${titleColor}">${p.name} <span class="text-xs text-gray-500">(${lvl}/${p.max})</span></span>
                        </div>
                        <div class="text-[10px] text-gray-400 leading-tight">${p.desc}</div>
                    </div>
                    <div class="mt-2 text-right">
                        ${!maxed && player.skillPoints > 0 ? `<button class="text-black bg-yellow-500 hover:bg-yellow-400 font-bold text-[10px] px-2 py-1 uppercase rounded-sm" onclick="upgradePassive('${p.id}')">Upgrade</button>` : (maxed ? `<span class="text-yellow-600 text-[10px] font-bold uppercase">Maxed</span>` : '')}
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    });
    container.innerHTML = html;
}

export function upgradePassive(id) {
    let player = gameState.player;
    if (!player.passives) player.passives = {};
    let lvl = player.passives[id] || 0;
    let p = PASSIVES.find(x => x.id === id);
    if (p && lvl < p.max && player.skillPoints > 0) {
        player.skillPoints--;
        player.passives[id] = lvl + 1;
        renderPassives();
        calculateStats();
        if (window.savePlayerData) window.savePlayerData();
        logMessage(`Upgraded Passive: <span class="text-yellow-400">${p.name}</span> to Level ${lvl + 1}!`, "success");
    }
}
