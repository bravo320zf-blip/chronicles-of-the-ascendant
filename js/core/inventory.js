// Inventory Management, Equipment, Crafting, and Stashing
import { gameState, passiveRank } from "./state.js";
import { ASCII_ITEMS, RECIPES, MATERIALS, generateRandomItem } from "../data/items.js";
import { logMessage } from "../ui/log.js";
import { moveEntities } from "./entities.js";

export function gainProfessionXP(prof, amount) {
    let player = gameState.player;
    if (!player.professions) return;
    let p = player.professions[prof];
    p.xp += amount;
    logMessage(`Gained ${amount} ${prof} XP!`, "text-cyan-400");
    if (p.xp >= p.nextXp) {
        p.level++;
        p.xp -= p.nextXp;
        p.nextXp = Math.floor(p.nextXp * 1.5);
        logMessage(`*** LEVEL UP! ${prof} is now Level ${p.level}! ***`, "text-yellow-400 font-bold blink");
    }
}

export function calculateStats() {
    let player = gameState.player;
    let s = { ...player.baseStats, atk: 0, def: 0, bonusMaxHp: 0, bonusMaxMp: 0 };
    for(let slot in player.equipment) {
        let eq = player.equipment[slot];
        if(eq && eq.stats) {
            for(let k in eq.stats) {
                if (k === 'maxHp') s.bonusMaxHp += eq.stats[k];
                else if (k === 'maxMp') s.bonusMaxMp += eq.stats[k];
                else s[k] = (s[k] || 0) + eq.stats[k];
            }
        }
    }
    
    if (passiveRank('juggernaut')) {
        s.def = Math.floor(s.def * (1 + (player.passives.juggernaut * 0.5)));
    }

    if (player.activeBuffs && player.activeBuffs.strengthSalve > 0) {
        s.atk += 3;
    }

    player.calcStats = s;
    player.maxHp = 50 + (s.con * 5) + (s.bonusMaxHp || 0);
    player.maxMp = 50 + (s.bonusMaxMp || 0);
    
    if (passiveRank('glass_cannon')) {
        player.maxHp = Math.floor(player.maxHp * (1 - (player.passives.glass_cannon * 0.15)));
    }
    
    if(player.hp > player.maxHp) player.hp = player.maxHp;
    if(player.mp > player.maxMp) player.mp = player.maxMp;
    if (typeof window !== 'undefined' && window.updateStatus) window.updateStatus();
}

export function renderInventory() {
    let player = gameState.player;
    const invContainer = document.getElementById('inventory-content');
    if (!invContainer) return;
    invContainer.innerHTML = '';
    let goldDisplay = document.getElementById('ui-gold-display');
    if (goldDisplay) goldDisplay.innerText = `Gold: ${player.gold || 0}`;

    let isSelling = player.sellingMode === true;
    const titleEl = document.getElementById('backpack-title');
    if (titleEl) titleEl.innerText = isSelling ? "Select Items to Sell" : "Backpack & Materials";

    player.inventory.forEach((item, index) => {
        let rColor = item.rarity === 'Legendary' ? 'text-yellow-400' : (item.rarity === 'Rare' ? 'text-purple-400' : (item.rarity === 'Uncommon' ? 'text-blue-400' : (item.rarity === 'Magic' ? 'text-blue-400' : 'text-green-400')));
        let bColor = item.rarity === 'Legendary' ? 'border-yellow-900' : (item.rarity === 'Rare' ? 'border-purple-900' : (item.rarity === 'Uncommon' ? 'border-blue-900' : (item.rarity === 'Magic' ? 'border-blue-900' : 'border-green-900')));
        let ascii = ASCII_ITEMS[item.id] || (item.type === 'material' ? ASCII_ITEMS['material'] : ASCII_ITEMS['potion']);
        
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

        let btnHtml = '';
        if (isSelling) {
            let sellPrice = Math.floor(item.price * 0.25) || 5;
            if (passiveRank('haggler_supreme')) sellPrice = Math.floor(sellPrice * (1 + (player.passives.haggler_supreme * 0.15)));
            btnHtml = `<button class="w-full mt-2 text-[10px] uppercase font-bold tracking-widest text-black bg-yellow-500 hover:bg-yellow-400 py-1" onclick="sellItem(${index}, ${sellPrice})">SELL FOR ${sellPrice}g</button>`;
        } else if (item.type !== 'material') {
            let btnText = item.type === 'consumable' ? 'USE' : 'EQUIP';
            btnHtml = `<button class="w-full mt-2 border border-green-900 text-[10px] uppercase font-bold tracking-widest hover:bg-green-900 transition-colors py-1" onclick="useItem(${index})">${btnText}</button>`;
        } else {
            btnHtml = `<div class="w-full mt-2 text-center text-gray-500 text-[10px] uppercase tracking-widest py-1 border border-gray-800">CRAFTING MATERIAL</div>`;
        }

        invContainer.innerHTML += `
            <div class="border ${bColor} p-2 flex flex-col justify-between transition-colors hover:bg-white/5 relative min-h-[140px]">
                <div class="text-center text-yellow-500 text-xs mb-2 whitespace-pre leading-none">${ascii}</div>
                <div>
                    <div class="font-bold ${rColor} text-xs">${item.name} ${item.count > 1 ? `x${item.count}` : ''}</div>
                    <div class="text-[10px] text-gray-400 mt-1">${displayDesc}</div>
                </div>
                ${btnHtml}
            </div>
        `;
    });
    if (!isSelling) renderEquipment();
}

