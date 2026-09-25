// Collection & Crafting Studio Screen
import { COZY_COUNTER_CARDS } from "../data/cardsCozyCounter.js";
import { MIDNIGHT_BAZAAR_CARDS } from "../data/cardsMidnightBazaar.js";
import { soundFx } from "../audio/soundEffects.js";

export const CRAFT_COSTS = {
  common: 40,
  uncommon: 100,
  rare: 100,
  epic: 400,
  legendary: 1600
};

export const DISENCHANT_VALUES = {
  common: 5,
  uncommon: 20,
  rare: 20,
  epic: 100,
  legendary: 400
};

export class CollectionScreen {
  constructor(app) {
    this.app = app;
    this.selectedFaction = "all"; // 'all', 'cozy_counter', 'midnight_bazaar', 'custom'
    this.selectedRarity = "all";
    this.selectedCost = "all";
    this.selectedType = "all";
    this.searchQuery = "";
    this.filterOwnedOnly = false;
    this.inspectedCard = null; // Card object being inspected in detail modal
  }

  getAllCards() {
    const list = [...COZY_COUNTER_CARDS, ...MIDNIGHT_BAZAAR_CARDS];
    const custom = (this.app.saveData.cardLabIdeas || []).map(idea => ({
      ...idea,
      isCustom: true
    }));
    return [...list, ...custom];
  }

  getOwnedCopies(cardId) {
    const copies = this.app.saveData.inventory.cardCopies || {};
    return copies[cardId] || 0;
  }

  inspectCard(card) {
    this.inspectedCard = card;
    soundFx.playCardHover();
    this.app.render();
  }

  closeModal() {
    this.inspectedCard = null;
    soundFx.playButtonClick();
    this.app.render();
  }

  craftCard(card) {
    const cost = CRAFT_COSTS[card.rarity] || 40;
    const currentScrap = this.app.saveData.currency.scrap || 0;
    const currentCopies = this.getOwnedCopies(card.id);

    if (currentCopies >= 2) {
      alert("You already own the maximum allowed 2 copies of this card!");
      return;
    }

    if (currentScrap < cost) {
      soundFx.playErrorBuzz();
      alert(`Not enough Scrap! Crafting requires ${cost} ⚙️ Scrap.`);
      return;
    }

    this.app.saveData.currency.scrap -= cost;
    if (!this.app.saveData.inventory.cardCopies) this.app.saveData.inventory.cardCopies = {};
    this.app.saveData.inventory.cardCopies[card.id] = currentCopies + 1;

    // Track stats
    if (!this.app.saveData.stats) this.app.saveData.stats = {};
    this.app.saveData.stats.cardsCrafted = (this.app.saveData.stats.cardsCrafted || 0) + 1;

    this.app.saveState();
    soundFx.playSellCoin();
    this.app.render();
  }

  disenchantCard(card) {
    const currentCopies = this.getOwnedCopies(card.id);
    if (currentCopies <= 0) {
      soundFx.playErrorBuzz();
      alert("You do not own any copies of this card to disenchant!");
      return;
    }

    const value = DISENCHANT_VALUES[card.rarity] || 5;
    if (!confirm(`Are you sure you want to disenchant 1 copy of ${card.name} for ${value} ⚙️ Scrap?`)) {
      return;
    }

    this.app.saveData.currency.scrap = (this.app.saveData.currency.scrap || 0) + value;
    this.app.saveData.inventory.cardCopies[card.id] = currentCopies - 1;

    this.app.saveState();
    soundFx.playUnitDeath();
    this.app.render();
  }

