// Card Instance Factory & Model
let _uniqueInstanceCounter = 1;

export function createCardInstance(cardData) {
  return {
    instanceId: `card_${_uniqueInstanceCounter++}`,
    id: cardData.id,
    name: cardData.name,
    emoji: cardData.emoji || "📦",
    faction: cardData.faction,
    type: cardData.type, // 'item', 'trick', 'upgrade'
    cost: cardData.cost,
    baseCost: cardData.cost,
    attack: cardData.attack || 0,
    baseAttack: cardData.attack || 0,
    health: cardData.health || 0,
    maxHealth: cardData.health || 0,
    baseHealth: cardData.health || 0,
    rarity: cardData.rarity || "common",
    tags: [...(cardData.tags || [])],
    keywords: [...(cardData.keywords || [])],
    hasSwift: !!cardData.hasSwift,
    description: cardData.description || "",
    flavor: cardData.flavor || "",
    playCount: 0,
    tempAttackBonus: 0,
    // Method delegates
    onHealed: cardData.onHealed,
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
    onWarmthCheck: cardData.onWarmthCheck
  };
}
