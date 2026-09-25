// Core 5-Lane Deterministic Combat Engine & State Machine (Overhauled)
import { DeckManager } from "./deckManager.js";
import { SHOPKEEPERS } from "../data/shopkeepers.js";

export const CombatPhase = {
  ROUND_START: "ROUND_START",
  DRAW: "DRAW",
  PLAYER_PLANNING: "PLAYER_PLANNING",
  OPPONENT_PLANNING: "OPPONENT_PLANNING",
  OPEN_SHOP: "OPEN_SHOP",
  RESOLUTION: "RESOLUTION",
  ROUND_END: "ROUND_END",
  BATTLE_OVER: "BATTLE_OVER"
};

export class CombatEngine {
  constructor(config = {}) {
    this.roundNumber = 0;
    this.phase = CombatPhase.ROUND_START;
    this.eventLogs = [];
    this.listeners = [];

    // 5 Lanes: index 0 to 4
    this.playerLanes = [null, null, null, null, null];
    this.enemyLanes = [null, null, null, null, null];
    this.lockedPlayerLanes = [false, false, false, false, false];

    // Economy & Selling
    this.playerCoins = config.initialCoins || 0;
    this.enemyCoins = 0;
    this.salesThisRound = { player: 0, enemy: 0 };
    this.maxSalesPerRound = 1;
    this.soldStock = { player: [], enemy: [] };

    // Player State
    const playerShopkeeperData = SHOPKEEPERS[config.playerShopkeeperId || "cozy_curator"];
    this.player = {
      name: playerShopkeeperData.name,
      title: playerShopkeeperData.title,
      emoji: playerShopkeeperData.emoji,
      faction: playerShopkeeperData.faction,
      health: playerShopkeeperData.maxHealth,
      maxHealth: playerShopkeeperData.maxHealth,
      energy: 0,
      maxEnergy: 3,
      kassa: 0,
      kassaMax: playerShopkeeperData.kassaMax,
      warmth: 0,
      abilities: playerShopkeeperData.abilities,
      signature: playerShopkeeperData.signature,
      deckManager: new DeckManager(config.playerDeckInstances || []),
      isShopkeeper: true
    };

    // Enemy State
    const enemyShopkeeperData = SHOPKEEPERS[config.enemyShopkeeperId || "midnight_broker"];
    this.enemy = {
      name: config.enemyName || enemyShopkeeperData.name,
      title: config.enemyTitle || enemyShopkeeperData.title,
      emoji: config.enemyEmoji || enemyShopkeeperData.emoji,
      faction: enemyShopkeeperData.faction,
      health: config.enemyHealth || enemyShopkeeperData.maxHealth,
      maxHealth: config.enemyHealth || enemyShopkeeperData.maxHealth,
      energy: 0,
      maxEnergy: 3,
      kassa: 0,
      kassaMax: enemyShopkeeperData.kassaMax,
      warmth: 0,
      abilities: enemyShopkeeperData.abilities,
      signature: enemyShopkeeperData.signature,
      deckManager: new DeckManager(config.enemyDeckInstances || []),
      specialMechanic: config.specialMechanic || null,
      isShopkeeper: true
    };

    this.roundEndDamageQueue = { player: 0, enemy: 0 };
    this.destroyedThisRound = { player: [], enemy: [] };
    this.relics = config.relics || [];
    this.relicState = {};
    this.winner = null;
    this.aiController = config.aiController || null;
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify(eventType, data = {}) {
    this.listeners.forEach(fn => fn(eventType, data, this));
  }

  log(message) {
    this.eventLogs.push(message);
    this.notify("log", { message });
  }

  // --- Round Flow & Lifecycle ---

  startBattle() {
    this.log(`🏪 Welcome to The Odd Little Shop! Battle commences: ${this.player.name} vs ${this.enemy.name}!`);
    this.roundNumber = 0;
    this.startNextRound();
  }

  startNextRound() {
    if (this.winner) return;

    this.roundNumber += 1;
    this.phase = CombatPhase.ROUND_START;
    this.destroyedThisRound = { player: [], enemy: [] };
    this.salesThisRound = { player: 0, enemy: 0 };

    // Progressive Energy: Round 1: 3, Round 2: 4, Round 3+: 5
    const baseEnergy = Math.min(5, 2 + this.roundNumber);
    this.player.maxEnergy = baseEnergy;
    this.player.energy = baseEnergy;
    this.enemy.maxEnergy = baseEnergy;
    this.enemy.energy = baseEnergy;

    // Reset lane locks
    this.lockedPlayerLanes = [false, false, false, false, false];

    // Relic hooks
    this.relics.forEach(r => {
      if (r.onRoundStart) r.onRoundStart(this.relicState);
    });

    // Special Boss Mechanic: Inspector Grimshaw Code Violation
    if (this.enemy.specialMechanic === "code_violation" && this.roundNumber % 2 === 0) {
      const lockIndex = Math.floor(Math.random() * 5);
      this.lockedPlayerLanes[lockIndex] = true;
      this.log(`📋 Inspector Grimshaw places CONDEMNED TAPE on Lane ${lockIndex + 1}!`);
    }

    this.log(`─── Round ${this.roundNumber} begins! Energy: ${baseEnergy} ───`);

    // Board start of round triggers
    this.processStartOfRoundTriggers();

    // Execute Draw Phase
    this.executeDrawPhase();
  }

  processStartOfRoundTriggers() {
    for (let i = 0; i < 5; i++) {
      const pUnit = this.playerLanes[i];
      if (pUnit && pUnit.onRoundStart) {
        pUnit.onRoundStart(pUnit, i, this, true);
      }
      const eUnit = this.enemyLanes[i];
      if (eUnit && eUnit.onRoundStart) {
        eUnit.onRoundStart(eUnit, i, this, false);
      }
    }
  }

  executeDrawPhase() {
    this.phase = CombatPhase.DRAW;
    const cardsToDraw = this.roundNumber === 1 ? 5 : 4;

    const pDrawn = this.player.deckManager.drawCards(cardsToDraw, () => {
      this.log("🔄 Player draw pile empty: Shuffled Discard Pile back into Draw Pile!");
    });
    const eDrawn = this.enemy.deckManager.drawCards(cardsToDraw, () => {
      this.log("🔄 Opponent draw pile empty: Shuffled Discard Pile back into Draw Pile!");
    });

    this.log(`Drew ${pDrawn.length} cards. (Hand: ${this.player.deckManager.hand.length}/7)`);
    this.notify("draw_completed", { playerDrawn: pDrawn, enemyDrawn: eDrawn });

    this.phase = CombatPhase.PLAYER_PLANNING;
    this.notify("phase_changed", { phase: this.phase });
  }

  // --- SELLING MECHANIC (THE SHOP ECONOMY) ---

  canSellUnit(isPlayer, laneIndex) {
    if (this.phase !== CombatPhase.PLAYER_PLANNING && this.phase !== CombatPhase.OPPONENT_PLANNING) {
      return { allowed: false, reason: "Can only sell during Planning Phase" };
    }
    const currentSales = isPlayer ? this.salesThisRound.player : this.salesThisRound.enemy;
    if (currentSales >= this.maxSalesPerRound) {
      return { allowed: false, reason: `Max ${this.maxSalesPerRound} sale per round allowed!` };
    }
    const lanes = isPlayer ? this.playerLanes : this.enemyLanes;
    const unit = lanes[laneIndex];
    if (!unit) {
      return { allowed: false, reason: "No unit in that lane to sell" };
    }
    return { allowed: true, unit };
  }

  sellUnit(isPlayer, laneIndex) {
    const check = this.canSellUnit(isPlayer, laneIndex);
    if (!check.allowed) {
      this.log(`⚠️ Cannot sell: ${check.reason}`);
      return false;
    }

    const lanes = isPlayer ? this.playerLanes : this.enemyLanes;
    const unit = lanes[laneIndex];
    const saleCoins = unit.saleValue || Math.max(1, Math.floor(unit.cost * 1.5));

    // Remove from lane
    lanes[laneIndex] = null;
    if (isPlayer) {
      this.playerCoins += saleCoins;
      this.salesThisRound.player += 1;
      this.soldStock.player.push(unit);
      this.log(`💰 SOLD! ${unit.name} on Lane ${laneIndex + 1} sold for ${saleCoins} Coins! (Total: ${this.playerCoins} 🪙)`);
    } else {
      this.enemyCoins += saleCoins;
      this.salesThisRound.enemy += 1;
      this.soldStock.enemy.push(unit);
      this.log(`💰 Opponent liquidated ${unit.name} on Lane ${laneIndex + 1} for ${saleCoins} Coins!`);
    }

    // Trigger When Sold effect
    if (unit.onSold) {
      unit.onSold(unit, this, isPlayer);
    }

    // Relic triggers
    if (isPlayer) {
      this.relics.forEach(r => {
        if (r.onUnitSold) r.onUnitSold(unit, this);
      });
    }

    this.notify("unit_sold", { isPlayer, laneIndex, unit, saleCoins });
    this.notify("board_updated");
    return true;
  }

  // --- PLANNING ACTIONS (CARDS & ABILITIES) ---

  canPlayCard(isPlayer, cardInstance, targetLaneIndex = null) {
    const validPhase = isPlayer ? CombatPhase.PLAYER_PLANNING : CombatPhase.OPPONENT_PLANNING;
    if (this.phase !== validPhase) {
      return { allowed: false, reason: "Not in active planning phase" };
    }
    const entity = isPlayer ? this.player : this.enemy;
    const lanes = isPlayer ? this.playerLanes : this.enemyLanes;

    if (entity.energy < cardInstance.cost) {
      return { allowed: false, reason: `Need ${cardInstance.cost} Energy (have ${entity.energy})` };
    }

    if (cardInstance.type === "item" || cardInstance.type === "minion") {
      if (targetLaneIndex === null || targetLaneIndex < 0 || targetLaneIndex > 4) {
        return { allowed: false, reason: "Please choose a lane (1 to 5)" };
      }
      if (isPlayer && this.lockedPlayerLanes[targetLaneIndex]) {
        return { allowed: false, reason: "Lane is locked by Inspector Grimshaw!" };
      }
      if (lanes[targetLaneIndex] !== null) {
        return { allowed: false, reason: "Lane already occupied" };
      }
    }

    return { allowed: true };
  }

  playCard(isPlayer, cardInstanceId, targetLaneIndex = null, targetItem = null) {
    const entity = isPlayer ? this.player : this.enemy;
    const lanes = isPlayer ? this.playerLanes : this.enemyLanes;
    const opposingLanes = isPlayer ? this.enemyLanes : this.playerLanes;
    const card = entity.deckManager.hand.find(c => c.instanceId === cardInstanceId);

    if (!card) return false;
    const check = this.canPlayCard(isPlayer, card, targetLaneIndex);
    if (!check.allowed) {
      this.log(`⚠️ Cannot play ${card.name}: ${check.reason}`);
      return false;
    }

    // Deduct cost
    entity.energy -= card.cost;
    entity.deckManager.playCardFromHand(card.instanceId);

    // Relic triggers
    if (isPlayer) {
      this.relics.forEach(r => {
        if (r.onCardPlayed) r.onCardPlayed(card, this.relicState);
      });
    }

    if (card.type === "item" || card.type === "minion") {
      lanes[targetLaneIndex] = card;
      this.log(`${entity.name} deployed ${card.name} into Lane ${targetLaneIndex + 1}!`);

      // On Play triggers
      const opposingUnit = opposingLanes[targetLaneIndex];
      if (card.onPlay) {
        card.onPlay(card, lanes, this, isPlayer, false, targetLaneIndex, opposingUnit);
      }
      if (card.onPlayCheckSynergy) {
        card.onPlayCheckSynergy(card, lanes, this);
      }
    } else if (card.type === "trick" || card.type === "spell") {
      this.log(`${entity.name} played trick: ${card.name}!`);
      if (card.cast) card.cast(entity, this, isPlayer);
      if (card.castTargetItem && targetItem) card.castTargetItem(targetItem, targetLaneIndex, this, isPlayer);
      entity.deckManager.sendToDiscard(card);
    } else if (card.type === "upgrade" || card.type === "weapon") {
      if (targetItem) {
        if (card.apply) card.apply(targetItem, this);
        entity.deckManager.sendToDiscard(card);
      }
    }

    this.notify("card_played", { isPlayer, card, targetLaneIndex });
    this.notify("board_updated");
    return true;
  }

  useShopkeeperAbility(isPlayer, abilityId, targetLaneIndex = null) {
    const validPhase = isPlayer ? CombatPhase.PLAYER_PLANNING : CombatPhase.OPPONENT_PLANNING;
    if (this.phase !== validPhase) return false;

    const entity = isPlayer ? this.player : this.enemy;
    const lanes = isPlayer ? this.playerLanes : this.enemyLanes;
    const ability = entity.abilities.find(a => a.id === abilityId);

    if (!ability) return false;
    if (entity.energy < ability.cost) {
      this.log(`⚠️ Need ${ability.cost} Energy for ${ability.name}`);
      return false;
    }

    let target = null;
    if (ability.targetType === "friendly_item") {
      if (targetLaneIndex === null || !lanes[targetLaneIndex]) {
        this.log(`⚠️ Select a friendly item for ${ability.name}`);
        return false;
      }
      target = lanes[targetLaneIndex];
    } else if (ability.targetType === "any_friendly") {
      if (targetLaneIndex !== null && lanes[targetLaneIndex]) {
        target = lanes[targetLaneIndex];
      } else {
        target = entity; // Shopkeeper self
      }
    }

    entity.energy -= ability.cost;
    ability.execute(target, this, isPlayer);
    this.notify("ability_used", { isPlayer, ability, target });
    this.notify("board_updated");
    return true;
  }

  useSignatureAbility(isPlayer) {
    const validPhase = isPlayer ? CombatPhase.PLAYER_PLANNING : CombatPhase.OPPONENT_PLANNING;
    if (this.phase !== validPhase) return false;

    const entity = isPlayer ? this.player : this.enemy;
    const lanes = isPlayer ? this.playerLanes : this.enemyLanes;

    if (entity.kassa < entity.kassaMax) {
      this.log(`⚠️ Kassa meter not yet full (${entity.kassa}/${entity.kassaMax})!`);
      return false;
    }

    entity.kassa = 0; // Consume meter
    entity.signature.execute(lanes, this, isPlayer);
    this.notify("signature_used", { isPlayer, signature: entity.signature });
    this.notify("board_updated");
    return true;
  }

  // --- OPEN THE SHOP & ASYNC COMBAT RESOLUTION ---

  async openTheShop() {
    if (this.phase !== CombatPhase.PLAYER_PLANNING) return;

    this.log(`🔔 TING! OPEN THE SHOP! Committing stock...`);
    this.notify("shop_opened");

    // Phase 1: Opponent Planning
    this.phase = CombatPhase.OPPONENT_PLANNING;
    this.notify("phase_changed", { phase: this.phase });

    if (this.aiController) {
      await this.aiController.takeTurnAsync(this);
    }

    // Phase 2: Combat Resolution
    this.phase = CombatPhase.RESOLUTION;
    this.notify("phase_changed", { phase: this.phase });
    await this.resolveCombatSequentially();
  }

  async resolveCombatSequentially() {
    // Step 1: Pre-Combat triggers
    for (let i = 0; i < 5; i++) {
      const pUnit = this.playerLanes[i];
      const eUnit = this.enemyLanes[i];
      if (pUnit && pUnit.onPreCombat) {
        const neighbors = [this.playerLanes[i - 1], this.playerLanes[i + 1]];
        pUnit.onPreCombat(pUnit, neighbors, this, i, eUnit);
      }
      if (eUnit && eUnit.onPreCombat) {
        const neighbors = [this.enemyLanes[i - 1], this.enemyLanes[i + 1]];
        eUnit.onPreCombat(eUnit, neighbors, this, i, pUnit);
      }
    }
    this.notify("board_updated");
    await this.delay(350);

    // Step 2: Lane-by-Lane Clash (Lane 0 to 4)
    for (let laneIdx = 0; laneIdx < 5; laneIdx++) {
      await this.resolveSingleLaneAsync(laneIdx);
      if (this.checkWinLoss()) return;
      await this.delay(300);
    }

    // Step 3: Round End damage queues
    if (this.roundEndDamageQueue.player > 0) {
      this.damageShopkeeper("player", this.roundEndDamageQueue.player, "Pending round penalty");
      this.roundEndDamageQueue.player = 0;
    }
    if (this.roundEndDamageQueue.enemy > 0) {
      this.damageShopkeeper("enemy", this.roundEndDamageQueue.enemy, "Pending round penalty");
      this.roundEndDamageQueue.enemy = 0;
    }

    // Step 4: End of Round triggers
    for (let i = 0; i < 5; i++) {
      const pUnit = this.playerLanes[i];
      if (pUnit && pUnit.onRoundEnd) {
        pUnit.onRoundEnd(pUnit, this.playerLanes, this, true);
      }
      const eUnit = this.enemyLanes[i];
      if (eUnit && eUnit.onRoundEnd) {
        eUnit.onRoundEnd(eUnit, this.enemyLanes, this, false);
      }
    }

    this.relics.forEach(r => {
      if (r.onRoundEnd) r.onRoundEnd(this, true);
    });

    if (this.checkWinLoss()) return;

    this.phase = CombatPhase.ROUND_END;
    this.notify("phase_changed", { phase: this.phase });
    await this.delay(600);
    this.startNextRound();
  }

  async resolveSingleLaneAsync(laneIdx) {
    const pUnit = this.playerLanes[laneIdx];
    const eUnit = this.enemyLanes[laneIdx];

    if (!pUnit && !eUnit) return; // Empty lane

    this.log(`⚔️ Resolving Lane ${laneIdx + 1}...`);
    this.notify("lane_clashing", { laneIndex: laneIdx });

    // Case 1: Both lanes have an item
    if (pUnit && eUnit) {
      const pAttack = Math.max(0, pUnit.attack + (pUnit.tempAttackBonus || 0));
      const eAttack = Math.max(0, eUnit.attack + (eUnit.tempAttackBonus || 0));

      if (pUnit.hasSwift && !eUnit.hasSwift) {
        const dealt = this.applyUnitDamage(eUnit, pAttack, pUnit, false, laneIdx);
        this.notify("damage_dealt", { target: "enemy_unit", laneIndex: laneIdx, amount: dealt });
        this.log(`Swift strike! ${pUnit.name} hits ${eUnit.name} for ${dealt} damage.`);
        if (eUnit.health > 0) {
          const retaliation = this.applyUnitDamage(pUnit, eAttack, eUnit, true, laneIdx);
          this.notify("damage_dealt", { target: "player_unit", laneIndex: laneIdx, amount: retaliation });
          this.log(`${eUnit.name} strikes back for ${retaliation} damage.`);
        }
      } else if (eUnit.hasSwift && !pUnit.hasSwift) {
        const dealt = this.applyUnitDamage(pUnit, eAttack, eUnit, true, laneIdx);
        this.notify("damage_dealt", { target: "player_unit", laneIndex: laneIdx, amount: dealt });
        this.log(`Swift strike! ${eUnit.name} hits ${pUnit.name} for ${dealt} damage.`);
        if (pUnit.health > 0) {
          const retaliation = this.applyUnitDamage(eUnit, pAttack, pUnit, false, laneIdx);
          this.notify("damage_dealt", { target: "enemy_unit", laneIndex: laneIdx, amount: retaliation });
          this.log(`${pUnit.name} strikes back for ${retaliation} damage.`);
        }
      } else {
        const pDealt = this.applyUnitDamage(eUnit, pAttack, pUnit, false, laneIdx);
        const eDealt = this.applyUnitDamage(pUnit, eAttack, eUnit, true, laneIdx);
        this.notify("damage_dealt", { target: "both_units", laneIndex: laneIdx, pAmount: eDealt, eAmount: pDealt });
        this.log(`Clash! ${pUnit.name} (${pDealt} dmg) <==> ${eUnit.name} (${eDealt} dmg).`);
      }

      this.checkUnitDeath(true, laneIdx);
      this.checkUnitDeath(false, laneIdx);
    } 
    // Case 2: Player unit attacks uncontested lane
    else if (pUnit && !eUnit) {
      const pAttack = Math.max(0, pUnit.attack + (pUnit.tempAttackBonus || 0));
      if (pAttack > 0) {
        this.damageShopkeeper("enemy", pAttack, `Uncontested Lane ${laneIdx + 1}: ${pUnit.name}`);
        this.notify("damage_dealt", { target: "enemy_shopkeeper", amount: pAttack });
      }
    } 
    // Case 3: Enemy unit attacks uncontested lane
    else if (!pUnit && eUnit) {
      const eAttack = Math.max(0, eUnit.attack + (eUnit.tempAttackBonus || 0));
      if (eAttack > 0) {
        // Taunt Interception Check
        const tauntIdx = this.playerLanes.findIndex(c => c && c.keywords.includes("taunt"));
        if (tauntIdx !== -1) {
          const tauntUnit = this.playerLanes[tauntIdx];
          tauntUnit.health -= eAttack;
          this.notify("damage_dealt", { target: "player_unit", laneIndex: tauntIdx, amount: eAttack });
          this.log(`🛡️ ${tauntUnit.name} intercepts the attack on Lane ${laneIdx + 1} taking ${eAttack} damage!`);
          this.checkUnitDeath(true, tauntIdx);
        } else {
          this.damageShopkeeper("player", eAttack, `Uncontested Lane ${laneIdx + 1}: ${eUnit.name}`);
          this.notify("damage_dealt", { target: "player_shopkeeper", amount: eAttack });
        }
      }
    }

    this.notify("lane_resolved", { laneIndex: laneIdx });
  }

  checkUnitDeath(isPlayer, laneIdx) {
    const lanes = isPlayer ? this.playerLanes : this.enemyLanes;
    const unit = lanes[laneIdx];
    if (unit && unit.health <= 0) {
      this.log(`💥 ${unit.name} broke and was removed from Lane ${laneIdx + 1}!`);
      lanes[laneIdx] = null;

      const deathList = isPlayer ? this.destroyedThisRound.player : this.destroyedThisRound.enemy;
      deathList.push(unit);

      if (unit.onDeath) {
        unit.onDeath(unit, this, isPlayer, laneIdx);
      }
      this.triggerGlobalItemDeath(unit);

      const dm = isPlayer ? this.player.deckManager : this.enemy.deckManager;
      dm.sendToDiscard(unit);
      this.notify("unit_died", { isPlayer, laneIndex: laneIdx, unit });
    }
  }

  triggerGlobalItemDeath(deadUnit) {
    for (let i = 0; i < 5; i++) {
      const p = this.playerLanes[i];
      if (p && p.onAnyItemDeath) p.onAnyItemDeath(p, this);
      const e = this.enemyLanes[i];
      if (e && e.onAnyItemDeath) e.onAnyItemDeath(e, this);
    }
  }

  // --- Helper Methods ---

  applyUnitDamage(targetUnit, amount, attackerUnit = null, isTargetPlayer = false, laneIdx = null) {
    if (!targetUnit || amount <= 0) return 0;
    let finalAmount = amount;
    if (targetUnit.hasDivineShield || (targetUnit.keywords && targetUnit.keywords.includes("divine_shield"))) {
      targetUnit.hasDivineShield = false;
      targetUnit.keywords = targetUnit.keywords.filter(k => k !== "divine_shield");
      this.log(`✨ Divine Shield absorbs the blow on ${targetUnit.name}!`);
      this.notify("damage_absorbed", { isPlayer: isTargetPlayer, laneIndex: laneIdx });
      finalAmount = 0;
    } else {
      targetUnit.health -= finalAmount;
    }

    if (attackerUnit && attackerUnit.keywords && attackerUnit.keywords.includes("lifesteal") && finalAmount > 0) {
      this.healShopkeeper(isTargetPlayer ? "enemy" : "player", finalAmount, `${attackerUnit.name} Lifesteal`);
    }

    return finalAmount;
  }

  dealLaneDamage(targetSide, laneIndex, amount, reason = "") {
    const lanes = targetSide === "player" ? this.playerLanes : this.enemyLanes;
    const unit = lanes[laneIndex];
    if (unit) {
      unit.health -= amount;
      this.log(`${reason} — deals ${amount} damage to ${unit.name} on Lane ${laneIndex + 1}!`);
      this.checkUnitDeath(targetSide === "player", laneIndex);
    } else {
      this.damageShopkeeper(targetSide, amount, `${reason} (Direct Lane Hit)`);
    }
    this.notify("board_updated");
  }

  dealAllLaneDamage(targetSide, amount, reason = "") {
    for (let i = 0; i < 5; i++) {
      this.dealLaneDamage(targetSide, i, amount, reason);
    }
  }

  damageShopkeeper(targetSide, amount, reason = "") {
    const entity = targetSide === "player" ? this.player : this.enemy;
    entity.health = Math.max(0, entity.health - amount);
    this.log(`💥 ${entity.name} takes ${amount} damage! (${entity.health}/${entity.maxHealth} HP) [${reason}]`);
    this.notify("shopkeeper_damaged", { targetSide, amount, health: entity.health });
    this.checkWinLoss();
  }

  healShopkeeper(targetSide, amount, reason = "") {
    const entity = targetSide === "player" ? this.player : this.enemy;
    entity.health = Math.min(entity.maxHealth, entity.health + amount);
    this.log(`💚 ${entity.name} heals for ${amount} HP! (${reason})`);
    this.notify("board_updated");
  }

  addWarmth(targetSide, amount) {
    const entity = targetSide === "player" ? this.player : this.enemy;
    entity.warmth += amount;
    this.log(`☀️ ${entity.name} gained ${amount} Warmth (Total: ${entity.warmth})!`);

    const lanes = targetSide === "player" ? this.playerLanes : this.enemyLanes;
    lanes.forEach(unit => {
      if (unit && unit.onWarmthCheck) unit.onWarmthCheck(unit, entity.warmth, this, targetSide === "player");
    });
  }

  addRegister(targetSide, amount) {
    const entity = targetSide === "player" ? this.player : this.enemy;
    const maxVal = entity.registerMax || entity.kassaMax || 5;
    entity.register = Math.min(maxVal, (entity.register || entity.kassa || 0) + amount);
    entity.kassa = entity.register;
    this.log(`🪙 Register meter for ${entity.name}: ${entity.register}/${maxVal}`);
    this.notify("board_updated");
  }

  addKassa(targetSide, amount) {
    this.addRegister(targetSide, amount);
  }

  addEnergy(targetSide, amount) {
    const entity = targetSide === "player" ? this.player : this.enemy;
    entity.energy += amount;
  }

  drawCards(targetSide, count) {
    const dm = targetSide === "player" ? this.player.deckManager : this.enemy.deckManager;
    return dm.drawCards(count, () => {
      this.log(`🔄 ${targetSide} deck cycled and reshuffled!`);
    });
  }

  discardRandomCard(targetSide) {
    const dm = targetSide === "player" ? this.player.deckManager : this.enemy.deckManager;
    const card = dm.discardRandomCard();
    if (card && targetSide === "player") {
      this.relics.forEach(r => {
        if (r.onCardDiscarded) r.onCardDiscarded(this, true);
      });
    }
    return card;
  }

  getHand(targetSide) {
    const dm = targetSide === "player" ? this.player.deckManager : this.enemy.deckManager;
    return dm.hand;
  }

  registerRoundEndDamage(targetSide, amount) {
    this.roundEndDamageQueue[targetSide] += amount;
  }

  reclaimTrickToHand(targetSide, costOverride = null) {
    const dm = targetSide === "player" ? this.player.deckManager : this.enemy.deckManager;
    const trick = dm.reclaimCardFromDiscard(c => c.type === "trick");
    if (trick && costOverride !== null) {
      trick.cost = costOverride;
      this.log(`Reclaimed ${trick.name} into hand with cost ${costOverride}!`);
    }
    return trick;
  }

  reclaimItemToHand(targetSide, costDiscount = 0) {
    const dm = targetSide === "player" ? this.player.deckManager : this.enemy.deckManager;
    const item = dm.reclaimCardFromDiscard(c => c.type === "item");
    if (item) {
      item.cost = Math.max(0, item.cost - costDiscount);
      item.playCount = (item.playCount || 0) + 1;
      this.log(`Reclaimed ${item.name} into hand with discount!`);
    }
    return item;
  }

  resurrectRoundDeaths(targetSide) {
    const list = targetSide === "player" ? this.destroyedThisRound.player : this.destroyedThisRound.enemy;
    const lanes = targetSide === "player" ? this.playerLanes : this.enemyLanes;

    list.forEach(card => {
      const emptyIdx = lanes.findIndex(c => c === null);
      if (emptyIdx !== -1) {
        card.health = 1;
        card.maxHealth = 1;
        card.hasSwift = true;
        lanes[emptyIdx] = card;
        this.log(`👻 ${card.name} revived onto Lane ${emptyIdx + 1} with Swift!`);
      }
    });
  }

  checkWinLoss() {
    if (this.winner) return true;

    if (this.player.health <= 0 && this.enemy.health <= 0) {
      this.winner = "draw";
      this.phase = CombatPhase.BATTLE_OVER;
      this.log(`⚖️ DOUBLE DEFEAT! Both counters collapsed in the brawl!`);
      this.notify("battle_ended", { winner: "draw" });
      return true;
    } else if (this.enemy.health <= 0) {
      this.winner = "player";
      this.phase = CombatPhase.BATTLE_OVER;
      this.log(`🏆 VICTORY! You defended the shop!`);
      this.notify("battle_ended", { winner: "player" });
      return true;
    } else if (this.player.health <= 0) {
      this.winner = "enemy";
      this.phase = CombatPhase.BATTLE_OVER;
      this.log(`💀 DEFEAT! Your counter was overrun!`);
      this.notify("battle_ended", { winner: "enemy" });
      return true;
    }
    return false;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