  render() {
    const allCards = this.getAllCards();
    const scrap = this.app.saveData.currency.scrap || 0;
    const coins = this.app.saveData.currency.coins || 0;

    // Filter collection
    const filtered = allCards.filter(card => {
      if (this.selectedFaction !== "all") {
        if (this.selectedFaction === "custom" && !card.isCustom) return false;
        if (this.selectedFaction !== "custom" && card.faction !== this.selectedFaction) return false;
      }
      if (this.selectedRarity !== "all" && card.rarity !== this.selectedRarity) return false;
      if (this.selectedCost !== "all") {
        if (this.selectedCost === "7+" && card.cost < 7) return false;
        if (this.selectedCost !== "7+" && card.cost !== parseInt(this.selectedCost)) return false;
      }
      if (this.selectedType !== "all") {
        const cType = card.type === "item" ? "minion" : (card.type === "trick" ? "spell" : (card.type === "upgrade" ? "weapon" : card.type));
        if (cType !== this.selectedType) return false;
      }
      if (this.filterOwnedOnly && this.getOwnedCopies(card.id) === 0) return false;
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const matchesName = card.name.toLowerCase().includes(q);
        const matchesDesc = (card.description || "").toLowerCase().includes(q);
        const matchesTags = (card.tags || []).some(t => t.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesTags) return false;
      }
      return true;
    });

    return `
      <div class="collection-page-container">
        <!-- Top Navigation & Stats Bar -->
        <div class="collection-top-bar">
          <div class="col-nav-left">
            <button class="btn btn-secondary btn-sm" onclick="window.app.showScreen('main_menu')">⬅ Return to Lobby</button>
            <h2 class="col-page-title">📖 CARD ARCHIVES & CRAFTING</h2>
          </div>
          <div class="col-nav-right">
            <div class="hud-stat-pill scrap">
              <span class="pill-icon">⚙️</span>
              <span class="pill-value">${scrap} Scrap</span>
            </div>
            <div class="hud-stat-pill coins">
              <span class="pill-icon">🪙</span>
              <span class="pill-value">${coins} Coins</span>
            </div>
            <button class="btn btn-sm btn-primary" onclick="window.app.showScreen('deckbuilder')">🎒 Open Deckbuilder</button>
          </div>
        </div>

        <!-- Filter Controls Shelf -->
        <div class="collection-filters-shelf">
          <!-- Faction Tabs -->
          <div class="filter-group">
            <button class="filter-tab ${this.selectedFaction === 'all' ? 'active' : ''}" onclick="window.app.collection.selectedFaction = 'all'; window.app.render();">All Factions</button>
            <button class="filter-tab ${this.selectedFaction === 'cozy_counter' ? 'active' : ''}" onclick="window.app.collection.selectedFaction = 'cozy_counter'; window.app.render();">🕯️ Cozy Counter</button>
            <button class="filter-tab ${this.selectedFaction === 'midnight_bazaar' ? 'active' : ''}" onclick="window.app.collection.selectedFaction = 'midnight_bazaar'; window.app.render();">🌙 Midnight Bazaar</button>
            <button class="filter-tab ${this.selectedFaction === 'custom' ? 'active' : ''}" onclick="window.app.collection.selectedFaction = 'custom'; window.app.render();">🔬 Lab Curios</button>
          </div>

          <!-- Mana Cost Pills -->
          <div class="filter-group mana-pills">
            <button class="filter-pill ${this.selectedCost === 'all' ? 'active' : ''}" onclick="window.app.collection.selectedCost = 'all'; window.app.render();">Any Cost</button>
            ${['0', '1', '2', '3', '4', '5', '6', '7+'].map(c => `
              <button class="filter-pill ${this.selectedCost === c ? 'active' : ''}" onclick="window.app.collection.selectedCost = '${c}'; window.app.render();">${c}</button>
            `).join('')}
          </div>

          <!-- Rarity Dropdown -->
          <select class="filter-select" onchange="window.app.collection.selectedRarity = this.value; window.app.render();">
            <option value="all" ${this.selectedRarity === 'all' ? 'selected' : ''}>All Rarities</option>
            <option value="common" ${this.selectedRarity === 'common' ? 'selected' : ''}>⚪ Common</option>
            <option value="rare" ${this.selectedRarity === 'rare' ? 'selected' : ''}>🔵 Rare</option>
            <option value="epic" ${this.selectedRarity === 'epic' ? 'selected' : ''}>🟣 Epic</option>
            <option value="legendary" ${this.selectedRarity === 'legendary' ? 'selected' : ''}>🟠 Legendary</option>
          </select>

          <!-- Type Dropdown -->
          <select class="filter-select" onchange="window.app.collection.selectedType = this.value; window.app.render();">
            <option value="all" ${this.selectedType === 'all' ? 'selected' : ''}>All Types</option>
            <option value="minion" ${this.selectedType === 'minion' ? 'selected' : ''}>Minions</option>
            <option value="spell" ${this.selectedType === 'spell' ? 'selected' : ''}>Spells</option>
            <option value="weapon" ${this.selectedType === 'weapon' ? 'selected' : ''}>Weapons</option>
          </select>

          <!-- Search & Owned Toggle -->
          <div class="filter-search-box">
            <input type="text" class="search-input" placeholder="Search cards by name or keyword..." value="${this.searchQuery}" oninput="window.app.collection.searchQuery = this.value; window.app.render();">
          </div>
        </div>

        <!-- Collection Grid -->
        <div class="collection-cards-grid">
          ${filtered.length === 0 ? `
            <div class="empty-state-notice" style="grid-column: 1 / -1; padding: 60px;">
              <h3>📦 No cards match your filter criteria</h3>
              <p style="color: var(--wood-light); margin-top: 8px;">Try clearing search filters or changing the faction selector.</p>
            </div>
          ` : filtered.map(card => {
            const owned = this.getOwnedCopies(card.id);
            const isUnowned = owned === 0;
            const normType = card.type === "item" ? "minion" : (card.type === "trick" ? "spell" : (card.type === "upgrade" ? "weapon" : card.type));
            return `
              <div class="library-card-item faction-${card.faction} rarity-${card.rarity} ${isUnowned ? 'unowned-card' : ''}" onclick="window.app.collection.inspectCard(window.app.collection.getAllCards().find(c => c.id === '${card.id}'))">
                <!-- Mana Cost -->
                <div class="lib-mana-badge">${card.cost}</div>

