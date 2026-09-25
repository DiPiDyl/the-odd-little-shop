// Central Visual FX & Animation Manager (Hearthstone-Level Tactile Juice)
import { soundFx } from "../audio/soundEffects.js";

export class AnimationManager {
  constructor() {
    this.speedMultiplier = 1.0; // 1.0 = Normal, 0.6 = Fast Combat
    this.isFastCombat = false;
  }

  setFastCombat(enabled) {
    this.isFastCombat = enabled;
    this.speedMultiplier = enabled ? 0.6 : 1.0;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms * this.speedMultiplier));
  }

  // --- Attack Animations ---

  async playAttackAnimation(attackerSlotEl, defenderSlotEl, card, isPlayer) {
    if (!attackerSlotEl) return;
    const cardEl = attackerSlotEl.querySelector(".card-unit");
    if (!cardEl) return;

    const tags = card.tags || [];
    const isMagic = tags.includes("light") || tags.includes("glass") || tags.includes("magic") || tags.includes("occult");
    const isSwift = card.hasSwift || tags.includes("agile");

    if (isMagic) {
      // Magic projectile animation
      soundFx.playMagicCast();
      await this.spawnProjectile(attackerSlotEl, defenderSlotEl, card.emoji);
    } else if (isSwift) {
      // Swift sweeping slash
      soundFx.playSwiftAttack();
      cardEl.classList.add("anim-swift-sweep");
      await this.delay(220);
      cardEl.classList.remove("anim-swift-sweep");
    } else {
      // Melee lunge / slam
      soundFx.playHeavyAttack();
      const lungeClass = isPlayer ? "anim-lunge-up" : "anim-lunge-down";
      cardEl.classList.add(lungeClass);
      await this.delay(260);
      cardEl.classList.remove(lungeClass);
    }
  }

  async spawnProjectile(fromSlot, toSlot, emoji = "✨") {
    if (!fromSlot || !toSlot) return;

    const fromRect = fromSlot.getBoundingClientRect();
    const toRect = toSlot.getBoundingClientRect();

    const proj = document.createElement("div");
    proj.className = "magic-projectile";
    proj.innerText = emoji;
    proj.style.left = `${fromRect.left + fromRect.width / 2}px`;
    proj.style.top = `${fromRect.top + fromRect.height / 2}px`;
    document.body.appendChild(proj);

    // Force reflow
    proj.getBoundingClientRect();

    proj.style.transition = `all ${0.28 * this.speedMultiplier}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    proj.style.left = `${toRect.left + toRect.width / 2}px`;
    proj.style.top = `${toRect.top + toRect.height / 2}px`;
    proj.style.transform = "scale(1.4) rotate(45deg)";

    await this.delay(280);
    proj.remove();
  }

  // --- Hit Reactions & Floating Combat Text ---

  playHitReaction(slotEl, isHeavy = false) {
    if (!slotEl) return;
    const cardEl = slotEl.querySelector(".card-unit");
    const target = cardEl || slotEl;

    target.classList.add("anim-hit-squash");
    soundFx.playHitImpact();

    if (isHeavy) {
      this.shakeScreen("light");
    }

    setTimeout(() => {
      target.classList.remove("anim-hit-squash");
    }, 300 * this.speedMultiplier);
  }

  showFloatingText(anchorEl, text, type = "damage") {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();

    const floatEl = document.createElement("div");
    floatEl.className = `floating-combat-text float-${type}`;
    floatEl.innerText = text;

    // Center above anchor
    floatEl.style.left = `${rect.left + rect.width / 2}px`;
    floatEl.style.top = `${rect.top + rect.height * 0.3}px`;
    document.body.appendChild(floatEl);

    setTimeout(() => {
      floatEl.remove();
    }, 850 * this.speedMultiplier);
  }

  shakeScreen(intensity = "light") {
    const arena = document.querySelector(".battle-arena") || document.body;
    const cls = intensity === "heavy" ? "anim-screen-shake-heavy" : "anim-screen-shake";
    arena.classList.add(cls);
    setTimeout(() => {
      arena.classList.remove(cls);
    }, 350);
  }

  // --- Death & Summon Animations ---

  async playDeathAnimation(slotEl) {
    if (!slotEl) return;
    const cardEl = slotEl.querySelector(".card-unit");
    if (!cardEl) return;

    cardEl.classList.add("anim-death-crumble");
    await this.delay(350);
  }

  playSummonLanding(slotEl) {
    if (!slotEl) return;
    const cardEl = slotEl.querySelector(".card-unit");
    if (!cardEl) return;

    cardEl.classList.add("anim-summon-land");
    soundFx.playWoodClunk();
    setTimeout(() => {
      cardEl.classList.remove("anim-summon-land");
    }, 350);
  }

  // --- Shopkeeper Hit & Reaction ---

  playShopkeeperHit(targetSide, amount) {
    const targetSelector = targetSide === "player" ? ".sidebar-panel .shopkeeper-card" : ".enemy-area";
    const shopkeeperEl = document.querySelector(targetSelector);
    if (shopkeeperEl) {
      shopkeeperEl.classList.add("anim-hit-squash");
      this.showFloatingText(shopkeeperEl, `-${amount}`, "damage");
      this.shakeScreen(amount >= 3 ? "heavy" : "light");
      setTimeout(() => {
        shopkeeperEl.classList.remove("anim-hit-squash");
      }, 350);
    }
  }

  // --- Selling Cash In Animation ---

  playSellAnimation(slotEl, saleCoins) {
    if (!slotEl) return;
    this.showFloatingText(slotEl, `SOLD! +${saleCoins} 🪙`, "sell");
    soundFx.playSellRegister();
    soundFx.playCoinShower();
  }
}

export const animManager = new AnimationManager();
