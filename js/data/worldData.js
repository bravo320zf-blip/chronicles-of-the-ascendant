// World Data: Cities, NPCs, Enemies, and Bosses

export const CITIES = [
    { name: "Oakhaven", x: 25, y: 25, biome: 'F' },
    { name: "Mirage Edge", x: 175, y: 25, biome: 'D' },
    { name: "Frosthold", x: 25, y: 175, biome: 'T' },
    { name: "Bogwatch", x: 175, y: 175, biome: 'S' },
    { name: "Kingsfall", x: 100, y: 100, biome: 'P' },
    { name: "Embergard", x: 100, y: 150, biome: '#' }
];

export const NPC_NAMES = ["Grom", "Elara", "Thorn", "Sylas", "Mira", "Kael", "Bram", "Lyra", "Vane", "Seraphina"];
export const NPC_PROFESSIONS = ["Scholar", "Former Guard", "Wanderer", "Priest", "Scavenger", "Bounty Hunter", "Farmer", "Grave Robber", "Cartographer", "Bard"];
export const NPC_SECRETS = ["I lost my family.", "I am secretly hoarding artifacts.", "I have a bounty on my head.", "I know the true origin of the Ascendant.", "I saw a god fall from the sky."];
export const NPC_MOTIVATIONS = ["I want to survive.", "I seek revenge.", "I am mapping the world.", "I want to retire peacefully."];
export const NPC_QUIRKS = ["nervous", "boisterous", "melancholy", "suspicious", "optimistic"];

export const ENEMIES = {
    'F': ['Timber Wolf', 'Bandit', 'Forest Troll'],
    'D': ['Sand Worm', 'Scorpion Pack', 'Desert Nomad'],
    'T': ['Frost Golem', 'Ice Wraith', 'Polar Bear'],
    'S': ['Swamp Slime', 'Hag', 'Crocodile'],
    'P': ['Wild Boar', 'Goblin', 'Thief'],
    '#': ['Mountain Orc', 'Stone Golem', 'Harpy']
};

export const ENEMY_STATS = {
    'Timber Wolf': { hp: 15, damage: 6 }, 'Bandit': { hp: 25, damage: 8 }, 'Forest Troll': { hp: 50, damage: 12 },
    'Sand Worm': { hp: 35, damage: 10 }, 'Scorpion Pack': { hp: 18, damage: 7 }, 'Desert Nomad': { hp: 30, damage: 9 },
    'Frost Golem': { hp: 70, damage: 14 }, 'Ice Wraith': { hp: 25, damage: 11 }, 'Polar Bear': { hp: 45, damage: 10 },
    'Swamp Slime': { hp: 15, damage: 5 }, 'Hag': { hp: 35, damage: 13 }, 'Crocodile': { hp: 40, damage: 11 },
    'Wild Boar': { hp: 20, damage: 7 }, 'Goblin': { hp: 10, damage: 5 }, 'Thief': { hp: 25, damage: 8 },
    'Mountain Orc': { hp: 45, damage: 10 }, 'Stone Golem': { hp: 80, damage: 15 }, 'Harpy': { hp: 20, damage: 9 }
};

export const ELITE_PREFIXES = ['Fiery', 'Vampiric', 'Swift', 'Armored', 'Brutal'];

export const baseName = (name) => name.replace(new RegExp('^(' + ELITE_PREFIXES.join('|') + ') '), '');

export const BIOME_BOSSES = {
    'F': { name: 'Ancient Treant', desc: 'Overgrown roots burst through the stone floors.', legendary: 'Staff of Nature' },
    'D': { name: 'Sandstone Colossus', desc: 'The air is bone dry and sand pours from the ceiling.', legendary: 'Blade of the Dunes' },
    'T': { name: 'Frost Wyrm', desc: 'Thick, unbreakable ice coats the walls of this chamber.', legendary: 'Crown of Winter' },
    'S': { name: 'Bog Hag Matriarch', desc: 'A foul stench of decay fills the room.', legendary: 'Amulet of the Mire' },
    'P': { name: 'Warlord of the Wastes', desc: 'The bones of fallen warriors litter the ground.', legendary: 'Greatsword of the Conqueror' },
    '#': { name: 'Mountain Behemoth', desc: 'Deep tremors shake the cavern with every footstep.', legendary: 'Earthshatter Maul' }
};
