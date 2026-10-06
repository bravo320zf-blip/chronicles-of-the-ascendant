// 3-Panel Trading System, Party System, and Multiplayer Emotes
import { gameState } from "../core/state.js";
import { logMessage } from "./log.js";
import { renderMap } from "./renderer.js";
import { broadcastPresence, sendChatMessage } from "../network/multiplayer.js";
import { triggerAutoSave } from "../network/characterSave.js";

// ==========================================
// 8 UNIQUE MUD EMOTES
// ==========================================
export const EMOTES = [
    { id: 'wave', label: 'Wave', text: (p, t) => `${p} waves at ${t}.` },
    { id: 'bow', label: 'Bow', text: (p, t) => `${p} bows respectfully to ${t}.` },
    { id: 'cheer', label: 'Cheer', text: (p, t) => `${p} cheers enthusiastically for ${t}!` },
    { id: 'salute', label: 'Salute', text: (p, t) => `${p} raises their weapon in salute to ${t}.` },
    { id: 'challenge', label: 'Challenge', text: (p, t) => `${p} brandishes their blade and challenges ${t} to a duel!` },
    { id: 'laugh', label: 'Laugh', text: (p, t) => `${p} laughs heartily alongside ${t}.` },
    { id: 'dance', label: 'Dance', text: (p, t) => `${p} performs a triumphant victory jig for ${t}!` },
    { id: 'highfive', label: 'High Five', text: (p, t) => `${p} gives ${t} a resounding high five!` }
];

// Active Interaction and Trade State
let activeInteractingPlayer = null;

let tradeState = {
    partner: null,
    heroOfferedItems: [],
    heroOfferedGold: 0,
    heroAccepted: false,
    partnerOfferedItems: [],
    partnerOfferedGold: 0,
    partnerAccepted: false
};

// ==========================================
// PLAYER INTERACTION MODAL CONTROLS
// ==========================================
export function openPlayerInteraction(targetPlayer) {
    if (!targetPlayer) return;
    activeInteractingPlayer = targetPlayer;

    const modal = document.getElementById('player-interact-modal');
    const nameEl = document.getElementById('interact-player-name');
    const optView = document.getElementById('interact-options-view');
    const emoView = document.getElementById('interact-emotes-view');

    if (nameEl) nameEl.innerText = `${targetPlayer.name} (Lvl ${targetPlayer.level || 1})`;
    if (optView) optView.classList.remove('hidden-ui');
    if (emoView) emoView.classList.add('hidden-ui');

    // Also log in the terminal log with clickable options just like NPCs
    logMessage(`*** You interact with Adventurer [${targetPlayer.name}] ***`, "text-cyan-400 font-bold");
    logMessage(`<div class="space-y-1 my-1">
        <span class="cursor-pointer text-cyan-400 hover:text-white underline decoration-dotted" data-player-action="party">[1] "Invite to Party"</span><br>
        <span class="cursor-pointer text-yellow-400 hover:text-white underline decoration-dotted" data-player-action="trade">[2] "Trade"</span><br>
        <span class="cursor-pointer text-pink-400 hover:text-white underline decoration-dotted" data-player-action="emote">[3] "Emote"</span><br>
        <span class="cursor-pointer text-gray-500 hover:text-white underline decoration-dotted" data-player-action="cancel">[4] "Cancel"</span>
    </div>`);

    if (modal) modal.classList.remove('hidden-ui');
}

export function closePlayerInteraction() {
    activeInteractingPlayer = null;
    document.getElementById('player-interact-modal')?.classList.add('hidden-ui');
}

// ==========================================
// PARTY INVITATION
// ==========================================
export function inviteToParty(targetPlayer) {
    const target = targetPlayer || activeInteractingPlayer;
    if (!target) return;

    let player = gameState.player;
    if (!player.party) player.party = [];

    const identifier = target.uid || target.name;
    if (player.party.includes(identifier) || player.party.includes(target.name)) {
        logMessage(`[Party]: ${target.name} is already in your party!`, "text-yellow-400");
    } else {
        player.party.push(identifier);
        if (target.name && !player.party.includes(target.name)) {
            player.party.push(target.name);
        }
        logMessage(`*** You invited ${target.name} to your party! ***`, "text-cyan-400 font-bold");
        logMessage(`[Party]: ${target.name} is now your teammate! Their map icon has turned WHITE.`, "text-white font-bold");
        sendChatMessage('say', `[Party Invite] ${player.name} invited ${target.name} to join their party!`);
    }

    renderMap();
    triggerAutoSave();
    broadcastPresence();
    closePlayerInteraction();
}

