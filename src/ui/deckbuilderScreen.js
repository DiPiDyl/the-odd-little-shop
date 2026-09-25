// Deckbuilder & Collection Curation Screen (Strict 20-Card Engine)
import { COZY_COUNTER_CARDS } from "../data/cardsCozyCounter.js";
import { MIDNIGHT_BAZAAR_CARDS } from "../data/cardsMidnightBazaar.js";
import { soundFx } from "../audio/soundEffects.js";

export class DeckbuilderScreen {
  constructor(app) {
    this.app = app;
    this.activeFaction = app.currentFaction || "cozy_counter";
    this.currentDeckIds = [...(app.saveData.decks[this.activeFaction] || [])];
    this.selectedFilterRarity = "all";
    this.searchQuery = "";
  }

  render() {
    const allFactionCards = this.activeFaction === "cozy_counter" ? COZY_COUNTER_CARDS : MIDNIGHT_BAZAAR_CARDS;
    const cardCopies = this.app.saveData.inventory.cardCopies || {};

    // Calculate Mana Curve & Rarity counts
    const curve = { 1: 0, 2: 0, 3: 0, 4: 0, "5+": 0 };
    const rarities = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };

    this.currentDeckIds.forEach(id => {
      const card = allFactionCards.find(c => c.id === id);
      if (card) {
        const costKey = card.cost >= 5 ? "5+" : Math.max(1, card.cost);
        curve[costKey] = (curve[costKey] || 0) + 1;
        rarities[card.rarity] = (rarities[card.rarity] || 0) + 1;
      }
    });

    // Group deck cards for display: { id: card, count: N }
    const groupedDeck = [];
    const counted = {};
    this.currentDeckIds.forEach(id => {
      counted[id] = (counted[id] || 0) + 1;
    });
    for (const [id, count] of Object.entries(counted)) {
      const card = allFactionCards.find(c => c.id === id);
      if (card) groupedDeck.push({ card, count });
    }

