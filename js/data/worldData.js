// World Data: Continents, Cities, Lore, Handcrafted NPCs, Quests, Enemies, and Bosses

export const CITIES = [
    { name: "Oakhaven", x: 48, y: 92, biome: 'F', region: "Sylva (The Elderwood)", desc: "Enchanted arboreal haven built around the roots of the Great Elder Tree." },
    { name: "Mirage Edge", x: 152, y: 152, biome: 'D', region: "Solaris (The Scorched Sands)", desc: "A sandstone oasis citadel overlooking the shifting dunes and buried sun-temples." },
    { name: "Frosthold", x: 55, y: 38, biome: 'T', region: "Borealis (The Glacial Reach)", desc: "A granite and ice bastion standing defiant against the howling arctic blizzards." },
    { name: "Bogwatch", x: 48, y: 152, biome: 'S', region: "Venomfang (The Shadowmire)", desc: "A stilt-built settlement shrouded in mystical mist and dark alchemical lore." },
    { name: "Kingsfall", x: 135, y: 85, biome: 'P', region: "Aethelgard (Imperial Crownlands)", desc: "The ancient seat of the Solar Concordat, surrounded by rolling golden meadows." },
    { name: "Embergard", x: 100, y: 165, biome: '#', region: "The Ashen Reach (Mount Caldera)", desc: "A subterranean forge-stronghold carved directly into the basalt of Mount Caldera." }
];

export const WORLD_LORE = {
    title: "The Chronicles of Aethelgard: The Shattered Realm",
    overview: "Aethelgard was once a harmonious realm bridged by the Cosmic Ascendants—celestial architects who bound the planar leylines through divine Aether Shrines. Centuries ago, the catastrophic impact of the Void Tear (the Fallen Star) fractured the celestial lattice. The Ascendants vanished into the Astral Veil, leaving behind dormant shrines, sacred shards, and corrupted guardians.",
    continents: [
        { name: "Borealis (The Northern Glaciers)", ruler: "Jarl Gunnar Ironpeak", danger: "Ancient Frost Wyrm, Rimefang", element: "Winter & Ice" },
        { name: "Sylva (The Western Elderwood)", ruler: "Archdruid Melissa", danger: "Blighted Treant Patriarch", element: "Nature & Verdance" },
        { name: "Aethelgard (The Imperial Crownlands)", ruler: "High Chancellor Valerius", danger: "Void Cultists & Rogue Warlords", element: "Solar Order" },
        { name: "Solaris (The Southeastern Dunes)", ruler: "Chieftain Tariq", danger: "Obsidian Sand Colossus", element: "Sun & Flame" },
        { name: "Venomfang (The Southwestern Mire)", ruler: "Alchemist Balthazar", danger: "Swamp Hag Matriarch, Morwena", element: "Tide & Decay" },
        { name: "The Ashen Reach (The Volcanic Isle)", ruler: "Forge-Master Ignis", danger: "Magma Behemoth, Ignis", element: "Earth & Magma" }
    ],
    theSanctuary: "At the center of the Great Inland Sea lies the Sacred Isle of the Ascendant. It is said that whoever gathers the elemental seals of the 5 continents may cross the Colossus Bridges, touch the Ancient Shrine, and awaken the dormant power of the Ascendant."
};