// ==========================================
// EMOTES
// ==========================================
export function showEmoteList(targetPlayer) {
    const target = targetPlayer || activeInteractingPlayer;
    if (!target) return;

    const optView = document.getElementById('interact-options-view');
    const emoView = document.getElementById('interact-emotes-view');
    const listEl = document.getElementById('emotes-list');

    if (optView) optView.classList.add('hidden-ui');
    if (emoView) emoView.classList.remove('hidden-ui');

    if (listEl) {
        listEl.innerHTML = '';
        EMOTES.forEach(e => {
            const btn = document.createElement('button');
            btn.className = "btn-term py-1 text-xs text-pink-300 border-pink-900 hover:bg-pink-950/40";
            btn.innerText = e.label;
            btn.addEventListener('click', () => {
                performEmote(e.id, target);
            });
            listEl.appendChild(btn);
        });
    }

    // Also display clickable list in terminal log
    logMessage(`[Emote choices for ${target.name}]:`, "text-pink-400 font-bold");
    let logHtml = `<div class="flex flex-wrap gap-2 my-1">`;
    EMOTES.forEach(e => {
        logHtml += `<span class="cursor-pointer text-pink-300 hover:text-white underline decoration-dotted border border-pink-900/60 px-1 py-0.5 text-xs bg-pink-950/20" data-emote-id="${e.id}">[${e.label}]</span>`;
    });
    logHtml += `</div>`;
    logMessage(logHtml);
}

export function performEmote(emoteId, targetPlayer) {
    const target = targetPlayer || activeInteractingPlayer;
    if (!target) return;

    const emote = EMOTES.find(e => e.id === emoteId);
    if (!emote) return;

    const player = gameState.player;
    const msg = emote.text(player.name, target.name);

    logMessage(`[Emote] ${msg}`, "text-pink-400 italic font-bold");
    sendChatMessage('say', msg);

    closePlayerInteraction();
}

// ==========================================
// 3-PANEL TRADE SYSTEM
// ==========================================
export function startTrade(targetPlayer) {
    const target = targetPlayer || activeInteractingPlayer;
    if (!target) return;

    closePlayerInteraction();

    tradeState = {
        partner: target,
        heroOfferedItems: [],
        heroOfferedGold: 0,
        heroAccepted: false,
        partnerOfferedItems: [],
        partnerOfferedGold: 0,
        partnerAccepted: false
    };

    // If simulated adventurer, populate friendly mock offers
    if (!target.uid || target.uid.startsWith('sim_')) {
        const simOffers = [
            { id: 'potion_health', category: 'consumable', type: 'consumable', name: 'Health Potion', count: 2, rarity: 'Basic', stats: {}, price: 15 },
            { id: 'mat_ore_iron', category: 'material', name: 'Iron Ingot', count: 3, rarity: 'Uncommon', stats: {}, price: 20 },
            { id: 'herb_starlight', category: 'material', name: 'Starlight Petal', count: 1, rarity: 'Rare', stats: {}, price: 50 }
        ];
        const randomOffer = simOffers[Math.floor(Math.random() * simOffers.length)];
        tradeState.partnerOfferedItems = [{ ...randomOffer }];
        tradeState.partnerOfferedGold = Math.floor(Math.random() * 25) + 10;
    }

    const modal = document.getElementById('trade-modal');
    if (!modal) return;
    modal.classList.remove('hidden-ui');

    renderTradePanels();
    logMessage(`*** Opened trade session with ${target.name}. ***`, "text-yellow-400");
}

export function cancelTrade() {
    const modal = document.getElementById('trade-modal');
    if (modal) modal.classList.add('hidden-ui');
    tradeState = { partner: null, heroOfferedItems: [], heroOfferedGold: 0, heroAccepted: false, partnerOfferedItems: [], partnerOfferedGold: 0, partnerAccepted: false };
    logMessage("Trade cancelled.", "text-gray-400");
}

