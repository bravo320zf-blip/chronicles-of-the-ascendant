// Items, Recipes, Materials, and Procedural Equipment Generation

export const ASCII_ITEMS = {
    'sword': `   /\\   \n   ||   \n  /==\\  \n   ||   `,
    'dagger': `        \n   /\\   \n  -++-  \n   ||   `,
    'mace': `  (##)  \n   ||   \n   ||   \n   ||   `,
    'axe': `   /|   \n  [#|   \n   \\|   \n    |   `,
    'staff': `   /\\   \n  /  \\  \n  \\  /  \n   ||   `,
    'shield': ` ______ \n|      |\n \\    / \n  \\__/  `,
    'potion': `   __   \n  /==\\ \n |::::| \n \\____/ `,
    'armor': `  /||\\\\ \n |::::| \n |::::| \n  \\__/  `,
    'helm': `  ____  \n / [] \\\\\n|______|`,
    'boots': ` __  __ \n|  ||  |\n|__||__|`,
    'gauntlets': `  _  _  \n | || |\n | || |\n  \\__/  `,
    'cloak': `  ____  \n /    \\\\ \n|      |\n \\____/ `,
    'ring': `   _o_  \n  /   \\\\ \n  \\___/ `,
    'amulet': ` \\\\   / \n  \\\\ /  \n  (O)   `,
    'bow': `   /|   \n  / |   \n <  |   \n  \\ |   \n   \\|   `,
    'wand': `    *   \n    |   \n    |   \n    |   `,
    'book': ` ______ \n|  __  |\n| |__| |\n|______|`,
    'torch': `   ()   \n   ||   \n   ||   \n   ||   `,
    'material': `   ..   \n  ....  \n   ..   `
};

