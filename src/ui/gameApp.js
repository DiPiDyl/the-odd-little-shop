// The Odd Little Shop — Master Application Controller & Router (Overhauled)
import { CombatEngine, CombatPhase } from "../engine/combatEngine.js";
import { AIOpponent } from "../engine/aiOpponent.js";
import { createCardInstance } from "../engine/cardModel.js";
import { COZY_COUNTER_CARDS } from "../data/cardsCozyCounter.js";
import { MIDNIGHT_BAZAAR_CARDS } from "../data/cardsMidnightBazaar.js";
import { ENEMY_ENCOUNTERS } from "../data/enemies.js";
import { RELICS } from "../data/relics.js";
import { soundFx } from "../audio/soundEffects.js";
import { SaveManager } from "../save/saveManager.js";

import { MainMenuScreen } from "./mainMenuScreen.js";
import { DeckbuilderScreen } from "./deckbuilderScreen.js";
import { PackOpeningScreen } from "./packOpeningScreen.js";
import { PawnShopModal } from "./pawnShopModal.js";

export class GameApp {
  constructor() {
    this.saveData = SaveManager.loadSave();
    this.currentScreen = "main_menu"; // 'main_menu', 'battle', 'deckbuilder', 'packs'

    this.allCards = [...COZY_COUNTER_CARDS, ...MIDNIGHT_BAZAAR_CARDS];
    this.currentFaction = "cozy_counter";
    this.currentEnemyId = "rowdy_imp";

    this.engine = null;
    this.ai = new AIOpponent("normal");
    this.selectedHandCard = null;
    this.selectedAbility = null;
    this.selectedBoardLane = null; // For inspecting / selling

    // Sub-screens
    this.mainMenu = new MainMenuScreen(this);
    this.deckbuilder = new DeckbuilderScreen(this);
    this.packScreen = new PackOpeningScreen(this);
    this.pawnModal = new PawnShopModal(this);

    this.setupGlobalEvents();
    this.render();
  }

  setupGlobalEvents() {
    window.addEventListener("click", () => {
      soundFx.init();
    }, { once: true });
  }

  showScreen(screenName) {
    this.currentScreen = screenName;
    soundFx.playCardSwoosh();
    this.render();
  }

  saveState() {
    SaveManager.save(this.saveData);
  }

  startSelectedBattle(faction = "cozy_counter", enemyEncounterId = "rowdy_imp") {
    this.currentFaction = faction;
    this.currentEnemyId = enemyEncounterId;

    const enemyData = ENEMY_ENCOUNTERS[enemyEncounterId];
    const playerShopkeeperId = faction === "cozy_counter" ? "cozy_curator" : "midnight_broker";
    const enemyShopkeeperId = enemyData.shopkeeperId;

    // Load active custom 20-card deck
    const deckIds = this.saveData.decks[faction] || [];
    const allFactionCards = faction === "cozy_counter" ? COZY_COUNTER_CARDS : MIDNIGHT_BAZAAR_CARDS;
    const playerDeckInstances = deckIds.map(id => {
      const template = allFactionCards.find(c => c.id === id) || allFactionCards[0];
      return createCardInstance(template);
    });

    // Enemy deck instances
    const enemyCardPool = enemyData.deckFaction === "cozy_counter" ? COZY_COUNTER_CARDS : MIDNIGHT_BAZAAR_CARDS;
    const enemyDeckInstances = enemyData.deckPreset.map(cardId => {
      const template = enemyCardPool.find(c => c.id === cardId) || enemyCardPool[0];
      return createCardInstance(template);
    });

    this.engine = new CombatEngine({
      playerShopkeeperId,
      enemyShopkeeperId,
      enemyName: enemyData.name,
      enemyTitle: enemyData.title || "Rival Merchant",
      enemyEmoji: enemyData.emoji,
      enemyHealth: enemyData.maxHealth,
      specialMechanic: enemyData.specialMechanic,
      playerDeckInstances,
      enemyDeckInstances,
      initialCoins: this.saveData.currency.coins || 0,
      relics: [RELICS[0], RELICS[1]],
      aiController: this.ai
    });

    this.engine.subscribe((event, data) => this.onEngineEvent(event, data));
    this.currentScreen = "battle";
    this.render();
    this.engine.startBattle();
  }