export function closeInventory() {
    let player = gameState.player;
    document.getElementById('inventory-modal').classList.add('hidden-ui');
    player.sellingMode = false;
    if(player.activeDialogue && player.activeDialogue.npc && player.activeDialogue.npc.isVendor) {
        player.activeDialogue.state = 'root';
        logMessage(`[${player.activeDialogue.npc.name}]: "Anything else?"`, "npc");
        if (window.showDialogueOptions) window.showDialogueOptions();
    }
}

export function sortInventory() {
    let player = gameState.player;
    let consolidated = [];
    player.inventory.forEach(item => {
        if (item.type === 'consumable' || item.type === 'material') {
            let existing = consolidated.find(i => i.id === item.id);
            if (existing) {
                existing.count += (item.count || 1);
            } else {
                item.count = item.count || 1;
                consolidated.push(item);
            }
        } else {
            item.count = item.count || 1;
            consolidated.push(item);
        }
    });
    player.inventory = consolidated;

    const rVal = { 'Legendary': 5, 'Rare': 4, 'Uncommon': 3, 'Magic': 3, 'Basic': 2, 'material': 1, 'consumable': 1 };
    player.inventory.sort((a, b) => {
        let vA = (a.type === 'material' || a.type === 'consumable') ? 1 : (rVal[a.rarity] || 2);
        let vB = (b.type === 'material' || b.type === 'consumable') ? 1 : (rVal[b.rarity] || 2);
        if (vB !== vA) return vB - vA;
        return a.name.localeCompare(b.name);
    });
    
    if (window.savePlayerData) window.savePlayerData();
    renderInventory();
}