export const CITY_NPCS_DATA = {
    'Kingsfall': [
        {
            name: "High Chancellor Valerius",
            profession: "Imperial Regent",
            quirk: "weary and noble",
            dialogue: "A dark shadow creeps over the Crownlands... Ah, an adventurer. Perhaps the stars have not abandoned us after all.",
            backstory: "I served three emperors before the Fallen Star shattered the heavens. Now the imperial throne sits empty, and rogue factions fight for scraps while the Void stirs in the deep. I see the celestial mark upon you, traveler...",
            lore: "Kingsfall was founded where the First Ascendant planted the Sun Spear. The grand arches were designed to channel astral currents. Now those currents are warping, causing wildlife and brigands to turn ferocious.",
            rumor: "Highwaymen have ambushed the royal messenger along the eastern road and stolen our sacred Astral Sextant. Without it, our astrologers cannot chart the leylines.",
            questToGive: {
                id: 'q_main_1',
                category: 'The Ascendant Saga',
                title: "The Shattered Crown - Recover the Astral Sextant",
                desc: "Bandit outlaws have ambushed the imperial courier and stolen the Astral Sextant. Hunt down 4 Bandits or Thieves along the Crownland roads to recover the sextant and restore hope to Kingsfall.",
                target: "Bandit / Thief",
                targets: ["Bandit", "Thief"],
                progress: 0,
                maxProgress: 4,
                rewardGold: 120,
                rewardXp: 250,
                rewardItem: { id: 'crest_valerius', name: 'Imperial Signet Ring', rarity: 'Rare', type: 'accessory', stats: { int: 2, def: 2 }, desc: 'The gilded seal of Chancellor Valerius.', price: 60 },
                patronCity: "Kingsfall",
                turnInDialogue: "You returned the Astral Sextant! The stars shine a little brighter tonight. You truly possess the bloodline of the Ascendants. Take this signet ring as a token of the Crown's gratitude.",
                isComplete: false,
                isTurnedIn: false
            }
        },
        {
            name: "Grand Archivist Cynthia",
            profession: "Keeper of the Astral Tomes",
            quirk: "scholarly and intense",
            dialogue: "The ancient texts spoke of your arrival... Born under the comet's wake, carrying the embers of the Ascendant.",
            backstory: "For forty years, I have studied the shattered tablets of the First Era. The Ascendants did not perish—they sealed themselves within the Astral Veil to protect this world from what came beyond.",
            lore: "Five ancient Guardians across the continents absorbed the dark fallout of the Fallen Star and were driven mad: the Treant of Sylva, the Colossus of Solaris, the Wyrm of Borealis, the Matriarch of Venomfang, and the Behemoth of Caldera. Only by defeating them can their corrupted seals be purified.",
            rumor: "Deep within the Ruined Fortresses across the plains lie lost celestial tablets. If you ever venture into their depths, seek out the ancient stone pedestals.",
            questToGive: {
                id: 'q_kf_archives',
                category: 'Arcane Study',
                title: "Tomes of the Fallen Star",
                desc: "Goblins and feral beasts have invaded the old observatory ruins. Slay 5 Goblins or Wild Boars to secure the perimeter for the archival expedition.",
                target: "Goblin / Wild Boar",
                targets: ["Goblin", "Wild Boar"],
                progress: 0,
                maxProgress: 5,
                rewardGold: 90,
                rewardXp: 180,
                patronCity: "Kingsfall",
                turnInDialogue: "Splendid work! The scholars can now reach the observatory unmolested. May the celestial light guide your blade.",
                isComplete: false,
                isTurnedIn: false
            }
        },
        {
            name: "Commander Raynor",
            profession: "Veteran Paladin",
            quirk: "gruff and battle-scarred",
            dialogue: "Watch your back out there, recruit. The wilderness doesn't care about your titles or your gold.",
            backstory: "I marched into the northern blizzards twenty years ago with two hundred good soldiers. Three of us walked back out. The cold gets into your blood, and the wraiths never sleep.",
            lore: "The continental roads used to be safe when the Concordat held the garrison forts. Now, between the goblin swarms and roving thieves, you're lucky to travel ten leagues without drawing steel.",
            rumor: "If you're looking to cross to other continents, look for the Great Stone Bridges that span the ocean straits. The High King's Bridge connects us to the Sacred Isle and across to Oakhaven.",
            questToGive: {
                id: 'q_kf_bounty',
                category: 'Regional Bounty',
                title: "Highway Pacification",
                desc: "Ruthless bandits are strangling the trade convoys outside Kingsfall. Slay 3 Bandits to protect the merchants and pilgrims.",
                target: "Bandit",
                targets: ["Bandit"],
                progress: 0,
                maxProgress: 3,
                rewardGold: 100,
                rewardXp: 200,
                patronCity: "Kingsfall",
                turnInDialogue: "Clean cuts. You handle yourself like a true soldier of the old guard. Take your bounty, warrior.",
                isComplete: false,
                isTurnedIn: false
            }
        }
    ],

    'Oakhaven': [
        {
            name: "Archdruid Melissa",
            profession: "Voice of the Elder Tree",
            quirk: "serene and ancient",
            dialogue: "Listen closely... the roots of Sylva weep. The blight spreads from the ancient groves.",
            backstory: "I was born when the Elder Tree was still a sapling. For centuries, our order tended the emerald leylines. But since the comet fell, a foul necrotic fungus infects the soil, turning our sacred beasts into rabid monsters.",
            lore: "The Crest of Verdance was once entrusted to the Ancient Treant patriarch. When the Void Tear poisoned the water table, the Treant became an engine of rot. Slaying the blighted predators around Oakhaven is our only hope.",
            rumor: "Deep within the dense canopies to the west lie ancient damp caves. Strange bioluminescent herbs grow near their mouths, guarded by woodland trolls.",
            questToGive: {
                id: 'q_main_2',
                category: 'The Ascendant Saga',
                title: "Heart of the Elderwood - Slay the Blighted Wolves",
                desc: "The Shadowfang pack has succumbed to necrotic madness. Slay 4 Timber Wolves or Forest Trolls in the Elderwood to protect the roots of Oakhaven and claim the blessings of Sylva.",
                target: "Timber Wolf / Forest Troll",
                targets: ["Timber Wolf", "Forest Troll"],
                progress: 0,
                maxProgress: 4,
                rewardGold: 140,
                rewardXp: 300,
                rewardItem: { id: 'amulet_elderwood', name: 'Amulet of the Elder Grove', rarity: 'Rare', type: 'neck', stats: { dex: 3, hp: 20 }, desc: 'Carved from living elderwood by Archdruid Melissa.', price: 75 },
                patronCity: "Oakhaven",
                turnInDialogue: "The forest breathes a sigh of relief. The green leyline stabilizes under your touch. Accept this Elderwood amulet, Champion of Verdance.",
                isComplete: false,
                isTurnedIn: false
            }
        },
        {
            name: "Ranger Kaelen",
            profession: "Shadow Tracker",
            quirk: "alert and taciturn",
            dialogue: "Step softly. In this wood, if you aren't the hunter, you are the prey.",
            backstory: "My sister was taken by the Forest Trolls three winters back during the Great Eclipse. I've spent every waking moment since mapping their hunting corridors and tracking their tracks.",
            lore: "The Elderwood was once connected to Kingsfall by an emerald canopy before the Inland Sea widened. If you follow the Western Causeway, you can cross right into the Sacred Isle.",
            rumor: "Trolls cannot stand fire. If you venture into the damp caves, keep your torches burning and strike hard before they regenerate.",
            questToGive: {
                id: 'q_oak_troll',
                category: 'Regional Bounty',
                title: "Trolls of the Deep Canopy",
                desc: "The forest trolls have grown bold, attacking woodcutters near the perimeter. Hunt down 2 Forest Trolls to secure the logging trail.",
                target: "Forest Troll",
                targets: ["Forest Troll"],
                progress: 0,
                maxProgress: 2,
                rewardGold: 110,
                rewardXp: 240,
                patronCity: "Oakhaven",
                turnInDialogue: "Two less monsters walking this earth. My sister's spirit rests a little easier today. Thank you.",
                isComplete: false,
                isTurnedIn: false
            }
        }
    ],

    'Mirage Edge': [
        {
            name: "Chieftain Tariq",
            profession: "Lord of the Dune Striders",
            quirk: "proud and weathered",
            dialogue: "Welcome to Solaris, wanderer. May the twin suns spare your skin and the sand wyrms overlook your scent.",
            backstory: "My ancestors rode across these sands long before the Concordat built their stone towers. We know where the lost oasis cities sleep beneath the dunes. But the Sand Colossus has awakened, and desert nomads pillage our sacred shrines.",
            lore: "Solaris was once a lush empire of gardens watered by celestial canals. When the Void Tear crashed, the heat scorched the riverbeds into dust in a single solar cycle. The Crest of Solar Flame lies buried in the deep desert.",
            rumor: "The sand worms detect footfalls from a quarter-league away. Stay upon the rocky ridges and sandstone mesas whenever you travel through the Great Dunes.",
            questToGive: {
                id: 'q_main_3',
                category: 'The Ascendant Saga',
                title: "Wrath of the Sunken Sands",
                desc: "Renegade desert nomads and predatory sand worms threaten the nomadic trade routes. Slay 4 Desert Nomads or Sand Worms in Solaris to safeguard the desert trail.",
                target: "Desert Nomad / Sand Worm",
                targets: ["Desert Nomad", "Sand Worm"],
                progress: 0,
                maxProgress: 4,
                rewardGold: 160,
                rewardXp: 380,
                rewardItem: { id: 'cloak_sun_strider', name: 'Dune Strider Cloak', rarity: 'Rare', type: 'back', stats: { dex: 3, def: 3 }, desc: 'Woven from desert silk, offering protection from sandstorms.', price: 80 },
                patronCity: "Mirage Edge",
                turnInDialogue: "By the blazing sun, you have proven your valor! The Dune Striders name you honorary blood-kin. Wear this cloak of the desert wind.",
                isComplete: false,
                isTurnedIn: false
            }
        },
        {
            name: "Sorceress Safiya",
            profession: "Solar Pyromancer",
            quirk: "mysterious and fiery",
            dialogue: "The sunlight here does not just illuminate... it burns away falsehoods.",
            backstory: "I fled the Imperial College when the Chancellor outlawed solar communion. The desert is harsh, but here the solar leylines burn pure and untamed.",
            lore: "The ancient sun-priests constructed mirror obelisks to focus celestial beams into healing energy. The scorpions that nest in the ruins have absorbed this energy, making their venom extraordinarily potent.",
            rumor: "Harvesting the venom from desert scorpions yields powerful reagents for potion-making and flame enchanting.",
            questToGive: {
                id: 'q_me_scorpions',
                category: 'Arcane Study',
                title: "Solar Venom Extraction",
                desc: "Safiya requires catalytic venom glands from the desert scorpions. Eliminate 3 Scorpion Packs in the dunes.",
                target: "Scorpion Pack",
                targets: ["Scorpion Pack"],
                progress: 0,
                maxProgress: 3,
                rewardGold: 120,
                rewardXp: 260,
                patronCity: "Mirage Edge",
                turnInDialogue: "Exquisite venom! The luminescent qualities are intact. Here is your promised gold, adventurer.",
                isComplete: false,
                isTurnedIn: false
            }
        }
    ],

    'Frosthold': [
        {
            name: "Jarl Gunnar Ironpeak",
            profession: "Lord of the Glaciers",
            quirk: "stern and unyielding",
            dialogue: "Frosthold does not bend to summer kings. Our walls are carved from living glacier, and our blood runs cold as iron.",
            backstory: "For seven generations my clan has guarded the Northern Seal against the primordial horrors slumbering beneath the ice sheets. But the Frost Wyrm, Rimefang, stirs in the northern peaks, summoning ice wraiths and frost golems.",
            lore: "The Northern Seal was placed by the Ascendants to lock away the Frost Titans. If Rimefang shatters the ice barrier, the Great Freeze will swallow all continents.",
            rumor: "The ice caverns in Borealis are slick as oiled glass. Wear heavy boots and watch for bottomless crevasses.",
            questToGive: {
                id: 'q_main_4',
                category: 'The Ascendant Saga',
                title: "The Northern Seal - Quell the Frost Horrors",
                desc: "Frost Golems and Ice Wraiths have breached the southern glacier pass. Slay 4 Frost Golems or Ice Wraiths in Borealis to secure the gates of Frosthold.",
                target: "Frost Golem / Ice Wraith",
                targets: ["Frost Golem", "Ice Wraith"],
                progress: 0,
                maxProgress: 4,
                rewardGold: 180,
                rewardXp: 450,
                rewardItem: { id: 'shield_frost_guard', name: 'Frost-Forged Bulwark', rarity: 'Rare', type: 'leftHand', stats: { def: 6, con: 2 }, desc: 'Carved from unbreakable blue glacier ice.', price: 90 },
                patronCity: "Frosthold",
                turnInDialogue: "By the thunder of the north, you fight like a Frosthold giant! The pass is secured. Take this shield—it will turn aside dragon claws and ice spikes alike.",
                isComplete: false,
                isTurnedIn: false
            }
        },
        {
            name: "Shieldmaiden Freya",
            profession: "Huntress of the Rime",
            quirk: "boisterous and fearless",
            dialogue: "Ha! Another southern softskin trying to survive our winters? Show me you have spine, traveler!",
            backstory: "I took my first polar bear with a bone dagger when I was fourteen. Up here, you don't survive by praying to gods—you survive by swinging first and striking hard.",
            lore: "The Northern Ocean freezes solid in deep winter, allowing brave hunters to walk between the outer icebergs. But polar bears hunt those same shelves.",
            rumor: "Polar bear pelts are the warmest material in all Aethelgard. The armorsmiths in Kingsfall pay fortunes for unblemished hides.",
            questToGive: {
                id: 'q_fh_bears',
                category: 'Regional Bounty',
                title: "Apex Predators of the Tundra",
                desc: "Feral polar bears are roaming close to the outer gates. Slay 2 Polar Bears to thin the pack and protect the scouts.",
                target: "Polar Bear",
                targets: ["Polar Bear"],
                progress: 0,
                maxProgress: 2,
                rewardGold: 130,
                rewardXp: 280,
                patronCity: "Frosthold",
                turnInDialogue: "Well struck! You have the heart of a true northman. Let's share a horn of mead at the tavern!",
                isComplete: false,
                isTurnedIn: false
            }
        }
    ],

    'Bogwatch': [
        {
            name: "Alchemist Balthazar",
            profession: "Grand Apothecary of the Mire",
            quirk: "blind, enigmatic, and brilliant",
            dialogue: "I hear the celestial resonance in your footsteps... You walk with the weight of the stars, wanderer.",
            backstory: "I gave my eyesight thirty years ago to decipher the forbidden texts of the Sunken Fane. The Shadowmire is breathing poison because the Bog Hag Matriarch feeds on the fallen comet's marrow.",
            lore: "Centuries ago, the Ascendant of Rebirth cast her emerald tears into this delta. When the Void Tear struck, those tears turned to toxic bile. The Crest of the Mire is trapped inside the hag matriarch's cauldron.",
            rumor: "The crocodiles in the deep murk grow twice the size of a war horse. Avoid the bubbling green pools unless you possess rare antidotes.",
            questToGive: {
                id: 'q_main_5',
                category: 'The Ascendant Saga',
                title: "The Morass of Sorrows - Cleanse the Venomfang Delta",
                desc: "Toxic swamp slimes and malevolent hags are spreading pestilence through the bayous. Slay 4 Swamp Slimes or Hags in Venomfang to gather pure restorative catalysts.",
                target: "Swamp Slime / Hag",
                targets: ["Swamp Slime", "Hag"],
                progress: 0,
                maxProgress: 4,
                rewardGold: 200,
                rewardXp: 520,
                rewardItem: { id: 'vial_sunken_stars', name: 'Phial of the Sunken Stars', rarity: 'Rare', type: 'accessory', stats: { mp: 30, int: 3 }, desc: 'Glowing with luminous green celestial essence.', price: 100 },
                patronCity: "Bogwatch",
                turnInDialogue: "The bile is distilled, and the rot begins to recede! The swamp leylines pulse with renewed vitality. Take this celestial phial, Ascendant.",
                isComplete: false,
                isTurnedIn: false
            }
        },
        {
            name: "Ferryman Silas",
            profession: "Bayou Navigator",
            quirk: "grim and silent",
            dialogue: "The fog conceals many things in the Shadowmire... some better left undiscovered.",
            backstory: "I've rowed these waterways for forty years. I know every sunken root and every submerged skeleton. The crocodiles have grown unnaturally vicious since the dark fog rolled in.",
            lore: "The Mire Causeway connects Bogwatch north to the Elderwood of Oakhaven. Follow the wooden stilts and lanterns if you wish to avoid sinking into the quicksand.",
            rumor: "If you get lost in the mist, look for the torches of the fishing cabins. Do not follow the blue will-o'-the-wisps—they lead straight into hag ambushes.",
            questToGive: {
                id: 'q_bw_crocs',
                category: 'Regional Bounty',
                title: "Clearing the Estuary",
                desc: "Giant crocodiles have blocked the western shipping channel. Hunt 3 Crocodiles to reopen the waterway.",
                target: "Crocodile",
                targets: ["Crocodile"],
                progress: 0,
                maxProgress: 3,
                rewardGold: 140,
                rewardXp: 300,
                patronCity: "Bogwatch",
                turnInDialogue: "The waterway is clear once more. You have earned your keep in the murk, stranger.",
                isComplete: false,
                isTurnedIn: false
            }
        }
    ],

    'Embergard': [
        {
            name: "Forge-Master Ignis",
            profession: "Lord of the Dragon Crucible",
            quirk: "fiery, boisterous, and master of metal",
            dialogue: "CLANG! Ah! Stand back from the magma trench! No common steel can withstand the heat of Mount Caldera!",
            backstory: "For forty years I have guarded the Great Dragon Forge, awaiting an adventurer who carries the Elemental Crests. Only the volcanic core of this mountain has heat sufficient to reforge the Aetherial Star-Key!",
            lore: "Mount Caldera is the beating heart of Aethelgard's tectonic foundation. The Mountain Behemoth sleeps within the magma roots. If he wakes in full fury, the seas will boil.",
            rumor: "Mountain orcs and stone golems patrol the basalt ridges. Defeating them yields volcanic slag and obsidian cores vital for reforging legendary weapons.",
            questToGive: {
                id: 'q_main_6',
                category: 'The Ascendant Saga',
                title: "The Dragon's Crucible - Reforge the Star-Key",
                desc: "Defeat 5 Mountain Orcs or Stone Golems in the volcanic caldera to harvest volcanic heat cores. With these cores, Forge-Master Ignis can reforge the Keystone to the Ascendant Sanctuary!",
                target: "Mountain Orc / Stone Golem",
                targets: ["Mountain Orc", "Stone Golem"],
                progress: 0,
                maxProgress: 5,
                rewardGold: 300,
                rewardXp: 800,
                rewardItem: { id: 'crest_ascendant_keystone', name: 'Aetherial Star-Key', rarity: 'Legendary', type: 'quest', stats: { atk: 5, def: 5, str: 3, int: 3 }, desc: 'The reforged key that awakens the ancient Sanctuary of the Ascendant.', price: 500 },
                patronCity: "Embergard",
                turnInDialogue: "BY THE FIRES OF CREATION! THE KEY IS FORGED! Take the Aetherial Star-Key across the Inland Sea to the Sacred Isle! Touch the Ancient Shrine [Ω] and awaken the Ascendant!",
                isComplete: false,
                isTurnedIn: false
            }
        },
        {
            name: "Scout Tova",
            profession: "Ash-Runner",
            quirk: "daring and agile",
            dialogue: "Mind your footing on the pumice stones. One slip and you're bathing in liquid fire.",
            backstory: "I scout the rim of the volcano every morning to check for seismic fissures. The harpy nests along the upper crags make the reconnaissance hazardous.",
            lore: "The Dragon's Viaduct connects our volcanic island north to the mainland plains. It was built by ancient stonemasons to withstand earthquakes.",
            rumor: "Harpies dive from the smoke clouds when your back is turned. Watch the skies whenever you hear their piercing shrieks.",
            questToGive: {
                id: 'q_eg_harpies',
                category: 'Regional Bounty',
                title: "Caldera Reconnaissance",
                desc: "Savage harpies are nesting along the volcanic cliffs. Slay 3 Harpies to clear the observation perches.",
                target: "Harpy",
                targets: ["Harpy"],
                progress: 0,
                maxProgress: 3,
                rewardGold: 150,
                rewardXp: 320,
                patronCity: "Embergard",
                turnInDialogue: "The observation posts are secure! Thanks to you, our scouts can monitor the magma flows in safety.",
                isComplete: false,
                isTurnedIn: false
            }
        }
    ]
};

