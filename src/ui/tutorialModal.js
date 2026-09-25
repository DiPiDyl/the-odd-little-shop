// Tutorial & Rules Guide Modal
import { soundFx } from "../audio/soundEffects.js";

export class TutorialModal {
  constructor(app) {
    this.app = app;
    this.isOpen = false;
    this.currentStep = 0;
  }

  open() {
    this.isOpen = true;
    this.currentStep = 0;
    soundFx.playButtonClick();
    this.app.render();
  }

  close() {
    this.isOpen = false;
    soundFx.playButtonClick();
    this.app.render();
  }

  setStep(step) {
    this.currentStep = step;
    soundFx.playCardHover();
    this.app.render();
  }

  render() {
    if (!this.isOpen) return "";

    const steps = [
      {
        title: "1. The 5-Lane Counter",
        icon: "🏬",
        content: `
          <p>Combat takes place across <strong>5 distinct Counter Lanes</strong>. When you play a Minion, place it into any open lane.</p>
          <p>During the clash phase, units attack opposing enemies directly across from them. If an enemy lane is empty, your unit strikes the <strong>Rival Hero directly!</strong></p>
        `
      },
      {
        title: "2. Mana Management",
        icon: "💎",
        content: `
          <p>You begin each battle with <strong>1 Mana Crystal</strong>. Each subsequent turn, your maximum Mana increases by +1 (up to 10) and completely refreshes!</p>
          <p>Cards and Shopkeeper Hero Powers consume Mana. Affordable cards in your arched hand pulse with a golden glow.</p>
        `
      },
      {
        title: "3. Minions, Spells & Weapons",
        icon: "⚔️",
        content: `
          <p><strong>Minions (Curios):</strong> Have Attack (⚔️) and Health (❤️). They stay on the counter until defeated.</p>
          <p><strong>Spells (Tricks):</strong> Instant magical reactions that heal allies, blast enemies, or draw extra cards.</p>
          <p><strong>Weapons (Tools):</strong> Equip directly to your Hero with Attack and Durability to personally strike foes!</p>
        `
      },
      {
        title: "4. Powerful Keywords",
        icon: "✨",
        content: `
          <ul class="tutorial-kw-list">
            <li><strong>🛡️ Taunt:</strong> Opponents cannot strike past this minion; they must attack it first.</li>
            <li><strong>⚡ Rush:</strong> Can charge and attack opposing units immediately on the turn it is deployed!</li>
            <li><strong>✨ Divine Shield:</strong> Completely negates the very first instance of damage received.</li>
            <li><strong>🩸 Lifesteal:</strong> Any damage dealt by this card restores Health to your Hero.</li>
            <li><strong>📢 Battlecry:</strong> Triggers an immediate bonus ability when played from hand.</li>
            <li><strong>💀 Deathrattle:</strong> Triggers a final bonus effect when crumbled or destroyed.</li>
          </ul>
        `
      },
      {
        title: "5. Unit Liquidation (Selling)",
        icon: "🪙",
        content: `
          <p>Unique to <em>The Odd Little Shop</em>: During your planning phase, you can <strong>sell 1 unit per round</strong> to liquidate stock.</p>
          <p>Selling awards instant <strong>Coins (🪙)</strong> and triggers special <strong>When Sold</strong> abilities (such as healing your Hero or drawing fresh wares)!</p>
        `
      }
    ];

    const cur = steps[this.currentStep];

    return `
      <div class="modal-backdrop" onclick="window.app.tutorialModal.close()">
        <div class="tutorial-modal-dialog" onclick="event.stopPropagation()">
          <div class="tutorial-modal-header">
            <h3>📖 HOW TO PLAY THE ODD LITTLE SHOP</h3>
            <button class="modal-close-btn" onclick="window.app.tutorialModal.close()">✖</button>
          </div>

          <div class="tutorial-step-tabs">
            ${steps.map((st, i) => `
              <button class="tutorial-tab-btn ${this.currentStep === i ? 'active' : ''}" onclick="window.app.tutorialModal.setStep(${i})">
                ${st.icon} ${st.title.split('.')[1] || st.title}
              </button>
            `).join('')}
          </div>

          <div class="tutorial-body-stage">
            <div class="tutorial-body-icon">${cur.icon}</div>
            <div class="tutorial-body-text">
              <h4>${cur.title}</h4>
              ${cur.content}
            </div>
          </div>

          <div class="tutorial-modal-footer">
            <button class="btn btn-secondary" onclick="window.app.tutorialModal.setStep(Math.max(0, window.app.tutorialModal.currentStep - 1))" ${this.currentStep === 0 ? 'disabled' : ''}>Previous</button>
            <span class="tutorial-page-indicator">Step ${this.currentStep + 1} of ${steps.length}</span>
            ${this.currentStep < steps.length - 1 ? `
              <button class="btn btn-primary" onclick="window.app.tutorialModal.setStep(window.app.tutorialModal.currentStep + 1)">Next</button>
            ` : `
              <button class="btn btn-primary" onclick="window.app.tutorialModal.close()">Got It!</button>
            `}
          </div>
        </div>
      </div>
    `;
  }
}