export function useItem(index) {
    let player = gameState.player;
    let item = player.inventory[index];
    if (!item || item.type === 'material') return;

    if (item.type === 'consumable') {
        if (item.id.includes('potion') || item.id.includes('salve') || item.id.includes('elixir')) {
            
            if (item.id === 'potion_health') {
                let heal = 30;
                if (passiveRank('alchemist_master')) heal += player.passives.alchemist_master * 25;
                if (passiveRank('vital_surge')) heal = Math.floor(heal * (1 + (player.passives.vital_surge * 0.25)));
                player.hp = Math.min(player.maxHp, player.hp + heal);
                logMessage(`You drink the ${item.name} and recover ${heal} HP.`, "success");
            } 
            else if (item.id === 'potion_mana') {
                player.mp = Math.min(player.maxMp, player.mp + 30);
                logMessage(`You drink the ${item.name} and recover 30 MP.`, "text-blue-400");
            } 
            else if (item.id === 'salve_healing') {
                if (!player.activeBuffs) player.activeBuffs = {};
                player.activeBuffs.healingSalve = 20;
                logMessage(`You apply the Healing Salve. Your wounds begin to knit.`, "success");
            } 
            else if (item.id === 'salve_strength') {
                if (!player.activeBuffs) player.activeBuffs = {};
                player.activeBuffs.strengthSalve = 20;
                logMessage(`You apply the Strength Salve. You feel a surge of power!`, "text-orange-400");
                calculateStats();
            } 
            else if (item.id === 'elixir_health') {
                player.baseStats.con = (player.baseStats.con || 10) + 2; 
                player.maxHp += 10;
                player.hp += 10;
                logMessage(`You consume the Elixir of Vitality! Permanent Max HP increased!`, "text-yellow-400 font-bold");
                calculateStats();
            } 
            else if (item.id === 'elixir_power') {
                player.baseStats.str = (player.baseStats.str || 10) + 1;
                logMessage(`You consume the Elixir of Power! Permanent Strength increased!`, "text-yellow-400 font-bold");
                calculateStats();
            }
            
            item.count--;
            if (item.count <= 0) player.inventory.splice(index, 1);
            if (window.updateStatus) window.updateStatus(); 
            renderInventory(); 
            moveEntities(); 
            if (window.renderMap) window.renderMap();
            return;
        }
    }

    let slotMap = { 'sword': 'rightHand', 'dagger': 'rightHand', 'mace': 'rightHand', 'axe': 'rightHand', 'staff': 'rightHand', 'wand': 'rightHand', 'bow': 'rightHand', 'shield': 'leftHand', 'book': 'leftHand', 'armor': 'chest', 'helm': 'head', 'boots': 'boots', 'gauntlets': 'gloves', 'cloak': 'back', 'ring': 'rightFinger', 'amulet': 'neck', 'torch': 'light' };
    let slot = slotMap[item.id];
    
    if (item.id === 'ring' || item.name.toLowerCase().includes('ring')) {
        if (!player.equipment.leftFinger && player.equipment.rightFinger) slot = 'leftFinger';
        else slot = 'rightFinger';
    } else if (!slot) {
        if(item.name.toLowerCase().includes('amulet')) slot = 'neck';
        else if(item.name.toLowerCase().includes('chest')) slot = 'chest';
        else if(item.name.toLowerCase().includes('cloak')) slot = 'back';
        else if(item.name.toLowerCase().includes('boots')) slot = 'boots';
        else if(item.name.toLowerCase().includes('helm')) slot = 'head';
        else slot = 'rightHand';
    }
    equipItem(index, slot);
}

export function equipItem(invIndex, slot) {
    let player = gameState.player;
    let item = player.inventory[invIndex];
    player.inventory.splice(invIndex, 1);
    
    if (player.equipment[slot]) {
        player.inventory.push(player.equipment[slot]);
    }
    
    player.equipment[slot] = {...item, count: 1};
    if(item.count > 1) {
        player.inventory.push({...item, count: item.count - 1});
    }
    
    logMessage(`You equipped ${item.name} to ${slot}.`, "system");
    calculateStats(); 
    renderInventory(); 
    moveEntities(); 
    if (window.renderMap) window.renderMap(); 
    if (window.savePlayerData) window.savePlayerData();
}

export function unequipItem(slot) {
    let player = gameState.player;
    if (player.equipment[slot]) {
        logMessage(`You unequipped ${player.equipment[slot].name}.`, "system");
        if (slot === 'light') player.torchActive = false;
        player.inventory.push(player.equipment[slot]);
        player.equipment[slot] = null;
        calculateStats(); 
        renderInventory(); 
        if (window.renderMap) window.renderMap(); 
        if (window.savePlayerData) window.savePlayerData();
    }
}

export function sellItem(index, price) {
    let player = gameState.player;
    let item = player.inventory[index];
    if (!item) return;
    
    player.gold += price;
    item.count--;
    if(item.count <= 0) player.inventory.splice(index, 1);
    
    logMessage(`Sold ${item.name} for ${price}g.`, "success");
    renderInventory(); 
    if (window.savePlayerData) window.savePlayerData(); 
    if (window.updateStatus) window.updateStatus();
}