                <!-- Rarity Crown -->
                <div class="lib-rarity-badge">${card.rarity === 'legendary' ? '👑' : '💎'}</div>

                <!-- Art Preview -->
                <div class="lib-card-art">
                  <span class="lib-card-emoji">${card.emoji || '📦'}</span>
                </div>

                <!-- Name & Type -->
                <div class="lib-card-name">${card.name}</div>
                <div class="lib-card-type">${normType.toUpperCase()}</div>

                <!-- Text Preview -->
                <div class="lib-card-text">${card.description || ''}</div>

                <!-- Stats or Spell Marker -->
                <div class="lib-card-footer">
                  ${normType !== 'spell' ? `
                    <span class="lib-stat atk">⚔️ ${card.attack || 0}</span>
                    <span class="lib-stat hp">${normType === 'weapon' ? '🛡️ ' + (card.durability || 2) : '❤️ ' + (card.health || 1)}</span>
                  ` : `<span class="lib-spell-tag">✨ SPELL</span>`}
                </div>

                <!-- Copy Count Badge -->
                <div class="lib-copy-badge ${owned > 0 ? 'owned' : 'missing'}">
                  ${owned} / 2 Owned
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Card Detail & Crafting Modal -->
        ${this.inspectedCard ? this.renderDetailModal(this.inspectedCard) : ''}
      </div>
    `;
  }

  renderDetailModal(card) {
    const owned = this.getOwnedCopies(card.id);
    const craftCost = CRAFT_COSTS[card.rarity] || 40;
    const disenchantVal = DISENCHANT_VALUES[card.rarity] || 5;
    const canCraft = (this.app.saveData.currency.scrap || 0) >= craftCost && owned < 2;
    const canDisenchant = owned > 0;
    const normType = card.type === "item" ? "minion" : (card.type === "trick" ? "spell" : (card.type === "upgrade" ? "weapon" : card.type));

    return `
      <div class="modal-backdrop" onclick="window.app.collection.closeModal()">
        <div class="card-detail-modal" onclick="event.stopPropagation()">
          <button class="modal-close-btn" onclick="window.app.collection.closeModal()">✖</button>
          