  onEngineEvent(event, data) {
    if (event === "log") {
      this.updateLogBox();
    } else if (event === "draw_completed") {
      soundFx.playCardSwoosh();
      this.render();
    } else if (event === "board_updated" || event === "phase_changed") {
      this.render();
    } else if (event === "unit_sold") {
      soundFx.playSellRegister();
      this.saveData.currency.coins = this.engine.playerCoins;
      this.saveState();
      this.render();
    } else if (event === "lane_clashing") {
      this.render();
    } else if (event === "lane_resolved") {
      soundFx.playDamageImpact();
      this.render();
    } else if (event === "shopkeeper_damaged") {
      soundFx.playDamageImpact();
      this.render();
    } else if (event === "shop_opened") {
      soundFx.playCounterBell();
      this.render();
    } else if (event === "battle_ended") {
      this.render();
      if (data.winner === "player") {
        this.saveData.currency.coins += 50;
        this.saveData.meta.completedRuns = (this.saveData.meta.completedRuns || 0) + 1;
        this.saveState();
      }
      setTimeout(() => {
        this.showBattleEndModal(data.winner);
      }, 1000);
    }
  }

  // --- Master Render ---

  render() {
    const appEl = document.getElementById("app");
    if (!appEl) return;

    if (this.currentScreen === "main_menu") {
      appEl.innerHTML = this.mainMenu.render();
    } else if (this.currentScreen === "deckbuilder") {
      appEl.innerHTML = this.deckbuilder.render();
    } else if (this.currentScreen === "packs") {
      appEl.innerHTML = this.packScreen.render();
    } else if (this.currentScreen === "battle") {
      this.renderBattleArena(appEl);
    }
  }