export const RECIPES = [
    // Woodworking
    { id: 'r_wood_handle', name: 'Wooden Handle', type: 'Woodworking', desc: 'A basic handle.', baseId: 'comp_wood_handle', isComponent: true, reqs: [{ cat: 'wood', name: 'Any Wood', count: 1 }] },
    { id: 'r_torch', name: 'Pine Torch', type: 'Woodworking', desc: 'Craft a light source.', baseId: 'torch_pine', isComponent: true, reqs: [{ cat: 'wood', name: 'Any Wood', count: 1 }, { cat: 'hide', name: 'Any Hide', count: 1 }] },
    { id: 'r_staff', name: 'Channeling Staff', type: 'Woodworking', desc: 'A magical wooden staff.', baseId: 'staff', isEquipable: true, reqs: [{ cat: 'wood', name: 'Any Wood', count: 3 }, { cat: 'herb', name: 'Any Herb', count: 1 }] },
    { id: 'r_wand', name: 'Carved Wand', type: 'Woodworking', desc: 'A quick casting wand.', baseId: 'wand', isEquipable: true, reqs: [{ cat: 'wood', name: 'Any Wood', count: 1 }, { cat: 'monster_part', name: 'Monster Part', count: 1 }] },
    { id: 'r_bow', name: 'Hunter Bow', type: 'Woodworking', desc: 'A flexible ranged weapon.', baseId: 'bow', isEquipable: true, reqs: [{ cat: 'wood', name: 'Any Wood', count: 3 }, { cat: 'hide', name: 'Any Hide', count: 1 }] },
    { id: 'r_crossbow', name: 'Heavy Crossbow', type: 'Woodworking', desc: 'A mechanical ranged weapon.', baseId: 'bow', isEquipable: true, reqs: [{ cat: 'wood', name: 'Any Wood', count: 3 }, { cat: 'metal', name: 'Any Metal', count: 2 }] },
    { id: 'r_wood_shield', name: 'Wooden Shield', type: 'Woodworking', desc: 'A light, sturdy shield.', baseId: 'shield', isEquipable: true, reqs: [{ cat: 'wood', name: 'Any Wood', count: 3 }, { cat: 'hide', name: 'Any Hide', count: 1 }] },
    
    // Hunting/Leatherworking
    { id: 'r_wrapped_handle', name: 'Wrapped Handle', type: 'Hunting', desc: 'A comfortable grip.', baseId: 'comp_wrapped_handle', isComponent: true, reqs: [{ cat: 'handle', name: 'Wooden Handle', count: 1 }, { cat: 'hide', name: 'Any Hide', count: 1 }] },
    { id: 'r_armor', name: 'Leather Tunic', type: 'Hunting', desc: 'Stitch protective leather.', baseId: 'armor', isEquipable: true, reqs: [{ cat: 'hide', name: 'Any Hide', count: 4 }, { cat: 'monster_part', name: 'Monster Part', count: 1 }] },
    { id: 'r_cowl', name: 'Thief Cowl', type: 'Hunting', desc: 'A stealthy hood.', baseId: 'helm', isEquipable: true, reqs: [{ cat: 'hide', name: 'Any Hide', count: 2 }] },
    { id: 'r_gloves', name: 'Leather Gloves', type: 'Hunting', desc: 'Flexible protective gloves.', baseId: 'gauntlets', isEquipable: true, reqs: [{ cat: 'hide', name: 'Any Hide', count: 2 }] },
    { id: 'r_boots', name: 'Swift Boots', type: 'Hunting', desc: 'Light boots for quick movement.', baseId: 'boots', isEquipable: true, reqs: [{ cat: 'hide', name: 'Any Hide', count: 2 }] },
    { id: 'r_cloak', name: 'Mystic Cloak', type: 'Hunting', desc: 'A woven magical cloak.', baseId: 'cloak', isEquipable: true, reqs: [{ cat: 'hide', name: 'Any Hide', count: 3 }, { cat: 'herb', name: 'Any Herb', count: 1 }] },
    
    // Metalworking
    { id: 'r_sword', name: 'Custom Broadsword', type: 'Metalworking', desc: 'Forge a blade.', baseId: 'sword', isEquipable: true, reqs: [{ cat: 'metal', name: 'Any Metal', count: 3 }, { cat: 'wrapped_handle', name: 'Wrapped Handle', count: 1 }] },
    { id: 'r_axe', name: 'Battleaxe', type: 'Metalworking', desc: 'A heavy cleaving axe.', baseId: 'axe', isEquipable: true, reqs: [{ cat: 'metal', name: 'Any Metal', count: 4 }, { cat: 'handle', name: 'Wooden Handle', count: 1 }] },
    { id: 'r_mace', name: 'Warhammer', type: 'Metalworking', desc: 'A blunt crushing weapon.', baseId: 'mace', isEquipable: true, reqs: [{ cat: 'metal', name: 'Any Metal', count: 4 }, { cat: 'wrapped_handle', name: 'Wrapped Handle', count: 1 }] },
    { id: 'r_dagger', name: 'Assassin Dagger', type: 'Metalworking', desc: 'A small, lethal blade.', baseId: 'dagger', isEquipable: true, reqs: [{ cat: 'metal', name: 'Any Metal', count: 2 }, { cat: 'hide', name: 'Any Hide', count: 1 }] },
    { id: 'r_plate', name: 'Plate Mail', type: 'Metalworking', desc: 'Heavy plating.', baseId: 'armor', isEquipable: true, reqs: [{ cat: 'metal', name: 'Any Metal', count: 6 }, { cat: 'hide', name: 'Any Hide', count: 1 }] },
    { id: 'r_heavy_shield', name: 'Kite Shield', type: 'Metalworking', desc: 'A thick metal shield.', baseId: 'shield', isEquipable: true, reqs: [{ cat: 'metal', name: 'Any Metal', count: 4 }, { cat: 'wood', name: 'Any Wood', count: 1 }] },
    { id: 'r_greathelm', name: 'Greathelm', type: 'Metalworking', desc: 'A heavy metal helmet.', baseId: 'helm', isEquipable: true, reqs: [{ cat: 'metal', name: 'Any Metal', count: 3 }] },
    { id: 'r_sabatons', name: 'Steel Sabatons', type: 'Metalworking', desc: 'Heavy protective boots.', baseId: 'boots', isEquipable: true, reqs: [{ cat: 'metal', name: 'Any Metal', count: 3 }] },
    { id: 'r_gauntlets', name: 'Steel Gauntlets', type: 'Metalworking', desc: 'Thick metal gloves.', baseId: 'gauntlets', isEquipable: true, reqs: [{ cat: 'metal', name: 'Any Metal', count: 2 }] },
    
    // Alchemy
    { id: 'r_potion_h', name: 'Health Potion', type: 'Alchemy', desc: 'Brew a restoring potion.', baseId: 'potion_health', isComponent: true, reqs: [{ cat: 'herb', name: 'Any Herb', count: 2 }] },
    { id: 'r_potion_m', name: 'Mana Potion', type: 'Alchemy', desc: 'Brew a mana potion.', baseId: 'potion_mana', isComponent: true, reqs: [{ cat: 'herb', name: 'Any Herb', count: 2 }] },
    { id: 'r_salve_h', name: 'Healing Salve', type: 'Alchemy', desc: 'A slow healing salve.', baseId: 'salve_healing', isComponent: true, reqs: [{ cat: 'herb', name: 'Any Herb', count: 3 }] },
    { id: 'r_salve_s', name: 'Strength Salve', type: 'Alchemy', desc: 'A combat-enhancing salve.', baseId: 'salve_strength', isComponent: true, reqs: [{ cat: 'herb', name: 'Any Herb', count: 3 }] },
    { id: 'r_elixir_h', name: 'Elixir of Vitality', type: 'Alchemy', desc: 'A permanent health boost.', baseId: 'elixir_health', isComponent: true, reqs: [{ cat: 'herb_rare', name: 'Rare Herb', count: 5 }] },
    { id: 'r_elixir_p', name: 'Elixir of Power', type: 'Alchemy', desc: 'A permanent strength boost.', baseId: 'elixir_power', isComponent: true, reqs: [{ cat: 'herb_rare', name: 'Rare Herb', count: 5 }] }
];