export function renderEquipment() {
    let player = gameState.player;
    const equipContainer = document.getElementById('equipment-content');
    if (!equipContainer) return;
    
    const slots = [
        { id: 'head', name: 'HEAD' }, { id: 'neck', name: 'NECK' }, { id: 'shoulders', name: 'SHOULDERS' }, 
        { id: 'back', name: 'BACK' }, { id: 'chest', name: 'CHEST' }, { id: 'gloves', name: 'GLOVES' },
        { id: 'leftHand', name: 'LEFT HAND' }, { id: 'rightHand', name: 'RIGHT HAND' }, 
        { id: 'leftFinger', name: 'L. FINGER' }, { id: 'rightFinger', name: 'R. FINGER' },
        { id: 'pants', name: 'PANTS' }, { id: 'boots', name: 'BOOTS' }, { id: 'light', name: 'LIGHT' }
    ];

    let html = '';
    slots.forEach(s => {
        let item = player.equipment[s.id];
        if (item) {
            let rColor = item.rarity === 'Legendary' ? 'text-yellow-400' : (item.rarity === 'Rare' ? 'text-purple-400' : (item.rarity === 'Magic' ? 'text-blue-400' : 'text-green-400'));
            html += `
                <div class="flex items-center justify-between border-b border-green-900/30 py-2">
                    <div class="w-20 text-cyan-500 font-bold tracking-widest text-[10px] shrink-0">${s.name}</div>
                    <div class="flex-1 px-2">
                        <div class="font-bold ${rColor} text-sm">${item.name}</div>
                        <div class="text-[10px] text-gray-400 italic">${item.desc} ${s.id === 'light' ? `(Life: ${item.life})` : ''}</div>
                    </div>
                    <button class="border border-red-900 text-red-500 hover:bg-red-900/50 hover:text-white px-2 py-1 text-[10px] uppercase font-bold tracking-widest transition-colors" onclick="unequipItem('${s.id}')">UNEQUIP</button>
                </div>
            `;
        } else {
            html += `
                <div class="flex items-center justify-between border-b border-green-900/30 py-2 opacity-50">
                    <div class="w-20 text-cyan-500 font-bold tracking-widest text-[10px] shrink-0">${s.name}</div>
                    <div class="flex-1 px-2 text-center text-gray-500 text-xs">--- Empty ---</div>
                </div>
            `;
        }
    });
    equipContainer.innerHTML = html;
}

export function renderCrafting() {
    let player = gameState.player;
    if (!player.professions) return;
    
    let headerHtml = `<div class="flex gap-4 mb-4 justify-center flex-wrap">`;
    ['Woodworking', 'Metalworking', 'Alchemy', 'Hunting'].forEach(p => {
        let prof = player.professions[p];
        let pct = Math.min(100, (prof.xp / prof.nextXp) * 100);
        headerHtml += `
            <div class="text-center bg-black border border-cyan-900 p-2 min-w-[120px]">
                <div class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">${p}</div>
                <div class="text-cyan-400 font-bold">Lvl ${prof.level}</div>
                <div class="w-full bg-gray-900 h-1 mt-1"><div class="bg-cyan-500 h-full" style="width: ${pct}%"></div></div>
            </div>
        `;
    });
    headerHtml += `</div>`;
    
    let modalEl = document.getElementById('crafting-modal');
    if (!modalEl) return;
    let container = modalEl.querySelector('.panel');
    if(!container.querySelector('#craft-header')) {
        container.insertAdjacentHTML('afterbegin', `<div id="craft-header">${headerHtml}</div>`);
    } else {
        document.getElementById('craft-header').innerHTML = headerHtml;
    }

    const listContainer = document.getElementById('recipe-list');
    listContainer.innerHTML = '';
    
    ['Woodworking', 'Metalworking', 'Hunting', 'Alchemy'].forEach(cat => {
        listContainer.innerHTML += `<div class="text-xs font-bold uppercase text-gray-500 mt-2 border-b border-gray-800 pb-1">${cat}</div>`;
        RECIPES.filter(r => r.type === cat).forEach(r => {
            listContainer.innerHTML += `
                <button class="w-full text-left p-2 border border-cyan-900/30 hover:bg-cyan-900/20 hover:border-cyan-400 transition-colors" onclick="selectRecipe('${r.id}')">
                    <div class="font-bold text-cyan-400 text-sm">${r.name}</div>
                </button>
            `;
        });
    });
    
    document.getElementById('recipe-details').innerHTML = `<div class="text-gray-500 italic">Select a blueprint to begin crafting.</div>`;
}