          <div class="detail-modal-layout">
            <!-- Large Card Display Stage -->
            <div class="detail-card-stage">
              <div class="preview-curio-card faction-${card.faction} rarity-${card.rarity}">
                <div class="preview-mana-gem">${card.cost}</div>
                <div class="preview-rarity-gem">${card.rarity === 'legendary' ? '👑' : '💎'}</div>
                <div class="preview-name-banner">
                  <span class="preview-name-text">${card.name}</span>
                </div>
                <div class="preview-art-frame">
                  <div class="preview-art-emoji">${card.emoji || '📦'}</div>
                  <div class="preview-type-badge">${normType.toUpperCase()}</div>
                </div>
                <div class="preview-textbox">
                  <p class="preview-description">${card.description || ''}</p>
                  ${card.flavor ? `<p class="preview-flavor">"${card.flavor}"</p>` : ''}
                </div>
                <div class="preview-stat-ribbon">
                  ${normType !== 'spell' ? `<div class="preview-orb atk-orb">${card.attack || 0}</div>` : '<div></div>'}
                  ${normType === 'minion' ? `<div class="preview-orb hp-orb">${card.health || 1}</div>` : ''}
                  ${normType === 'weapon' ? `<div class="preview-orb dur-orb">${card.durability || 2}</div>` : ''}
                </div>
              </div>
            </div>

            <!-- Detail Information & Crafting Actions -->
            <div class="detail-info-stage">
              <div class="detail-header">
                <h3>${card.name}</h3>
                <span class="badge ${card.rarity}">${card.rarity.toUpperCase()} • ${card.faction.replace('_', ' ').toUpperCase()}</span>
              </div>

              <div class="detail-ownership">
                <span style="font-weight: bold; font-size: 1.1rem; color: ${owned > 0 ? 'var(--cozy-gold)' : 'var(--wood-light)'};">
                  ${owned} / 2 Copies Owned
                </span>
                <p style="font-size: 0.85rem; color: var(--parchment-dim); margin-top: 4px;">
                  Decks can contain up to 2 copies of any single card.
                </p>
              </div>

              <!-- Keyword & Tag Breakdown -->
              ${(card.keywords && card.keywords.length > 0) ? `
                <div class="detail-keywords">
                  <strong>Keywords:</strong>
                  <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
                    ${card.keywords.map(kw => `<span class="tag-chip">${kw.toUpperCase()}</span>`).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Crafting & Disenchanting Buttons -->
              <div class="detail-crafting-panel">
                <div class="craft-action-card">
                  <div class="craft-action-desc">
                    <strong>Disenchant</strong>
                    <span style="color: var(--wood-light); font-size: 0.82rem;">Break 1 copy down into scrap</span>
                  </div>
                  <button class="btn btn-secondary ${!canDisenchant ? 'disabled' : ''}" onclick="window.app.collection.disenchantCard(window.app.collection.inspectedCard)">
                    +${disenchantVal} ⚙️ Scrap
                  </button>
                </div>

                <div class="craft-action-card">
                  <div class="craft-action-desc">
                    <strong>Craft Copy</strong>
                    <span style="color: var(--wood-light); font-size: 0.82rem;">Forge 1 copy from raw scrap</span>
                  </div>
                  <button class="btn btn-primary ${!canCraft ? 'disabled' : ''}" onclick="window.app.collection.craftCard(window.app.collection.inspectedCard)">
                    -${craftCost} ⚙️ Scrap
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
