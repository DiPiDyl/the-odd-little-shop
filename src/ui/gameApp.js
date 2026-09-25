// The Odd Little Shop — Master UI & Game Controller
import { CombatEngine, CombatPhase } from "../engine/combatEngine.js";
import { AIOpponent } from "../engine/aiOpponent.js";
import { createCardInstance } from "../engine/cardModel.js";
import { COZY_COUNTER_CARDS } from "../data/cardsCozyCounter.js";
import { MIDNIGHT_BAZAAR_CARDS } from "../data/cardsMidnightBazaar.js";
import { SHOPKEEPERS } from "../data/shopkeepers.js";
import { ENEMY_ENCOUNTERS } from "../data/enemies.js";
import { RELICS } from "../data/relics.js";
import { soundFx } from "../audio/soundEffects.js";
import { SaveManager } from "../save/saveManager.js";

export class GameApp {
  constructor() {
    this.saveData = SaveManager.loadSave();
    this.engine = null;
    this.ai = new AIOpponent("normal");
    this.selectedHandCard = null;
    this.selectedAbility = null;
    this.allCards = [...COZY_COUNTER_CARDS, ...MIDNIGHT_BAZAAR_CARDS];
    this.currentFaction = "cozy_counter";
    this.currentEnemyId = "rowdy_imp";

    this.initBattle();
    this.setupGlobalEvents();
  }

  initBattle(faction = "cozy_counter", enemyEncounterId = "rowdy_imp") {
    this.currentFaction = faction;
    this.currentEnemyId = enemyEncounterId;

    const enemyData = ENEMY_ENCOUNTERS[enemyEncounterId];
    const playerShopkeeperId = faction === "cozy_counter" ? "cozy_curator" : "midnight_broker";
    const enemyShopkeeperId = enemyData.shopkeeperId;

    // Build 20-card starting deck from faction cards
    const cardPool = faction === "cozy_counter" ? COZY_COUNTER_CARDS : MIDNIGHT_BAZAAR_CARDS;
    const playerDeckInstances = [];
    for (let i = 0; i < 20; i++) {
      const template = cardPool[i % cardPool.length];
      playerDeckInstances.push(createCardInstance(template));
    }

    // Build enemy deck instances
    const enemyCardPool = enemyData.deckFaction === "cozy_counter" ? COZY_COUNTER_CARDS : MIDNIGHT_BAZAAR_CARDS;
    const enemyDeckInstances = enemyData.deckPreset.map(cardId => {
      const template = enemyCardPool.find(c => c.id === cardId) || enemyCardPool[0];
      return createCardInstance(template);
    });

    this.engine = new CombatEngine({
      playerShopkeeperId,
      enemyShopkeeperId,
      enemyName: enemyData.name,
      enemyTitle: enemyData.title || "Rival Customer",
      enemyEmoji: enemyData.emoji,
      enemyHealth: enemyData.maxHealth,
      specialMechanic: enemyData.specialMechanic,
      playerDeckInstances,
      enemyDeckInstances,
      relics: [RELICS[0], RELICS[1]] // Start with Old Shop Bell & Lucky Jade Plant
    });

    this.engine.subscribe((event, data) => this.onEngineEvent(event, data));
    this.render();
    this.engine.startBattle();
  }

  setupGlobalEvents() {
    window.addEventListener("click", () => {
      soundFx.init(); // Unlock AudioContext on first user interaction
    }, { once: true });
  }

  onEngineEvent(event, data) {
    if (event === "log") {
      this.updateLogBox();
    } else if (event === "draw_completed") {
      soundFx.playCardSwoosh();
      this.render();
    } else if (event === "board_updated" || event === "phase_changed") {
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
      // Execute AI turn before resolution
      setTimeout(() => {
        this.ai.takeTurn(this.engine);
        this.render();
      }, 300);
    } else if (event === "battle_ended") {
      this.render();
      setTimeout(() => {
        this.showBattleEndModal(data.winner);
      }, 1000);
    }
  }

  // --- Rendering UI ---

