// Authentication and Character Selection / Creation UI
import { gameState } from "../core/state.js";
import { signInWithEmail, signUpWithEmail, signInAsGuest, signOutUser } from "../network/auth.js";
import { loadUserCharacters, activateCharacter, deleteCharacter, flushSave, updateCharacterRecord } from "../network/characterSave.js";
import { isOfflineMode, firebaseConfig } from "../config/firebaseConfig.js";
import { CITIES } from "../data/worldData.js";
import { AVATAR_GLYPHS } from "../data/constants.js";
import { generateWorld, enterLocalZone } from "../core/worldGen.js";
import { renderMap } from "./renderer.js";
import { logMessage } from "./log.js";
import { calculateStats } from "../core/inventory.js";
import { broadcastPresence } from "../network/multiplayer.js";

export function showAuthModal() {
    document.getElementById('auth-modal')?.classList.remove('hidden-ui');
    document.getElementById('char-select-modal')?.classList.add('hidden-ui');
    document.getElementById('char-creation')?.classList.add('hidden-ui');
    document.getElementById('main-game')?.classList.add('hidden-ui');
}

export function showCharSelectModal(characters) {
    document.getElementById('auth-modal')?.classList.add('hidden-ui');
    document.getElementById('char-creation')?.classList.add('hidden-ui');
    document.getElementById('main-game')?.classList.add('hidden-ui');
    
    const modal = document.getElementById('char-select-modal');
    if (!modal) return;
    modal.classList.remove('hidden-ui');

    renderCharacterList(characters);
}

export function showCharCreationModal() {
    document.getElementById('auth-modal')?.classList.add('hidden-ui');
    document.getElementById('char-select-modal')?.classList.add('hidden-ui');
    document.getElementById('main-game')?.classList.add('hidden-ui');
    document.getElementById('char-creation')?.classList.remove('hidden-ui');
}

export function showMainGame() {
    document.getElementById('auth-modal')?.classList.add('hidden-ui');
    document.getElementById('char-select-modal')?.classList.add('hidden-ui');
    document.getElementById('char-creation')?.classList.add('hidden-ui');
    document.getElementById('main-game')?.classList.remove('hidden-ui');

    if (gameState.worldMap.length === 0) generateWorld();

    let player = gameState.player;
    if (player) {
        player.symbol = player.symbol || '@';
        // If player has a specific zone saved (e.g. city), re-enter or validate it
        if (player.zone && player.zone !== 'world') {
            let poiKey = player.zone.split('_')[0];
            let poi = gameState.pois[poiKey];
            if (poi) {
                enterLocalZone(poiKey, poi);
            } else {
                player.zone = 'world';
                player.x = player.worldX || 30;
                player.y = player.worldY || 30;
            }
        } else if (player.zone === 'world') {
            // If player is standing at a city coordinate, enter the city
            let curPOI = gameState.pois[`${player.x},${player.y}`];
            if (curPOI && curPOI.type === 'C') {
                enterLocalZone(`${curPOI.rootX},${curPOI.rootY}`, curPOI);
            }
        }
    }

    calculateStats();
    renderMap();
    updateAccountBadge();
    broadcastPresence();
}