  renderBattleArena(appEl) {
    if (!this.engine) return;

    const isPlanning = this.engine.phase === CombatPhase.PLAYER_PLANNING;
    const selectedUnitOnBoard = this.selectedBoardLane !== null ? this.engine.playerLanes[this.selectedBoardLane] : null;

    appEl.innerHTML = `
      <div class="battle-arena">
        <!-- Left Sidebar: Shopkeeper Info & Deck Status -->
        <div class="sidebar-panel">
          <div class="shopkeeper-card">
            <div class="shopkeeper-portrait">${this.engine.player.emoji}</div>
            <div class="shopkeeper-name">${this.engine.player.name}</div>
            <div class="shopkeeper-title">${this.engine.player.title}</div>
            
            <!-- Health Bar -->
            <div class="meter-bar">
              <div class="meter-fill-hp" style="width: ${(this.engine.player.health / this.engine.player.maxHealth) * 100}%"></div>
              <span class="meter-label">HP: ${this.engine.player.health} / ${this.engine.player.maxHealth}</span>
            </div>

            <!-- Energy Bar -->
            <div class="meter-bar" style="margin-top: 6px;">
              <div class="meter-fill-energy" style="width: ${(this.engine.player.energy / this.engine.player.maxEnergy) * 100}%"></div>
              <span class="meter-label">Energy: ${this.engine.player.energy} / ${this.engine.player.maxEnergy}</span>
            </div>

            <!-- Kassa Meter -->
            <div class="meter-bar" style="margin-top: 6px;">
              <div class="meter-fill-kassa" style="width: ${(this.engine.player.kassa / this.engine.player.kassaMax) * 100}%"></div>
              <span class="meter-label">Kassa: ${this.engine.player.kassa} / ${this.engine.player.kassaMax}</span>
            </div>

            <div style="margin-top: 6px; font-weight: bold; font-size: 0.85rem; color: #E65100;">
              🪙 Coins: ${this.engine.playerCoins}
            </div>
          </div>

          <!-- Unit Selling Inspection Box -->
          ${selectedUnitOnBoard ? `
            <div class="sell-action-box">
              <div style="font-weight: bold; font-size: 0.85rem;">📦 Select Stock: ${selectedUnitOnBoard.name}</div>
              <div style="font-size: 0.75rem; color: #555;">Value: 🪙 ${selectedUnitOnBoard.saleValue} Coins</div>
              <button class="btn btn-sm btn-primary" style="margin-top: 6px; width: 100%;"
                ${!isPlanning || this.engine.salesThisRound.player >= this.engine.maxSalesPerRound ? 'disabled' : ''}
                onclick="window.app.sellSelectedUnit()">
                💰 SELL UNIT (+${selectedUnitOnBoard.saleValue} 🪙)
              </button>
            </div>
          ` : `
            <div style="font-size: 0.75rem; color: #888; text-align: center; border: 1px dashed #D7CCC8; padding: 6px; border-radius: 6px;">
              Click any friendly unit to inspect / sell stock (1 sale/round limit).
            </div>
          `}

          <!-- Shopkeeper Abilities -->
          <div class="abilities-list">
            <h4 style="font-size: 0.82rem; color: var(--wood-med);">ABILITIES</h4>
            ${this.engine.player.abilities.map(ab => `
              <button class="ability-btn" 
                ${this.engine.player.energy < ab.cost || !isPlanning ? 'disabled' : ''}
                onclick="window.app.onAbilityClicked('${ab.id}')">
                <strong>${ab.emoji} ${ab.name}</strong> (${ab.cost} Energy)<br/>
                <span style="font-size: 0.7rem; color: #555;">${ab.description}</span>
              </button>
            `).join('')}

            <!-- Signature Ability -->
            <button class="ability-btn signature-btn"
              ${this.engine.player.kassa < this.engine.player.kassaMax || !isPlanning ? 'disabled' : ''}
              onclick="window.app.onSignatureClicked()">
              <strong>${this.engine.player.signature.emoji} ${this.engine.player.signature.name}</strong> (Full Kassa)<br/>
              <span style="font-size: 0.7rem; color: #555;">${this.engine.player.signature.description}</span>
            </button>
          </div>

          <!-- Deck / Discard Status -->
          <div class="piles-status">
            <div>🎴 Draw: <strong>${this.engine.player.deckManager.drawPile.length}</strong></div>
            <div>🗑️ Discard: <strong>${this.engine.player.deckManager.discardPile.length}</strong></div>
          </div>
          <button class="btn btn-sm" onclick="window.app.showScreen('main_menu')">🏳️ Surrender / Menu</button>
        </div>

        <!-- Center Battlefield (5 Lanes) -->
        <div class="battlefield-container">
          <!-- Opponent Counter Status -->
          <div class="enemy-area">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 2rem;">${this.engine.enemy.emoji}</span>
              <div>
                <strong>${this.engine.enemy.name}</strong>
                <div style="font-size: 0.8rem; color: #666;">${this.engine.enemy.title}</div>
              </div>
            </div>
            <div style="width: 200px;">
              <div class="meter-bar">
                <div class="meter-fill-hp" style="width: ${(this.engine.enemy.health / this.engine.enemy.maxHealth) * 100}%"></div>
                <span class="meter-label">HP: ${this.engine.enemy.health} / ${this.engine.enemy.maxHealth}</span>
              </div>
            </div>
          </div>

          <!-- The 5 Combat Lanes -->
          <div class="lanes-board">
            <div class="lanes-row">
              ${this.renderLanes(this.engine.enemyLanes, false)}
            </div>

            <div class="lane-divider">
              ⚔️ 5-LANE CLASH COUNTER ⚔️
            </div>

            <div class="lanes-row">
              ${this.renderLanes(this.engine.playerLanes, true)}
            </div>
          </div>

          <!-- Player Controls: Hand & Bell Action Bar -->
          <div class="player-controls">
            <div class="action-bar">
              <div>
                <span style="font-weight: bold; font-size: 1rem;">Phase: ${this.engine.phase}</span>
                <span style="margin-left: 12px; color: var(--wood-med);">Round: ${this.engine.roundNumber}</span>
              </div>
              <button class="btn-open-shop" 
                ${!isPlanning ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
                onclick="window.app.onOpenTheShopClicked()">
                🔔 OPEN THE SHOP!
              </button>
            </div>

            <div class="hand-container">
              ${this.renderHandCards()}
            </div>
          </div>
        </div>

        <!-- Right Sidebar: Log & Relics -->
        <div class="sidebar-panel log-panel">
          <h4 style="font-size: 0.85rem; color: var(--wood-med);">ACTIVE RELICS</h4>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${this.engine.relics.map(r => `
              <div style="background: #FFF; border: 1px solid var(--amber-gold); border-radius: 6px; padding: 4px 8px; font-size: 0.8rem;" title="${r.description}">
                ${r.emoji} ${r.name}
              </div>
            `).join('')}
          </div>

          <h4 style="font-size: 0.85rem; color: var(--wood-med); margin-top: 8px;">SHOP COMBAT LOG</h4>
          <div class="event-log-box" id="event-log-box">
            ${this.engine.eventLogs.slice(-25).reverse().map(msg => `
              <div class="log-entry">${msg}</div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderLanes(lanes, isPlayer) {
    return lanes.map((unit, idx) => {
      const isLocked = isPlayer && this.engine.lockedPlayerLanes[idx];
      const isSelectable = isPlayer && this.selectedHandCard && this.selectedHandCard.type === "item" && unit === null && !isLocked;
      const isLaneSelected = isPlayer && this.selectedBoardLane === idx;

      if (isLocked) {
        return `
          <div class="lane-slot locked">
            <span class="lane-badge">LANE ${idx + 1}</span>
            <div style="font-size: 1.8rem;">🚫</div>
            <div style="font-size: 0.7rem; font-weight: bold; color: var(--danger-red);">CONDEMNED</div>
          </div>
        `;
      }

      if (unit) {
        const extraClass = unit.keywords.includes("taunt") ? "taunt" : (unit.hasSwift ? "swift" : "");
        return `
          <div class="lane-slot ${isLaneSelected ? 'selected-lane' : ''}" onclick="window.app.onLaneSlotClicked(${idx}, ${isPlayer})">
            <span class="lane-badge">LANE ${idx + 1}</span>
            <div class="card-unit ${extraClass}">
              <div class="card-header">
                <span class="card-cost">${unit.cost}</span>
                <span style="font-size: 0.65rem; text-transform: uppercase;">${unit.tags[0] || 'Item'}</span>
              </div>
              <div class="card-emoji">${unit.emoji}</div>
              <div class="card-name">${unit.name}</div>
              <div class="card-stats">
                <span class="stat-atk">⚔️ ${unit.attack + (unit.tempAttackBonus || 0)}</span>
                <span class="stat-hp">❤️ ${unit.health}</span>
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="lane-slot ${isSelectable ? 'selectable' : ''}" onclick="window.app.onLaneSlotClicked(${idx}, ${isPlayer})">
          <span class="lane-badge">LANE ${idx + 1}</span>
          <span style="font-size: 0.75rem; color: #9E9E9E;">${isSelectable ? 'Click to Place' : 'Empty'}</span>
        </div>
      `;
    }).join('');
  }

  renderHandCards() {
    const hand = this.engine.player.deckManager.hand;
    if (hand.length === 0) {
      return `<div style="padding: 16px; color: #757575;">No cards in hand.</div>`;
    }

    return hand.map(card => {
      const isSelected = this.selectedHandCard && this.selectedHandCard.instanceId === card.instanceId;
      const canAfford = this.engine.player.energy >= card.cost;
      return `
        <div class="hand-card ${isSelected ? 'selected' : ''}" 
          style="${!canAfford ? 'opacity: 0.6;' : ''}"
          onclick="window.app.onHandCardClicked('${card.instanceId}')">
          <div class="card-header">
            <span class="card-cost">${card.cost}</span>
            <span style="font-size: 0.65rem; color: #666;">${card.type}</span>
          </div>
          <div class="card-emoji">${card.emoji}</div>
          <div class="card-name">${card.name}</div>
          <div class="card-desc">${card.description}</div>
          ${card.type === 'item' ? `
            <div class="card-stats">
              <span class="stat-atk">⚔️ ${card.attack}</span>
              <span class="stat-hp">❤️ ${card.health}</span>
            </div>
          ` : '<div style="height: 14px;"></div>'}
        </div>
      `;
    }).join('');
  }

  updateLogBox() {
    const box = document.getElementById("event-log-box");
    if (box) {
      box.innerHTML = this.engine.eventLogs.slice(-25).reverse().map(msg => `
        <div class="log-entry">${msg}</div>
      `).join('');
    }
  }

  // --- User Interactions ---

  onHandCardClicked(instanceId) {
    if (this.engine.phase !== CombatPhase.PLAYER_PLANNING) return;

    const card = this.engine.player.deckManager.hand.find(c => c.instanceId === instanceId);
    if (!card) return;

    if (this.selectedHandCard && this.selectedHandCard.instanceId === instanceId) {
      this.selectedHandCard = null;
    } else {
      this.selectedHandCard = card;
      this.selectedBoardLane = null;
      soundFx.playWoodClunk();
      if (card.type === "trick") {
        const success = this.engine.playCard(true, card.instanceId);
        if (success) {
          soundFx.playHealChime();
          this.selectedHandCard = null;
        }
      }
    }
    this.render();
  }

  onLaneSlotClicked(laneIndex, isPlayer) {
    if (!isPlayer) return;

    if (this.selectedHandCard) {
      if (this.selectedHandCard.type === "item") {
        const success = this.engine.playCard(true, this.selectedHandCard.instanceId, laneIndex);
        if (success) {
          soundFx.playWoodClunk();
          this.selectedHandCard = null;
        }
      } else if (this.selectedHandCard.type === "upgrade") {
        const targetItem = this.engine.playerLanes[laneIndex];
        if (targetItem) {
          const success = this.engine.playCard(true, this.selectedHandCard.instanceId, laneIndex, targetItem);
          if (success) {
            soundFx.playHealChime();
            this.selectedHandCard = null;
          }
        }
      }
    } else if (this.selectedAbility) {
      const success = this.engine.useShopkeeperAbility(true, this.selectedAbility, laneIndex);
      if (success) {
        soundFx.playHealChime();
        this.selectedAbility = null;
      }
    } else {
      // Toggle lane inspection for selling
      if (this.engine.playerLanes[laneIndex]) {
        this.selectedBoardLane = this.selectedBoardLane === laneIndex ? null : laneIndex;
        soundFx.playWoodClunk();
      }
    }
    this.render();
  }

  sellSelectedUnit() {
    if (this.selectedBoardLane === null) return;
    const success = this.engine.sellUnit(true, this.selectedBoardLane);
    if (success) {
      this.selectedBoardLane = null;
    }
    this.render();
  }

  onAbilityClicked(abilityId) {
    const ability = this.engine.player.abilities.find(a => a.id === abilityId);
    if (!ability) return;

    if (ability.targetType === "none") {
      this.engine.useShopkeeperAbility(true, abilityId);
      soundFx.playHealChime();
    } else {
      this.selectedAbility = abilityId;
      this.engine.log(`Selected ${ability.name}. Click a friendly item on the board.`);
    }
    this.render();
  }

  onSignatureClicked() {
    this.engine.useSignatureAbility(true);
    soundFx.playCounterBell();
    this.render();
  }

  async onOpenTheShopClicked() {
    await this.engine.openTheShop();
  }

  showCollectionModal() {
    const modalEl = document.createElement("div");
    modalEl.className = "modal-overlay";
    modalEl.id = "collection-modal";
    modalEl.innerHTML = `
      <div class="modal-content">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--wood-light); padding-bottom: 8px;">
          <h2>📚 Master Collection (30 / 120+ Initial Catalog)</h2>
          <button class="btn" onclick="document.getElementById('collection-modal').remove()">Close ✖</button>
        </div>
        <p style="margin-top: 8px; color: var(--wood-med); font-size: 0.9rem;">
          Explore all permanent cards from <strong>The Cozy Counter</strong> and <strong>The Midnight Bazaar</strong>.
        </p>
        <div class="collection-grid">
          ${this.allCards.map(c => `
            <div class="hand-card" style="width: 100%; height: 160px; cursor: default;">
              <div class="card-header">
                <span class="card-cost">${c.cost}</span>
                <span style="font-size: 0.65rem; color: #888;">${c.faction.replace('_', ' ')}</span>
              </div>
              <div class="card-emoji">${c.emoji}</div>
              <div class="card-name">${c.name}</div>
              <div class="card-desc">${c.description}</div>
              ${c.type === 'item' ? `
                <div class="card-stats">
                  <span class="stat-atk">⚔️ ${c.attack}</span>
                  <span class="stat-hp">❤️ ${c.health}</span>
                </div>
              ` : '<div style="height: 14px;"></div>'}
            </div>
          `).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);
  }

  showSettingsModal() {
    alert("Audio Settings:\n• Web Audio Sound Effects: Enabled (100%)\n• Master Volume: 100%\n• Reduced Motion: Off\n• Save Version: 2.0 (Local)");
  }

  showBattleEndModal(winner) {
    const modalEl = document.createElement("div");
    modalEl.className = "modal-overlay";
    modalEl.id = "battle-end-modal";
    const isWin = winner === "player";

    modalEl.innerHTML = `
      <div class="modal-content" style="max-width: 500px; text-align: center;">
        <div style="font-size: 3.5rem; margin-bottom: 8px;">${isWin ? '🏆' : '💀'}</div>
        <h2>${isWin ? 'Shop Victorious!' : 'Shop Overrun!'}</h2>
        <p style="margin: 12px 0; color: #555;">
          ${isWin ? 'Your living merchandise stood ground and protected the counter! Awarded +50 Coins 🪙!' : 'The dispute overwhelmed your stock. Tidy up the counter and try again!'}
        </p>
        <button class="btn btn-primary" style="font-size: 1.1rem; padding: 10px 24px;"
          onclick="document.getElementById('battle-end-modal').remove(); window.app.showScreen('main_menu');">
          Return to Shop Hub ➔
        </button>
      </div>
    `;
    document.body.appendChild(modalEl);
  }
}

// Bootstrap
window.addEventListener("DOMContentLoaded", () => {
  window.app = new GameApp();
});