export function selectRecipe(id) {
    let player = gameState.player;
    let r = RECIPES.find(x => x.id === id);
    if (!r) return;
    
    let container = document.getElementById('recipe-details');
    let matsHtml = '';
    let canCraft = true;
    
    r.reqs.forEach((req, index) => {
        let availableMats = player.inventory.filter(i => i.category === req.cat);
        let totalOwned = availableMats.reduce((sum, item) => sum + (item.count || 1), 0);
        
        let color = totalOwned >= req.count ? 'text-green-400' : 'text-red-400';
        if (totalOwned < req.count) canCraft = false;
        
        let selectOptions = '';
        if (availableMats.length > 0) {
            availableMats.forEach(mat => {
                selectOptions += `<option value="${mat.id}">${mat.name} (Own: ${mat.count || 1})</option>`;
            });
        } else {
            selectOptions = `<option value="">None Available</option>`;
        }
        
        matsHtml += `
            <div class="bg-black border border-gray-800 p-2 mb-2">
                <div class="flex justify-between items-center mb-1">
                    <span class="font-bold text-gray-300">${req.name}</span>
                    <span class="${color} font-bold text-xs">Need: ${req.count}</span>
                </div>
                <select id="craft-req-${index}" class="w-full bg-gray-900 border border-cyan-900 text-cyan-400 p-1 text-xs outline-none" ${availableMats.length === 0 ? 'disabled' : ''}>
                    ${selectOptions}
                </select>
            </div>
        `;
    });
    
    let craftBtn = canCraft 
        ? `<button class="w-full py-3 mt-4 text-black font-bold uppercase tracking-widest text-lg bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.4)]" onclick="craftItem('${id}')">CRAFT ITEM</button>`
        : `<button class="w-full py-3 mt-4 text-gray-500 font-bold uppercase tracking-widest text-lg border border-gray-700 bg-gray-900" disabled>MISSING MATERIALS</button>`;

    container.innerHTML = `
        <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-white shadow-text">${r.name}</h2>
            <div class="text-sm text-gray-400 italic mt-1">${r.desc}</div>
        </div>
        <div class="w-full max-w-sm text-left">
            <h4 class="text-xs uppercase text-cyan-500 font-bold mb-2 tracking-widest">Select Materials</h4>
            ${matsHtml}
        </div>
        <div class="w-full max-w-sm mt-auto">
            <div class="text-[10px] text-gray-500 text-center mb-2">Item stats are determined by the quality of materials used.</div>
            ${craftBtn}
        </div>
    `;
}

