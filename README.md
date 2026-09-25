# The Odd Little Shop

> A cozy fantasy roguelite deckbuilder & turn-based 5-lane card battler where you run a magical antique shop filled with living, eccentric merchandise.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue.svg)](https://pages.github.com/)

---

## 🌟 The Fantasy
In *The Odd Little Shop*, you manage a warm, slightly chaotic shop of magical oddities. But the goods aren't inanimate objects—they are alive with attitudes and personalities. An obstinate armchair acts as a loyal bodyguard; an anxious candle warms its neighbors; an irritable toaster sparks when crowded; and lost socks yearn for their partners.

When inspectors, rival hawkers, and unruly customers cause trouble, you step behind the counter and deploy your living inventory across **5 lanes** to defend the shop.

## ⚔️ Core Gameplay Features
- **5-Lane Tactical Clashes:** Direct clashes, unblocked face damage, Taunt defenses, and adjacency combos.
- **Continuous Deck Cycling:** Draw fresh cards each round (`Draw -> Plan -> Play -> Shopkeeper -> Open The Shop -> Resolve -> Draw`). Decks never run dry; discard piles reshuffle automatically.
- **Two Asymmetrical Factions:**
  - **The Cozy Counter:** Warmth, healing, durability, adjacency buffs, and crafted upgrades.
  - **The Midnight Bazaar:** Reclaim, discard synergies, secondhand boons, cursed bargains, and high-tempo recursion.
- **Shopkeepers with Personality:** Active tactical abilities and a Kassa/Momentum meter triggering tide-turning Signature Abilities.
- **Roguelite Exploration:** Branching map encounters, card drafting, eccentric relics, and act bosses with lane-bending mechanics.
- **Permanent Collection:** 120+ unique cards architecture with local save persistence.
- **100% Free & Open Source:** Zero microtransactions, zero ads, runs anywhere directly in the browser and hosted on GitHub Pages.

---

## 📖 Documentation
Detailed game rules, deterministic combat state machines, and card specifications are documented in:
- [`docs/GAME_DESIGN_DOCUMENT.md`](docs/GAME_DESIGN_DOCUMENT.md)

---

## 🛠️ Project Structure
```
the-odd-little-shop/
├── docs/
│   └── GAME_DESIGN_DOCUMENT.md
├── src/
│   ├── engine/          # Deterministic combat, lane resolution, turn state machine
│   ├── data/            # 120+ card definitions, Shopkeepers, relics, enemies
│   └── ui/              # Cozy storybook visual renderer, board, counter bell
├── .gitignore
├── LICENSE
└── README.md
```
