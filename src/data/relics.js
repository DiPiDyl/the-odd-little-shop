// Relics Specification
export const RELICS = [
  {
    id: "old_shop_bell",
    name: "Old Shop Bell",
    emoji: "🔔",
    description: "The first Item card you play each round costs 1 less Energy.",
    onRoundStart: (relicState) => {
      relicState.firstItemFreeUsed = false;
    },
    onCardPlayed: (card, relicState) => {
      if (card.type === "item" && !relicState.firstItemFreeUsed) {
        relicState.firstItemFreeUsed = true;
      }
    }
  },
  {
    id: "lucky_plant",
    name: "Lucky Jade Plant",
    emoji: "🪴",
    description: "At the end of each round, heal your Shopkeeper for 1 HP.",
    onRoundEnd: (engine, isPlayer) => {
      engine.healShopkeeper(isPlayer ? "player" : "enemy", 1, "Lucky Jade Plant brings fortune (+1 HP)!");
    }
  },
  {
    id: "bottomless_teapot",
    name: "Bottomless Teapot",
    emoji: "🫖",
    description: "The first time a friendly item is healed each round, draw 1 card.",
    onHealTriggered: (engine, isPlayer, relicState) => {
      if (!relicState.teapotUsed) {
        relicState.teapotUsed = true;
        engine.drawCards(isPlayer ? "player" : "enemy", 1);
        engine.log("Bottomless Teapot steeps a fresh card!");
      }
    },
    onRoundStart: (relicState) => {
      relicState.teapotUsed = false;
    }
  },
  {
    id: "endless_receipt",
    name: "Endless Receipt",
    emoji: "🧾",
    description: "Whenever you discard a card, gain +1 Kassa meter tick.",
    onCardDiscarded: (engine, isPlayer) => {
      engine.addKassa(isPlayer ? "player" : "enemy", 1);
      engine.log("Endless Receipt tallies the discard (+1 Kassa)!");
    }
  }
];
