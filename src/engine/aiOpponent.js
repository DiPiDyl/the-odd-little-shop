// AI Opponent Decision Engine (Active, Symmetrical & Asynchronous)
export class AIOpponent {
  constructor(difficulty = "normal") {
    this.difficulty = difficulty; // "easy", "normal", "hard"
  }

  async takeTurnAsync(engine) {
    if (engine.phase !== "OPPONENT_PLANNING") return;

    const enemy = engine.enemy;
    engine.log(`🤖 ${enemy.name} is sizing up the shop counter...`);
    await this.delay(300);

    // 1. Signature Ability Check: If Kassa is full, unleash it!
    if (enemy.kassa >= enemy.kassaMax && enemy.signature) {
      engine.useSignatureAbility(false);
      engine.log(`⚡ ${enemy.name} unleashed signature: ${enemy.signature.name}!`);
      await this.delay(350);
    }

    // 2. Selling Evaluation:
    // If AI controls a heavily damaged unit (<= 1 HP) and has low energy (< 2), sell it to gain coins/benefits!
    if (engine.salesThisRound.enemy < engine.maxSalesPerRound) {
      let sellCandidateIdx = null;
      engine.enemyLanes.forEach((u, idx) => {
        if (u && (u.health <= 1 || u.onSold) && enemy.energy < 2) {
          sellCandidateIdx = idx;
        }
      });
      if (sellCandidateIdx !== null) {
        engine.sellUnit(false, sellCandidateIdx);
        await this.delay(300);
      }
    }

    // 3. Play Cards from Hand
    // Prioritize high-threat counter-placements
    let attempts = 0;
    while (attempts < 5) {
      attempts++;
      const hand = enemy.deckManager.hand;
      const affordable = hand.filter(c => c.cost <= enemy.energy);
      if (affordable.length === 0) break;

      // Sort by cost descending (on-curve)
      affordable.sort((a, b) => b.cost - a.cost);
      const cardToPlay = affordable[0];

      if (cardToPlay.type === "item") {
        const laneChoice = this.chooseLaneForItem(cardToPlay, engine.enemyLanes, engine.playerLanes);
        if (laneChoice !== null) {
          const success = engine.playCard(false, cardToPlay.instanceId, laneChoice);
          if (success) {
            await this.delay(350);
          } else {
            break;
          }
        } else {
          break; // Board full
        }
      } else if (cardToPlay.type === "trick") {
        const success = engine.playCard(false, cardToPlay.instanceId);
        if (success) {
          await this.delay(300);
        } else {
          break;
        }
      }
    }

    // 4. Shopkeeper Active Abilities
    for (const ability of enemy.abilities) {
      if (enemy.energy >= ability.cost) {
        if (ability.targetType === "friendly_item") {
          let targetIdx = null;
          let lowestHp = 999;
          engine.enemyLanes.forEach((u, idx) => {
            if (u && u.health < lowestHp) {
              lowestHp = u.health;
              targetIdx = idx;
            }
          });
          if (targetIdx !== null) {
            engine.useShopkeeperAbility(false, ability.id, targetIdx);
            await this.delay(250);
          }
        } else if (ability.targetType === "none" || ability.targetType === "any_friendly") {
          engine.useShopkeeperAbility(false, ability.id);
          await this.delay(250);
        }
      }
    }

    engine.log(`🤖 ${enemy.name} completed preparations.`);
    await this.delay(200);
  }

  chooseLaneForItem(card, enemyLanes, playerLanes) {
    const emptyLanes = [];
    enemyLanes.forEach((u, idx) => {
      if (u === null) emptyLanes.push(idx);
    });

    if (emptyLanes.length === 0) return null;

    // Prioritize blocking incoming player attack threats
    const dangerousLanes = emptyLanes.filter(idx => playerLanes[idx] !== null && playerLanes[idx].attack > 0);
    if (dangerousLanes.length > 0) {
      dangerousLanes.sort((a, b) => playerLanes[b].attack - playerLanes[a].attack);
      return dangerousLanes[0];
    }

    // Threaten unblocked player lanes for face damage
    const openOpponentLanes = emptyLanes.filter(idx => playerLanes[idx] === null);
    if (openOpponentLanes.length > 0) {
      return openOpponentLanes[0];
    }

    return emptyLanes[0];
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