  render() {
    const appEl = document.getElementById("app");
    if (!appEl) return;

    appEl.innerHTML = `
      <div class="battle-arena">
        <!-- Left Sidebar: Player Info & Abilities -->
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
          </div>

          <!-- Shopkeeper Abilities -->
          <div class="abilities-list">
            <h4 style="font-size: 0.85rem; color: var(--wood-med);">SHOPKEEPER ABILITIES</h4>
            ${this.engine.player.abilities.map(ab => `
              <button class="ability-btn" 
                ${this.engine.player.energy < ab.cost || this.engine.phase !== CombatPhase.PLANNING ? 'disabled' : ''}
                onclick="window.app.onAbilityClicked('${ab.id}')">
                <strong>${ab.emoji} ${ab.name}</strong> (${ab.cost} Energy)<br/>
                <span style="font-size: 0.72rem; color: #555;">${ab.description}</span>
              </button>
            `).join('')}

            <!-- Signature Ability -->
            <button class="ability-btn" style="border: 2px solid var(--amber-gold); background: #FFF9C4;"
              ${this.engine.player.kassa < this.engine.player.kassaMax || this.engine.phase !== CombatPhase.PLANNING ? 'disabled' : ''}
              onclick="window.app.onSignatureClicked()">
              <strong>${this.engine.player.signature.emoji} ${this.engine.player.signature.name}</strong> (Full Kassa)<br/>
              <span style="font-size: 0.72rem; color: #555;">${this.engine.player.signature.description}</span>
            </button>
          </div>

          <!-- Deck / Discard Status -->
          <div class="piles-status">
            <div>🎴 Draw: <strong>${this.engine.player.deckManager.drawPile.length}</strong></div>
            <div>🗑️ Discard: <strong>${this.engine.player.deckManager.discardPile.length}</strong></div>
          </div>
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
            <!-- Enemy Lanes Row -->
            <div class="lanes-row">
              ${this.renderLanes(this.engine.enemyLanes, false)}
            </div>

            <!-- Lane Divider / Clash Line -->
            <div class="lane-divider">
              ⚔️ 5-LANE CLASH COUNTER ⚔️
            </div>

            <!-- Player Lanes Row -->
            <div class="lanes-row">
              ${this.renderLanes(this.engine.playerLanes, true)}
            </div>
          </div>

          <!-- Player Controls: Hand & Bell Action Bar -->
          <div class="player-controls">
            <div class="action-bar">
              <div>
                <span style="font-weight: bold; font-size: 1.05rem;">Phase: ${this.engine.phase}</span>
                <span style="margin-left: 12px; color: var(--wood-med);">Round: ${this.engine.roundNumber}</span>
              </div>
              <button class="btn-open-shop" 
                ${this.engine.phase !== CombatPhase.PLANNING ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
                onclick="window.app.onOpenTheShopClicked()">
                🔔 OPEN THE SHOP!
              </button>
            </div>

            <!-- Hand Cards -->
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
          <div class="lane-slot" onclick="window.app.onLaneSlotClicked(${idx}, ${isPlayer})">
            <span class="lane-badge">LANE ${idx + 1}</span>
            <div class="card-unit ${extraClass}">
              <div class="card-header">
                <span class="card-cost">${unit.cost}</span>
                <span style="font-size: 0.7rem; text-transform: uppercase;">${unit.tags[0] || 'Item'}</span>
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
    if (this.engine.phase !== CombatPhase.PLANNING) return;

    const card = this.engine.player.deckManager.hand.find(c => c.instanceId === instanceId);
    if (!card) return;

    if (this.selectedHandCard && this.selectedHandCard.instanceId === instanceId) {
      this.selectedHandCard = null; // Deselect
    } else {
      this.selectedHandCard = card;
      soundFx.playWoodClunk();
      if (card.type === "trick") {
        // Immediate cast trick if self-targeting
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
    }
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

  onOpenTheShopClicked() {
    this.engine.openTheShop();
  }

  // --- Modals (Collection & Run Selection) ---

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

  showNewGameModal() {
    const modalEl = document.createElement("div");
    modalEl.className = "modal-overlay";
    modalEl.id = "new-game-modal";
    modalEl.innerHTML = `
      <div class="modal-content" style="max-width: 600px; text-align: center;">
        <h2>🏪 Choose Your Faction & Battle</h2>
        <p style="margin: 12px 0; color: #555;">Select your shopkeeping philosophy for this encounter:</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0;">
          <div style="background: #FFF; border: 2px solid var(--cozy-green); border-radius: 8px; padding: 16px; cursor: pointer;"
            onclick="window.app.startNewBattle('cozy_counter', 'rowdy_imp')">
            <div style="font-size: 3rem;">🕯️</div>
            <h3>The Cozy Counter</h3>
            <p style="font-size: 0.8rem; color: #666; margin-top: 6px;">
              Warmth, healing, adjacency buffs, and durable household items.
            </p>
            <button class="btn btn-primary" style="margin-top: 12px;">Play Cozy Counter</button>
          </div>

          <div style="background: #FFF; border: 2px solid var(--bazaar-accent); border-radius: 8px; padding: 16px; cursor: pointer;"
            onclick="window.app.startNewBattle('midnight_bazaar', 'fussy_collector')">
            <div style="font-size: 3rem;">🌙</div>
            <h3>The Midnight Bazaar</h3>
            <p style="font-size: 0.8rem; color: #666; margin-top: 6px;">
              Reclaim, secondhand power, discard tempo, and cursed oddities.
            </p>
            <button class="btn btn-primary" style="margin-top: 12px;">Play Midnight Bazaar</button>
          </div>
        </div>

        <button class="btn" onclick="window.app.startNewBattle('cozy_counter', 'property_inspector')">
          ⚔️ Boss Encounter: The Property Inspector (Mr. Grimshaw)
        </button>
      </div>
    `;
    document.body.appendChild(modalEl);
  }

  startNewBattle(faction, enemyId) {
    const modal = document.getElementById("new-game-modal");
    if (modal) modal.remove();
    this.initBattle(faction, enemyId);
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
          ${isWin ? 'Your living merchandise stood ground and protected the counter!' : 'The dispute overwhelmed your stock. Tidy up the counter and try again!'}
        </p>
        <button class="btn btn-primary" style="font-size: 1.1rem; padding: 10px 24px;"
          onclick="document.getElementById('battle-end-modal').remove(); window.app.showNewGameModal();">
          Start Next Encounter ➔
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
