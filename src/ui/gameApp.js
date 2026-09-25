// The Odd Little Shop — Master Application Controller & Router (Hearthstone-Level Visual Polish)
import { CombatEngine, CombatPhase } from "../engine/combatEngine.js";
import { AIOpponent } from "../engine/aiOpponent.js";
import { createCardInstance } from "../engine/cardModel.js";
import { COZY_COUNTER_CARDS } from "../data/cardsCozyCounter.js";
import { MIDNIGHT_BAZAAR_CARDS } from "../data/cardsMidnightBazaar.js";
import { ENEMY_ENCOUNTERS } from "../data/enemies.js";
import { RELICS } from "../data/relics.js";
import { soundFx } from "../audio/soundEffects.js";
import { SaveManager } from "../save/saveManager.js";
import { animManager } from "./animationManager.js";

import { MainMenuScreen } from "./mainMenuScreen.js";
import { DeckbuilderScreen } from "./deckbuilderScreen.js";
import { PackOpeningScreen } from "./packOpeningScreen.js";
import { PawnShopModal } from "./pawnShopModal.js";
import { CardLabScreen } from "./cardLabScreen.js";
import { CollectionScreen } from "./collectionScreen.js";
import { ProfileScreen } from "./profileScreen.js";
import { SettingsModal } from "./settingsModal.js";
import { TutorialModal } from "./tutorialModal.js";