    // Filter collection
    const filteredCollection = allFactionCards.filter(card => {
      if (this.selectedFilterRarity !== "all" && card.rarity !== this.selectedFilterRarity) return false;
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        return card.name.toLowerCase().includes(q) || card.tags.some(t => t.toLowerCase().includes(q));
      }
      return true;
    });

    return `
      <div class="deckbuilder-container">
        <!-- Left Panel: Active 20-Card Deck -->
        <div class="deck-panel">
          <div class="deck-header">
            <div>
              <h3>🎒 Active Deck (${this.activeFaction === 'cozy_counter' ? 'Cozy Counter' : 'Midnight Bazaar'})</h3>
              <div style="font-size: 0.9rem; font-weight: bold; color: ${this.currentDeckIds.length === 20 ? 'var(--cozy-green)' : 'var(--danger-red)'};">
                ${this.currentDeckIds.length} / 20 Cards (Max 2 per card)
              </div>
            </div>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-sm" onclick="window.app.deckbuilder.switchFaction('cozy_counter')">🕯️ Cozy</button>
              <button class="btn btn-sm" onclick="window.app.deckbuilder.switchFaction('midnight_bazaar')">🌙 Bazaar</button>
            </div>
          </div>

          <!-- Energy Curve Histogram -->
          <div class="curve-chart">
            <span style="font-size: 0.72rem; font-weight: bold; color: var(--wood-med);">ENERGY CURVE</span>
            <div class="curve-bars">
              ${['1', '2', '3', '4', '5+'].map(c => `
                <div class="curve-col">
                  <div class="curve-bar" style="height: ${(curve[c] / 10) * 45}px;"></div>
                  <span class="curve-label">${c} (${curve[c]})</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Rarity Breakdown -->
          <div class="rarity-badges">
            <span class="badge common">Common: ${rarities.common}</span>
            <span class="badge uncommon">Uncommon: ${rarities.uncommon}</span>
            <span class="badge rare">Rare: ${rarities.rare}</span>
            <span class="badge epic">Epic: ${rarities.epic}</span>
            <span class="badge legendary">Legend: ${rarities.legendary}</span>
          </div>

          <!-- Deck List -->
          <div class="deck-card-list">
            ${groupedDeck.map(({ card, count }) => `
              <div class="deck-card-row">
                <span class="row-cost">${card.cost}</span>
                <span class="row-emoji">${card.emoji}</span>
                <span class="row-name">${card.name}</span>
                <span class="row-count">×${count}</span>
                <button class="btn-remove-card" onclick="window.app.deckbuilder.removeCard('${card.id}')">✖</button>
              </div>
            `).join('')}
          </div>

          <div style="display: flex; justify-content: space-between; margin-top: 10px;">
            <button class="btn" onclick="window.app.showScreen('main_menu')">⬅️ Back to Menu</button>
            <button class="btn btn-primary" onclick="window.app.deckbuilder.saveAndConfirm()">💾 Save Deck</button>
          </div>
        </div>

        <!-- Right Panel: Collection Browser -->
        <div class="collection-browser-panel">
          <div class="browser-header">
            <h3>📚 Available Collection</h3>
            <div class="filter-controls">
              <input type="text" placeholder="Search cards or tags..." class="search-box" value="${this.searchQuery}"
                oninput="window.app.deckbuilder.onSearch(this.value)">
              <select class="rarity-select" onchange="window.app.deckbuilder.onFilterRarity(this.value)">
                <option value="all" ${this.selectedFilterRarity === 'all' ? 'selected' : ''}>All Rarities</option>
                <option value="common" ${this.selectedFilterRarity === 'common' ? 'selected' : ''}>Common</option>
                <option value="uncommon" ${this.selectedFilterRarity === 'uncommon' ? 'selected' : ''}>Uncommon</option>
                <option value="rare" ${this.selectedFilterRarity === 'rare' ? 'selected' : ''}>Rare</option>
                <option value="epic" ${this.selectedFilterRarity === 'epic' ? 'selected' : ''}>Epic</option>
                <option value="legendary" ${this.selectedFilterRarity === 'legendary' ? 'selected' : ''}>Legendary</option>
              </select>
            </div>
          </div>

          <div class="browser-grid">
            ${filteredCollection.map(card => {
              const currentDeckCount = this.currentDeckIds.filter(id => id === card.id).length;
              const maxDeckAllowed = 2;
              const canAdd = this.currentDeckIds.length < 20 && currentDeckCount < maxDeckAllowed;

              return `
                <div class="collection-card ${canAdd ? '' : 'disabled'}">
                  <div class="card-header">
                    <span class="card-cost">${card.cost}</span>
                    <span style="font-size: 0.7rem; font-weight: bold; text-transform: uppercase;">${card.rarity}</span>
                  </div>
                  <div class="card-emoji">${card.emoji}</div>
                  <div class="card-name">${card.name}</div>
                  <div class="card-desc">${card.description}</div>
                  <div class="card-footer">
                    <span style="font-size: 0.75rem; color: #555;">In Deck: ${currentDeckCount}/2</span>
                    <button class="btn btn-sm btn-primary" ${canAdd ? '' : 'disabled'}
                      onclick="window.app.deckbuilder.addCard('${card.id}')">+ Add</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  switchFaction(faction) {
    this.activeFaction = faction;
    this.currentDeckIds = [...(this.app.saveData.decks[faction] || [])];
    soundFx.playCardSwoosh();
    this.app.render();
  }

  addCard(cardId) {
    if (this.currentDeckIds.length >= 20) {
      alert("Deck is already at maximum capacity (20 cards)!");
      return;
    }
    const currentCount = this.currentDeckIds.filter(id => id === cardId).length;
    if (currentCount >= 2) {
      alert("Maximum 2 copies of any card allowed in a deck!");
      return;
    }
    this.currentDeckIds.push(cardId);
    soundFx.playWoodClunk();
    this.app.render();
  }

  removeCard(cardId) {
    const idx = this.currentDeckIds.lastIndexOf(cardId);
    if (idx !== -1) {
      this.currentDeckIds.splice(idx, 1);
      soundFx.playCardSwoosh();
      this.app.render();
    }
  }

  onSearch(query) {
    this.searchQuery = query;
    this.app.render();
  }

  onFilterRarity(rarity) {
    this.selectedFilterRarity = rarity;
    this.app.render();
  }

  saveAndConfirm() {
    if (this.currentDeckIds.length !== 20) {
      alert(`A legal deck must contain exactly 20 cards! (Currently: ${this.currentDeckIds.length}/20)`);
      return;
    }
    this.app.saveData.decks[this.activeFaction] = [...this.currentDeckIds];
    this.app.saveState();
    soundFx.playCounterBell();
    alert(`Deck saved successfully for ${this.activeFaction === 'cozy_counter' ? 'The Cozy Counter' : 'The Midnight Bazaar'}!`);
  }
}
