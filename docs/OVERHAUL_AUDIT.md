# Technical & Visual Overhaul Audit: The Odd Little Shop

> **Document Version:** 1.0.0  
> **Date:** 2026-09-25  
> **Objective:** Comprehensive systems, gameplay, AI, economy, and visual presentation overhaul to transform the prototype into a commercial-grade, fully playable, cozy fantasy roguelite deckbuilder.

---

## 1. Executive Summary & Root Cause Analysis

The initial prototype proved the viability of the 5-lane architecture and data-driven card definition. However, several critical systems were either incomplete, desynchronized, or absent:

| Subsystem | Current State | Root Cause / Issue | Impact on Player Experience |
|---|---|---|---|
| **Opponent AI** | ❌ Non-responsive / passive | In `combatEngine.js`, `openTheShop()` called `executeCombatResolution()` synchronously before the AI timeout in `gameApp.js` could execute. Furthermore, AI had a guard `if (phase !== 'PLANNING') return;` which instantly failed because the phase had already shifted to `OPEN_SHOP` / `RESOLUTION`. | Battles felt like hitting a practice dummy; player was not threatened. |
| **Turn Structure** | ⚠️ Rushed / Ambiguous | No discrete `AI_PLANNING` phase visible to the player. Combat resolution was instantaneous with no visual pacing, step-by-step clashes, or animations. | Lack of clarity on what caused damage or deaths; lack of tactical tension. |
| **Selling Mechanic** | ❌ Missing entirely | Selling units during planning phase was not implemented in the engine, data models, or UI. | Missed the core shopkeeper fantasy of liquidating inventory for tactical coins. |
| **Packs & Crafting** | ❌ Missing entirely | Card collection was purely static with all cards pre-unlocked; no card packs, no pack opening ritual, no duplicates/scrap economy. | Progression loop had zero dopamine hit or long-term motivation. |
| **Pawn Shop** | ❌ Missing entirely | No quirky NPC barter/haggling encounters between combats. | World felt empty of character. |
| **Main Menu & HUD** | ⚠️ Minimalist / Webapp feel | Direct drop into battle arena with plain buttons; lacked the requested 16:9 storybook cartoon main menu with rival shopkeepers, missions, daily rewards, and coins/gems HUD. | Looked like a tech demo rather than a polished indie game. |
| **Deckbuilder** | ⚠️ Basic collection modal | Read-only modal with no 20-card deck constraints, no mana curve graph, no rarity breakdown, no active deck curation. | No strategic pre-run deck customization. |
| **Animations & Juice** | ⚠️ Static DOM elements | Missing attack lunges, damage numbers, sell coin bursts, death poofs, card hover tilts, and counter bell squash/stretch. | Combat lacked visceral and emotional satisfaction. |

---

## 2. Detailed Technical Audit of Existing Codebase

### 2.1 Engine (`src/engine/combatEngine.js`)
- **Strengths:** 
  - Pure state-machine design with 5 lanes, health tracking, and event emission.
  - Continuous deck loop logic in `deckManager.js` functions properly (auto-reshuffle on empty draw pile).
- **Flaws & Required Refactors:**
  1. **Phase Machine Desynchronization:** Introduce explicit asynchronous phases:
     `ROUND_START` ➔ `DRAW` ➔ `PLAYER_PLANNING` ➔ `OPPONENT_PLANNING` (AI plays with visual cadence) ➔ `OPEN_THE_SHOP` ➔ `STEP_BY_STEP_RESOLUTION` (Lane 1 through 5 with attack delays and animations) ➔ `ROUND_END`.
  2. **Add Unit Selling:**
     - `sellUnit(isPlayer, laneIndex)`: checks limit (1 per round), calculates sale value from cost + tags + relics, grants Coins, triggers `onSold(unit, engine)`, removes unit to `soldZone`, emits `unit_sold`.
  3. **Event Queue Animation Driver:**
     - Replace instantaneous loops with an async/await or sequenced Event Queue so attacks visually lunge, damage numbers fly, and casualties crumble before the next lane clashes.