export const MATERIALS = {
    // Woods (Woodworking)
    'wood_oak': { id: 'wood_oak', category: 'wood', name: 'Oak Wood', type: 'material', rarity: 'Basic', price: 2, stats: { atk: 1 }, desc: '+1 ATK' },
    'wood_ironwood': { id: 'wood_ironwood', category: 'wood', name: 'Ironwood', type: 'material', rarity: 'Uncommon', price: 10, stats: { atk: 2, str: 1 }, desc: '+2 ATK, +1 STR' },
    'wood_ghost': { id: 'wood_ghost', category: 'wood', name: 'Ghostwood', type: 'material', rarity: 'Rare', price: 30, stats: { atk: 3, int: 2 }, desc: '+3 ATK, +2 INT' },
    
    // Ores (Metalworking)
    'ore_copper': { id: 'ore_copper', category: 'metal', name: 'Copper Ore', type: 'material', rarity: 'Basic', price: 2, stats: { atk: 1, def: 1 }, desc: '+1 ATK, +1 DEF' },
    'ore_silver': { id: 'ore_silver', category: 'metal', name: 'Silver Ore', type: 'material', rarity: 'Uncommon', price: 12, stats: { atk: 2, int: 1 }, desc: '+2 ATK, +1 INT' },
    'ore_starmetal': { id: 'ore_starmetal', category: 'metal', name: 'Star-metal', type: 'material', rarity: 'Rare', price: 40, stats: { atk: 4, str: 2 }, desc: '+4 ATK, +2 STR' },
    
    // Herbs (Alchemy)
    'herb_mudleaf': { id: 'herb_mudleaf', category: 'herb', name: 'Mudleaf', type: 'material', rarity: 'Basic', price: 2, stats: {}, desc: 'Alchemy ingredient.' },
    'herb_sunspore': { id: 'herb_sunspore', category: 'herb', name: 'Sunspore', type: 'material', rarity: 'Uncommon', price: 8, stats: {}, desc: 'Alchemy ingredient.' },
    'herb_frostbloom': { id: 'herb_frostbloom', category: 'herb_rare', name: 'Frostbloom', type: 'material', rarity: 'Rare', price: 25, stats: {}, desc: 'Rare alchemy ingredient.' },
    'herb_starlight': { id: 'herb_starlight', category: 'herb_rare', name: 'Starlight Bloom', type: 'material', rarity: 'Rare', price: 35, stats: {}, desc: 'Rare alchemy ingredient.' },

    // Monster Drops (Hunting/Leatherworking)
    'hide_scraps': { id: 'hide_scraps', category: 'hide', name: 'Scraps', type: 'material', rarity: 'Basic', price: 2, stats: { def: 1 }, desc: '+1 DEF' },
    'tooth_goblin': { id: 'tooth_goblin', category: 'monster_part', name: 'Goblin Tooth', type: 'material', rarity: 'Uncommon', price: 10, stats: { dex: 2 }, desc: '+2 DEX' },
    'bone_troll': { id: 'bone_troll', category: 'monster_part', name: 'Troll Bone', type: 'material', rarity: 'Rare', price: 35, stats: { str: 3 }, desc: '+3 STR' },
    'hide_wolf': { id: 'hide_wolf', category: 'hide', name: 'Thick Wolf Hide', type: 'material', rarity: 'Uncommon', price: 15, stats: { def: 3 }, desc: '+3 DEF' },
    'scale_dragon': { id: 'scale_dragon', category: 'monster_part', name: 'Drake Scale', type: 'material', rarity: 'Rare', price: 50, stats: { def: 5, maxHp: 15 }, desc: '+5 DEF, +15 HP' },
    
    // Crafted Components & Consumables
    'comp_wood_handle': { id: 'comp_wood_handle', category: 'handle', name: 'Wooden Handle', type: 'material', rarity: 'Basic', price: 5, stats: {}, desc: 'Crafting component.' },
    'comp_wrapped_handle': { id: 'comp_wrapped_handle', category: 'wrapped_handle', name: 'Wrapped Handle', type: 'material', rarity: 'Uncommon', price: 15, stats: {}, desc: 'Crafting component.' },
    
    'potion_health': { id: 'potion_health', category: 'consumable', name: 'Health Potion', type: 'consumable', rarity: 'Basic', price: 15, stats: {}, desc: 'Restores 30 HP.' },
    'potion_mana': { id: 'potion_mana', category: 'consumable', name: 'Mana Potion', type: 'consumable', rarity: 'Basic', price: 15, stats: {}, desc: 'Restores 30 MP.' },
    'salve_healing': { id: 'salve_healing', category: 'consumable', name: 'Healing Salve', type: 'consumable', rarity: 'Uncommon', price: 35, stats: {}, desc: 'Restores 1 HP per turn for 20 turns.' },
    'salve_strength': { id: 'salve_strength', category: 'consumable', name: 'Strength Salve', type: 'consumable', rarity: 'Uncommon', price: 35, stats: {}, desc: '+3 ATK for 20 turns.' },
    'elixir_health': { id: 'elixir_health', category: 'consumable', name: 'Elixir of Vitality', type: 'consumable', rarity: 'Rare', price: 120, stats: {}, desc: 'Permanently increases Max HP by 10.' },
    'elixir_power': { id: 'elixir_power', category: 'consumable', name: 'Elixir of Power', type: 'consumable', rarity: 'Rare', price: 120, stats: {}, desc: 'Permanently increases Base STR by 1.' },
    
    'torch_pine': { id: 'torch', category: 'consumable', name: 'Pine Torch', type: 'consumable', rarity: 'Basic', price: 15, stats: {}, desc: 'Provides light. Decays over time.', life: 100, maxLife: 100 }
};

