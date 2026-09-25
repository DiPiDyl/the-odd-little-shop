// Card Pack Generation & Scrap Crafting System
import { COZY_COUNTER_CARDS } from "./cardsCozyCounter.js";
import { MIDNIGHT_BAZAAR_CARDS } from "./cardsMidnightBazaar.js";

export const PACK_TYPES = {
  cozy_pack: {
    id: "cozy_pack",
    name: "Cozy Counter Pack",
    emoji: "🎁",
    faction: "cozy_counter",
    cardCount: 5,
    costCoins: 100,
    description: "Contains 5 handcrafted, warm items & tricks from The Cozy Counter."
  },
  midnight_pack: {
    id: "midnight_pack",
    name: "Midnight Bazaar Pack",
    emoji: "📦",
    faction: "midnight_bazaar",
    cardCount: 5,
    costCoins: 100,
    description: "Contains 5 strange, reclaimed curiosities & oddities from The Midnight Bazaar."
  },
  oddity_pack: {
    id: "oddity_pack",
    name: "Oddity Specialty Pack",
    emoji: "✨",
    faction: "mixed",
    cardCount: 5,
    costCoins: 150,
    description: "A mysterious assortment drawn from both shop cultures with enhanced rare odds."
  }
};

export const SCRAP_VALUES = {
  duplicateScrap: {
    common: 10,
    uncommon: 25,
    rare: 75,
    epic: 200,
    legendary: 500
  },
  craftCost: {
    common: 40,
    uncommon: 100,
    rare: 300,
    epic: 800,
    legendary: 2000
  }
};

export class PackSystem {
  static openPack(packTypeId, existingCollectionCopies = {}) {
    const packConfig = PACK_TYPES[packTypeId] || PACK_TYPES.cozy_pack;
    let cardPool = [];
    if (packConfig.faction === "cozy_counter") {
      cardPool = [...COZY_COUNTER_CARDS];
    } else if (packConfig.faction === "midnight_bazaar") {
      cardPool = [...MIDNIGHT_BAZAAR_CARDS];
    } else {
      cardPool = [...COZY_COUNTER_CARDS, ...MIDNIGHT_BAZAAR_CARDS];
    }

    const cardsDrawn = [];
    const chosenIds = new Set();

    for (let slot = 1; slot <= 5; slot++) {
      let candidatePool = [];

      if (slot <= 3) {
        // Slots 1-3: Common / Uncommon
        candidatePool = cardPool.filter(c => c.rarity === "common" || c.rarity === "uncommon");
      } else if (slot === 4) {
        // Slot 4: Uncommon or Rare
        candidatePool = cardPool.filter(c => c.rarity === "uncommon" || c.rarity === "rare");
      } else {
        // Slot 5: Guaranteed Rare, Epic, or Legendary
        const roll = Math.random();
        if (roll < 0.65) {
          candidatePool = cardPool.filter(c => c.rarity === "rare");
        } else if (roll < 0.90) {
          candidatePool = cardPool.filter(c => c.rarity === "epic");
        } else {
          candidatePool = cardPool.filter(c => c.rarity === "legendary");
        }
      }

      if (candidatePool.length === 0) candidatePool = cardPool;

      // Filter out cards already chosen in this pack for no duplicates within one pack
      const available = candidatePool.filter(c => !chosenIds.has(c.id));
      const poolToUse = available.length > 0 ? available : candidatePool;
      const card = poolToUse[Math.floor(Math.random() * poolToUse.length)];

      chosenIds.add(card.id);

      const currentOwnedCopies = existingCollectionCopies[card.id] || 0;
      const isDuplicateExcess = currentOwnedCopies >= 2;
      const scrapAwarded = isDuplicateExcess ? (SCRAP_VALUES.duplicateScrap[card.rarity] || 10) : 0;

      cardsDrawn.push({
        card,
        isNew: currentOwnedCopies === 0,
        isDuplicateExcess,
        scrapAwarded
      });
    }

    return cardsDrawn;
  }
}