### 2.2 AI Engine (`src/engine/aiOpponent.js`)
- **Flaws & Required Refactors:**
  1. Decouple AI thinking into sequential actions:
     - Check signature / kassa meter.
     - Evaluate selling low-health or high-value units if economically advantageous.
     - Evaluate lane threat scoring (blocking player attackers or exploiting unblocked lanes).
     - Play cards on-curve with visual delays.
     - Use Shopkeeper active abilities.
  2. Remove phase blocking bugs so AI reliably executes during `OPPONENT_PLANNING`.

### 2.3 Data Layer (`src/data/`)
- **Cards (`cardsCozyCounter.js`, `cardsMidnightBazaar.js`):**
  - Add explicit `saleValue` calculation rule (e.g. `Math.max(1, Math.floor(cost * 1.5))`).
  - Add "When Sold" trigger effects on designated economy items (e.g., *Antique Lamp*, *Fragile China*, *Loyal Footstool*).
  - Prepare data structures for scaling towards 60+ cards per faction.
- **Pawn Shop (`pawnShop.js`):**
  - New data module for NPC encounters (*The Collector*, *The Traveler*, *The Hedge Witch*, *The Student*, etc.) with Buy, Sell, Trade, Mystery, and Haggling rules.
- **Packs & Progression (`packSystem.js`):**
  - 5-card booster packs (Cozy Pack, Midnight Pack, Oddity Pack), rarity drop tables, duplicate conversion to Scrap, and crafting system.

### 2.4 User Interface & Visual Presentation (`src/ui/`, `css/styles.css`)
- **Main Menu System (`src/ui/mainMenu.js`):**
  - 16:9 storybook cartoon presentation.
  - Top HUD: Player avatar, Level, Coins, Gems, Mail, Settings.
  - Left: Stacked mission cards (Cozy Quest, Midnight Deal) with progress bars.
  - Center: Dominant **BATTLE** panel with rival shopkeeper art (*Barnaby Finch* vs *Madame Vespera*), cartoon energy sparkles, and rank progression bar.
  - Right: Daily Reward card, Event/News card, Shop teaser, Streak tracker.
  - Bottom: Navigation bar for Collection, Packs, Shop, and Friends ("Coming Soon").
- **Deckbuilder Screen (`src/ui/deckbuilder.js`):**
  - Left panel: Active 20-card deck with count `20/20`, rarity counts, and dynamic Energy curve histogram (1, 2, 3, 4, 5+).
  - Right panel: Permanent collection grid with faction tabs, cost filters, rarity filters, search, and add/remove buttons.
- **Pack Opening Ritual (`src/ui/packOpening.js`):**
  - Cozy cartoon booster pack presentation; click to tear/unwrap; 5 cards presented face-down; click to flip with rarity glows and chime sounds; duplicate scrap indicators.
- **Battle Arena & Juice:**
  - Floating animated damage numbers (`-X` red bounce, `+X` green float).
  - Attack lunge animations toward opposing lane or shopkeeper portrait.
  - Dedicated "SELL" drawer/drop target on the counter with coin flying particles.
  - Interactive "OPEN THE SHOP" brass bell with tactile squash/bounce.

---

## 3. What We Keep vs. What We Overhaul

### Kept & Preserved:
- ✅ Independent project isolation (`the-odd-little-shop`, separate GitHub repo).
- ✅ Core 5-lane board concept and direct face attack mechanics.
- ✅ Continuous deck loop architecture (auto-reshuffle discard into draw pile).
- ✅ Asymmetrical faction themes (The Cozy Counter vs The Midnight Bazaar).
- ✅ Synthesized Web Audio API soundscape (zero heavy external audio dependencies).
- ✅ Zero-cost, 100% offline-compatible, GitHub Pages ready architecture.

### Overhauled & Upgraded:
- 🔄 **Turn Engine & Asynchronous Combat Resolution:** Step-by-step visual clashes with animations.
- 🔄 **Opponent AI:** Fixed trigger pipeline so AI actively analyzes board, plays cards, uses abilities, and sells.
- 🔄 **New Pawn Shop & Unit Selling Mechanics:** Genuine shopkeeper economic strategy.
- 🔄 **New 16:9 Cartoon Main Menu & HUD:** High-polish, playful cartoon visual identity.
- 🔄 **New Pack Opening & Scrap Crafting System:** Rewarding card collecting progression.
- 🔄 **New 20-Card Deckbuilder with Curve Visualization.**