export class GameApp {
  constructor() {
    window.app = this;
    this.saveData = SaveManager.loadSave();
    this.currentScreen = "main_menu"; // 'main_menu', 'battle', 'deckbuilder', 'packs', 'collection', 'card_lab', 'profile'

    this.allCards = [...COZY_COUNTER_CARDS, ...MIDNIGHT_BAZAAR_CARDS];
    this.currentFaction = "cozy_counter";
    this.currentEnemyId = "rowdy_imp";

    this.engine = null;
    this.ai = new AIOpponent("normal");
    this.selectedHandCard = null;
    this.selectedAbility = null;
    this.selectedBoardLane = null; // For inspecting / selling

    // Sub-screens & Modals
    this.mainMenu = new MainMenuScreen(this);
    this.deckbuilder = new DeckbuilderScreen(this);
    this.packScreen = new PackOpeningScreen(this);
    this.pawnModal = new PawnShopModal(this);
    this.cardLab = new CardLabScreen(this);
    this.collection = new CollectionScreen(this);
    this.profile = new ProfileScreen(this);
    this.settingsModal = new SettingsModal(this);
    this.tutorialModal = new TutorialModal(this);

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

  async onEngineEvent(event, data) {
    if (event === "draw_completed") {
      soundFx.playCardSwoosh();
      this.render();
    } else if (event === "board_updated" || event === "phase_changed") {
      this.render();
    } else if (event === "unit_sold") {
      const slotEl = document.querySelector(`.player-row .lane-slot:nth-child(${data.laneIndex + 1})`);
      animManager.playSellAnimation(slotEl, data.saleCoins);
      this.saveData.currency.coins = this.engine.playerCoins;
      this.saveState();
      this.render();
    } else if (event === "lane_clashing") {
      const pSlot = document.querySelector(`.player-row .lane-slot:nth-child(${data.laneIndex + 1})`);
      const eSlot = document.querySelector(`.enemy-row .lane-slot:nth-child(${data.laneIndex + 1})`);
      const pUnit = this.engine.playerLanes[data.laneIndex];
      const eUnit = this.engine.enemyLanes[data.laneIndex];

      if (pUnit && eSlot) {
        await animManager.playAttackAnimation(pSlot, eSlot, pUnit, true);
      }
      if (eUnit && pSlot) {
        await animManager.playAttackAnimation(eSlot, pSlot, eUnit, false);
      }
    } else if (event === "damage_dealt") {
      if (data.target === "enemy_unit") {
        const slot = document.querySelector(`.enemy-row .lane-slot:nth-child(${data.laneIndex + 1})`);
        animManager.playHitReaction(slot, data.amount >= 3);
        animManager.showFloatingText(slot, `-${data.amount}`, "damage");
      } else if (data.target === "player_unit") {
        const slot = document.querySelector(`.player-row .lane-slot:nth-child(${data.laneIndex + 1})`);
        animManager.playHitReaction(slot, data.amount >= 3);
        animManager.showFloatingText(slot, `-${data.amount}`, "damage");
      } else if (data.target === "both_units") {
        const pSlot = document.querySelector(`.player-row .lane-slot:nth-child(${data.laneIndex + 1})`);
        const eSlot = document.querySelector(`.enemy-row .lane-slot:nth-child(${data.laneIndex + 1})`);
        animManager.playHitReaction(pSlot, data.pAmount >= 3);
        animManager.showFloatingText(pSlot, `-${data.pAmount}`, "damage");
        animManager.playHitReaction(eSlot, data.eAmount >= 3);
        animManager.showFloatingText(eSlot, `-${data.eAmount}`, "damage");
      } else if (data.target === "enemy_shopkeeper") {
        animManager.playShopkeeperHit("enemy", data.amount);
      } else if (data.target === "player_shopkeeper") {
        animManager.playShopkeeperHit("player", data.amount);
      }
      this.render();
    } else if (event === "unit_died") {
      const rowCls = data.isPlayer ? ".player-row" : ".enemy-row";
      const slot = document.querySelector(`${rowCls} .lane-slot:nth-child(${data.laneIndex + 1})`);
      await animManager.playDeathAnimation(slot);
      this.render();
    } else if (event === "shop_opened") {
      soundFx.playCounterBell();
      this.render();
    } else if (event === "battle_ended") {
      this.render();
      if (data.winner === "player") {
        soundFx.playLegendaryStinger();
        this.saveData.currency.coins = (this.saveData.currency.coins || 0) + 60;
        this.saveData.meta.completedRuns = (this.saveData.meta.completedRuns || 0) + 1;
        
        // Award XP & Level up check
        this.saveData.player.xp = (this.saveData.player.xp || 0) + 150;
        if (this.saveData.player.xp >= this.saveData.player.xpToNext) {
          this.saveData.player.level += 1;
          this.saveData.player.xp -= this.saveData.player.xpToNext;
          this.saveData.player.xpToNext = Math.round(this.saveData.player.xpToNext * 1.25);
        }

        // Stats & Quests
        if (!this.saveData.stats) this.saveData.stats = {};
        this.saveData.stats.wins = (this.saveData.stats.wins || 0) + 1;
        this.saveData.stats.gamesPlayed = (this.saveData.stats.gamesPlayed || 0) + 1;
        (this.saveData.missions || []).forEach(m => {
          if (m.id === "m_win_battles") m.progress = Math.min(m.goal, (m.progress || 0) + 1);
        });

        this.saveState();
      } else if (data.winner === "enemy") {
        soundFx.playUnitDeath();
        if (!this.saveData.stats) this.saveData.stats = {};
        this.saveData.stats.losses = (this.saveData.stats.losses || 0) + 1;
        this.saveData.stats.gamesPlayed = (this.saveData.stats.gamesPlayed || 0) + 1;
        this.saveState();
      }
      setTimeout(() => {
        this.showBattleEndModal(data.winner);
      }, 1000);
    }
  }

  // --- Master Viewport Router ---

  render() {
    const appEl = document.getElementById("app");
    if (!appEl) return;

    if (this.currentScreen === "main_menu") {
      appEl.innerHTML = this.mainMenu.render();
    } else if (this.currentScreen === "deckbuilder") {
      appEl.innerHTML = this.deckbuilder.render();
    } else if (this.currentScreen === "collection") {
      appEl.innerHTML = this.collection.render();
    } else if (this.currentScreen === "card_lab") {
      appEl.innerHTML = this.cardLab.render();
    } else if (this.currentScreen === "profile") {
      appEl.innerHTML = this.profile.render();
    } else if (this.currentScreen === "packs") {
      appEl.innerHTML = this.packScreen.render();
    } else if (this.currentScreen === "battle") {
      this.renderBattleArena(appEl);
    }

    // Modal Overlays
    let modalsHtml = "";
    if (this.settingsModal && this.settingsModal.isOpen) modalsHtml += this.settingsModal.render();
    if (this.tutorialModal && this.tutorialModal.isOpen) modalsHtml += this.tutorialModal.render();
    if (modalsHtml) {
      appEl.insertAdjacentHTML("beforeend", modalsHtml);
    }
  }

  // --- Battle Arena Viewport (No Right-Side Chat Log) ---

  renderBattleArena(appEl) {
    if (!this.engine) return;

    const isPlanning = this.engine.phase === CombatPhase.PLAYER_PLANNING;
    const selectedUnitOnBoard = this.selectedBoardLane !== null ? this.engine.playerLanes[this.selectedBoardLane] : null;

    appEl.innerHTML = `
      <div class="battle-arena">
        <!-- Left Sidebar: Shopkeeper & Tactical Controls -->
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
            <div class="meter-bar">
              <div class="meter-fill-energy" style="width: ${(this.engine.player.energy / this.engine.player.maxEnergy) * 100}%"></div>
              <span class="meter-label">Energy: ${this.engine.player.energy} / ${this.engine.player.maxEnergy}</span>
            </div>

            <!-- Register Meter -->
            <div class="meter-bar">
              <div class="meter-fill-kassa" style="width: ${((this.engine.player.register || this.engine.player.kassa || 0) / (this.engine.player.registerMax || this.engine.player.kassaMax || 5)) * 100}%"></div>
              <span class="meter-label">Register: ${this.engine.player.register || this.engine.player.kassa || 0} / ${this.engine.player.registerMax || this.engine.player.kassaMax || 5}</span>
            </div>

            <div style="margin-top: 6px; font-weight: 900; font-size: 0.9rem; color: #E65100;">
              🪙 Coins: ${this.engine.playerCoins}
            </div>
          </div>

          <!-- Unit Selling Tray -->
          ${selectedUnitOnBoard ? `
            <div class="sell-action-box">
              <div style="font-weight: 900; font-size: 0.85rem;">📦 Selected: ${selectedUnitOnBoard.name}</div>
              <div style="font-size: 0.75rem; color: #555;">Value: 🪙 ${selectedUnitOnBoard.saleValue} Coins</div>
              <button class="btn btn-sm btn-primary" style="margin-top: 6px; width: 100%;"
                ${!isPlanning || this.engine.salesThisRound.player >= this.engine.maxSalesPerRound ? 'disabled' : ''}
                onclick="window.app.sellSelectedUnit()">
                💰 SELL UNIT (+${selectedUnitOnBoard.saleValue} 🪙)
              </button>
            </div>
          ` : `
            <div style="font-size: 0.72rem; color: #777; text-align: center; border: 2px dashed #B8A88A; padding: 6px; border-radius: 8px;">
              Click any friendly item to inspect & sell stock (max 1/round).
            </div>
          `}

          <!-- Abilities -->
          <div class="abilities-list">
            <h4 style="font-size: 0.82rem; color: var(--wood-med); font-weight: 800;">TACTICAL ABILITIES</h4>
            ${this.engine.player.abilities.map(ab => `
              <button class="ability-btn" 
                ${this.engine.player.energy < ab.cost || !isPlanning ? 'disabled' : ''}
                onclick="window.app.onAbilityClicked('${ab.id}')">
                <strong>${ab.emoji} ${ab.name}</strong> (${ab.cost} ⚡)<br/>
                <span style="font-size: 0.68rem; color: #555;">${ab.description}</span>
              </button>
            `).join('')}

            <button class="ability-btn signature-btn"
              ${(this.engine.player.register || this.engine.player.kassa || 0) < (this.engine.player.registerMax || this.engine.player.kassaMax || 5) || !isPlanning ? 'disabled' : ''}
              onclick="window.app.onSignatureClicked()">
              <strong>${this.engine.player.signature.emoji} ${this.engine.player.signature.name}</strong> (Full Register)<br/>
              <span style="font-size: 0.68rem; color: #555;">${this.engine.player.signature.description}</span>
            </button>
          </div>

          <!-- Deck / Discard Status & Speed Toggle -->
          <div class="piles-status">
            <div>🎴 Draw: <strong>${this.engine.player.deckManager.drawPile.length}</strong></div>
            <div>🗑️ Discard: <strong>${this.engine.player.deckManager.discardPile.length}</strong></div>
          </div>

          <div style="display: flex; justify-content: space-between; gap: 6px;">
            <button class="btn btn-sm" onclick="window.app.toggleFastCombat()">
              ⚡ Fast: ${animManager.isFastCombat ? 'ON' : 'OFF'}
            </button>
            <button class="btn btn-sm" onclick="window.app.showScreen('main_menu')">🏳️ Menu</button>
          </div>
        </div>

        <!-- Center Stage: The 5 Combat Lanes & Arched Fanned Hand -->
        <div class="battlefield-container">
          <!-- Opponent Counter Status -->
          <div class="enemy-area">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 2.4rem;">${this.engine.enemy.emoji}</span>
              <div>
                <strong style="font-size: 1.1rem;">${this.engine.enemy.name}</strong>
                <div style="font-size: 0.78rem; color: #666; font-weight: 600;">${this.engine.enemy.title}</div>
              </div>
            </div>

            <!-- Relics Display Banner -->
            <div style="display: flex; gap: 6px;">
              ${this.engine.relics.map(r => `
                <div style="background: #FFF; border: 1px solid var(--amber-gold); border-radius: 6px; padding: 2px 6px; font-size: 0.75rem;" title="${r.description}">
                  ${r.emoji} ${r.name}
                </div>
              `).join('')}
            </div>

            <div style="width: 220px;">
              <div class="meter-bar">
                <div class="meter-fill-hp" style="width: ${(this.engine.enemy.health / this.engine.enemy.maxHealth) * 100}%"></div>
                <span class="meter-label">HP: ${this.engine.enemy.health} / ${this.engine.enemy.maxHealth}</span>
              </div>
            </div>
          </div>

          <!-- The 5 Combat Lanes Board -->
          <div class="lanes-board">
            <div class="lanes-row enemy-row">
              ${this.renderLanes(this.engine.enemyLanes, false)}
            </div>

            <div class="lane-divider">
              ⚔️ 5-LANE CLASH COUNTER ⚔️
            </div>

            <div class="lanes-row player-row">
              ${this.renderLanes(this.engine.playerLanes, true)}
            </div>
          </div>

          <!-- Player Controls: Action Bar & Arched Fanned-Out Hand -->
          <div class="player-controls">
            <div class="action-bar">
              <div>
                <span style="font-weight: 900; font-size: 1.05rem;">Phase: ${this.engine.phase.replace('_', ' ')}</span>
                <span style="margin-left: 12px; color: var(--wood-med); font-weight: 800;">Round ${this.engine.roundNumber}</span>
              </div>
              <button class="btn-open-shop" 
                ${!isPlanning ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
                onclick="window.app.onOpenTheShopClicked()">
                🔔 OPEN THE SHOP!
              </button>
            </div>

            <!-- Arched Fanned Hand Container -->
            <div class="hand-container">
              ${this.renderArchedHandCards()}
            </div>
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
            <div style="font-size: 2rem;">🚫</div>
            <div style="font-size: 0.72rem; font-weight: 900; color: var(--danger-red);">CONDEMNED</div>
          </div>
        `;
      }

      if (unit) {
        const extraClass = unit.keywords.includes("taunt") ? "taunt" : (unit.hasSwift ? "swift" : "");
        const factionClass = unit.faction === "cozy_counter" ? "faction-cozy" : "faction-midnight";
        const idleAnimClass = unit.tags.includes("light") ? "idle-candle" : (unit.tags.includes("furniture") ? "idle-wobble" : "");

        return `
          <div class="lane-slot ${isLaneSelected ? 'selected-lane' : ''}" onclick="window.app.onLaneSlotClicked(${idx}, ${isPlayer})">
            <span class="lane-badge">LANE ${idx + 1}</span>
            <div class="card-unit ${extraClass} ${factionClass}">
              <div class="card-header">
                <span class="card-cost-gem">${unit.cost}</span>
                <span class="rarity-jewel jewel-${unit.rarity}"></span>
              </div>
              <div class="unit-emoji-container ${idleAnimClass}">${unit.emoji}</div>
              <div class="card-name">${unit.name}</div>
              <div class="card-stats">
                <span class="stat-badge-atk">${unit.attack + (unit.tempAttackBonus || 0)}</span>
                <span class="stat-badge-hp">${unit.health}</span>
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="lane-slot ${isSelectable ? 'selectable' : ''}" onclick="window.app.onLaneSlotClicked(${idx}, ${isPlayer})">
          <span class="lane-badge">LANE ${idx + 1}</span>
          <span style="font-size: 0.78rem; font-weight: 700; color: #8D6E63;">${isSelectable ? 'Click to Place' : 'Empty'}</span>
        </div>
      `;
    }).join('');
  }

  // --- Arched Fanned-Out Hand Rendering ---

  renderArchedHandCards() {
    const hand = this.engine.player.deckManager.hand;
    const total = hand.length;
    if (total === 0) {
      return `<div style="padding: 16px; color: #FFF; font-weight: bold; text-shadow: 1px 1px 0 #000;">Hand empty. Next round draws fresh stock!</div>`;
    }

    return hand.map((card, i) => {
      const isSelected = this.selectedHandCard && this.selectedHandCard.instanceId === card.instanceId;
      const canAfford = this.engine.player.energy >= card.cost;
      const factionClass = card.faction === "cozy_counter" ? "faction-cozy" : "faction-midnight";

      // Calculate gentle arc rotation and vertical offset
      const centerOffset = i - (total - 1) / 2;
      const rotationDeg = centerOffset * 4.5;
      const translateYPx = Math.abs(centerOffset) * 6;

      return `
        <div class="hand-card ${isSelected ? 'selected' : ''} ${canAfford ? 'playable' : 'unplayable'} ${factionClass}" 
          style="transform: rotate(${rotationDeg}deg) translateY(${translateYPx}px); z-index: ${i + 1};"
          onclick="window.app.onHandCardClicked('${card.instanceId}')">
          <div class="card-header">
            <span class="card-cost-gem">${card.cost}</span>
            <span class="rarity-jewel jewel-${card.rarity}"></span>
          </div>
          <div class="card-emoji" style="font-size: 2.2rem; text-align: center;">${card.emoji}</div>
          <div class="card-name">${card.name}</div>
          <div class="card-desc">${card.description}</div>
          ${card.type === 'item' ? `
            <div class="card-stats" style="margin-top: 4px;">
              <span class="stat-badge-atk">${card.attack}</span>
              <span class="stat-badge-hp">${card.health}</span>
            </div>
          ` : '<div style="height: 18px;"></div>'}
        </div>
      `;
    }).join('');
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
          const slot = document.querySelector(`.player-row .lane-slot:nth-child(${laneIndex + 1})`);
          animManager.playSummonLanding(slot);
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
    animManager.shakeScreen("heavy");
    this.render();
  }

  async onOpenTheShopClicked() {
    await this.engine.openTheShop();
  }

  toggleFastCombat() {
    animManager.setFastCombat(!animManager.isFastCombat);
    soundFx.playCardFlip();
    this.render();
  }

  showCollectionModal() {
    const modalEl = document.createElement("div");
    modalEl.className = "modal-overlay";
    modalEl.id = "collection-modal";
    modalEl.innerHTML = `
      <div class="modal-content">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid var(--wood-med); padding-bottom: 8px;">
          <h2>📚 Master Collection (30 / 120+ Initial Catalog)</h2>
          <button class="btn btn-sm" onclick="document.getElementById('collection-modal').remove()">✖</button>
        </div>
        <p style="margin-top: 8px; color: var(--wood-med); font-size: 0.9rem;">
          Explore all permanent cards from <strong>The Cozy Counter</strong> and <strong>The Midnight Bazaar</strong>.
        </p>
        <div class="collection-grid">
          ${this.allCards.map(c => `
            <div class="hand-card ${c.faction === 'cozy_counter' ? 'faction-cozy' : 'faction-midnight'}" style="width: 100%; height: 165px; cursor: default; transform: none !important;">
              <div class="card-header">
                <span class="card-cost-gem">${c.cost}</span>
                <span class="rarity-jewel jewel-${c.rarity}"></span>
              </div>
              <div class="card-emoji" style="font-size: 2.2rem; text-align: center;">${c.emoji}</div>
              <div class="card-name">${c.name}</div>
              <div class="card-desc">${c.description}</div>
              ${c.type === 'item' ? `
                <div class="card-stats" style="margin-top: 4px;">
                  <span class="stat-badge-atk">${c.attack}</span>
                  <span class="stat-badge-hp">${c.health}</span>
                </div>
              ` : '<div style="height: 18px;"></div>'}
            </div>
          `).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);
  }

  showSettingsModal() {
    this.settingsModal.open();
  }

  showTutorialModal() {
    this.tutorialModal.open();
  }

  showBattleEndModal(winner) {
    const modalEl = document.createElement("div");
    modalEl.className = "modal-overlay";
    modalEl.id = "battle-end-modal";
    const isWin = winner === "player";

    modalEl.innerHTML = `
      <div class="modal-content" style="max-width: 520px; text-align: center;">
        <div style="font-size: 4rem; margin-bottom: 8px;">${isWin ? '🏆' : '💀'}</div>
        <h2 style="font-size: 1.8rem; font-weight: 900;">${isWin ? 'Shop Victorious!' : 'Shop Overrun!'}</h2>
        <p style="margin: 14px 0; color: #555; font-size: 0.95rem;">
          ${isWin ? 'Your living stock stood ground and protected the counter! Awarded +50 Coins 🪙!' : 'The dispute overwhelmed your stock. Tidy up the counter and try again!'}
        </p>
        <button class="btn btn-primary" style="font-size: 1.15rem; padding: 12px 30px;"
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