export const ITEM_BASES = [
    { name: 'Broadsword', id: 'sword', type: 'weapon', baseStats: { atk: 2 }, statPool: ['str', 'atk'] },
    { name: 'Battleaxe', id: 'axe', type: 'weapon', baseStats: { atk: 3 }, statPool: ['str', 'atk'] },
    { name: 'Warhammer', id: 'mace', type: 'weapon', baseStats: { atk: 3 }, statPool: ['str', 'atk'] },
    { name: 'Dagger', id: 'dagger', type: 'weapon', baseStats: { atk: 1 }, statPool: ['dex', 'atk'] },
    { name: 'Shortbow', id: 'bow', type: 'weapon', baseStats: { atk: 2 }, statPool: ['dex', 'atk'] },
    { name: 'Rapier', id: 'sword', type: 'weapon', baseStats: { atk: 2 }, statPool: ['dex', 'atk'] },
    { name: 'Staff', id: 'staff', type: 'weapon', baseStats: { atk: 1 }, statPool: ['int', 'atk'] },
    { name: 'Wand', id: 'wand', type: 'weapon', baseStats: { atk: 1 }, statPool: ['int', 'atk'] },
    { name: 'Grimoire', id: 'book', type: 'shield', baseStats: { def: 1 }, statPool: ['int', 'maxMp'] },
    { name: 'Kite Shield', id: 'shield', type: 'shield', baseStats: { def: 3 }, statPool: ['str', 'def', 'con'] },
    { name: 'Plate Mail', id: 'armor', type: 'armor', baseStats: { def: 4 }, statPool: ['str', 'def', 'con'] },
    { name: 'Greathelm', id: 'helm', type: 'armor', baseStats: { def: 2 }, statPool: ['str', 'def', 'con'] },
    { name: 'Steel Sabatons', id: 'boots', type: 'armor', baseStats: { def: 2 }, statPool: ['str', 'def', 'con'] },
    { name: 'Gauntlets', id: 'gauntlets', type: 'armor', baseStats: { def: 2 }, statPool: ['str', 'def', 'con'] },
    { name: 'Leather Tunic', id: 'armor', type: 'armor', baseStats: { def: 2 }, statPool: ['dex', 'def'] },
    { name: 'Thief Cowl', id: 'helm', type: 'armor', baseStats: { def: 1 }, statPool: ['dex', 'def'] },
    { name: 'Swift Boots', id: 'boots', type: 'armor', baseStats: { def: 1 }, statPool: ['dex', 'def'] },
    { name: 'Mystic Robes', id: 'cloak', type: 'armor', baseStats: { def: 1 }, statPool: ['int', 'def', 'maxMp'] },
    { name: 'Apprentice Hood', id: 'helm', type: 'armor', baseStats: { def: 1 }, statPool: ['int', 'def'] },
    { name: 'Silk Gloves', id: 'gauntlets', type: 'armor', baseStats: { def: 1 }, statPool: ['int', 'def'] },
    { name: 'Ring', id: 'ring', type: 'jewelry', baseStats: {}, statPool: ['str', 'dex', 'int', 'con', 'maxHp', 'maxMp'] },
    { name: 'Amulet', id: 'amulet', type: 'jewelry', baseStats: {}, statPool: ['str', 'dex', 'int', 'con', 'maxHp', 'maxMp'] }
];

