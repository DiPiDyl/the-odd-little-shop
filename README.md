# The Odd Little Shop — Digital Collectible Card Game

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue.svg)](https://pages.github.com/)
[![Language: English](https://img.shields.io/badge/Language-English%20Only-green.svg)](#)
[![Test Suite: Passing](https://img.shields.io/badge/Tests-11%20Passed-brightgreen.svg)](test/testEngine.html)

> A deep, tactile, and cozy digital collectible card game (CCG) & turn-based 5-lane battler where you manage a whimsical antique shop filled with living, eccentric merchandise.

---

## 🌟 The Fantasy
In **The Odd Little Shop**, you manage a warm, slightly chaotic shop of magical oddities. But the inventory isn't inanimate—every curio is alive with attitude and purpose. An obstinate armchair acts as a loyal bodyguard; an anxious candle warms its neighbors; a grumpy toaster spits hot crumbs; and lonely socks yearn for their lost pairs.

When rival hawkers, unruly imps, and strict inspectors cause trouble, you step behind the counter, manage your **Mana Crystals**, and deploy your living stock across **5 lanes** to defend the shop.

---

## 🎮 Core Game Systems

### 1. 5-Lane Battlefield & Tactile Combat
- **Arched Fanned-Out Hand:** Naturally curved hand with physical perspective, hover lifting, and dynamic playable mana auras.
- **Turn-Based Mana Progression:** Starts with Mana on Turn 1, scaling up to 10 crystals, completely refreshing every round.
- **Visual Storytelling:** No bulky text combat logs! Direct floating damage numbers (`-4`, `+2`), camera screen shakes, hit squash, and lane-wide projectile casts.
- **Unit Liquidation (Selling):** Once per round during planning, click any friendly unit on the board to sell it for instant **Coins (🪙)** and trigger special **When Sold** bonuses.
- **Shopkeeper Hero Powers & Register Meter:** Charge your register meter to unleash game-winning signature abilities.

### 2. CCG Keyword & Effect Engine
- **🛡️ Taunt:** Enemies cannot strike your Hero while a Taunt minion defends the counter.
- **⚡ Rush:** Attacks opposing enemy units immediately on the turn summoned.
- **✨ Divine Shield:** Absorbs the first instance of incoming damage completely.
- **🩸 Lifesteal:** Restores Health to your Hero equal to any damage dealt.
- **📢 Battlecry:** Triggers an immediate bonus ability when played from your hand.
- **💀 Deathrattle:** Triggers a final bonus effect when destroyed or crumbled.

### 3. 🔬 The Card Lab (Custom Card Creator Studio)
- **Live Interactive WYSIWYG Preview:** See your card update instantly as you change names, mana costs, attack, health, durability, rarity, and keywords.
- **Support for Minions, Spells & Weapons:** Design living creatures, instant magical tricks, or personal shop tools with durability.
- **Guided Effect Constructor:** Select triggers (*Battlecry*, *Deathrattle*, *Start of Turn*) and actions (*Deal X Damage*, *Restore X Health*, *Draw Cards*, *Buff Minions*).
- **Idea Archive & Management:** Save ideas, duplicate, edit, delete, and test custom cards in practice combat.

### 4. 📖 Card Archives & Scrap Crafting
- **Comprehensive Library:** Filter by Faction (*Cozy Counter*, *Midnight Bazaar*, *Lab Curios*), Rarity (*Common*, *Rare*, *Epic*, *Legendary*), Mana Cost (*0 to 7+*), and Type (*Minion*, *Spell*, *Weapon*).
- **Inspect Card Modal:** Large high-resolution card view with lore flavor text and keyword breakdowns.
- **Scrap Economy:** Disenchant duplicate or unwanted cards into **Scrap (⚙️)**, and craft any missing card in the catalog.

### 5. 🎒 20-Card Deckbuilder
- **Strict CCG Rules:** Requires exactly 20 cards per deck with a maximum of 2 copies per card.
- **Dynamic Mana Curve Histogram:** Real-time visual bar chart tracking cards across costs 1, 2, 3, 4, 5, 6, and 7+.
- **Rarity Distribution & Deck Validation:** Instant warnings if a deck has fewer than 20 cards.

### 6. 🎁 3D Booster Pack Opening Ceremony
- **Pack Shop:** Purchase booster packs using in-game Coins or Gems.
- **3D Foil Tear:** Smooth tear animation with golden dust particles.
- **5 Face-Down Cards:** Arc fanned cards with wax seals; click to flip individually or "Flip All".
- **Rarity Reveals & Fanfare:** Celebratory chime stingers for Epics and screen-wide golden starbursts for Legendaries.
- **Duplicate Conversion:** Extra copies beyond 2 automatically crumble into bonus Scrap (`⚙️ +25`).

### 7. 📜 Profile, Quests & Progression
- **Shopkeeper Dossier:** Track player level, XP progress bar, rank ladder stars, and avatar selection.
- **Career Statistics:** Total Games Played, Wins, Losses, Win Rate %, Packs Opened, and Cards Crafted.
- **Active Quests:** Daily missions (*Cozy Conquest*, *Midnight Deal*, *Arcane Restock*) with claimable rewards.
- **Achievements Showcase:** Unlock honors like *Curio Collector*, *First Liquidation*, and *Mad Inventor*.
- **7-Day Login Streak:** Claim daily login rewards including coins, gems, and curio packs.

### 8. 🔊 Web Audio Procedural Sound Engine
- 100% self-contained synthesized Web Audio API sound effects—no external MP3 downloads required!
- Dedicated sounds for: button clicks, card hover, card plays, melee thumps, blade whooshes, arcane blasts, coin clinks, pack tears, and legendary fanfares.

---

## 🛠️ Architecture & Project Structure

```
the-odd-little-shop/
├── css/
│   └── styles.css             # Comprehensive responsive 16:9 storybook design system
├── index.html                 # Main application entry point
├── src/
│   ├── audio/
│   │   └── soundEffects.js    # Procedural Web Audio API sound synthesizer
│   ├── data/
│   │   ├── cardsCozyCounter.js    # Cozy Counter card definitions
│   │   ├── cardsMidnightBazaar.js # Midnight Bazaar card definitions
│   │   ├── enemies.js         # Boss & rival merchant encounters
│   │   ├── packSystem.js      # Booster pack distribution & drop probabilities
│   │   ├── pawnShop.js        # NPC barter encounters & haggling logic
│   │   ├── relics.js          # Passive artifacts
│   │   └── shopkeepers.js     # Hero portraits, stats, abilities, and signature powers
│   ├── engine/
│   │   ├── aiOpponent.js      # Heuristic AI opponent lane planner
│   │   ├── cardModel.js       # Card instance factory, CCG types, and keywords
│   │   ├── combatEngine.js    # Deterministic 5-lane combat state machine & resolution
│   │   └── deckManager.js     # Continuous cycling draw pile, hand, and discard pile
│   ├── save/
│   │   └── saveManager.js     # LocalStorage versioned persistence (Schema V2.5)
│   └── ui/
│       ├── animationManager.js   # Visual FX, floating text, camera shake, and death crumble
│       ├── cardLabScreen.js      # The Card Lab custom card creator studio
│       ├── collectionScreen.js   # Card catalog, detail inspection, and scrap crafting
│       ├── deckbuilderScreen.js  # 20-card deck curation & mana curve histogram
│       ├── gameApp.js            # Master application router & state controller
│       ├── mainMenuScreen.js     # Lobby hub, battle mode selector, and daily quests
│       ├── packOpeningScreen.js  # 3D pack opening ceremony & shop
│       ├── pawnShopModal.js      # Barter & haggling modal
│       ├── profileScreen.js      # Player dossier, career records, and achievements
│       ├── settingsModal.js      # Sound volume, reduced motion, and data reset
│       └── tutorialModal.js      # Step-by-step illustrated rules guide
└── test/
    └── testEngine.html        # Automated test suite (11 comprehensive tests)
```

---

## 🧪 Testing

The automated test suite runs in any browser and headlessly via Edge or Chrome:
```powershell
Start-Process msedge.exe -ArgumentList @("--headless=new", "--allow-file-access-from-files", "--virtual-time-budget=8000", "--dump-dom", "file:///path/to/the-odd-little-shop/test/testEngine.html")
```

The suite validates:
1. Continuous deck loop auto-reshuffle
2. 5-Lane battlefield initialization
3. Minion placement and mana deduction
4. Unit liquidation and "When Sold" bonus triggers
5. Selling limits (max 1 sale per round)
6. AI Opponent heuristic counter-play
7. Booster pack generation and duplicate scrap conversion
8. Save schema V2.5 backward-compatibility
9. Keyword execution (Divine Shield absorption & Lifesteal hero recovery)
10. Card Lab custom card model and persistence
11. Crafting and disenchanting scrap economy

---

## 🚀 Live Demo & Deployment

The game is hosted for free on GitHub Pages:
- **Live URL:** [https://dipidyl.github.io/the-odd-little-shop/](https://dipidyl.github.io/the-odd-little-shop/)
- **Repository:** [https://github.com/DiPiDyl/the-odd-little-shop](https://github.com/DiPiDyl/the-odd-little-shop)

---

## 📄 License
This project is open-source and released under the **MIT License**.