// Procedural citizens for flavor and atmospheric depth in taverns and streets
export const NPC_NAMES = [
    "Grom", "Elara", "Thorn", "Sylas", "Mira", "Kael", "Bram", "Lyra", "Vane", "Seraphina",
    "Cedric", "Rowena", "Torvald", "Astrid", "Gideon", "Mirella", "Brutus", "Daphne", "Eldrin", "Zaira"
];
export const NPC_PROFESSIONS = [
    "Scholar of the Stars", "Former Temple Guard", "Wandering Cartographer", "Priest of the Sun",
    "Leyline Scavenger", "Bounty Hunter", "Caravan Farmer", "Runic Scribe", "Glacial Scout", "MUD Bard"
];
export const NPC_SECRETS = [
    "I survived an encounter with the Void Wyrm in the deep north.",
    "I am secretly hoarding ancient Ascendant shards beneath my floorboards.",
    "I carry the wanted bounty of the Concordat for uncovering temple secrets.",
    "I know the true incantation that awakens the Central Shrine.",
    "I saw a celestial chariot fall from the sky when the comet struck."
];
export const NPC_MOTIVATIONS = [
    "I want to see the five continents united under one banner again.",
    "I seek vengeance against the bandits who razed my home village.",
    "I am mapping every coastline and bridge in Aethelgard.",
    "I want to master all three crafting disciplines before I retire."
];
export const NPC_QUIRKS = ["nervous", "boisterous", "melancholy", "suspicious", "optimistic", "scholarly", "philosophical"];

