// Modals and UI Sheets (Stats, Skills, Passives, Journal, Stash)
import { gameState, passiveRank } from "../core/state.js";
import { ACTIVES, PASSIVES } from "../data/skills.js";
import { ASCII_ITEMS } from "../data/items.js";
import { AVATAR_GLYPHS } from "../data/constants.js";
import { logMessage } from "./log.js";
import { renderInventory, closeInventory, renderCrafting, calculateStats, depositItem, withdrawItem } from "../core/inventory.js";
import { broadcastPresence } from "../network/multiplayer.js";
import { renderWorldMapModal } from "./worldMap.js";
import { getClass } from "../data/classes.js";

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
        if(id === 'worldmap-modal') renderWorldMapModal();
    } else {
        if (id === 'inventory-modal') closeInventory();
        else modal.classList.add('hidden-ui');
    }
}

export function renderStats() {
    let player = gameState.player;
    const container = document.getElementById('stats-content');
    if (!container) return;
    const cInfo = getClass(player.loadout);
    container.innerHTML = `
        <div class="grid grid-cols-2 gap-4">
            <div><span class="text-gray-400">Name:</span> <span class="text-green-400 font-bold">${player.name}</span></div>
            <div><span class="text-gray-400">Class:</span> <span class="text-yellow-400 font-bold">${cInfo.name}</span> <span class="text-[11px] text-gray-500">(${cInfo.tagline})</span></div>
            
            <div class="col-span-2 bg-zinc-950 border border-green-950 p-2 rounded text-xs">
                <span class="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Class Playstyles:</span>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                    ${cInfo.playstyles.map(p => `
                        <div class="border border-green-900/60 bg-black/60 p-1.5 rounded">
                            <div class="text-yellow-300 font-bold text-[11px]">${p.name}</div>
                            <div class="text-[10px] text-cyan-400">${p.role}</div>
                            <div class="text-[9px] text-gray-400 leading-tight mt-0.5">${p.desc}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="col-span-2 border-t border-green-900/50 mt-2 pt-2 flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    <span class="text-gray-400">Map Glyph:</span>
                    <span class="w-8 h-8 rounded border border-green-500 bg-black flex items-center justify-center font-bold text-lg text-white shadow-sm">${player.symbol || '@'}</span>
                </div>
                <div class="flex items-center gap-1">
                    <select id="stat-symbol-select" class="bg-black border border-green-800 text-green-400 text-xs p-1 outline-none font-mono">
                        ${AVATAR_GLYPHS.map(g => `<option value="${g.glyph}" ${(player.symbol || '@') === g.glyph ? 'selected' : ''}>${g.label}</option>`).join('')}
                    </select>
                    <button id="btn-save-stat-glyph" class="btn-term text-[11px] py-1 px-2 border-green-700 hover:bg-green-900/30 font-bold">SET</button>
                </div>
            </div>

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

    const updateGlyph = (newGlyph) => {
        if (!newGlyph) return;
        player.symbol = newGlyph;
        if (window.renderMap) window.renderMap();
        if (window.savePlayerData) window.savePlayerData();
        broadcastPresence();
        renderStats();
        logMessage(`Map avatar glyph updated to "${player.symbol}".`, "success");
    };

    container.querySelector('#stat-symbol-select')?.addEventListener('change', (e) => {
        updateGlyph(e.target.value);
    });

    container.querySelector('#btn-save-stat-glyph')?.addEventListener('click', () => {
        const sel = container.querySelector('#stat-symbol-select');
        if (sel) updateGlyph(sel.value);
    });
}

