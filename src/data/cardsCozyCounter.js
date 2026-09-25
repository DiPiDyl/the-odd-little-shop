// Cards Specification: The Cozy Counter (15 Initial Cards)
export const COZY_COUNTER_CARDS = [
  {
    id: "cozy_armchair",
    name: "Old Armchair",
    emoji: "🪑",
    faction: "cozy_counter",
    type: "item",
    cost: 3,
    attack: 1,
    health: 8,
    rarity: "common",
    tags: ["furniture", "sturdy"],
    keywords: ["taunt"],
    description: "Taunt. When healed, permanently gains +1 Attack.",
    flavor: "He was already standing here before the shop opened its doors.",
    onHealed: (card, engine) => {
      card.attack += 1;
      engine.log(`${card.name} settles comfortably and gains +1 Attack!`);
    }
  },
  {
    id: "cozy_candle",
    name: "Timid Candle",
    emoji: "🕯️",
    faction: "cozy_counter",
    type: "item",
    cost: 1,
    attack: 1,
    health: 3,
    rarity: "common",
    tags: ["light", "fragile"],
    keywords: ["adjacent_buff"],
    description: "Adjacent friendly items have +1 Attack.",
    flavor: "Its flame wavers, but it refuses to let anyone sit in the dark.",
    passiveAdjacency: (self, neighbors) => {
      neighbors.forEach(n => {
        if (n) n.tempAttackBonus = (n.tempAttackBonus || 0) + 1;
      });
    }
  },
  {
    id: "cozy_teddy",
    name: "Stuffed Teddy",
    emoji: "🧸",
    faction: "cozy_counter",
    type: "item",
    cost: 2,
    attack: 2,
    health: 4,
    rarity: "common",
    tags: ["toy", "loyal"],
    keywords: [],
    description: "Whenever an adjacent ally takes damage, Teddy gains +1 Attack.",
    flavor: "Missing one button eye, but never lets a friend down.",
    onNeighborDamaged: (self, engine) => {
      self.attack += 1;
      engine.log(`${self.name} steps up courageously (+1 Attack)!`);
    }
  },
  {
    id: "cozy_toaster",
    name: "Grumpy Toaster",
    emoji: "🍞",
    faction: "cozy_counter",
    type: "item",
    cost: 2,
    attack: 3,
    health: 2,
    rarity: "common",
    tags: ["appliance", "fiery"],
    keywords: [],
    description: "Start of Round: If at full Health, deal 1 damage to opposing lane.",
    flavor: "It burns the toast on purpose when annoyed.",
    onRoundStart: (self, laneIndex, engine, isPlayer) => {
      if (self.health >= self.maxHealth) {
        engine.dealLaneDamage(isPlayer ? "enemy" : "player", laneIndex, 1, `${self.name} pops hot crumbs!`);
      }
    }
  },
  {
    id: "cozy_mirror",
    name: "Jealous Mirror",
    emoji: "🪞",
    faction: "cozy_counter",
    type: "item",
    cost: 3,
    attack: 0,
    health: 5,
    rarity: "uncommon",
    tags: ["glass", "curious"],
    keywords: [],
    description: "Combat Start: Copies the Attack of the strongest adjacent ally.",
    flavor: "Anything you can do, it insists it reflects better.",
    onPreCombat: (self, neighbors, engine) => {
      let maxAtk = 0;
      neighbors.forEach(n => {
        if (n && n.attack > maxAtk) maxAtk = n.attack;
      });
      self.attack = Math.max(self.attack, maxAtk);
      engine.log(`${self.name} reflects power, matching ${maxAtk} Attack!`);
    }
  },
  {
    id: "cozy_left_sock",
    name: "Lonely Left Sock",
    emoji: "🧦",
    faction: "cozy_counter",
    type: "item",
    cost: 1,
    attack: 1,
    health: 2,
    rarity: "common",
    tags: ["fabric", "oddity"],
    keywords: [],
    description: "If you control Right Sock, both gain +2 Attack and +2 Health.",
    flavor: "Spends its quiet nights dreaming of the laundry basket reunion.",
    onPlayCheckSynergy: (self, board, engine) => {
      const pair = board.find(c => c && c.id === "cozy_right_sock");
      if (pair) {
        self.attack += 2; self.health += 2; self.maxHealth += 2;
        pair.attack += 2; pair.health += 2; pair.maxHealth += 2;
        engine.log(`The socks are reunited! Both gain +2/+2!`);
      }
    }
  },
  {
    id: "cozy_right_sock",
    name: "Right Sock Found",
    emoji: "🧦",
    faction: "cozy_counter",
    type: "item",
    cost: 1,
    attack: 2,
    health: 1,
    rarity: "common",
    tags: ["fabric", "oddity"],
    keywords: [],
    description: "On Play: Draw 1 card if you control Left Sock.",
    flavor: "Turned up behind the chest of drawers after three long years.",
    onPlay: (self, board, engine, isPlayer) => {
      const pair = board.find(c => c && c.id === "cozy_left_sock");
      if (pair) {
        engine.drawCards(isPlayer ? "player" : "enemy", 1);
        engine.log(`${self.name} found its pair! Drew 1 card!`);
      }
    }
  },
  {
    id: "cozy_teapot",
    name: "Singing Teapot",
    emoji: "🫖",
    faction: "cozy_counter",
    type: "item",
    cost: 2,
    attack: 1,
    health: 4,
    rarity: "uncommon",
    tags: ["kitchen", "melodic"],
    keywords: [],
    description: "End of Round: Restore 2 Health to the most damaged friendly item.",
    flavor: "Its gentle whistling soothes even the most fragile chinaware.",
    onRoundEnd: (self, board, engine, isPlayer) => {
      let target = null;
      let lowestHp = 999;
      board.forEach(c => {
        if (c && c.health < c.maxHealth && c.health < lowestHp) {
          lowestHp = c.health;
          target = c;
        }
      });
      if (target) {
        target.health = Math.min(target.maxHealth, target.health + 2);
        engine.addWarmth(isPlayer ? "player" : "enemy", 1);
        engine.log(`${self.name} serves soothing chamomile tea to ${target.name} (+2 HP)!`);
      }
    }
  },
  {
    id: "cozy_porridge",
    name: "Warm Porridge",
    emoji: "🥣",
    faction: "cozy_counter",
    type: "trick",
    cost: 1,
    rarity: "common",
    tags: ["food", "care"],
    keywords: ["heal"],
    description: "Restore 4 Health to a target item or your Shopkeeper. Gain 1 Warmth.",
    flavor: "Not too hot, not too cold. Just right.",
    cast: (target, engine, isPlayer) => {
      if (target.isShopkeeper) {
        target.health = Math.min(target.maxHealth, target.health + 4);
      } else {
        target.health = Math.min(target.maxHealth, target.health + 4);
        if (target.onHealed) target.onHealed(target, engine);
      }
      engine.addWarmth(isPlayer ? "player" : "enemy", 1);
      engine.log(`Warm Porridge heals ${target.name} for 4 HP!`);
    }
  },
  {
    id: "cozy_polish",
    name: "Hand-Carved Polish",
    emoji: "🪵",
    faction: "cozy_counter",
    type: "upgrade",
    cost: 2,
    rarity: "uncommon",
    tags: ["craft", "wood"],
    keywords: ["buff"],
    description: "Give a friendly item +2 Attack, +3 Health, and Sturdy.",
    flavor: "Beechwood resin and honest elbow grease.",
    apply: (target, engine) => {
      target.attack += 2;
      target.health += 3;
      target.maxHealth += 3;
      target.tags.push("sturdy");
      engine.log(`${target.name} shines with Hand-Carved Polish (+2/+3)!`);
    }
  },
  {
    id: "cozy_broom",
    name: "Brisk Broom",
    emoji: "🧹",
    faction: "cozy_counter",
    type: "item",
    cost: 2,
    attack: 2,
    health: 2,
    rarity: "common",
    tags: ["household", "agile"],
    keywords: ["swift"],
    description: "Swift: Attacks before the opposing enemy during combat resolution.",
    flavor: "Sweeps dust and trespassers with equal enthusiasm.",
    hasSwift: true
  },
  {
    id: "cozy_fern",
    name: "Sunlit Fern",
    emoji: "🪴",
    faction: "cozy_counter",
    type: "item",
    cost: 2,
    attack: 0,
    health: 6,
    rarity: "rare",
    tags: ["plant", "cozy"],
    keywords: ["ramp"],
    description: "Start of Round: You gain +1 Energy this round.",
    flavor: "Thrives in the warm morning beam through the shop window.",
    onRoundStart: (self, laneIndex, engine, isPlayer) => {
      engine.addEnergy(isPlayer ? "player" : "enemy", 1);
      engine.log(`${self.name} photosynthesizes warm light (+1 Energy)!`);
    }
  },
  {
    id: "cozy_bargain_sticker",
    name: "Bargain Sticker",
    emoji: "🏷️",
    faction: "cozy_counter",
    type: "trick",
    cost: 1,
    rarity: "rare",
    tags: ["economy", "paper"],
    keywords: ["discount"],
    description: "Reduce the Energy cost of cards in your hand by 1 this turn.",
    flavor: "Marked down for immediate happiness.",
    cast: (target, engine, isPlayer) => {
      const hand = engine.getHand(isPlayer ? "player" : "enemy");
      hand.forEach(c => {
        c.cost = Math.max(0, c.cost - 1);
      });
      engine.log(`Bargain Sticker discounts all cards in hand by 1!`);
    }
  },
  {
    id: "cozy_grandfather_clock",
    name: "Grandfather Clock",
    emoji: "🕰️",
    faction: "cozy_counter",
    type: "item",
    cost: 4,
    attack: 2,
    health: 7,
    rarity: "epic",
    tags: ["furniture", "ancient"],
    keywords: [],
    description: "End of Round: Friendly items in odd lanes gain +1 Attack; even lanes gain +1 Health.",
    flavor: "Tick-tock. The shop keeps time with steady warmth.",
    onRoundEnd: (self, board, engine, isPlayer) => {
      board.forEach((c, idx) => {
        if (c) {
          if (idx % 2 === 0) {
            c.attack += 1;
          } else {
            c.health += 1;
            c.maxHealth += 1;
          }
        }
      });
      engine.log(`${self.name} chimes! Odd lanes gain +1 Attack, even lanes gain +1 Health!`);
    }
  },
  {
    id: "cozy_tapestry",
    name: "Masterpiece Tapestry",
    emoji: "👑",
    faction: "cozy_counter",
    type: "item",
    cost: 5,
    attack: 3,
    health: 10,
    rarity: "legendary",
    tags: ["relic", "cozy"],
    keywords: ["radiance"],
    description: "Friendly items cannot have stats reduced. At 5 Warmth, deals 4 damage to all enemy lanes.",
    flavor: "Woven by three generations of shopkeepers, depicting a haven of warm tea and gentle souls.",
    onWarmthCheck: (self, warmth, engine, isPlayer) => {
      if (warmth >= 5) {
        engine.dealAllLaneDamage(isPlayer ? "enemy" : "player", 4, "Masterpiece Tapestry unleashes radiant warmth!");
      }
    }
  }
];
