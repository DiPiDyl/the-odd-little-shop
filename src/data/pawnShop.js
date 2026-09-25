// The Odd Pawn Shop Encounters & Barter System
import { COZY_COUNTER_CARDS } from "./cardsCozyCounter.js";
import { MIDNIGHT_BAZAAR_CARDS } from "./cardsMidnightBazaar.js";

export const PAWN_SHOP_NPCS = [
  {
    id: "collector_finneas",
    name: "Finneas the Chair Enthusiast",
    title: "Antique Furniture Collector",
    emoji: "🧐",
    greeting: "Ah! I can spot high-grade beechwood from three streets away. Got any sturdy goods?",
    offerType: "buy_tag",
    targetTag: "furniture",
    coinBonusMultiplier: 1.5,
    dialogueSuccess: "Magnificent craftsmanship! Here are your coins, and keep that bell ringing!",
    dialogueDecline: "Pity. Do let me know if a nice armchair strolls by."
  },
  {
    id: "shadow_courier",
    name: "Madame Vespera's Courier",
    title: "Night Market Peddler",
    emoji: "🧳",
    greeting: "Looking for something that isn't on the official shop inventory? I have rare wares...",
    offerType: "sell_missing_card",
    priceCoins: 85,
    dialogueSuccess: "A clandestine bargain concluded. May its quirks serve you well.",
    dialogueDecline: "Suit yourself. The market waits for no one."
  },
  {
    id: "hedge_witch",
    name: "Grimble the Hedge Witch",
    title: "Oddity Barterer",
    emoji: "🧙‍♀️",
    greeting: "I trade strange for stranger! Give me one of your tricks, and take this bundle of curious scraps!",
    offerType: "trade_trick_for_rare",
    dialogueSuccess: "Hee hee! A deal sealed in herbal smoke!",
    dialogueDecline: "Too cautious! Caution never brewed a good cup of tea."
  },
  {
    id: "mossy_traveler",
    name: "Barnaby the Mossy Traveler",
    title: "Wandering Antiquarian",
    emoji: "🧳",
    greeting: "Dug up this ancient locked container near the forgotten mill. 60 coins, no refunds, great potential!",
    offerType: "mystery_box",
    priceCoins: 60,
    possibleRewards: [
      { type: "coins", amount: 120, label: "Found 120 Ancient Coins inside!" },
      { type: "pack", packId: "oddity_pack", label: "Found an Oddity Specialty Pack inside!" },
      { type: "scrap", amount: 150, label: "Found 150 Scrap metal inside!" }
    ],
    dialogueSuccess: "Let's crack it open together!",
    dialogueDecline: "Safe travels, shopkeeper."
  }
];

export class PawnShopManager {
  static getRandomEncounter(unownedCardIds = []) {
    const npc = PAWN_SHOP_NPCS[Math.floor(Math.random() * PAWN_SHOP_NPCS.length)];
    const encounter = { ...npc };

    if (npc.offerType === "sell_missing_card") {
      const allCards = [...COZY_COUNTER_CARDS, ...MIDNIGHT_BAZAAR_CARDS];
      let candidate = allCards.find(c => unownedCardIds.includes(c.id));
      if (!candidate) candidate = allCards[Math.floor(Math.random() * allCards.length)];
      encounter.offeredCard = candidate;
    }

    return encounter;
  }
}
