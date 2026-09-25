// The Odd Pawn Shop Barter Encounter Modal
import { PawnShopManager } from "../data/pawnShop.js";
import { soundFx } from "../audio/soundEffects.js";

export class PawnShopModal {
  constructor(app) {
    this.app = app;
    this.currentEncounter = null;
    this.dialogueMessage = null;
    this.haggleCompleted = false;
  }

  open() {
    this.show();
  }

  show() {
    const unownedCards = [];
    const copies = this.app.saveData.inventory.cardCopies || {};
    this.app.allCards.forEach(c => {
      if (!copies[c.id]) unownedCards.push(c.id);
    });

    this.currentEncounter = PawnShopManager.getRandomEncounter(unownedCards);
    this.dialogueMessage = this.currentEncounter.greeting;
    this.haggleCompleted = false;
    this.renderModal();
  }

  renderModal() {
    let existing = document.getElementById("pawn-shop-modal");
    if (existing) existing.remove();

    const enc = this.currentEncounter;
    const coins = this.app.saveData.currency.coins || 0;

    const modalEl = document.createElement("div");
    modalEl.className = "modal-overlay";
    modalEl.id = "pawn-shop-modal";

    let offerHtml = "";
    if (enc.offerType === "sell_missing_card" && enc.offeredCard) {
      offerHtml = `
        <div class="pawn-offer-box">
          <div style="font-weight: bold; margin-bottom: 6px;">Special Oddity on Offer:</div>
          <div style="font-size: 1.8rem;">${enc.offeredCard.emoji} ${enc.offeredCard.name}</div>
          <p style="font-size: 0.8rem; color: #555;">${enc.offeredCard.description}</p>
          <div style="margin-top: 10px; font-weight: bold; color: var(--wood-dark);">Price: ${enc.priceCoins} Coins</div>
        </div>
      `;
    } else if (enc.offerType === "mystery_box") {
      offerHtml = `
        <div class="pawn-offer-box">
          <div style="font-size: 2.5rem;">📦</div>
          <div style="font-weight: bold;">Ancient Locked Container</div>
          <p style="font-size: 0.8rem; color: #555;">Could hold treasure, rare packs, or ancient scrap!</p>
          <div style="margin-top: 10px; font-weight: bold;">Price: ${enc.priceCoins} Coins</div>
        </div>
      `;
    } else {
      offerHtml = `
        <div class="pawn-offer-box">
          <div style="font-size: 2.2rem;">🪵 🪑</div>
          <div style="font-weight: bold;">Looking for Furniture / Wooden Stock</div>
          <p style="font-size: 0.8rem; color: #555;">Offering a 50% coin premium for any matching item from your collection!</p>
        </div>
      `;
    }

    modalEl.innerHTML = `
      <div class="modal-content" style="max-width: 550px; text-align: center;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--wood-light); padding-bottom: 6px;">
          <h3>🏪 The Odd Pawn Shop — Barter Counter</h3>
          <button class="btn btn-sm" onclick="document.getElementById('pawn-shop-modal').remove()">✖</button>
        </div>

        <div style="margin: 16px 0;">
          <div style="font-size: 3.5rem;">${enc.emoji}</div>
          <h4>${enc.name}</h4>
          <span style="font-size: 0.8rem; color: var(--wood-med);">${enc.title}</span>
        </div>

        <div class="pawn-speech-bubble">
          "${this.dialogueMessage}"
        </div>

        ${offerHtml}

        <div style="display: flex; gap: 8px; justify-content: center; margin-top: 18px; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="window.app.pawnModal.acceptDeal()">
            ✅ Accept Deal
          </button>
          <button class="btn" ${this.haggleCompleted ? 'disabled' : ''} onclick="window.app.pawnModal.haggle()">
            💬 Haggle Price
          </button>
          <button class="btn" onclick="document.getElementById('pawn-shop-modal').remove()">
            ❌ Decline
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);
  }

  acceptDeal() {
    const enc = this.currentEncounter;
    const coins = this.app.saveData.currency.coins || 0;

    if (enc.offerType === "sell_missing_card") {
      if (coins < enc.priceCoins) {
        alert("Not enough coins!");
        return;
      }
      this.app.saveData.currency.coins -= enc.priceCoins;
      const copies = this.app.saveData.inventory.cardCopies;
      copies[enc.offeredCard.id] = (copies[enc.offeredCard.id] || 0) + 1;
      this.dialogueMessage = enc.dialogueSuccess;
      soundFx.playSellRegister();
    } else if (enc.offerType === "mystery_box") {
      if (coins < enc.priceCoins) {
        alert("Not enough coins!");
        return;
      }
      this.app.saveData.currency.coins -= enc.priceCoins;
      const outcome = enc.possibleRewards[Math.floor(Math.random() * enc.possibleRewards.length)];
      if (outcome.type === "coins") this.app.saveData.currency.coins += outcome.amount;
      if (outcome.type === "scrap") this.app.saveData.currency.scrap += outcome.amount;
      if (outcome.type === "pack") {
        this.app.saveData.inventory.packs[outcome.packId] = (this.app.saveData.inventory.packs[outcome.packId] || 0) + 1;
      }
      this.dialogueMessage = `Result: ${outcome.label}`;
      soundFx.playHealChime();
    } else {
      // Barter bonus
      this.app.saveData.currency.coins += 75;
      this.dialogueMessage = enc.dialogueSuccess;
      soundFx.playCoinClink();
    }

    this.app.saveState();
    this.renderModal();
  }

  haggle() {
    this.haggleCompleted = true;
    const enc = this.currentEncounter;
    const roll = Math.random();

    if (roll > 0.45) {
      if (enc.priceCoins) enc.priceCoins = Math.max(15, Math.floor(enc.priceCoins * 0.75));
      this.dialogueMessage = "Fine, fine! You drive a hard bargain. Here's a friendlier price!";
      soundFx.playHealChime();
    } else {
      this.dialogueMessage = "Hmph! If you question my appraisal, the price just went up!";
      if (enc.priceCoins) enc.priceCoins = Math.floor(enc.priceCoins * 1.3);
      soundFx.playWoodClunk();
    }
    this.renderModal();
  }
}
