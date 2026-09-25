// Card Instance Factory & Model — CCG Architecture
let _uniqueInstanceCounter = 1;

export const CardType = {
  MINION: "minion",
  SPELL: "spell",
  WEAPON: "weapon"
};

export const CardRarity = {
  COMMON: "common",
  UNCOMMON: "uncommon",
  RARE: "rare",
  EPIC: "epic",
  LEGENDARY: "legendary"
};

export const Keywords = {
  TAUNT: "taunt",
  BATTLECRY: "battlecry",
  DEATHRATTLE: "deathrattle",
  RUSH: "rush",
  CHARGE: "charge",
  DIVINE_SHIELD: "divine_shield",
  LIFESTEAL: "lifesteal",
  DISCOVER: "discover",
  FREEZE: "freeze",
  STEALTH: "stealth"
};

export function createCardInstance(cardData) {
  // Normalize type: 'item' -> 'minion', 'trick' -> 'spell', 'upgrade' -> 'weapon' if legacy
  let normalizedType = cardData.type;
  if (normalizedType === "item") normalizedType = CardType.MINION;
  else if (normalizedType === "trick") normalizedType = CardType.SPELL;
  else if (normalizedType === "upgrade") normalizedType = CardType.WEAPON;

  const keywords = Array.isArray(cardData.keywords) ? [...cardData.keywords] : [];
  if (cardData.hasSwift && !keywords.includes(Keywords.RUSH)) {
    keywords.push(Keywords.RUSH);
  }

  const instance = {
    instanceId: `card_${_uniqueInstanceCounter++}`,
    id: cardData.id,
    name: cardData.name,
    emoji: cardData.emoji || "📦",
    faction: cardData.faction || "neutral",
    type: normalizedType || CardType.MINION,
    cost: cardData.cost ?? 1,
    baseCost: cardData.cost ?? 1,
    saleValue: cardData.saleValue || Math.max(1, Math.floor((cardData.cost ?? 1) * 1.5)),
    attack: cardData.attack || 0,
    baseAttack: cardData.attack || 0,
    health: cardData.health || 0,
    maxHealth: cardData.health || 0,
    baseHealth: cardData.health || 0,
    durability: cardData.durability || (normalizedType === CardType.WEAPON ? 2 : 0),
    maxDurability: cardData.durability || (normalizedType === CardType.WEAPON ? 2 : 0),
    rarity: cardData.rarity || CardRarity.COMMON,
    tags: [...(cardData.tags || [])],
    keywords,
    description: cardData.description || "",
    flavor: cardData.flavor || "",
    playCount: 0,
    tempAttackBonus: 0,
    hasAttackedThisTurn: false,
    hasDivineShield: keywords.includes(Keywords.DIVINE_SHIELD),
    isFrozen: false,
    isStealthed: keywords.includes(Keywords.STEALTH),
    canAttackImmediately: keywords.includes(Keywords.CHARGE) || keywords.includes(Keywords.RUSH),

    // Method delegates
    onHealed: cardData.onHealed,
    onSold: cardData.onSold,
    passiveAdjacency: cardData.passiveAdjacency,
    onNeighborDamaged: cardData.onNeighborDamaged,
    onRoundStart: cardData.onRoundStart,
    onPreCombat: cardData.onPreCombat,
    onPlayCheckSynergy: cardData.onPlayCheckSynergy,
    onPlay: cardData.onPlay,
    onRoundEnd: cardData.onRoundEnd,
    cast: cardData.cast,
    apply: cardData.apply,
    castTargetItem: cardData.castTargetItem,
    onDeath: cardData.onDeath,
    onAnyItemDeath: cardData.onAnyItemDeath,
    onWarmthCheck: cardData.onWarmthCheck,

    // Helper predicates
    isMinion() {
      return this.type === CardType.MINION;
    },
    isSpell() {
      return this.type === CardType.SPELL;
    },
    isWeapon() {
      return this.type === CardType.WEAPON;
    },
    hasKeyword(keyword) {
      return this.keywords.includes(keyword.toLowerCase());
    }
  };

  return instance;
}
