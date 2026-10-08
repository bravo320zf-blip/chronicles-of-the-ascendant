// 8 Distinct Hero Classes, Archetypes, Playstyles, and Starter Loadouts

export const CLASSES = {
    'paladin': {
        id: 'paladin',
        name: 'Paladin',
        tagline: 'Holy Crusader of Light & Divine Retribution',
        desc: 'Heavily armored holy warriors sworn to uphold righteousness. They command blinding celestial light to heal allies, banish darkness, and smite foes with unwavering conviction.',
        suggestedSymbol: '★',
        baseStats: { str: 12, dex: 10, int: 12, con: 12 },
        playstyles: [
            {
                id: 'holy_avenger',
                name: 'Holy Avenger',
                role: 'Burst Melee & Radiant Smiter',
                desc: 'Channels divine wrath directly through the blade, converting faith into catastrophic holy and true damage that cuts through demonic and undead armor.',
                favoredSkills: ['smite', 'cleansing_flame'],
                favoredPassives: ['overload', 'spiked_armor']
            },
            {
                id: 'guardian_bulwark',
                name: 'Guardian Bulwark',
                role: 'Impenetrable Fortress & Tank',
                desc: 'Specializes in massive shield mitigation, reflecting incoming blows and stunning aggressive beasts with heavy shield bashes.',
                favoredSkills: ['shield_bash', 'sunder'],
                favoredPassives: ['unyielding', 'juggernaut', 'adaptive_plating']
            },
            {
                id: 'radiant_cleric',
                name: 'Radiant Cleric',
                role: 'Divine Sustain & Light Healer',
                desc: 'A beacon of hope that turns every wound into restorative energy, keeping their vitality at peak levels even through grueling dungeon treks.',
                favoredSkills: ['holy_light', 'major_heal', 'minor_heal'],
                favoredPassives: ['vital_surge', 'death_defiance', 'survivalist']
            }
        ],
        starterEquipment: {
            rightHand: { id: 'sword', name: 'Blessed Broadsword', rarity: 'Basic', stats: { atk: 3, int: 1 }, count: 1, desc: '+3 ATK, +1 INT (Sanctified steel)', price: 30 },
            leftHand: { id: 'shield', name: 'Radiant Kite Shield', rarity: 'Basic', stats: { def: 3, int: 1 }, count: 1, desc: '+3 DEF, +1 INT (Emblazoned holy crest)', price: 30 },
            chest: { id: 'armor', name: 'Templar Plate Mail', rarity: 'Basic', stats: { def: 4 }, count: 1, desc: '+4 DEF (Forged heavy plating)', price: 35 },
            leftFinger: { id: 'ring', name: 'Seal of the Dawn', rarity: 'Basic', stats: { maxMp: 15, int: 1 }, count: 1, desc: '+15 Max MP, +1 INT (Warm golden signet)', price: 25 },
            light: { id: 'torch', category: 'consumable', type: 'consumable', name: 'Pine Torch', life: 100, maxLife: 100, rarity: 'Basic', stats: {}, desc: 'Provides light. Decays over time.', price: 15 }
        },
        starterInventory: [
            { id: 'potion_health', category: 'consumable', type: 'consumable', name: 'Health Potion', desc: 'Restores 30 HP', count: 3, rarity: 'Basic', stats: {}, price: 15 }
        ],
        starterActives: ['smite', 'shield_bash'],
        starterHotkeys: { q: 'smite', e: 'shield_bash' },
        starterPassives: { spiked_armor: 1, vital_surge: 1 },
        classSkills: ['smite', 'shield_bash', 'holy_light', 'major_heal', 'minor_heal', 'cleansing_flame', 'sunder'],
        classPassives: ['spiked_armor', 'vital_surge', 'unyielding', 'death_defiance', 'juggernaut', 'adaptive_plating']
    },

    'berserker': {
        id: 'berserker',
        name: 'Berserker',
        tagline: 'Primal Bloodreaver of Mount Caldera',
        desc: 'Ferocious combatants who channel primal fury. As their life dwindles, their blood sings with savage fury, unleashing devastating cleaves that butcher whole hordes.',
        suggestedSymbol: '⚔',
        baseStats: { str: 14, dex: 10, int: 8, con: 14 },
        playstyles: [
            {
                id: 'blood_frenzy',
                name: 'Blood Frenzy',
                role: 'Low-HP High-Risk Juggernaut',
                desc: 'Intentionally fights near death where Berserker Rage multiplies outgoing damage into terrifying territory.',
                favoredSkills: ['berserk', 'bloodthirst'],
                favoredPassives: ['berserker_rage', 'blood_magic']
            },
            {
                id: 'whirlwind_cleaver',
                name: 'Whirlwind Cleaver',
                role: 'Sweeping AOE Room Cleanser',
                desc: 'Spins their massive greataxe in relentless arcs, crushing all adjacent foes simultaneously while drawing strength from the carnage.',
                favoredSkills: ['whirlwind', 'earthquake'],
                favoredPassives: ['momentum', 'chain_reaction']
            },
            {
                id: 'brutal_executioner',
                name: 'Brutal Executioner',
                role: 'Single-Target Decapitator',
                desc: 'Focuses down the strongest champions and bosses, instantly finishing off weakened targets with overwhelming martial momentum.',
                favoredSkills: ['execute', 'power_strike'],
                favoredPassives: ['executioner', 'lone_wolf', 'overload']
            }
        ],
        starterEquipment: {
            rightHand: { id: 'axe', name: 'Primal Greataxe', rarity: 'Basic', stats: { atk: 5, str: 2 }, count: 1, desc: '+5 ATK, +2 STR (Brutal double-bitted head)', price: 35 },
            leftHand: null,
            chest: { id: 'armor', name: 'Bear-Pelt Harness', rarity: 'Basic', stats: { def: 2, str: 1 }, count: 1, desc: '+2 DEF, +1 STR (Cured beast hide)', price: 25 },
            leftFinger: { id: 'ring', name: 'Bloodstone Band', rarity: 'Basic', stats: { maxHp: 20, str: 1 }, count: 1, desc: '+20 Max HP, +1 STR (Pulsing red mineral)', price: 25 },
            light: { id: 'torch', category: 'consumable', type: 'consumable', name: 'Pine Torch', life: 100, maxLife: 100, rarity: 'Basic', stats: {}, desc: 'Provides light. Decays over time.', price: 15 }
        },
        starterInventory: [
            { id: 'potion_health', category: 'consumable', type: 'consumable', name: 'Health Potion', desc: 'Restores 30 HP', count: 3, rarity: 'Basic', stats: {}, price: 15 }
        ],
        starterActives: ['power_strike', 'berserk'],
        starterHotkeys: { q: 'power_strike', e: 'berserk' },
        starterPassives: { berserker_rage: 1, blood_magic: 1 },
        classSkills: ['power_strike', 'berserk', 'whirlwind', 'bloodthirst', 'execute', 'earthquake'],
        classPassives: ['berserker_rage', 'blood_magic', 'momentum', 'executioner', 'overload', 'scavenger_king']
    },

    'pyromancer': {
        id: 'pyromancer',
        name: 'Pyromancer',
        tagline: 'Flame Weaver of the Scorched Lands',
        desc: 'Masters of wild igneous sorcery who bend flames to their will. They rain meteors from the sky, ignite fiery conflagrations, and sacrifice life essence for raw magical firepower.',
        suggestedSymbol: '☼',
        baseStats: { str: 8, dex: 10, int: 15, con: 10 },
        playstyles: [
            {
                id: 'inferno_artillery',
                name: 'Inferno Artillery',
                role: 'Long-Range Burst & Cataclysm',
                desc: 'Hurls high-damage fireballs and massive meteor impacts from afar, incinerating packs before they can close the distance.',
                favoredSkills: ['fireball', 'meteor'],
                favoredPassives: ['glass_cannon', 'spell_echo']
            },
            {
                id: 'chain_conflagration',
                name: 'Chain Conflagration',
                role: 'Explosive Chain Reaction Mage',
                desc: 'Ignites enemies with burning embers that detonate on death, causing chain reactions that sweep across battlefield corridors.',
                favoredSkills: ['ignite', 'meteor'],
                favoredPassives: ['chain_reaction', 'overload']
            },
            {
                id: 'cauterizing_alchemist',
                name: 'Cauterizing Alchemist',
                role: 'Life & Mana Transmutation',
                desc: 'Converts health into mana and back again using sacred purifying fire, maintaining an endless supply of arcane energy.',
                favoredSkills: ['cleansing_flame', 'life_tap', 'focus'],
                favoredPassives: ['masochist', 'alchemist_master']
            }
        ],
        starterEquipment: {
            rightHand: { id: 'staff', name: 'Cinderwood Flame Staff', rarity: 'Basic', stats: { atk: 2, int: 4 }, count: 1, desc: '+2 ATK, +4 INT (Warm ash core)', price: 35 },
            leftHand: { id: 'amulet', name: 'Smoldering Focus', rarity: 'Basic', stats: { int: 2, maxMp: 10 }, count: 1, desc: '+2 INT, +10 Max MP (Sparks dance within)', price: 25 },
            chest: { id: 'cloak', name: 'Flame-Weave Vestments', rarity: 'Basic', stats: { def: 1, int: 2 }, count: 1, desc: '+1 DEF, +2 INT (Fire-resistant spun silk)', price: 30 },
            rightFinger: { id: 'ring', name: 'Ring of Embers', rarity: 'Basic', stats: { maxMp: 15, int: 1 }, count: 1, desc: '+15 Max MP, +1 INT', price: 25 },
            light: { id: 'torch', category: 'consumable', type: 'consumable', name: 'Pine Torch', life: 100, maxLife: 100, rarity: 'Basic', stats: {}, desc: 'Provides light. Decays over time.', price: 15 }
        },
        starterInventory: [
            { id: 'potion_health', category: 'consumable', type: 'consumable', name: 'Health Potion', desc: 'Restores 30 HP', count: 2, rarity: 'Basic', stats: {}, price: 15 },
            { id: 'potion_mana', category: 'consumable', type: 'consumable', name: 'Mana Potion', desc: 'Restores 30 MP', count: 2, rarity: 'Basic', stats: {}, price: 15 }
        ],
        starterActives: ['fireball', 'cleansing_flame'],
        starterHotkeys: { q: 'fireball', e: 'cleansing_flame' },
        starterPassives: { glass_cannon: 1, chain_reaction: 1 },
        classSkills: ['fireball', 'meteor', 'cleansing_flame', 'life_tap', 'focus', 'ignite'],
        classPassives: ['glass_cannon', 'chain_reaction', 'overload', 'spell_echo', 'masochist', 'alchemist_master']
    },

    'shadowblade': {
        id: 'shadowblade',
        name: 'Shadowblade',
        tagline: 'Lethal Infiltrator & Venomous Assassin',
        desc: 'Deadly stealth specialists who strike from the shadows. With dual-wielded daggers, blinding smoke bombs, and virulent toxins, they eliminate key targets before disappearing without a trace.',
        suggestedSymbol: '§',
        baseStats: { str: 10, dex: 15, int: 9, con: 11 },
        playstyles: [
            {
                id: 'lethal_infiltrator',
                name: 'Lethal Infiltrator',
                role: 'Precision Backstab & Execution',
                desc: 'Flanks unsuspecting targets for critical backstabs that pierce straight through enemy defenses.',
                favoredSkills: ['backstab', 'execute'],
                favoredPassives: ['executioner', 'momentum']
            },
            {
                id: 'phantom_stalker',
                name: 'Phantom Stalker',
                role: 'Evasive Teleporter & Vanisher',
                desc: 'Utilizes smoke bombs and shadow stepping to reposition across the battlefield and evade dangerous boss mechanics entirely.',
                favoredSkills: ['shadow_step', 'smoke_bomb'],
                favoredPassives: ['ethereal_form', 'phase_shift']
            },
            {
                id: 'venom_specialist',
                name: 'Venom Specialist',
                role: 'Toxic Poison & Bleed Attrition',
                desc: 'Coats weapons in deadly neurotoxins and virulent venoms that degrade monster health pools continuously.',
                favoredSkills: ['poison_dart', 'adrenaline'],
                favoredPassives: ['festering_wounds', 'scavenger_king']
            }
        ],
        starterEquipment: {
            rightHand: { id: 'dagger', name: 'Serrated Kris', rarity: 'Basic', stats: { atk: 3, dex: 2 }, count: 1, desc: '+3 ATK, +2 DEX (Wicked curved blade)', price: 30 },
            leftHand: { id: 'dagger', name: 'Parrying Stiletto', rarity: 'Basic', stats: { atk: 1, def: 1, dex: 1 }, count: 1, desc: '+1 ATK, +1 DEF, +1 DEX (Dual-wield offhand)', price: 25 },
            chest: { id: 'armor', name: 'Midnight Leather Brigandine', rarity: 'Basic', stats: { def: 2, dex: 2 }, count: 1, desc: '+2 DEF, +2 DEX (Muffled dark leather)', price: 30 },
            back: { id: 'cloak', name: 'Shadow Cloak', rarity: 'Basic', stats: { def: 1, dex: 1 }, count: 1, desc: '+1 DEF, +1 DEX (Blends into darkness)', price: 25 },
            light: { id: 'torch', category: 'consumable', type: 'consumable', name: 'Pine Torch', life: 100, maxLife: 100, rarity: 'Basic', stats: {}, desc: 'Provides light. Decays over time.', price: 15 }
        },
        starterInventory: [
            { id: 'potion_health', category: 'consumable', type: 'consumable', name: 'Health Potion', desc: 'Restores 30 HP', count: 3, rarity: 'Basic', stats: {}, price: 15 }
        ],
        starterActives: ['backstab', 'shadow_step'],
        starterHotkeys: { q: 'backstab', e: 'shadow_step' },
        starterPassives: { festering_wounds: 1, ethereal_form: 1 },
        classSkills: ['backstab', 'shadow_step', 'smoke_bomb', 'poison_dart', 'adrenaline', 'execute'],
        classPassives: ['festering_wounds', 'executioner', 'ethereal_form', 'phase_shift', 'momentum', 'treasure_hunter']
    },

    'frost_knight': {
        id: 'frost_knight',
        name: 'Frost Knight',
        tagline: 'Glacial Warden of Borealis',
        desc: 'Stoic northern warriors who wield rime ice as both weapon and fortress. They freeze enemy advance, absorb heavy blows with glacial barriers, and shatter brittle foes with crushing blades.',
        suggestedSymbol: '∆',
        baseStats: { str: 12, dex: 10, int: 12, con: 13 },
        playstyles: [
            {
                id: 'permafrost_controller',
                name: 'Permafrost Controller',
                role: 'Crowd Controller & Turn Denier',
                desc: 'Freezes enemies solid with howling frostbolts and blizzard storms, completely halting their combat actions.',
                favoredSkills: ['frostbolt', 'blizzard'],
                favoredPassives: ['spell_echo', 'masochist']
            },
            {
                id: 'glacial_bulwark',
                name: 'Glacial Bulwark',
                role: 'Adaptive Damage Absorber',
                desc: 'Encases the adventurer in dense rime plate that converts mana into shields and reduces incoming damage from repeated hits.',
                favoredSkills: ['ice_barrier', 'shield_bash'],
                favoredPassives: ['mana_shield', 'adaptive_plating', 'unyielding']
            },
            {
                id: 'shatterblade',
                name: 'Shatterblade',
                role: 'Spellblade Melee Hybrid',
                desc: 'Freezes enemy armor before crushing it with sunder strikes, extracting massive spellblade bonus damage.',
                favoredSkills: ['sunder', 'frostbolt'],
                favoredPassives: ['spellblade', 'overload']
            }
        ],
        starterEquipment: {
            rightHand: { id: 'sword', name: 'Rime-Forged Claymore', rarity: 'Basic', stats: { atk: 4, int: 1, str: 1 }, count: 1, desc: '+4 ATK, +1 INT, +1 STR (Cold to the touch)', price: 35 },
            leftHand: { id: 'shield', name: 'Glacial Ward Buckler', rarity: 'Basic', stats: { def: 2, int: 1 }, count: 1, desc: '+2 DEF, +1 INT (Inscribed with frost runes)', price: 25 },
            chest: { id: 'armor', name: 'Frost-Chiseled Hauberk', rarity: 'Basic', stats: { def: 3, int: 1 }, count: 1, desc: '+3 DEF, +1 INT (Hardened Borealis rings)', price: 30 },
            leftFinger: { id: 'ring', name: 'Permafrost Band', rarity: 'Basic', stats: { maxMp: 15, def: 1 }, count: 1, desc: '+15 Max MP, +1 DEF (Subtle chill)', price: 25 },
            light: { id: 'torch', category: 'consumable', type: 'consumable', name: 'Pine Torch', life: 100, maxLife: 100, rarity: 'Basic', stats: {}, desc: 'Provides light. Decays over time.', price: 15 }
        },
        starterInventory: [
            { id: 'potion_health', category: 'consumable', type: 'consumable', name: 'Health Potion', desc: 'Restores 30 HP', count: 3, rarity: 'Basic', stats: {}, price: 15 }
        ],
        starterActives: ['frostbolt', 'sunder'],
        starterHotkeys: { q: 'frostbolt', e: 'sunder' },
        starterPassives: { mana_shield: 1, spellblade: 1 },
        classSkills: ['frostbolt', 'blizzard', 'sunder', 'shield_bash', 'ice_barrier', 'focus'],
        classPassives: ['mana_shield', 'spellblade', 'adaptive_plating', 'unyielding', 'masochist', 'spell_echo']
    },

    'ranger': {
        id: 'ranger',
        name: 'Ranger',
        tagline: 'Wilderness Marksman & Deadeye Scout',
        desc: 'Unmatched sharpshooters and wildland trackers. Armed with recurve bows, broadhead arrows, and wilderness survival expertise, they spot prey leagues away and strike with pinpoint lethality.',
        suggestedSymbol: 'Ψ',
        baseStats: { str: 10, dex: 14, int: 10, con: 12 },
        playstyles: [
            {
                id: 'deadeye_sniper',
                name: 'Deadeye Sniper',
                role: 'Extreme-Range Single-Target Nuker',
                desc: 'Takes careful aim from far outside monster retaliation range, delivering deadly precision hits with high DEX scaling.',
                favoredSkills: ['aimed_shot', 'execute'],
                favoredPassives: ['lone_wolf', 'momentum']
            },
            {
                id: 'trapper_scout',
                name: 'Trapper Scout',
                role: 'Tactical Traps & Battlefield Recon',
                desc: 'Employs poison darts and smoke screens to control skirmishes while enjoying an expanded overworld field of view.',
                favoredSkills: ['poison_dart', 'smoke_bomb'],
                favoredPassives: ['omniscience', 'phase_shift']
            },
            {
                id: 'apex_survivalist',
                name: 'Apex Survivalist',
                role: 'Sustained Explorer & Fortune Seeker',
                desc: 'Master of foraging and self-reliance, recovering rapidly during camp rests and discovering higher grade loot.',
                favoredSkills: ['adrenaline', 'focus'],
                favoredPassives: ['survivalist', 'treasure_hunter', 'scavenger_king']
            }
        ],
        starterEquipment: {
            rightHand: { id: 'bow', name: 'Recurve Composite Bow', rarity: 'Basic', stats: { atk: 4, dex: 2 }, count: 1, desc: '+4 ATK, +2 DEX (Laminated yew and horn)', price: 35 },
            leftHand: { id: 'shield', name: 'Quiver of Broadheads', rarity: 'Basic', stats: { atk: 1, dex: 1 }, count: 1, desc: '+1 ATK, +1 DEX (Feathered arrows)', price: 20 },
            chest: { id: 'armor', name: "Scout's Camouflage Brigandine", rarity: 'Basic', stats: { def: 2, dex: 2 }, count: 1, desc: '+2 DEF, +2 DEX (Dappled woodland pattern)', price: 30 },
            head: { id: 'helm', name: "Hunter's Feathered Cap", rarity: 'Basic', stats: { def: 1, dex: 1 }, count: 1, desc: '+1 DEF, +1 DEX', price: 20 },
            light: { id: 'torch', category: 'consumable', type: 'consumable', name: 'Pine Torch', life: 100, maxLife: 100, rarity: 'Basic', stats: {}, desc: 'Provides light. Decays over time.', price: 15 }
        },
        starterInventory: [
            { id: 'potion_health', category: 'consumable', type: 'consumable', name: 'Health Potion', desc: 'Restores 30 HP', count: 3, rarity: 'Basic', stats: {}, price: 15 }
        ],
        starterActives: ['aimed_shot', 'poison_dart'],
        starterHotkeys: { q: 'aimed_shot', e: 'poison_dart' },
        starterPassives: { omniscience: 1, survivalist: 1 },
        classSkills: ['aimed_shot', 'poison_dart', 'smoke_bomb', 'adrenaline', 'execute', 'focus'],
        classPassives: ['omniscience', 'survivalist', 'momentum', 'treasure_hunter', 'ethereal_form', 'lone_wolf']
    },

    'necromancer': {
        id: 'necromancer',
        name: 'Necromancer',
        tagline: 'Dark Occultist & Blood Weaver',
        desc: 'Practitioners of forbidden necrotic rites who tap into the threshold between life and death. They siphon vitality from foes, devour lingering souls, and turn corpses into devastating explosives.',
        suggestedSymbol: 'Ѫ',
        baseStats: { str: 8, dex: 9, int: 15, con: 12 },
        playstyles: [
            {
                id: 'siphon_vampire',
                name: 'Siphon Vampire',
                role: 'Life Drain & Attrition Sustain',
                desc: 'Continuously siphons vital fluids from opponents, maintaining top health while steadily wearing down monster hit points.',
                favoredSkills: ['vampiric_touch', 'mana_drain'],
                favoredPassives: ['soul_eater', 'vital_surge']
            },
            {
                id: 'corpse_harvester',
                name: 'Corpse Harvester',
                role: 'Detonation & Cheat-Death Shielding',
                desc: 'Ignites necrotic miasma for heavy area explosions upon defeating enemies, while warding themselves with death-defying soul shields.',
                favoredSkills: ['corpse_explosion', 'arcane_missiles'],
                favoredPassives: ['chain_reaction', 'death_defiance']
            },
            {
                id: 'blood_occultist',
                name: 'Blood Occultist',
                role: 'Health-For-Power Conversion',
                desc: 'Sacrifices their own blood pool to cast high-magnitude spells without depending on conventional mana reservoirs.',
                favoredSkills: ['life_tap', 'focus'],
                favoredPassives: ['blood_magic', 'masochist']
            }
        ],
        starterEquipment: {
            rightHand: { id: 'wand', name: 'Ossuary Bone Wand', rarity: 'Basic', stats: { atk: 2, int: 3 }, count: 1, desc: '+2 ATK, +3 INT (Carved from ancient remains)', price: 30 },
            leftHand: { id: 'book', name: 'Grimoire of the Crypt', rarity: 'Basic', stats: { def: 1, int: 2 }, count: 1, desc: '+1 DEF, +2 INT (Bound in dark vellum)', price: 25 },
            chest: { id: 'cloak', name: 'Robes of the Accursed', rarity: 'Basic', stats: { def: 1, int: 2 }, count: 1, desc: '+1 DEF, +2 INT (Smells of graveyard moss)', price: 30 },
            leftFinger: { id: 'ring', name: 'Skull Signet Ring', rarity: 'Basic', stats: { maxHp: 10, maxMp: 10 }, count: 1, desc: '+10 Max HP, +10 Max MP (Carved onyx skull)', price: 25 },
            light: { id: 'torch', category: 'consumable', type: 'consumable', name: 'Pine Torch', life: 100, maxLife: 100, rarity: 'Basic', stats: {}, desc: 'Provides light. Decays over time.', price: 15 }
        },
        starterInventory: [
            { id: 'potion_health', category: 'consumable', type: 'consumable', name: 'Health Potion', desc: 'Restores 30 HP', count: 3, rarity: 'Basic', stats: {}, price: 15 }
        ],
        starterActives: ['vampiric_touch', 'life_tap'],
        starterHotkeys: { q: 'vampiric_touch', e: 'life_tap' },
        starterPassives: { soul_eater: 1, death_defiance: 1 },
        classSkills: ['vampiric_touch', 'life_tap', 'mana_drain', 'corpse_explosion', 'arcane_missiles', 'focus'],
        classPassives: ['soul_eater', 'death_defiance', 'blood_magic', 'chain_reaction', 'masochist', 'vital_surge']
    },

    'stormcaller': {
        id: 'stormcaller',
        name: 'Stormcaller',
        tagline: 'Tempest Shaman & Lightning Lord',
        desc: 'Conduits of the howling heavens who summon thunderstorm fury. They strike multiple foes with arcing electricity, charge melee blows with static, and accelerate combat tempo with time manipulation.',
        suggestedSymbol: '⚡',
        baseStats: { str: 9, dex: 12, int: 14, con: 11 },
        playstyles: [
            {
                id: 'tempest_striker',
                name: 'Tempest Striker',
                role: 'Multi-Target Arc Chain Striker',
                desc: 'Unleashes crackling lightning bolts that arc between foes, devastating grouped adversaries with swift elemental shocks.',
                favoredSkills: ['lightning', 'chain_lightning'],
                favoredPassives: ['overload', 'spell_echo']
            },
            {
                id: 'shock_spellblade',
                name: 'Shock Spellblade',
                role: 'Spell-Infused Martial Brawler',
                desc: 'Channels storm magic into heavy physical weapon strikes, discharging bonus lightning shock with each swing.',
                favoredSkills: ['earthquake', 'lightning'],
                favoredPassives: ['spellblade', 'momentum']
            },
            {
                id: 'overloaded_conduit',
                name: 'Overloaded Conduit',
                role: 'Cooldown Reduction & Time Bender',
                desc: 'Operates at frantic velocity, cutting skill cooldowns down to bare minimums and bending time itself to freeze opponents.',
                favoredSkills: ['time_warp', 'meditate'],
                favoredPassives: ['time_weaver', 'masochist']
            }
        ],
        starterEquipment: {
            rightHand: { id: 'staff', name: 'Storm-Carved Rod', rarity: 'Basic', stats: { atk: 3, int: 3 }, count: 1, desc: '+3 ATK, +3 INT (Crackles with ozone)', price: 35 },
            leftHand: { id: 'shield', name: 'Thunderstrike Totem', rarity: 'Basic', stats: { atk: 1, int: 1, def: 1 }, count: 1, desc: '+1 ATK, +1 INT, +1 DEF (Vibrates with thunder)', price: 25 },
            chest: { id: 'armor', name: 'Shamanic Feather Garb', rarity: 'Basic', stats: { def: 2, int: 1, dex: 1 }, count: 1, desc: '+2 DEF, +1 INT, +1 DEX (Lightweight enchanted raiment)', price: 30 },
            rightFinger: { id: 'ring', name: 'Galvanic Band', rarity: 'Basic', stats: { maxMp: 15, int: 1 }, count: 1, desc: '+15 Max MP, +1 INT (Sparks leap from the band)', price: 25 },
            light: { id: 'torch', category: 'consumable', type: 'consumable', name: 'Pine Torch', life: 100, maxLife: 100, rarity: 'Basic', stats: {}, desc: 'Provides light. Decays over time.', price: 15 }
        },
        starterInventory: [
            { id: 'potion_health', category: 'consumable', type: 'consumable', name: 'Health Potion', desc: 'Restores 30 HP', count: 3, rarity: 'Basic', stats: {}, price: 15 }
        ],
        starterActives: ['lightning', 'arcane_missiles'],
        starterHotkeys: { q: 'lightning', e: 'arcane_missiles' },
        starterPassives: { overload: 1, time_weaver: 1 },
        classSkills: ['lightning', 'arcane_missiles', 'chain_lightning', 'earthquake', 'meditate', 'time_warp'],
        classPassives: ['overload', 'time_weaver', 'spellblade', 'spell_echo', 'momentum', 'masochist']
    }
};

export function getClass(classId) {
    if (!classId) return CLASSES.paladin;
    const lower = String(classId).toLowerCase().trim();
    if (CLASSES[lower]) return CLASSES[lower];
    // Backward compatibility for original 3 loadout names
    if (lower === 'warrior') return CLASSES.paladin;
    if (lower === 'mage') return CLASSES.pyromancer;
    if (lower === 'rogue') return CLASSES.shadowblade;
    return CLASSES.paladin;
}

export function getAllClasses() {
    return Object.values(CLASSES);
}
