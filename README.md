# ⚔️ Chronicles of the Ascendant - Online MUD & MMORPG

A retro-terminal, ASCII-style MUD (Multi-User Dungeon) and lightweight MMORPG designed for modern web browsers. Built to run seamlessly on **GitHub Pages** and **Firebase Free Tier (Spark Plan)** with zero hosting costs.

---

## 🌟 Highlights & Features

- **Living, Always-Running World**: Deterministic procedural continent generation (shared across all players via synchronized world seeds) with a globally synchronized real-time day/night cycle and world boss resumptions.
- **Real-Time Multiplayer Presence**: See other adventurers roaming your screen with highlighted `@` markers, inspect their levels and gear, and interact in the same zones.
- **MUD Communication Engine**: Local `/say <msg>`, realm-wide `/shout <msg>`, and `/who` commands to see all online players.
- **Account & Multi-Character Slots**: Secure Email/Password and Guest authentication with multi-slot character saving and backward compatibility for legacy saves.
- **Deep Gameplay Mechanics**:
  - Full ASCII tactical combat system with projectiles, line-of-sight, AOE spells, and terrain destruction (igniting poison pools, detonating explosive barrels).
  - Passive skill tree spanning Combat, Defense, and Utility archetypes.
  - 4 gathering and crafting professions (Woodworking, Metalworking, Alchemy, Hunting) with custom forged items.
  - Dynamic procedural city quests, bounties, dialogue trees, vendor economies, and crime/guard enforcement.
  - Multi-floor dungeons, damp caves, fortresses, boss lairs, and city interior shops.

---

## 📁 Modular Architecture

The project has been refactored from a single monolithic file into a clean, modern ES module architecture:

```
chronicles_of_the_ascendant_Project/
├── index.html                   # Clean, semantic UI entry point
├── chronicles_of_the_ascendant_refactor.html # Original backup reference
├── css/
│   └── styles.css               # CRT terminal scanlines, panel styles, map tiles
└── js/
    ├── config/
    │   └── firebaseConfig.js    # Firebase credentials & offline fallback detector
    ├── data/
    │   ├── constants.js         # World dimensions, global clock rate, app ID
    │   ├── terrain.js           # Terrain biomes, POIs, and local tile characters
    │   ├── items.js             # ASCII art, crafting recipes, materials, gear generator
    │   ├── skills.js            # Active abilities and passive skill tree definitions
    │   └── worldData.js         # Cities, NPCs, enemies, elite prefixes, biome bosses
    ├── core/
    │   ├── state.js             # Centralized GameState & transient state manager
    │   ├── worldGen.js          # Procedural world generator, POIs, building interiors
    │   ├── time.js              # Day/night cycle, global world clock, torch durability
    │   ├── combat.js            # Combat turn engine, projectiles, targeting, active skills
    │   ├── entities.js          # NPC AI, monster pathfinding, guards, dialogue trees
    │   └── inventory.js         # Inventory, equipment slots, crafting workbench, city vault
    ├── network/
    │   ├── auth.js              # Account registration, sign in, guest mode, sign out
    │   ├── characterSave.js     # Character persistence, autosave debounce, legacy migration
    │   └── multiplayer.js       # Real-time player presence, position sync, MUD chat
    ├── ui/
    │   ├── renderer.js          # ASCII map renderer, fog of war, player & multiplayer '@'
    │   ├── modals.js            # Stats, skills, passives, journal, stash dialogs
    │   ├── log.js               # Terminal message logger & retro encounter animations
    │   └── authUI.js            # Account modals, character selection screen
    └── main.js                  # Master coordinator, keyboard shortcuts & command parser
```

---

## 🚀 Running Locally

Because the project uses standard ES Modules, it requires a local web server (or GitHub Pages) to load imports properly:

### Option 1: VS Code Live Server
- Open this folder in VS Code.
- Right-click `index.html` and click **"Open with Live Server"**.

### Option 2: Node.js (Installed on your machine)
Run in PowerShell:
```powershell
npx serve .
```
Then open `http://localhost:3000` in your browser.

### Option 3: Python
Run in PowerShell:
```powershell
python -m http.server 8000
```
Then open `http://localhost:8000`.

---