export const ITEM_PREFIXES = [
    { name: 'Savage', stat: 'str', val: 2 }, { name: 'Brutal', stat: 'atk', val: 3 }, 
    { name: 'Cunning', stat: 'dex', val: 2 }, { name: 'Swift', stat: 'dex', val: 3 },
    { name: 'Brilliant', stat: 'int', val: 2 }, { name: 'Eldritch', stat: 'int', val: 3 },
    { name: 'Stalwart', stat: 'def', val: 2 }, { name: 'Iron', stat: 'con', val: 2 }
];

export const ITEM_SUFFIXES = [
    { name: 'of the Bear', stat: 'str', val: 3 }, { name: 'of the Tiger', stat: 'atk', val: 2 },
    { name: 'of the Viper', stat: 'dex', val: 3 }, { name: 'of the Owl', stat: 'int', val: 3 },
    { name: 'of the Colossus', stat: 'con', val: 3 }, { name: 'of Warding', stat: 'def', val: 2 },
    { name: 'of Vitality', stat: 'maxHp', val: 10 }, { name: 'of Focus', stat: 'maxMp', val: 10 }
];

export function generateRandomItem(rarity, forceBaseId = null) {
    let possibleBases = forceBaseId ? ITEM_BASES.filter(b => b.id === forceBaseId) : ITEM_BASES;
    if (possibleBases.length === 0) possibleBases = ITEM_BASES; 
    
    let base = possibleBases[Math.floor(Math.random() * possibleBases.length)];
    let itemName = base.name;
    let stats = { ...base.baseStats };
    
    let affixCount = rarity === 'Legendary' ? 3 : (rarity === 'Rare' ? 2 : (rarity === 'Magic' ? 1 : 0));
    let multiplier = rarity === 'Legendary' ? 3 : (rarity === 'Rare' ? 2 : 1);

    for (let k in stats) stats[k] += Math.floor(multiplier * 1.5);

    if (affixCount > 0) {
        let pre = ITEM_PREFIXES[Math.floor(Math.random() * ITEM_PREFIXES.length)];
        stats[pre.stat] = (stats[pre.stat] || 0) + (pre.val * multiplier);
        itemName = `${pre.name} ${itemName}`;
        affixCount--;
    }
    
    if (affixCount > 0) {
        let suf = ITEM_SUFFIXES[Math.floor(Math.random() * ITEM_SUFFIXES.length)];
        stats[suf.stat] = (stats[suf.stat] || 0) + (suf.val * multiplier);
        itemName = `${itemName} ${suf.name}`;
        affixCount--;
    }

    if (affixCount > 0 && rarity === 'Legendary') {
        let pool = base.statPool;
        let extra = pool[Math.floor(Math.random() * pool.length)];
        stats[extra] = (stats[extra] || 0) + (5);
        
        const UNIQ = ['Aethelgard\'s', 'Doombringer', 'Starfall', 'Voidwalker', 'Soulthief'];
        itemName = `${UNIQ[Math.floor(Math.random()*UNIQ.length)]} ${base.name}`;
    }

    let descParts = [];
    if (stats.atk) descParts.push(`+${stats.atk} ATK`);
    if (stats.def) descParts.push(`+${stats.def} DEF`);
    if (stats.str) descParts.push(`+${stats.str} STR`);
    if (stats.dex) descParts.push(`+${stats.dex} DEX`);
    if (stats.int) descParts.push(`+${stats.int} INT`);
    if (stats.con) descParts.push(`+${stats.con} CON`);
    if (stats.maxHp) descParts.push(`+${stats.maxHp} HP`);
    if (stats.maxMp) descParts.push(`+${stats.maxMp} MP`);
    
    let desc = descParts.join(', ');
    if (!desc) desc = "A mundane item.";
    
    let basePrice = rarity === 'Legendary' ? 500 : (rarity === 'Rare' ? 150 : (rarity === 'Magic' ? 50 : 15));
    let statBonus = (stats.atk || 0)*5 + (stats.def || 0)*4 + (stats.str || 0)*3 + (stats.dex || 0)*3 + (stats.int || 0)*3 + (stats.con || 0)*2 + (stats.maxHp || 0)*0.5 + (stats.maxMp || 0)*0.5;
    let finalPrice = Math.floor(basePrice + statBonus);

    return { id: base.id, name: itemName, rarity: rarity, stats: stats, desc: desc, count: 1, price: finalPrice };
}