export function renderTradePanels() {
    const player = gameState.player;
    const partner = tradeState.partner;
    if (!partner) return;

    // Subtitles & Headers
    const subTitle = document.getElementById('trade-session-subtitle');
    if (subTitle) subTitle.innerText = `Trading with ${partner.name} (Lvl ${partner.level || 1} ${partner.loadout || 'Adventurer'})`;

    const leftTitle = document.getElementById('trade-left-title');
    if (leftTitle) leftTitle.innerText = `${player.name}'s Backpack`;

    const rightTitle = document.getElementById('trade-right-title');
    if (rightTitle) rightTitle.innerText = `${partner.name}'s Backpack`;

    const heroGold = document.getElementById('trade-hero-gold');
    if (heroGold) heroGold.innerText = `Gold: ${player.gold}g`;

    const centerHeroLbl = document.getElementById('trade-center-hero-label');
    if (centerHeroLbl) centerHeroLbl.innerText = `[${player.name}] Offers:`;

    const centerPartLbl = document.getElementById('trade-center-partner-label');
    if (centerPartLbl) centerPartLbl.innerText = `[${partner.name}] Offers:`;

    // 1. LEFT PANEL: Hero Inventory
    const invEl = document.getElementById('trade-hero-inventory');
    if (invEl) {
        invEl.innerHTML = '';
        if (!player.inventory || player.inventory.length === 0) {
            invEl.innerHTML = `<div class="text-gray-500 italic text-xs py-4 text-center">Your backpack is empty.</div>`;
        } else {
            player.inventory.forEach((item, idx) => {
                const row = document.createElement('div');
                row.className = "flex justify-between items-center bg-black/80 border border-green-900/60 p-1.5 text-xs";
                const countBadge = item.count > 1 ? ` <span class="text-yellow-400 font-bold">(x${item.count})</span>` : '';
                row.innerHTML = `
                    <div class="truncate mr-2">
                        <span class="text-green-300 font-bold">${item.name}</span>${countBadge}
                        <div class="text-[10px] text-gray-500">${item.rarity || 'Basic'} • ${item.desc || ''}</div>
                    </div>
                    <button class="btn-term text-[10px] py-0.5 px-2 text-cyan-400 border-cyan-800 hover:bg-cyan-900/40" data-offer-idx="${idx}">[OFFER]</button>
                `;
                row.querySelector('[data-offer-idx]')?.addEventListener('click', () => {
                    offerHeroItem(idx);
                });
                invEl.appendChild(row);
            });
        }
    }

    // 2. MIDDLE PANEL: Staging Area
    const heroOfferedGoldEl = document.getElementById('trade-hero-offered-gold');
    if (heroOfferedGoldEl) heroOfferedGoldEl.innerText = `${tradeState.heroOfferedGold}g`;

    const partnerOfferedGoldEl = document.getElementById('trade-partner-offered-gold');
    if (partnerOfferedGoldEl) partnerOfferedGoldEl.innerText = `${tradeState.partnerOfferedGold}g`;

    // Hero Offered Items
    const heroOfferedList = document.getElementById('trade-hero-offered-items');
    if (heroOfferedList) {
        heroOfferedList.innerHTML = '';
        if (tradeState.heroOfferedItems.length === 0) {
            heroOfferedList.innerHTML = `<div class="text-gray-600 italic text-[11px]">No items offered yet.</div>`;
        } else {
            tradeState.heroOfferedItems.forEach((item, oIdx) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = "flex justify-between items-center bg-green-950/20 border border-green-800/40 px-2 py-1 text-xs rounded";
                const countBadge = item.count > 1 ? ` (x${item.count})` : '';
                itemDiv.innerHTML = `
                    <span class="text-green-300"><span class="text-gray-400">[${player.name}]</span> ${item.name}${countBadge}</span>
                    <button class="text-[10px] text-red-400 hover:text-red-300 font-bold ml-2 underline" data-remove-offer="${oIdx}">[Remove]</button>
                `;
                itemDiv.querySelector('[data-remove-offer]')?.addEventListener('click', () => {
                    removeHeroOfferedItem(oIdx);
                });
                heroOfferedList.appendChild(itemDiv);
            });
        }
    }

    // Partner Offered Items
    const partnerOfferedList = document.getElementById('trade-partner-offered-items');
    if (partnerOfferedList) {
        partnerOfferedList.innerHTML = '';
        if (tradeState.partnerOfferedItems.length === 0) {
            partnerOfferedList.innerHTML = `<div class="text-gray-600 italic text-[11px]">No items offered yet.</div>`;
        } else {
            tradeState.partnerOfferedItems.forEach((item) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = "flex justify-between items-center bg-cyan-950/20 border border-cyan-800/40 px-2 py-1 text-xs rounded";
                const countBadge = item.count > 1 ? ` (x${item.count})` : '';
                itemDiv.innerHTML = `
                    <span class="text-cyan-300"><span class="text-gray-400">[${partner.name}]</span> ${item.name}${countBadge}</span>
                `;
                partnerOfferedList.appendChild(itemDiv);
            });
        }
    }

    // Accept Checkbox & Status
    const chk = document.getElementById('trade-accept-checkbox');
    if (chk) chk.checked = tradeState.heroAccepted;

    const heroStatus = document.getElementById('trade-hero-status');
    if (heroStatus) {
        heroStatus.innerText = tradeState.heroAccepted ? "ACCEPTED" : "WAITING";
        heroStatus.className = tradeState.heroAccepted ? "text-green-400 font-bold" : "text-gray-500 font-bold";
    }

    const partnerStatus = document.getElementById('trade-partner-status');
    if (partnerStatus) {
        partnerStatus.innerText = tradeState.partnerAccepted ? "ACCEPTED" : "WAITING";
        partnerStatus.className = tradeState.partnerAccepted ? "text-green-400 font-bold" : "text-gray-500 font-bold";
    }

    const statusMsg = document.getElementById('trade-status-msg');
    if (statusMsg) {
        if (tradeState.heroAccepted && tradeState.partnerAccepted) {
            statusMsg.innerText = "BOTH PARTIES ACCEPTED! EXECUTING TRADE...";
            statusMsg.className = "text-[11px] text-center min-h-[1.2rem] text-green-400 font-bold blink";
        } else if (tradeState.heroAccepted) {
            statusMsg.innerText = `Waiting for ${partner.name} to accept...`;
            statusMsg.className = "text-[11px] text-center min-h-[1.2rem] text-yellow-300 font-bold";
        } else {
            statusMsg.innerText = "Review items and check Accept Trade to proceed.";
            statusMsg.className = "text-[11px] text-center min-h-[1.2rem] text-gray-500";
        }
    }
}