## 🌐 Deploying to GitHub Pages (100% Free Forever)

1. Create a repository on GitHub (e.g., `chronicles-of-the-ascendant`).
2. Commit and push your files:
   ```bash
   git add .
   git commit -m "Organize modular MUD architecture with accounts, saves, and multiplayer"
   git remote add origin https://github.com/YOUR_USERNAME/chronicles-of-the-ascendant.git
   git branch -M main
   git push -u origin main
   ```
3. On GitHub, go to **Settings** > **Pages**.
4. Under **Branch**, select `main` and `/ (root)`, then click **Save**.
5. Your game will be live globally at `https://YOUR_USERNAME.github.io/chronicles-of-the-ascendant/` with free SSL and unlimited bandwidth!

---

## 🔥 Firebase Setup (100% Free Spark Plan)

The game includes an **Offline / LocalStorage Fallback**, meaning it works right out of the box even without Firebase configured.

To enable online accounts, multi-device cloud saving, and MMORPG multiplayer:

1. Visit [Firebase Console](https://console.firebase.google.com/) and create a free project.
2. Under **Build**:
   - **Authentication**: Click **Get Started**, enable **Email/Password** and **Anonymous**.
   - **Firestore Database**: Click **Create Database**, select **Start in production mode** (or test mode).
3. Under **Project Settings** (gear icon) > **General** > **Your Apps**:
   - Click the Web icon `</>` to register a web app.
   - Copy the `firebaseConfig` object.
4. In the game:
   - Click **"⚙ Firebase Backend Configuration"** on the login screen, paste your JSON, and save.
   - Or paste it directly into [js/config/firebaseConfig.js](file:///c:/Users/Zachary/Videos/chronicles_of_the_ascendant_Project/js/config/firebaseConfig.js).

### Recommended Firestore Security Rules
Paste these rules in your **Firestore Database > Rules** tab to protect user data while allowing public presence:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Character and user data: Only the owner can read/write their characters
    match /artifacts/chronicles-ascendant-mud/users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Multiplayer Presence: Any logged-in player can view presence; users update their own
    match /artifacts/chronicles-ascendant-mud/presence/{userId} {
      allow read: if request.auth != null;
      allow write, delete: if request.auth != null && request.auth.uid == userId;
    }
    // MUD Chat: Authenticated players can read and send messages
    match /artifacts/chronicles-ascendant-mud/chat/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
    // World Clock & State: Authenticated players can read and sync the server world clock
    match /artifacts/chronicles-ascendant-mud/world/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Free Tier Limits Protection
Firebase's **Spark Plan** grants:
- **50,000 document reads/day**
- **20,000 document writes/day**
- **1 GB storage**

The multiplayer engine is specifically optimized for these limits:
- Movement and presence updates are throttled.
- Heartbeats fire every 8 seconds.
- Auto-saving is debounced by 1.5 seconds so rapid movements do not trigger redundant writes.

---

## 🎮 How to Play

### Keyboard Controls
- **Arrow Keys**: Move your character (North, South, East, West) or aim AOE spells.
- **[A]**: Melee Attack (in combat).
- **[G]**: Gather nearby resources (trees, rocks, herbs).
- **[F]**: Toggle Torch (illuminates dark dungeons and night).
- **[Q] / [E]**: Cast your bound Spells / Skills.
- **[C]**: Character Stats sheet.
- **[I]**: Inventory & Equipment.
- **[S]**: Spells & Skills book.
- **[R]**: Crafting & Blueprints workbench.
- **[P]**: Passive Skill Tree.
- **[J]**: Quest Journal.
- **[Escape]**: Close any open modal or cancel targeting.

### Terminal Commands
Type these into the command line at the bottom:
- `/help`: Display in-game commands list.
- `/say <message>`: Speak to adventurers in your current zone.
- `/shout <message>`: Shout across the entire realm.
- `/who`: List all online players, levels, and zones.
- `/look`: Examine the current tile and list nearby adventurers.
- `/time`: Inspect the current server synchronized world clock and day/night status.
- `/gather`: Harvest surrounding resources.
- `/rest`: Recover HP and MP out of combat.
- `/torch`: Toggle torch lighting.
- `/respawn`: Return to your bound home city if defeated.