export function renderCharacterList(characters = []) {
    const listContainer = document.getElementById('char-slots-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const TOTAL_SLOTS = 5;
    for (let slotIdx = 0; slotIdx < TOTAL_SLOTS; slotIdx++) {
        const char = characters[slotIdx];
        const card = document.createElement('div');

        if (char) {
            const city = CITIES[char.boundCity] || CITIES[0];
            card.className = "char-slot-card panel p-4 flex flex-col justify-between";
            card.innerHTML = `
                <div>
                    <div class="flex justify-between items-start mb-2 border-b border-green-900 pb-2">
                        <div class="flex items-center gap-2">
                            <span id="char-badge-${char.id}" class="w-8 h-8 rounded border border-green-500 bg-black flex items-center justify-center font-bold text-lg text-white shadow-sm">${char.symbol || '@'}</span>
                            <div>
                                <span class="text-base font-bold text-green-400 block">${char.name}</span>
                                <span class="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Slot ${slotIdx + 1}</span>
                            </div>
                        </div>
                        <span class="text-xs uppercase bg-green-900/40 text-green-300 px-2 py-0.5 rounded border border-green-800">Lvl ${char.level || 1} ${char.loadout || 'Adventurer'}</span>
                    </div>
                    <div class="text-xs text-gray-400 space-y-1 mb-3">
                        <div><span class="text-gray-500">Origin City:</span> ${city.name}</div>
                        <div><span class="text-gray-500">Gold:</span> <span class="text-yellow-400">${char.gold || 0}g</span></div>
                        <div><span class="text-gray-500">HP:</span> ${Math.floor(char.hp || 100)}/${char.maxHp || 100} | <span class="text-gray-500">MP:</span> ${Math.floor(char.mp || 50)}/${char.maxMp || 50}</div>
                    </div>
                    <div class="flex items-center gap-2 mb-3 bg-black/60 p-1.5 rounded border border-green-900/40">
                        <label class="text-[10px] text-gray-400 uppercase font-mono whitespace-nowrap">Glyph:</label>
                        <select class="char-glyph-select bg-black border border-green-800 text-green-400 text-xs p-1 outline-none font-mono flex-1" data-char-id="${char.id}">
                            ${AVATAR_GLYPHS.map(g => `<option value="${g.glyph}" ${(char.symbol || '@') === g.glyph ? 'selected' : ''}>${g.label}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="btn-term flex-1 py-1 text-xs text-cyan-400 border-cyan-800 hover:bg-cyan-900/40 font-bold" data-enter="${char.id}">ENTER WORLD</button>
                    <button class="btn-term px-3 py-1 text-xs text-red-500 border-red-900 hover:bg-red-900/40" data-del="${char.id}">DEL</button>
                </div>
            `;

            card.querySelector('.char-glyph-select')?.addEventListener('change', async (e) => {
                const newSym = e.target.value;
                char.symbol = newSym;
                const badge = card.querySelector(`#char-badge-${char.id}`);
                if (badge) badge.innerText = newSym;
                await updateCharacterRecord(char);
                if (gameState.player && gameState.player.id === char.id) {
                    gameState.player.symbol = newSym;
                    if (window.renderMap) window.renderMap();
                    broadcastPresence();
                }
            });

            card.querySelector('[data-enter]')?.addEventListener('click', () => {
                activateCharacter(char);
                showMainGame();
                logMessage(`Welcome back, ${char.name}. (Avatar: "${char.symbol || '@'}")`, "success");
            });

            card.querySelector('[data-del]')?.addEventListener('click', async () => {
                if (confirm(`Are you sure you want to delete ${char.name}?`)) {
                    await deleteCharacter(char.id);
                    const updated = await loadUserCharacters(gameState.currentUser?.uid);
                    renderCharacterList(updated);
                }
            });
        } else {
            // Empty Slot
            card.className = "panel p-6 flex flex-col items-center justify-center border-dashed border-gray-700 hover:border-green-500 cursor-pointer text-gray-400 hover:text-green-400 transition-colors min-h-[160px]";
            card.innerHTML = `
                <span class="text-xs text-gray-600 uppercase font-mono tracking-widest mb-1">Slot ${slotIdx + 1}: Empty</span>
                <span class="text-3xl mb-1 text-green-400">+</span>
                <span class="text-xs font-bold tracking-widest uppercase">Create New Adventurer</span>
            `;
            card.addEventListener('click', () => {
                if (characters.length >= TOTAL_SLOTS) {
                    alert("Account has reached maximum of 5 characters.");
                    return;
                }
                showCharCreationModal();
            });
        }

        listContainer.appendChild(card);
    }
}