export function craftItem(id) {
    let player = gameState.player;
    let r = RECIPES.find(x => x.id === id);
    if (!r) return;
    
    let consumedStats = { atk: 0, def: 0, str: 0, dex: 0, int: 0, con: 0, maxHp: 0, maxMp: 0 };
    let highestRarityValue = 1;
    const rarityMap = { 'Basic': 1, 'Uncommon': 2, 'Rare': 3 };
    const reverseRarity = { 1: 'Basic', 2: 'Uncommon', 3: 'Rare' };

    for (let i = 0; i < r.reqs.length; i++) {
        let req = r.reqs[i];
        let selectEl = document.getElementById(`craft-req-${i}`);
        let matId = selectEl.value;
        
        let invIndex = player.inventory.findIndex(item => item.id === matId);
        if (invIndex === -1 || player.inventory[invIndex].count < req.count) {
            logMessage("Error consuming materials.", "text-red-500");
            return;
        }
        
        let matRef = player.inventory[invIndex];
        
        if (matRef.stats) {
            for (let stat in matRef.stats) {
                consumedStats[stat] += (matRef.stats[stat] * req.count);
            }
        }
        if (rarityMap[matRef.rarity] > highestRarityValue) highestRarityValue = rarityMap[matRef.rarity];
        
        player.inventory[invIndex].count -= req.count;
        if (player.inventory[invIndex].count <= 0) player.inventory.splice(invIndex, 1);
    }
    
    let finalRarity = reverseRarity[highestRarityValue];
    let newItem;

    if (r.isComponent) {
        newItem = {...MATERIALS[r.baseId], count: 1, rarity: finalRarity, stats: consumedStats};
        
        if (r.baseId.includes('potion')) newItem.count = 3;
        else if (r.baseId.includes('salve')) newItem.count = 2;
        else if (r.baseId === 'torch_pine') {
            newItem.life = 100 + (player.professions['Woodworking'].level * 10);
            newItem.maxLife = newItem.life;
        }
        
        player.inventory.push(newItem);
        logMessage(`You crafted a <span class="font-bold text-cyan-400">${newItem.name}</span> (x${newItem.count})!`, "success");
    } else {
        newItem = generateRandomItem(finalRarity, r.baseId);
        newItem.stats = {};
        for (let stat in consumedStats) {
            if (consumedStats[stat] > 0) newItem.stats[stat] = consumedStats[stat];
        }
        
        let descParts = [];
        if (newItem.stats.atk) descParts.push(`+${newItem.stats.atk} ATK`);
        if (newItem.stats.def) descParts.push(`+${newItem.stats.def} DEF`);
        if (newItem.stats.str) descParts.push(`+${newItem.stats.str} STR`);
        if (newItem.stats.dex) descParts.push(`+${newItem.stats.dex} DEX`);
        if (newItem.stats.int) descParts.push(`+${newItem.stats.int} INT`);
        if (newItem.stats.con) descParts.push(`+${newItem.stats.con} CON`);
        if (newItem.stats.maxHp) descParts.push(`+${newItem.stats.maxHp} HP`);
        newItem.desc = descParts.join(', ');
        
        player.inventory.push(newItem);
        
        setTimeout(() => {
            let customName = prompt("Name your forged item:", r.name);
            if (customName && customName.trim() !== "") {
                newItem.name = customName.trim().substring(0, 30);
            } else {
                newItem.name = r.name;
            }
            logMessage(`You crafted <span class="font-bold text-cyan-400">${newItem.name}</span>!`, "success");
            sortInventory();
            renderCrafting();
            if (window.savePlayerData) window.savePlayerData();
        }, 100);
    }

    gainProfessionXP(r.type, 25);
    sortInventory();
    selectRecipe(id); 
    if (window.savePlayerData) window.savePlayerData();
}

export function depositItem(index) {
    let player = gameState.player;
    let item = player.inventory[index];
    if (!item) return;
    if (!player.stash) player.stash = [];
    player.stash.push(item);
    player.inventory.splice(index, 1);
    if (window.renderStash) window.renderStash(); 
    if (window.savePlayerData) window.savePlayerData();
}

export function withdrawItem(index) {
    let player = gameState.player;
    let item = player.stash[index];
    if (!item) return;
    player.inventory.push(item);
    player.stash.splice(index, 1);
    if (window.renderStash) window.renderStash(); 
    if (window.savePlayerData) window.savePlayerData();
}

export function handleGoldStash(action) {
    let player = gameState.player;
    if (player.stashedGold === undefined) player.stashedGold = 0;
    const input = document.getElementById('stash-gold-input');
    let amount = parseInt(input.value);

    if (isNaN(amount) || amount <= 0) {
        logMessage("Please enter a valid amount of gold.", "text-gray-400");
        return;
    }

    if (action === 'deposit') {
        if (player.gold >= amount) {
            player.gold -= amount;
            player.stashedGold += amount;
            logMessage(`Deposited ${amount}g into your Stash.`, "success");
        } else {
            logMessage("You do not have that much gold on hand!", "text-red-400");
        }
    } else if (action === 'withdraw') {
        if (player.stashedGold >= amount) {
            player.stashedGold -= amount;
            player.gold += amount;
            logMessage(`Withdrew ${amount}g from your Stash.`, "success");
        } else {
            logMessage("You do not have that much gold in your stash!", "text-red-400");
        }
    }
    
    input.value = '';
    if (window.renderStash) window.renderStash();
    if (window.updateStatus) window.updateStatus();
    if (window.savePlayerData) window.savePlayerData();
}