export const ENEMIES = {
    'F': ['Timber Wolf', 'Bandit', 'Forest Troll'],
    'D': ['Sand Worm', 'Scorpion Pack', 'Desert Nomad'],
    'T': ['Frost Golem', 'Ice Wraith', 'Polar Bear'],
    'S': ['Swamp Slime', 'Hag', 'Crocodile'],
    'P': ['Wild Boar', 'Goblin', 'Thief', 'Bandit'],
    '#': ['Mountain Orc', 'Stone Golem', 'Harpy']
};

export const ENEMY_STATS = {
    'Timber Wolf': { hp: 18, damage: 6 }, 'Bandit': { hp: 28, damage: 8 }, 'Forest Troll': { hp: 55, damage: 13 },
    'Sand Worm': { hp: 38, damage: 11 }, 'Scorpion Pack': { hp: 20, damage: 8 }, 'Desert Nomad': { hp: 32, damage: 9 },
    'Frost Golem': { hp: 75, damage: 15 }, 'Ice Wraith': { hp: 28, damage: 12 }, 'Polar Bear': { hp: 50, damage: 11 },
    'Swamp Slime': { hp: 18, damage: 6 }, 'Hag': { hp: 38, damage: 14 }, 'Crocodile': { hp: 44, damage: 12 },
    'Wild Boar': { hp: 22, damage: 7 }, 'Goblin': { hp: 12, damage: 5 }, 'Thief': { hp: 26, damage: 8 },
    'Mountain Orc': { hp: 48, damage: 11 }, 'Stone Golem': { hp: 85, damage: 16 }, 'Harpy': { hp: 24, damage: 10 }
};