export function updateAccountBadge() {
    const user = gameState.currentUser;
    const badgeEl = document.getElementById('ui-account-badge');
    if (!badgeEl) return;

    if (!user) {
        badgeEl.innerHTML = `<span class="text-gray-500">Offline</span>`;
        return;
    }

    const emailDisplay = user.isAnonymous ? 'Guest' : user.email.split('@')[0];
    const modeBadge = isOfflineMode ? '<span class="text-yellow-500 text-[10px]">[Local]</span>' : '<span class="text-green-400 text-[10px]">[Online]</span>';

    badgeEl.innerHTML = `
        <span class="text-gray-400">${emailDisplay}</span> ${modeBadge}
        <button id="btn-switch-char" class="ml-2 text-xs text-cyan-400 hover:underline">[CHARS]</button>
        <button id="btn-logout" class="ml-1 text-xs text-red-400 hover:underline">[LOGOUT]</button>
    `;

    document.getElementById('btn-switch-char')?.addEventListener('click', async () => {
        await flushSave();
        const chars = await loadUserCharacters(user.uid);
        showCharSelectModal(chars);
    });

    document.getElementById('btn-logout')?.addEventListener('click', async () => {
        await flushSave();
        await signOutUser();
        showAuthModal();
    });
}

export function initAuthUIEvents() {
    // Auth Tab switching
    const tabSignIn = document.getElementById('tab-sign-in');
    const tabSignUp = document.getElementById('tab-sign-up');
    const authForm = document.getElementById('auth-form');
    const btnSubmit = document.getElementById('btn-auth-submit');
    const btnGuest = document.getElementById('btn-auth-guest');
    const authError = document.getElementById('auth-error');

    let isSignUp = false;

    tabSignIn?.addEventListener('click', () => {
        isSignUp = false;
        tabSignIn.classList.add('text-green-400', 'border-b-2', 'border-green-400');
        tabSignIn.classList.remove('text-gray-500');
        tabSignUp.classList.add('text-gray-500');
        tabSignUp.classList.remove('text-green-400', 'border-b-2', 'border-green-400');
        btnSubmit.innerText = "SIGN IN";
        if (authError) authError.innerText = "";
    });

    tabSignUp?.addEventListener('click', () => {
        isSignUp = true;
        tabSignUp.classList.add('text-green-400', 'border-b-2', 'border-green-400');
        tabSignUp.classList.remove('text-gray-500');
        tabSignIn.classList.add('text-gray-500');
        tabSignIn.classList.remove('text-green-400', 'border-b-2', 'border-green-400');
        btnSubmit.innerText = "CREATE ACCOUNT";
        if (authError) authError.innerText = "";
    });

    authForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value.trim();
        const pass = document.getElementById('auth-password').value;
        if (!email || !pass) return;

        btnSubmit.disabled = true;
        btnSubmit.innerText = "AUTHENTICATING...";
        if (authError) authError.innerText = "";

        try {
            if (isSignUp) {
                await signUpWithEmail(email, pass);
            } else {
                await signInWithEmail(email, pass);
            }
            const characters = await loadUserCharacters(gameState.currentUser?.uid);
            if (characters.length === 0) {
                showCharCreationModal();
            } else {
                showCharSelectModal(characters);
            }
        } catch (err) {
            if (authError) authError.innerText = err.message;
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerText = isSignUp ? "CREATE ACCOUNT" : "SIGN IN";
        }
    });

    btnGuest?.addEventListener('click', async () => {
        btnGuest.disabled = true;
        try {
            await signInAsGuest();
            const characters = await loadUserCharacters(gameState.currentUser?.uid);
            if (characters.length === 0) {
                showCharCreationModal();
            } else {
                showCharSelectModal(characters);
            }
        } catch (err) {
            if (authError) authError.innerText = err.message;
        } finally {
            btnGuest.disabled = false;
        }
    });

    // Config / Firebase settings button
    document.getElementById('btn-firebase-settings')?.addEventListener('click', () => {
        const modal = document.getElementById('settings-modal');
        if (modal) modal.classList.toggle('hidden-ui');
    });

    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
        const raw = document.getElementById('settings-firebase-config').value.trim();
        try {
            if (raw) {
                JSON.parse(raw);
                localStorage.setItem('cota_firebase_config', raw);
                alert("Firebase configuration saved! The page will now reload.");
                window.location.reload();
            }
        } catch (e) {
            alert("Invalid JSON format for Firebase configuration!");
        }
    });
}
