// AI Opponent Decision Engine (Symmetrical Rules)
export class AIOpponent {
  constructor(difficulty = "normal") {
    this.difficulty = difficulty; // "easy", "normal", "hard"
  }

  takeTurn(engine) {
    if (engine.phase !== "PLANNING") return;

    const enemy = engine.enemy;
    const hand = enemy.deckManager.hand;
    const enemyLanes = engine.enemyLanes;
    const playerLanes = engine.playerLanes;

    engine.log(`🤖 ${enemy.name} is planning tactics...`);

    // 1. Signature Ability Check: If Kassa meter is full, unleash it!
    if (enemy.kassa >= enemy.kassaMax && enemy.signature) {
      engine.useSignatureAbility(false);
    }

    // 2. Play items from hand onto lanes
    // Sort playable cards by cost descending to play high-value cards first
    const playableCards = hand
      .filter(card => card.cost <= enemy.energy)
      .sort((a, b) => b.cost - a.cost);

    for (const card of playableCards) {
      if (enemy.energy < card.cost) continue;

      if (card.type === "item") {
        const laneChoice = this.chooseLaneForItem(card, enemyLanes, playerLanes);
        if (laneChoice !== null) {
          engine.playCard(false, card.instanceId, laneChoice);
        }
      } else if (card.type === "trick") {
        engine.playCard(false, card.instanceId);
      }
    }

    // 3. Use Shopkeeper active ability if Energy remains
    for (const ability of enemy.abilities) {
      if (enemy.energy >= ability.cost) {
        if (ability.targetType === "friendly_item") {
          // Find friendly item with lowest health
          let targetIdx = null;
          let lowestHp = 999;
          enemyLanes.forEach((u, idx) => {
            if (u && u.health < lowestHp) {
              lowestHp = u.health;
              targetIdx = idx;
            }
          });
          if (targetIdx !== null) {
            engine.useShopkeeperAbility(false, ability.id, targetIdx);
          }
        } else if (ability.targetType === "none" || ability.targetType === "any_friendly") {
          engine.useShopkeeperAbility(false, ability.id);
        }
      }
    }

    engine.log(`🤖 ${enemy.name} completed planning.`);
  }

  chooseLaneForItem(card, enemyLanes, playerLanes) {
    const emptyLanes = [];
    enemyLanes.forEach((u, idx) => {
      if (u === null) emptyLanes.push(idx);
    });

    if (emptyLanes.length === 0) return null;

    // Difficulty heuristic:
    // Normal / Hard: Prioritize blocking player threats (uncontested lanes where player has an attacker)
    const dangerousLanes = emptyLanes.filter(idx => playerLanes[idx] !== null && playerLanes[idx].attack > 0);
    if (dangerousLanes.length > 0) {
      // Pick the lane with the highest player attack threat
      dangerousLanes.sort((a, b) => playerLanes[b].attack - playerLanes[a].attack);
      return dangerousLanes[0];
    }

    // Otherwise, pick lane opposite an empty player lane to threaten direct face damage
    const openOpponentLanes = emptyLanes.filter(idx => playerLanes[idx] === null);
    if (openOpponentLanes.length > 0) {
      return openOpponentLanes[0];
    }

    // Fallback: Pick any empty lane
    return emptyLanes[0];
  }
}
