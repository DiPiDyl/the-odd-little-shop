// Interactive Booster Pack Opening & Scrap Crafting Screen
import { PACK_TYPES, PackSystem } from "../data/packSystem.js";
import { soundFx } from "../audio/soundEffects.js";

export class PackOpeningScreen {
  constructor(app) {
    this.app = app;
    this.currentOpenedCards = null; // Array of 5 cards when opening
    this.flippedIndices = new Set();
  }

  render() {
    const packs = this.app.saveData.inventory.packs || { cozy_pack: 0, midnight_pack: 0, oddity_pack: 0 };
    const coins = this.app.saveData.currency.coins || 0;
    const scrap = this.app.saveData.currency.scrap || 0;

    if (this.currentOpenedCards) {
      return this.renderPackRevealScreen();
    }

    return `
      <div class="pack-screen-container">
        <div class="pack-screen-header">
          <div>
            <h2>🎁 The Odd Curiosity Packs</h2>
            <p style="color: var(--wood-med);">
              Open card packs to expand your permanent collection. Duplicates beyond 2 copies turn into <strong>Scrap</strong>!
            </p>
          </div>
          <div class="hud-badges">
            <span class="hud-pill">🪙 ${coins} Coins</span>
            <span class="hud-pill">⚙️ ${scrap} Scrap</span>
            <button class="btn" onclick="window.app.showScreen('main_menu')">⬅️ Back to Menu</button>
          </div>
        </div>

        <div class="pack-grid">
          <!-- Cozy Counter Pack -->
          <div class="pack-card cozy-pack-card">
            <div class="pack-art">🎁</div>
            <h3>Cozy Counter Pack</h3>
            <p>5 Guaranteed Cozy Counter cards. Durable, warm, and supportive stock.</p>
            <div class="pack-count-badge">You Have: <strong>${packs.cozy_pack || 0}</strong></div>
            <div style="display: flex; gap: 8px; margin-top: 12px;">
              <button class="btn btn-primary" ${packs.cozy_pack > 0 ? '' : 'disabled'}
                onclick="window.app.packScreen.openPack('cozy_pack')">
                🎉 Open Pack
              </button>
              <button class="btn" ${coins >= 100 ? '' : 'disabled'}
                onclick="window.app.packScreen.buyPack('cozy_pack', 100)">
                Buy (100 🪙)
              </button>
            </div>
          </div>

          <!-- Midnight Bazaar Pack -->
          <div class="pack-card midnight-pack-card">
            <div class="pack-art">📦</div>
            <h3>Midnight Bazaar Pack</h3>
            <p>5 Guaranteed Midnight Bazaar cards. Reclaimed, risky, secondhand oddities.</p>
            <div class="pack-count-badge">You Have: <strong>${packs.midnight_pack || 0}</strong></div>
            <div style="display: flex; gap: 8px; margin-top: 12px;">
              <button class="btn btn-primary" ${packs.midnight_pack > 0 ? '' : 'disabled'}
                onclick="window.app.packScreen.openPack('midnight_pack')">
                🎉 Open Pack
              </button>
              <button class="btn" ${coins >= 100 ? '' : 'disabled'}
                onclick="window.app.packScreen.buyPack('midnight_pack', 100)">
                Buy (100 🪙)
              </button>
            </div>
          </div>

          <!-- Oddity Pack -->
          <div class="pack-card oddity-pack-card">
            <div class="pack-art">✨</div>
            <h3>Oddity Specialty Pack</h3>
            <p>5 Mixed rare and curious oddities from both shops with boosted rare odds.</p>
            <div class="pack-count-badge">You Have: <strong>${packs.oddity_pack || 0}</strong></div>
            <div style="display: flex; gap: 8px; margin-top: 12px;">
              <button class="btn btn-primary" ${packs.oddity_pack > 0 ? '' : 'disabled'}
                onclick="window.app.packScreen.openPack('oddity_pack')">
                🎉 Open Pack
              </button>
              <button class="btn" ${coins >= 150 ? '' : 'disabled'}
                onclick="window.app.packScreen.buyPack('oddity_pack', 150)">
                Buy (150 🪙)
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderPackRevealScreen() {
    const allFlipped = this.flippedIndices.size === 5;

    return `
      <div class="pack-reveal-container">
        <h2>✨ Unveiling Pack Contents! ✨</h2>
        <p style="color: var(--wood-med); margin-bottom: 20px;">
          Click each card to reveal its magic, or flip all at once!
        </p>

        <div class="reveal-cards-row">
          ${this.currentOpenedCards.map((item, idx) => {
            const isFlipped = this.flippedIndices.has(idx);
            const card = item.card;

            return `
              <div class="reveal-card-slot ${isFlipped ? 'flipped' : ''}" 
                onclick="window.app.packScreen.flipCard(${idx})">
                <div class="reveal-card-inner">
                  <!-- Face Down Back -->
                  <div class="card-face card-back">
                    <div style="font-size: 2.5rem;">❓</div>
                    <div style="font-weight: bold; margin-top: 8px;">ODD SHOP</div>
                    <div style="font-size: 0.7rem; opacity: 0.8;">Click to Reveal</div>
                  </div>

                  <!-- Face Up Front -->
                  <div class="card-face card-front ${card.rarity}">
                    <div class="card-header">
                      <span class="card-cost">${card.cost}</span>
                      <span style="font-size: 0.65rem; text-transform: uppercase;">${card.rarity}</span>
                    </div>
                    <div class="card-emoji" style="font-size: 2.5rem;">${card.emoji}</div>
                    <div class="card-name" style="font-size: 0.85rem;">${card.name}</div>
                    <div class="card-desc" style="font-size: 0.65rem;">${card.description}</div>
                    
                    ${item.isDuplicateExcess ? `
                      <div class="scrap-banner">⚙️ +${item.scrapAwarded} Scrap!</div>
                    ` : (item.isNew ? `
                      <div class="new-banner">🌟 NEW!</div>
                    ` : `
                      <div class="owned-banner">✓ Owned x2</div>
                    `)}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="margin-top: 30px; display: flex; gap: 12px; justify-content: center;">
          ${!allFlipped ? `
            <button class="btn btn-primary" onclick="window.app.packScreen.flipAll()">✨ Flip All Cards</button>
          ` : `
            <button class="btn btn-primary" style="font-size: 1.1rem; padding: 12px 28px;"
              onclick="window.app.packScreen.finishPack()">
              🎉 Collect & Return
            </button>
          `}
        </div>
      </div>
    `;
  }

  buyPack(packId, price) {
    if (this.app.saveData.currency.coins < price) {
      alert("Not enough coins!");
      return;
    }
    this.app.saveData.currency.coins -= price;
    this.app.saveData.inventory.packs[packId] = (this.app.saveData.inventory.packs[packId] || 0) + 1;
    this.app.saveState();
    soundFx.playCoinClink();
    this.app.render();
  }

  openPack(packId) {
    const packs = this.app.saveData.inventory.packs;
    if (!packs[packId] || packs[packId] <= 0) return;

    packs[packId] -= 1;
    this.flippedIndices.clear();

    const existingCopies = this.app.saveData.inventory.cardCopies || {};
    this.currentOpenedCards = PackSystem.openPack(packId, existingCopies);

    soundFx.playPackTear();
    this.app.render();
  }

  flipCard(idx) {
    if (this.flippedIndices.has(idx)) return;
    this.flippedIndices.add(idx);
    soundFx.playCardFlip();
    this.app.render();
  }

  flipAll() {
    for (let i = 0; i < 5; i++) {
      this.flippedIndices.add(i);
    }
    soundFx.playHealChime();
    this.app.render();
  }

  finishPack() {
    if (!this.currentOpenedCards) return;

    const copies = this.app.saveData.inventory.cardCopies;
    let totalScrapEarned = 0;

    this.currentOpenedCards.forEach(item => {
      const cardId = item.card.id;
      if (item.isDuplicateExcess) {
        totalScrapEarned += item.scrapAwarded;
      } else {
        copies[cardId] = (copies[cardId] || 0) + 1;
      }
    });

    this.app.saveData.currency.scrap += totalScrapEarned;
    this.currentOpenedCards = null;
    this.flippedIndices.clear();

    this.app.saveState();
    soundFx.playCounterBell();
    this.app.render();
  }
}