export function renderJournal() {
    let player = gameState.player;
    const container = document.getElementById('journal-content');
    if (!container) return;
    if (!player.quests || player.quests.length === 0) {
        container.innerHTML = `<div class="text-gray-500 text-center mt-10">Your quest journal is currently empty.<br><span class="text-xs text-gray-600 mt-2 block">Speak with city leaders and citizens in Kingsfall, Oakhaven, Frosthold, and other realms to take on epic tasks.</span></div>`;
        return;
    }

    let html = '';
    player.quests.forEach(q => {
        if (q.isTurnedIn) return; 

        let statusColor = q.isComplete ? 'text-green-400' : 'text-yellow-400';
        let statusText = q.isComplete ? '★ READY FOR TURN IN' : `${q.progress} / ${q.maxProgress}`;
        let barWidth = Math.min(100, (q.progress / q.maxProgress) * 100);
        let category = q.category || 'Regional Bounty';

        html += `
            <div class="border border-blue-900/50 p-4 bg-black/60 mb-3 rounded shadow-sm">
                <div class="flex justify-between items-start mb-1">
                    <div>
                        <span class="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-blue-950 text-cyan-400 border border-blue-800">${category}</span>
                        <h3 class="font-bold text-base text-white mt-1.5 tracking-wide">${q.title}</h3>
                    </div>
                    <span class="${statusColor} font-bold text-xs uppercase bg-black/80 px-2 py-1 border border-current rounded">${statusText}</span>
                </div>
                <p class="text-xs text-gray-300 italic mb-2 leading-relaxed">"${q.desc}"</p>
                
                <div class="flex justify-between text-[11px] text-gray-400 mb-1 font-mono">
                    <span>Target: <strong class="text-yellow-400">${q.target}</strong></span>
                    <span>Progress: ${q.progress}/${q.maxProgress}</span>
                </div>
                <div class="w-full bg-gray-900 h-2 mb-3 border border-gray-700 rounded overflow-hidden">
                    <div class="${q.isComplete ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-yellow-500'} h-full transition-all duration-300" style="width: ${barWidth}%"></div>
                </div>
                
                <div class="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-gray-400 border-t border-blue-900/40 pt-2">
                    <div class="flex gap-3 items-center">
                        <span class="text-gray-500">Rewards:</span>
                        <span class="text-yellow-400 font-mono">${q.rewardGold}g</span>
                        <span class="text-purple-400 font-mono">+${q.rewardXp} XP</span>
                        ${q.rewardItem ? `<span class="text-cyan-400 font-mono border border-cyan-800 px-1 py-0.5 rounded bg-cyan-950/40">[${q.rewardItem.name}]</span>` : ''}
                    </div>
                    ${q.patronCity ? `<span class="text-gray-500 text-[10px] font-mono">Patron in: ${q.patronCity}</span>` : ''}
                </div>
            </div>
        `;
    });
    
    if (html === '') html = `<div class="text-gray-500 text-center mt-10">No active tasks. Speak with city leaders to begin new quests.</div>`;
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

    const cInfo = getClass(player.loadout);

    let html = `
        <div class="flex justify-between items-center border-b border-green-900 pb-2 mb-3 shrink-0">
            <div>
                <h2 class="text-xl font-bold text-cyan-400">SPELLS & SKILLS</h2>
                <div class="text-[11px] text-gray-400">Class: <span class="text-yellow-400 font-bold">${cInfo.name}</span> — ${cInfo.tagline}</div>
            </div>
            <div class="flex items-center gap-4">
                <span class="text-yellow-400 font-bold tracking-widest text-sm bg-yellow-900/20 px-3 py-1 border border-yellow-900">SKILL POINTS: <span>${player.skillPoints || 0}</span></span>
                <button class="text-red-500 hover:text-red-400 font-bold" onclick="toggleModal('skills-modal')">[X]</button>
            </div>
        </div>

        <!-- CLASS PLAYSTYLES BANNER -->
        <div class="mb-3 p-2 bg-zinc-950 border border-green-900/80 rounded shrink-0">
            <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Class Playstyle Synergies:</div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                ${cInfo.playstyles.map(p => `
                    <div class="border border-green-900/40 bg-black/50 p-1.5 rounded">
                        <span class="text-yellow-300 font-bold text-[11px]">${p.name}</span>
                        <span class="text-[10px] text-cyan-400 ml-1">(${p.role})</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="mb-3 p-3 border border-cyan-900 bg-cyan-900/10 shrink-0">
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
        
        <div class="flex-1 overflow-y-auto log-container pr-2 pb-4 space-y-4">
    `;

    // 1. Class Specialized Abilities
    const classSkillList = ACTIVES.filter(s => cInfo.classSkills.includes(s.id));
    const universalSkillList = ACTIVES.filter(s => !cInfo.classSkills.includes(s.id));

    const renderCard = (s, isClassSkill) => {
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

        // Find which playstyle favors this skill
        let playstyleTag = '';
        const favoredStyle = cInfo.playstyles.find(p => p.favoredSkills && p.favoredSkills.includes(s.id));
        if (favoredStyle) {
            playstyleTag = `<span class="text-[9px] text-yellow-400 border border-yellow-900/80 bg-yellow-950/40 px-1 py-0.2 rounded font-mono ml-1">${favoredStyle.name}</span>`;
        } else if (isClassSkill) {
            playstyleTag = `<span class="text-[9px] text-green-400 border border-green-900/80 bg-green-950/40 px-1 py-0.2 rounded font-mono ml-1">${cInfo.name}</span>`;
        }

        return `
            <div class="border ${isClassSkill ? (unlocked ? 'border-yellow-700 bg-yellow-950/10' : 'border-green-900/60 bg-black/60') : (unlocked ? 'border-cyan-900 bg-black/60' : 'border-gray-900 bg-black/40')} p-3 rounded flex flex-col justify-between min-h-[115px]">
                <div>
                    <div class="flex justify-between items-start border-b border-gray-800 pb-1 mb-1">
                        <div class="flex items-center flex-wrap gap-1">
                            <span class="font-bold ${unlocked ? (isClassSkill ? 'text-yellow-400' : 'text-cyan-400') : 'text-gray-500'}">${s.name} ${unlocked ? `<span class="text-xs text-yellow-500">(Lvl ${player.skillLevels?.[s.id] || 1})</span>` : ''} ${unlocked && player.cooldowns && player.cooldowns[s.id] > 0 ? `<span class="text-yellow-500 text-xs ml-1">(CD: ${player.cooldowns[s.id]})</span>` : ''}</span>
                            ${playstyleTag}
                        </div>
                        <span class="text-blue-400 font-bold text-xs shrink-0">${s.cost > 0 ? s.cost + ' MP' : s.cd + ' Turn CD'}</span>
                    </div>
                    <div class="text-[10px] text-gray-400 mt-1 leading-tight">${s.desc}</div>
                </div>
                ${btnHtml}
            </div>
        `;
    };

    html += `
        <div>
            <div class="text-xs font-bold text-yellow-400 uppercase tracking-widest border-b border-yellow-900/60 pb-1 mb-2 flex items-center justify-between">
                <span>★ ${cInfo.name} Specialized Abilities</span>
                <span class="text-[10px] text-gray-400 font-mono">${classSkillList.length} Class Spells</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${classSkillList.map(s => renderCard(s, true)).join('')}
            </div>
        </div>

        <div class="pt-2">
            <div class="text-xs font-bold text-cyan-400 uppercase tracking-widest border-b border-cyan-900/60 pb-1 mb-2 flex items-center justify-between">
                <span>✦ Cross-Realm & Universal Grimoire</span>
                <span class="text-[10px] text-gray-400 font-mono">${universalSkillList.length} Other Spells</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${universalSkillList.map(s => renderCard(s, false)).join('')}
            </div>
        </div>
    </div>`;

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
    
    const cInfo = getClass(player.loadout);

    let html = `
        <!-- CLASS PASSIVE SYNERGIES HEADER -->
        <div class="col-span-full border border-green-900/80 bg-zinc-950 p-3 rounded mb-3">
            <div class="flex justify-between items-center mb-1">
                <span class="text-yellow-400 font-bold text-sm">${cInfo.name} Playstyle Passives</span>
                <span class="text-xs text-gray-400 font-mono">Skill Points: <span class="text-yellow-400 font-bold">${player.skillPoints || 0}</span></span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                ${cInfo.playstyles.map(p => {
                    const passivesList = p.favoredPassives.map(pid => {
                        const pObj = PASSIVES.find(x => x.id === pid);
                        const lvl = player.passives[pid] || 0;
                        return `<span class="px-1.5 py-0.5 rounded text-[10px] ${lvl > 0 ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700' : 'bg-black/60 text-gray-400 border border-gray-800'}">${pObj ? pObj.name : pid} (${lvl}/${pObj ? pObj.max : 1})</span>`;
                    }).join(' ');
                    return `
                        <div class="border border-green-900/50 bg-black/60 p-2 rounded">
                            <div class="text-yellow-300 font-bold text-xs">${p.name}</div>
                            <div class="text-[10px] text-cyan-400 mb-1">${p.role}</div>
                            <div class="flex flex-wrap gap-1 mt-1">${passivesList}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    ['Combat', 'Defense', 'Utility'].forEach(cat => {
        html += `<div class="flex flex-col gap-3">
            <h3 class="text-cyan-400 border-b border-cyan-900 pb-1 mb-1 font-bold uppercase tracking-widest sticky top-0 bg-black/90 z-10">${cat}</h3>`;
        
        PASSIVES.filter(p => p.category === cat).forEach(p => {
            let lvl = player.passives[p.id] || 0;
            let maxed = lvl >= p.max;
            let isClassFavored = cInfo.classPassives && cInfo.classPassives.includes(p.id);
            let borderColor = maxed ? 'border-yellow-600' : (lvl > 0 ? 'border-green-600' : (isClassFavored ? 'border-green-900/80' : 'border-gray-800'));
            let titleColor = lvl > 0 ? 'text-green-400' : (isClassFavored ? 'text-yellow-200' : 'text-gray-400');
            
            html += `
                <div class="border ${borderColor} p-3 ${isClassFavored ? 'bg-green-950/10' : 'bg-black/60'} flex flex-col justify-between transition-colors hover:bg-gray-900 min-h-[90px] rounded">
                    <div>
                        <div class="flex justify-between items-start mb-1">
                            <span class="font-bold ${titleColor}">${p.name} <span class="text-xs text-gray-500">(${lvl}/${p.max})</span> ${isClassFavored ? '<span class="text-[9px] text-yellow-400 border border-yellow-900/80 bg-yellow-950/40 px-1 rounded ml-1 font-mono">CLASS</span>' : ''}</span>
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
