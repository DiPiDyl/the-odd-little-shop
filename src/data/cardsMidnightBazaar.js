// Cards Specification: The Midnight Bazaar (15 Initial Cards + Economy & Sell Effects)
export const MIDNIGHT_BAZAAR_CARDS = [
  {
    id: "midnight_key",
    name: "Rust-Eaten Key",
    emoji: "🗝️",
    faction: "midnight_bazaar",
    type: "item",
    cost: 1,
    attack: 1,
    health: 2,
    saleValue: 2,
    rarity: "common",
    tags: ["metal", "junk"],
    keywords: ["deathrattle"],
    description: "On Death: Draw 1 card and gain +1 Kassa meter.",
    flavor: "Unlocks a padlock that turned to dust a century ago.",
    onDeath: (self, engine, isPlayer) => {
      engine.drawCards(isPlayer ? "player" : "enemy", 1);
      engine.addKassa(isPlayer ? "player" : "enemy", 1);
      engine.log(`${self.name} breaks, revealing a forgotten secret (+1 card, +1 Kassa)!`);
    },
    onSold: (self, engine, isPlayer) => {
      engine.drawCards(isPlayer ? "player" : "enemy", 1);
      engine.log(`${self.name} pawned off (+1 card drawn)!`);
    }
  },
  {
    id: "midnight_urn",
    name: "Cracked Urn",
    emoji: "🏺",
    faction: "midnight_bazaar",
    type: "item",
    cost: 2,
    attack: 2,
    health: 3,
    saleValue: 3,
    rarity: "common",
    tags: ["ceramic", "mystery"],
    keywords: ["deathrattle", "cursed"],
    description: "On Death: Deal 2 damage to opposing lane and 1 damage to own Shopkeeper.",
    flavor: "Whatever was sealed inside was meant to remain sealed.",
    onDeath: (self, engine, isPlayer, laneIndex) => {
      engine.dealLaneDamage(isPlayer ? "enemy" : "player", laneIndex, 2, `${self.name} shatters outwards!`);
      engine.damageShopkeeper(isPlayer ? "player" : "enemy", 1, `${self.name} backfires!`);
    }
  },
  {
    id: "midnight_night_light",
    name: "Sputtering Night-Light",
    emoji: "🕯️",
    faction: "midnight_bazaar",
    type: "item",
    cost: 1,
    attack: 2,
    health: 1,
    saleValue: 2,
    rarity: "common",
    tags: ["light", "unstable"],
    keywords: ["secondhand"],
    description: "Secondhand: If played from discard or replayed, gains +2/+2.",
    flavor: "Flickers in the darkness, hungriest when it has almost died out.",
    onPlay: (self, board, engine, isPlayer, fromDiscard) => {
      if (fromDiscard || self.playCount > 1) {
        self.attack += 2;
        self.health += 2;
        self.maxHealth += 2;
        engine.log(`${self.name} reignites from the ashes with Secondhand power (+2/+2)!`);
      }
    }
  },
  {
    id: "midnight_dagger",
    name: "Cursed Dagger",
    emoji: "🗡️",
    faction: "midnight_bazaar",
    type: "item",
    cost: 1,
    attack: 4,
    health: 1,
    saleValue: 2,
    rarity: "common",
    tags: ["weapon", "cursed"],
    keywords: ["cursed"],
    description: "Cursed: When played, discard a random card from your hand.",
    flavor: "Sharp enough to cut silk or sever friendships.",
    onPlay: (self, board, engine, isPlayer) => {
      engine.discardRandomCard(isPlayer ? "player" : "enemy");
      engine.log(`${self.name} exacts a tithe: 1 card discarded!`);
    }
  },
  {
    id: "midnight_crate",
    name: "Unmarked Crate",
    emoji: "📦",
    faction: "midnight_bazaar",
    type: "item",
    cost: 3,
    attack: 1,
    health: 5,
    saleValue: 4,
    rarity: "uncommon",
    tags: ["container", "mystery"],
    keywords: ["deathrattle"],
    description: "On Death: Summon a random 2-cost Bazaar item in this lane.",
    flavor: "Customs declaration: 'Personal souvenirs. Do not open.'",
    onDeath: (self, engine, isPlayer, laneIndex) => {
      engine.summonRandomBazaarItem(isPlayer ? "player" : "enemy", laneIndex, 2);
    }
  },
  {
    id: "midnight_nesting_doll",
    name: "Nesting Doll of Shadows",
    emoji: "🪆",
    faction: "midnight_bazaar",
    type: "item",
    cost: 2,
    attack: 2,
    health: 2,
    saleValue: 3,
    rarity: "rare",
    tags: ["toy", "occult"],
    keywords: ["deathrattle"],
    description: "On Death: Summon a 1/1 Shadow Doll with Swift into this lane.",
    flavor: "Open one, find another. Open that, find something watching you.",
    onDeath: (self, engine, isPlayer, laneIndex) => {
      engine.summonToken(isPlayer ? "player" : "enemy", laneIndex, {
        id: "midnight_shadow_doll",
        name: "Shadow Doll",
        emoji: "👤",
        attack: 1,
        health: 1,
        maxHealth: 1,
        saleValue: 1,
        hasSwift: true,
        description: "Swift"
      });
      engine.log(`A Shadow Doll creeps out of the cracked nesting doll!`);
    }
  },
  {
    id: "midnight_salvage",
    name: "Midnight Salvage",
    emoji: "🌘",
    faction: "midnight_bazaar",
    type: "trick",
    cost: 1,
    saleValue: 1,
    rarity: "common",
    tags: ["magic", "recycle"],
    keywords: ["recycle"],
    description: "Discard 1 card from hand. Gain 2 Energy this round.",
    flavor: "One shop's trash is the night broker's prize collateral.",
    cast: (target, engine, isPlayer) => {
      const discarded = engine.discardRandomCard(isPlayer ? "player" : "enemy");
      if (discarded) {
        engine.addEnergy(isPlayer ? "player" : "enemy", 2);
        engine.addKassa(isPlayer ? "player" : "enemy", 1);
        engine.log(`Midnight Salvage recycled ${discarded.name} for +2 Energy!`);
      }
    }
  },
  {
    id: "midnight_doubloon",
    name: "Counterfeit Doubloon",
    emoji: "🪙",
    faction: "midnight_bazaar",
    type: "trick",
    cost: 0,
    saleValue: 1,
    rarity: "common",
    tags: ["currency", "junk"],
    keywords: ["ramp", "cursed"],
    description: "Gain 1 Energy immediately. At the end of the round, take 1 damage.",
    flavor: "Lead inside, gold outside. It spends just as well until dusk.",
    cast: (target, engine, isPlayer) => {
      engine.addEnergy(isPlayer ? "player" : "enemy", 1);
      engine.registerRoundEndDamage(isPlayer ? "player" : "enemy", 1);
      engine.log(`Counterfeit Doubloon slips through! +1 Energy (1 damage queued).`);
    }
  },
  {
    id: "midnight_looking_glass",
    name: "Distorted Looking-Glass",
    emoji: "🪞",
    faction: "midnight_bazaar",
    type: "item",
    cost: 2,
    attack: 1,
    health: 4,
    saleValue: 3,
    rarity: "uncommon",
    tags: ["glass", "cursed"],
    keywords: [],
    description: "Combat Start: Swaps Attack values with opposing enemy unit.",
    flavor: "It shows not how you appear, but what you fear you lack.",
    onPreCombat: (self, neighbors, engine, laneIndex, opposingUnit) => {
      if (opposingUnit) {
        const temp = self.attack;
        self.attack = opposingUnit.attack;
        opposingUnit.attack = temp;
        engine.log(`${self.name} distorts reality! Swapped Attack with ${opposingUnit.name}!`);
      }
    }
  },
  {
    id: "midnight_contract",
    name: "Contract of Ruin",
    emoji: "📜",
    faction: "midnight_bazaar",
    type: "trick",
    cost: 2,
    saleValue: 2,
    rarity: "rare",
    tags: ["cursed", "paper"],
    keywords: ["sacrifice"],
    description: "Destroy target friendly item. Deal its Attack + Health to opposing lane.",
    flavor: "Sign in squid ink, settle in splinters.",
    castTargetItem: (targetItem, laneIndex, engine, isPlayer) => {
      const totalDmg = targetItem.attack + targetItem.health;
      engine.destroyItem(isPlayer ? "player" : "enemy", laneIndex);
      engine.dealLaneDamage(isPlayer ? "enemy" : "player", laneIndex, totalDmg, `Contract of Ruin erupts!`);
    }
  },
  {
    id: "midnight_scrap_rat",
    name: "Scrap Rat",
    emoji: "🐀",
    faction: "midnight_bazaar",
    type: "item",
    cost: 1,
    attack: 1,
    health: 1,
    saleValue: 2,
    rarity: "common",
    tags: ["beast", "scavenger"],
    keywords: [],
    description: "Whenever any other item dies, Scrap Rat gains +1 Attack.",
    flavor: "It thrives on the debris left behind after a bitter dispute.",
    onAnyItemDeath: (self, engine) => {
      self.attack += 1;
      engine.log(`${self.name} feasts on broken scrap (+1 Attack)!`);
    }
  },
  {
    id: "midnight_borrowed_face",
    name: "Borrowed Face",
    emoji: "🎭",
    faction: "midnight_bazaar",
    type: "item",
    cost: 2,
    attack: 0,
    health: 4,
    saleValue: 3,
    rarity: "uncommon",
    tags: ["oddity", "disguise"],
    keywords: [],
    description: "Copies the Attack and Health of opposing enemy when played.",
    flavor: "Smile, and it smiles right back with your teeth.",
    onPlay: (self, board, engine, isPlayer, fromDiscard, laneIndex, opposingUnit) => {
      if (opposingUnit) {
        self.attack = opposingUnit.attack;
        self.health = opposingUnit.health;
        self.maxHealth = opposingUnit.health;
        engine.log(`${self.name} copies ${opposingUnit.name}'s form (${self.attack}/${self.health})!`);
      }
    }
  },
  {
    id: "midnight_whispering_orb",
    name: "Whispering Orb",
    emoji: "🔮",
    faction: "midnight_bazaar",
    type: "item",
    cost: 3,
    attack: 1,
    health: 5,
    saleValue: 4,
    rarity: "rare",
    tags: ["occult", "relic"],
    keywords: [],
    description: "End of Round: If your hand is empty, draw 2 cards and deal 2 damage to all enemies.",
    flavor: "It whispers the best deals only when you have nothing left to trade.",
    onRoundEnd: (self, board, engine, isPlayer) => {
      const hand = engine.getHand(isPlayer ? "player" : "enemy");
      if (hand.length === 0) {
        engine.drawCards(isPlayer ? "player" : "enemy", 2);
        engine.dealAllLaneDamage(isPlayer ? "enemy" : "player", 2, `${self.name} discharges psychic whispers!`);
      }
    }
  },
  {
    id: "midnight_pocketwatch",
    name: "Pawned Pocketwatch",
    emoji: "🕰️",
    faction: "midnight_bazaar",
    type: "item",
    cost: 2,
    attack: 2,
    health: 3,
    saleValue: 4,
    rarity: "epic",
    tags: ["gear", "temporal"],
    keywords: ["reclaim"],
    description: "Reclaim: On Play, return 1 Trick from discard to your hand. It costs 0 this turn.",
    flavor: "Pawned by an alchemist who ran out of time. Now it runs backward.",
    onPlay: (self, board, engine, isPlayer) => {
      engine.reclaimTrickToHand(isPlayer ? "player" : "enemy", 0);
    }
  },
  {
    id: "midnight_black_market_stall",
    name: "The Black Market Stall",
    emoji: "🖤",
    faction: "midnight_bazaar",
    type: "item",
    cost: 5,
    attack: 4,
    health: 8,
    saleValue: 7,
    rarity: "legendary",
    tags: ["market", "cursed"],
    keywords: ["reclaim", "engine"],
    description: "Start of Round: Return a random item destroyed last round to hand costing 0 Energy.",
    flavor: "Under the counter, everything has a second life.",
    onRoundStart: (self, laneIndex, engine, isPlayer) => {
      engine.reclaimDestroyedItemFree(isPlayer ? "player" : "enemy");
    }
  }
];
