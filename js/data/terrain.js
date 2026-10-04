// World and Local Map Tile Dictionaries

export const TERRAIN = {
    'F': { name: 'Forest', color: '#228B22', char: ' ' },
    'D': { name: 'Desert', color: '#BDB76B', char: ' ' },
    'T': { name: 'Tundra', color: '#E0FFFF', char: ' ' },
    'S': { name: 'Swamp', color: '#800080', char: ' ' },
    'P': { name: 'Plains', color: '#9ACD32', char: ' ' },
    '#': { name: 'Mountains', color: '#696969', char: '▲' },
    't': { name: 'Tree', color: '#228B22', char: '♣' },
    'l': { name: 'Leaves', color: '#228B22', char: '♣' },
    's': { name: 'Shrub', color: '#32CD32', char: 'w' },
    'c': { name: 'Cactus', color: '#32CD32', char: '╤' },
    'r': { name: 'Rock', color: '#808080', char: 'o' },
    'g': { name: 'Grass', color: '#9ACD32', char: '"' },
    'w': { name: 'Water', color: '#4169E1', char: '~' },
    'i': { name: 'Ice', color: '#ADD8E6', char: '∆' },
    'd': { name: 'Dead Tree', color: '#696969', char: 'T' },
    'Ω': { name: 'Ancient Shrine', color: '#ffd700', char: 'Ω' }
};

export const POI_TYPES = {
    'C': { name: 'City', css: 'map-city', char: '⌂' },
    'D': { name: 'Dungeon', css: 'map-dungeon', char: 'D' },
    '*': { name: 'Cave', css: 'map-cave', char: '*' },
    '^': { name: 'Fortress', css: 'map-fort', char: '^' }
};

export const LOCAL_TILES = {
    '#': { name: 'Wall', color: '#9ca3af', char: '█' },
    '.': { name: 'Floor', color: '#4b5563', char: '·' },
    ',': { name: 'Road', color: '#6b7280', char: '░' },
    '+': { name: 'Door', color: '#d2b48c', char: '◫' },
    '<': { name: 'Exit', color: '#00ffff', char: '<' },
    '▼': { name: 'Stairs Down', color: '#ffaa00', char: '▼' },
    '▲': { name: 'Stairs Up', color: '#ffaa00', char: '▲' },
    'N': { name: 'NPC', color: '#00ff00', char: 'N' },
    'M': { name: 'Merchant', color: '#00ffff', char: 'M' },
    'e': { name: 'Monster', color: '#ff5555', char: 'e' },
    'B': { name: 'Boss', color: '#ff0000', char: 'B' },
    'T': { name: 'Armor Stand', color: '#aaaaaa', char: 'T' },
    'O': { name: 'Shield Rack', color: '#d2b48c', char: 'O' },
    'I': { name: 'Anvil', color: '#555555', char: 'I' },
    '/': { name: 'Weapon Rack', color: '#cccccc', char: '/' },
    'U': { name: 'Cauldron', color: '#800080', char: 'U' },
    '╥': { name: 'Table', color: '#8b4513', char: '╥' },
    'h': { name: 'Chair', color: '#d2b48c', char: 'h' },
    'b': { name: 'Bed', color: '#4682b4', char: 'O' },
    'C': { name: 'Stash Chest', color: '#ffd700', char: '◰' },
    'W': { name: 'Wood/Roof', color: '#8b4513', char: '█' },
    '-': { name: 'Wood Floor', color: '#5c4033', char: '·' },
    '=': { name: 'Carpet', color: '#8b0000', char: '░' },
    'K': { name: 'Bookshelf', color: '#cd853f', char: '≡' },
    'F': { name: 'Furnace', color: '#ff4500', char: '◬' },
    't': { name: 'Tree Trunk', color: '#8b4513', char: 'O' },
    'l': { name: 'Leaves', color: '#228b22', char: '♣' },
    's': { name: 'Shrub', color: '#32cd32', char: 'w' },
    'c': { name: 'Cactus', color: '#32cd32', char: '╤' },
    'r': { name: 'Rock', color: '#808080', char: 'o' },
    'i': { name: 'Ice Crystal', color: '#add8e6', char: '∆' },
    'd': { name: 'Dead Tree', color: '#696969', char: 'T' },
    'w': { name: 'Water', color: '#4169e1', char: '~' },
    'R': { name: 'Rubble', color: '#666666', char: '▤' },
    'x': { name: 'Spike Trap', color: '#aaaaaa', char: 'x' },
    '&': { name: 'Barrel', color: '#8b4513', char: '8' },
    'p': { name: 'Poison Pool', color: '#00ff00', char: '≈' },
    'v': { name: 'Lava', color: '#ff4500', char: '≈' },
    ' ': { name: 'Void', color: '#000000', char: ' ' }
};
