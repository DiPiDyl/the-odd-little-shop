// Shopkeeper Definitions & Abilities
export const SHOPKEEPERS = {
  cozy_curator: {
    id: "cozy_curator",
    name: "Barnaby Finch",
    title: "The Cozy Curator",
    emoji: "🕯️",
    faction: "cozy_counter",
    maxHealth: 30,
    kassaMax: 5,
    description: "Gentle and patient shopkeeper who buffs merchandise and mends broken chinaware.",
    abilities: [
      {
        id: "dust_and_polish",
        name: "Dust & Polish",
        cost: 1,
        emoji: "✨",
        description: "Give a friendly item +1 Attack and +1 Health.",
        targetType: "friendly_item",
        execute: (target, engine, isPlayer) => {
          target.attack += 1;
          target.health += 1;
          target.maxHealth += 1;
          engine.addKassa(isPlayer ? "player" : "enemy", 1);
          engine.log(`Barnaby polishes ${target.name} to a shine (+1/+1)!`);
        }
      },
      {
        id: "gentle_mending",
        name: "Gentle Mending",
        cost: 2,
        emoji: "🩹",
        description: "Restore 3 Health to a friendly item or your Shopkeeper.",
        targetType: "any_friendly",
        execute: (target, engine, isPlayer) => {
          target.health = Math.min(target.maxHealth, target.health + 3);
          if (target.onHealed) target.onHealed(target, engine);
          engine.addWarmth(isPlayer ? "player" : "enemy", 1);
          engine.addKassa(isPlayer ? "player" : "enemy", 1);
          engine.log(`Barnaby carefully mends ${target.name} (+3 HP)!`);
        }
      }
    ],
    signature: {
      id: "grand_showcase",
      name: "Grand Showcase",
      cost: 0,
      emoji: "🌟",
      description: "Signature: Give ALL friendly items +2 Attack, +2 Health, and 1 Warmth each.",
      requiresFullKassa: true,
      execute: (board, engine, isPlayer) => {
        board.forEach(item => {
          if (item) {
            item.attack += 2;
            item.health += 2;
            item.maxHealth += 2;
          }
        });
        engine.addWarmth(isPlayer ? "player" : "enemy", 3);
        engine.log(`🛎️ TING! Barnaby presents the GRAND SHOWCASE! All items surge with +2/+2!`);
      }
    }
  },

  midnight_broker: {
    id: "midnight_broker",
    name: "Madame Vespera",
    title: "The Midnight Broker",
    emoji: "🌙",
    faction: "midnight_bazaar",
    maxHealth: 30,
    kassaMax: 5,
    description: "Astute antiquarian who deals in forgotten relics, second chances, and risky transactions.",
    abilities: [
      {
        id: "backroom_swap",
        name: "Backroom Swap",
        cost: 1,
        emoji: "🔄",
        description: "Discard 1 card from hand, then draw 1 card.",
        targetType: "none",
        execute: (target, engine, isPlayer) => {
          const discarded = engine.discardRandomCard(isPlayer ? "player" : "enemy");
          if (discarded) {
            engine.drawCards(isPlayer ? "player" : "enemy", 1);
            engine.addKassa(isPlayer ? "player" : "enemy", 1);
            engine.log(`Madame Vespera trades ${discarded.name} for fresh stock!`);
          }
        }
      },
      {
        id: "secondhand_stitch",
        name: "Secondhand Stitch",
        cost: 2,
        emoji: "🧵",
        description: "Reclaim a random Item from Discard to Hand with -1 Cost.",
        targetType: "none",
        execute: (target, engine, isPlayer) => {
          const reclaimed = engine.reclaimItemToHand(isPlayer ? "player" : "enemy", 1);
          if (reclaimed) {
            engine.addKassa(isPlayer ? "player" : "enemy", 1);
            engine.log(`Madame Vespera stitches ${reclaimed.name} back to life!`);
          } else {
            engine.log(`No items in discard to stitch.`);
          }
        }
      }
    ],
    signature: {
      id: "midnight_liquidation",
      name: "Midnight Liquidation",
      cost: 0,
      emoji: "🕯️",
      description: "Signature: Return all items destroyed this round back to empty lanes with 1 HP & Swift.",
      requiresFullKassa: true,
      execute: (board, engine, isPlayer) => {
        engine.resurrectRoundDeaths(isPlayer ? "player" : "enemy");
        engine.log(`🛎️ TING! Madame Vespera declares MIDNIGHT LIQUIDATION! Fallen stock returns to the lanes!`);
      }
    }
  }
};