export const ELITE_PREFIXES = ['Fiery', 'Vampiric', 'Swift', 'Armored', 'Brutal', 'Celestial', 'Blighted'];

export const baseName = (name) => name.replace(new RegExp('^(' + ELITE_PREFIXES.join('|') + ') '), '');

export const BIOME_BOSSES = {
    'F': { name: 'Blighted Treant Patriarch', desc: 'Overgrown necrotic roots burst through the temple flagstones.', legendary: 'Staff of the Elderwood' },
    'D': { name: 'Obsidian Sand Colossus', desc: 'The scorching air vibrates with ancient solar fury.', legendary: 'Sun-Forged Scimitar' },
    'T': { name: 'Ancient Frost Wyrm, Rimefang', desc: 'Aura of absolute zero coats the glacial chamber in razor frost.', legendary: 'Crown of the Frost Wyrm' },
    'S': { name: 'Swamp Hag Matriarch, Morwena', desc: 'A foul stench of soul-rot and dark miasma fills the cavern.', legendary: 'Amulet of the Mire' },
    'P': { name: 'Void Warlord of the Crownlands', desc: 'A fallen champion empowered by the dark void star.', legendary: 'Greatsword of the Ascendant' },
    '#': { name: 'Magma Behemoth, Ignis', desc: 'Tremors shake the mountain core as rivers of lava surge.', legendary: 'Earthshatter Maul' }
};

export function getTileBiome(tile) {
    if (['♣', 't', 'l', 'F'].includes(tile)) return 'F';
    if (['.', 'c', '╤', 'o', 'D'].includes(tile)) return 'D';
    if (['∆', '*', 'i', 'T', 'd'].includes(tile)) return 'T';
    if (['p', 'w', 's', 'S'].includes(tile)) return 'S';
    if (['v', '#', '▲'].includes(tile)) return '#';
    return 'P';
}
