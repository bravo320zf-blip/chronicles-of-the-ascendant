// Centralized Game State

export const TRANSIENT_STATE = { 
    inCombat: false, 
    currentEnemy: null, 
    combatTarget: null, 
    activeDialogue: null, 
    sellingMode: false,
    targetingMode: false,
    activeSpell: null,
    validTargets: [],
    selectedTargets: [],
    currentTargetIdx: 0,
    aoeCenter: { x: 0, y: 0 }
};

export function createDefaultPlayer() {
    return {
        id: 'char_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        name: "",
        symbol: "@",
        party: [],
        backstory: "",
        loadout: "warrior",
        level: 1,
        xp: 0,
        nextLevelXp: 100,
        skillPoints: 0,
        hp: 100,
        maxHp: 100,
        mp: 50,
        maxMp: 50,
        baseStats: { str: 10, dex: 10, int: 10, con: 10 },
        calcStats: { str: 10, dex: 10, int: 10, con: 10, atk: 0, def: 0 },
        x: 30,
        y: 30,
        worldX: 30,
        worldY: 30,
        localX: 20,
        localY: 35,
        zone: 'world',
        boundCity: 4,
        inventory: [
            { id: 'potion_health', category: 'consumable', type: 'consumable', name: 'Health Potion', desc: 'Restores 30 HP', count: 3, rarity: 'Basic', stats: {}, price: 15 }
        ],
        equipment: { 
            head: null, neck: null, shoulders: null, back: null, chest: null, gloves: null, 
            leftHand: null, rightHand: null, leftFinger: null, rightFinger: null, pants: null, boots: null, light: null 
        },
        stash: [],
        gold: 0,
        stashedGold: 0,
        quests: [],
        time: 480, // 08:00 AM
        torchActive: false,
        activeBuffs: { healingSalve: 0, strengthSalve: 0 },
        professions: {
            'Woodworking': { level: 1, xp: 0, nextXp: 50 },
            'Metalworking': { level: 1, xp: 0, nextXp: 50 },
            'Alchemy': { level: 1, xp: 0, nextXp: 50 },
            'Hunting': { level: 1, xp: 0, nextXp: 50 }
        },
        unlockedActives: [],
        hotkeys: { q: null, e: null },
        skillLevels: {},
        passives: {},
        cooldowns: {},
        cityBans: {},
        actionCount: 0,
        worldSeed: null,
        shield: 0,
        burn: 0,
        momentumStacks: 0,
        spellbladeActive: 0,
        secondWindUsed: false,
        gatherState: { day: 0, used: 0 },
        unlockedFloors: {},
        ...TRANSIENT_STATE
    };
}

export const gameState = {
    player: createDefaultPlayer(),
    worldMap: [],
    pois: {},
    localMaps: {},
    npcs: {},
    onlinePlayers: new Map(), // Real-time other online players: { [uid]: { name, x, y, zone, level, lastSeen } }
    currentUser: null,        // Currently authenticated user object { uid, email, isAnonymous }
    charactersList: [],       // List of saved characters for current account
    activeCharacterId: null,
    isAnimating: false,
    saveTimer: null,
    lastActionTimestamp: Date.now()
};

// Convenience accessor
export function passiveRank(id) {
    return (gameState.player.passives && gameState.player.passives[id]) || 0;
}
