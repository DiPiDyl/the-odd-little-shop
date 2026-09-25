// Enemy Encounters & Boss Definitions
export const ENEMY_ENCOUNTERS = {
  rowdy_imp: {
    id: "rowdy_imp",
    name: "Rowdy Imp Shopper",
    emoji: "👺",
    type: "normal",
    maxHealth: 18,
    shopkeeperId: "midnight_broker",
    deckFaction: "midnight_bazaar",
    deckPreset: [
      "midnight_key", "midnight_key", "midnight_dagger", "midnight_dagger",
      "midnight_scrap_rat", "midnight_scrap_rat", "midnight_night_light", "midnight_night_light",
      "midnight_urn", "midnight_salvage"
    ]
  },
  fussy_collector: {
    id: "fussy_collector",
    name: "Fussy Antiquities Collector",
    emoji: "🧐",
    type: "normal",
    maxHealth: 22,
    shopkeeperId: "cozy_curator",
    deckFaction: "cozy_counter",
    deckPreset: [
      "cozy_candle", "cozy_candle", "cozy_teddy", "cozy_teddy",
      "cozy_armchair", "cozy_teapot", "cozy_polish", "cozy_porridge",
      "cozy_toaster", "cozy_broom"
    ]
  },
  property_inspector: {
    id: "property_inspector",
    name: "Inspector Grimshaw",
    title: "The Property Inspector",
    emoji: "📋",
    type: "boss",
    maxHealth: 35,
    shopkeeperId: "midnight_broker",
    deckFaction: "midnight_bazaar",
    specialMechanic: "code_violation",
    description: "Every 2 rounds, locks 1 random player lane with Condemned Tape!",
    deckPreset: [
      "midnight_urn", "midnight_urn", "midnight_crate", "midnight_crate",
      "midnight_dagger", "midnight_looking_glass", "midnight_contract",
      "midnight_nesting_doll", "midnight_black_market_stall", "midnight_salvage"
    ]
  }
};