function offerHeroItem(invIdx) {
    const player = gameState.player;
    if (!player.inventory || !player.inventory[invIdx]) return;

    // Reset accept states on offer modification
    tradeState.heroAccepted = false;
    tradeState.partnerAccepted = false;

    const item = player.inventory[invIdx];
    if (item.count > 1) {
        item.count--;
        tradeState.heroOfferedItems.push({ ...item, count: 1 });
    } else {
        const [removed] = player.inventory.splice(invIdx, 1);
        tradeState.heroOfferedItems.push(removed);
    }

    renderTradePanels();
}

function removeHeroOfferedItem(offerIdx) {
    const player = gameState.player;
    if (!tradeState.heroOfferedItems[offerIdx]) return;

    // Reset accept states on offer modification
    tradeState.heroAccepted = false;
    tradeState.partnerAccepted = false;

    const item = tradeState.heroOfferedItems.splice(offerIdx, 1)[0];
    if (!player.inventory) player.inventory = [];

    const existing = player.inventory.find(i => i.id === item.id);
    if (existing && item.type === 'consumable' || existing && item.type === 'material') {
        existing.count = (existing.count || 1) + (item.count || 1);
    } else {
        player.inventory.push(item);
    }

    renderTradePanels();
}

export function setHeroOfferedGold(amount) {
    const player = gameState.player;
    const amt = Math.max(0, Math.min(player.gold || 0, parseInt(amount) || 0));
    tradeState.heroOfferedGold = amt;
    tradeState.heroAccepted = false;
    tradeState.partnerAccepted = false;
    renderTradePanels();
}

export function handleTradeAcceptToggle(isChecked) {
    tradeState.heroAccepted = isChecked;
    renderTradePanels();

    if (isChecked) {
        // If simulated or guest partner:
        if (!tradeState.partner.uid || tradeState.partner.uid.startsWith('sim_')) {
            setTimeout(() => {
                if (tradeState.heroAccepted) {
                    tradeState.partnerAccepted = true;
                    renderTradePanels();
                    setTimeout(finalizeTrade, 800);
                }
            }, 800);
        } else {
            // For real player: check if both accepted
            if (tradeState.partnerAccepted) {
                setTimeout(finalizeTrade, 800);
            }
        }
    } else {
        tradeState.partnerAccepted = false;
        renderTradePanels();
    }
}

function finalizeTrade() {
    const player = gameState.player;
    const partner = tradeState.partner;
    if (!partner) return;

    // 1. Deduct gold and finalize offered items
    player.gold = Math.max(0, (player.gold || 0) - tradeState.heroOfferedGold + tradeState.partnerOfferedGold);

    // 2. Add partner's offered items to hero's inventory
    tradeState.partnerOfferedItems.forEach(item => {
        if (!player.inventory) player.inventory = [];
        const existing = player.inventory.find(i => i.id === item.id);
        if (existing && (item.type === 'consumable' || item.type === 'material')) {
            existing.count = (existing.count || 1) + (item.count || 1);
        } else {
            player.inventory.push({ ...item });
        }
    });

    logMessage(`*** TRADE COMPLETED with ${partner.name}! ***`, "text-green-400 font-bold");
    if (tradeState.heroOfferedGold > 0) logMessage(`Transferred ${tradeState.heroOfferedGold}g to ${partner.name}.`, "text-yellow-400");
    if (tradeState.partnerOfferedGold > 0) logMessage(`Received ${tradeState.partnerOfferedGold}g from ${partner.name}.`, "text-yellow-400");
    if (tradeState.partnerOfferedItems.length > 0) {
        logMessage(`Received ${tradeState.partnerOfferedItems.length} item(s) from ${partner.name}.`, "success");
    }

    sendChatMessage('say', `[Trade] Completed a trade agreement with ${partner.name}.`);

    cancelTrade();
    triggerAutoSave();
    if (window.updateStatus) window.updateStatus();
    if (window.renderMap) window.renderMap();
}

// ==========================================
// INIT DOM LISTENERS FOR TRADE & SOCIAL
// ==========================================
export function initTradeEventListeners() {
    // Buttons in #player-interact-modal
    document.getElementById('btn-interact-party')?.addEventListener('click', () => {
        inviteToParty(activeInteractingPlayer);
    });

    document.getElementById('btn-interact-trade')?.addEventListener('click', () => {
        startTrade(activeInteractingPlayer);
    });

    document.getElementById('btn-interact-emote')?.addEventListener('click', () => {
        showEmoteList(activeInteractingPlayer);
    });

    document.getElementById('btn-emotes-back')?.addEventListener('click', () => {
        document.getElementById('interact-emotes-view')?.classList.add('hidden-ui');
        document.getElementById('interact-options-view')?.classList.remove('hidden-ui');
    });

    // Accept Checkbox in trade modal
    document.getElementById('trade-accept-checkbox')?.addEventListener('change', (e) => {
        handleTradeAcceptToggle(e.target.checked);
    });

    // Gold offer set button
    document.getElementById('btn-set-gold-offer')?.addEventListener('click', () => {
        const inp = document.getElementById('trade-offer-gold-input');
        if (inp) setHeroOfferedGold(inp.value);
    });

    // Handle clicks inside terminal game log for player actions and emotes
    document.getElementById('game-log')?.addEventListener('click', (e) => {
        const pAction = e.target.closest('[data-player-action]');
        if (pAction && activeInteractingPlayer) {
            const act = pAction.dataset.playerAction;
            if (act === 'party') inviteToParty(activeInteractingPlayer);
            else if (act === 'trade') startTrade(activeInteractingPlayer);
            else if (act === 'emote') showEmoteList(activeInteractingPlayer);
            else if (act === 'cancel') closePlayerInteraction();
            return;
        }

        const emoteTarget = e.target.closest('[data-emote-id]');
        if (emoteTarget && activeInteractingPlayer) {
            performEmote(emoteTarget.dataset.emoteId, activeInteractingPlayer);
        }
    });
}
