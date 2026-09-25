// Local Save & Progression Manager (Versioned JSON - V2.5 Full CCG Overhaul)
import { COZY_COUNTER_CARDS } from "../data/cardsCozyCounter.js";
import { MIDNIGHT_BAZAAR_CARDS } from "../data/cardsMidnightBazaar.js";

const SAVE_STORAGE_KEY = "the_odd_little_shop_save_v2";

export class SaveManager {
  static getInitialSaveState() {
    // Starting deck presets (exactly 20 cards each)
    const cozyStartingDeck = [
      "cozy_armchair", "cozy_armchair",
      "cozy_candle", "cozy_candle",
      "cozy_teddy", "cozy_teddy",
      "cozy_toaster", "cozy_toaster",
      "cozy_left_sock", "cozy_left_sock",
      "cozy_right_sock", "cozy_right_sock",
      "cozy_teapot", "cozy_teapot",
      "cozy_porridge", "cozy_porridge",
      "cozy_broom", "cozy_broom",
      "cozy_polish", "cozy_fern"
    ];

    const midnightStartingDeck = [
      "midnight_key", "midnight_key",
      "midnight_urn", "midnight_urn",
      "midnight_night_light", "midnight_night_light",
      "midnight_dagger", "midnight_dagger",
      "midnight_crate", "midnight_crate",
      "midnight_scrap_rat", "midnight_scrap_rat",
      "midnight_salvage", "midnight_salvage",
      "midnight_doubloon", "midnight_doubloon",
      "midnight_looking_glass", "midnight_borrowed_face",
      "midnight_nesting_doll", "midnight_whispering_orb"
    ];

    // Initial card copies (2 copies of commons/uncommons, 1 of rares)
    const cardCopies = {};
    COZY_COUNTER_CARDS.forEach(c => {
      cardCopies[c.id] = (c.rarity === "rare" || c.rarity === "epic" || c.rarity === "legendary") ? 1 : 2;
    });
    MIDNIGHT_BAZAAR_CARDS.forEach(c => {
      cardCopies[c.id] = (c.rarity === "rare" || c.rarity === "epic" || c.rarity === "legendary") ? 1 : 2;
    });

    return {
      version: 2,
      timestamp: Date.now(),
      player: {
        name: "CozyShopkeeper",
        level: 3,
        xp: 450,
        xpToNext: 1000,
        avatar: "🐱",
        rankTitle: "Master Peddler",
        rankProgress: 3,
        rankMax: 5
      },
      currency: {
        coins: 350,
        gems: 25,
        scrap: 120
      },
      inventory: {
        packs: {
          cozy_pack: 2,
          midnight_pack: 1,
          oddity_pack: 1
        },
        cardCopies
      },
      decks: {
        cozy_counter: cozyStartingDeck,
        midnight_bazaar: midnightStartingDeck
      },
      deckNames: {
        cozy_counter: "Cozy Hearth & Tea",
        midnight_bazaar: "Midnight Shadows"
      },
      cardLabIdeas: [
        {
          id: "custom_idea_1",
          name: "Whistling Kettle",
          type: "minion",
          faction: "cozy_counter",
          rarity: "rare",
          cost: 3,
          attack: 2,
          health: 5,
          durability: 0,
          emoji: "🫖",
          keywords: ["taunt", "battlecry"],
          description: "Taunt. Battlecry: Restore 3 Health to your Hero.",
          flavor: "Steam whistles a cheery greeting to visitors."
        },
        {
          id: "custom_idea_2",
          name: "Shadow Lockpick",
          type: "weapon",
          faction: "midnight_bazaar",
          rarity: "epic",
          cost: 2,
          attack: 3,
          health: 0,
          durability: 2,
          emoji: "🗝️",
          keywords: ["lifesteal"],
          description: "Lifesteal. After your hero attacks, gain 1 Scrap.",
          flavor: "Opens any door that was meant to stay locked."
        }
      ],
      stats: {
        gamesPlayed: 14,
        wins: 11,
        losses: 3,
        packsOpened: 6,
        cardsCrafted: 2,
        damageDealt: 180,
        unitsSold: 9
      },
      achievements: [
        {
          id: "ach_first_sale",
          title: "First Liquidation",
          desc: "Sell 1 unit from your counter during combat.",
          progress: 1,
          goal: 1,
          rewardLabel: "50 Coins 🪙",
          rewardType: "coins",
          rewardValue: 50,
          claimed: true
        },
        {
          id: "ach_pack_rat",
          title: "Curio Collector",
          desc: "Open 5 booster packs.",
          progress: 5,
          goal: 5,
          rewardLabel: "100 Scrap ⚙️",
          rewardType: "scrap",
          rewardValue: 100,
          claimed: false
        },
        {
          id: "ach_deck_master",
          title: "Deck Architect",
          desc: "Build a complete 20-card deck.",
          progress: 1,
          goal: 1,
          rewardLabel: "10 Gems 💎",
          rewardType: "gems",
          rewardValue: 10,
          claimed: true
        },
        {
          id: "ach_lab_creator",
          title: "Mad Inventor",
          desc: "Create and save a custom card in the Card Lab.",
          progress: 2,
          goal: 1,
          rewardLabel: "Oddity Pack 🎁",
          rewardType: "pack",
          rewardValue: "oddity_pack",
          claimed: false
        }
      ],
      missions: [
        {
          id: "m_win_battles",
          title: "COZY CONQUEST",
          desc: "Win 3 battles.",
          progress: 1,
          goal: 3,
          rewardType: "pack",
          rewardValue: "cozy_pack",
          rewardLabel: "Cozy Pack 🎁",
          claimed: false
        },
        {
          id: "m_sell_items",
          title: "MIDNIGHT DEAL",
          desc: "Sell 5 items from your counter.",
          progress: 3,
          goal: 5,
          rewardType: "coins",
          rewardValue: 100,
          rewardLabel: "100 Coins 🪙",
          claimed: false
        },
        {
          id: "m_cast_spells",
          title: "ARCANE RESTOCK",
          desc: "Play 6 spells or tricks.",
          progress: 4,
          goal: 6,
          rewardType: "scrap",
          rewardValue: 75,
          rewardLabel: "75 Scrap ⚙️",
          claimed: false
        }
      ],
      dailyReward: {
        currentDay: 4,
        lastClaimDate: null,
        streakDays: 4
      },
      settings: {
        soundVolume: 0.8,
        musicVolume: 0.5,
        reducedMotion: false,
        fastCombat: false
      },
      meta: {
        unlockedShopkeepers: ["cozy_curator", "midnight_broker"],
        completedRuns: 2
      }
    };
  }

  static loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_STORAGE_KEY);
      if (!raw) return this.getInitialSaveState();
      const parsed = JSON.parse(raw);
      if (parsed.version === 2) {
        return this.ensureDefaults(parsed);
      }
      return this.migrateSave(parsed);
    } catch (e) {
      console.warn("Failed to load local save, resetting to defaults", e);
      return this.getInitialSaveState();
    }
  }

  static ensureDefaults(save) {
    const fresh = this.getInitialSaveState();
    if (!save.cardLabIdeas) save.cardLabIdeas = fresh.cardLabIdeas;
    if (!save.stats) save.stats = fresh.stats;
    if (!save.achievements) save.achievements = fresh.achievements;
    if (!save.settings) save.settings = fresh.settings;
    if (!save.deckNames) save.deckNames = fresh.deckNames;
    if (!save.missions || save.missions.length === 0) save.missions = fresh.missions;
    if (!save.currency) save.currency = fresh.currency;
    if (!save.currency.scrap) save.currency.scrap = fresh.currency.scrap;
    if (!save.player.xp) {
      save.player.xp = 450;
      save.player.xpToNext = 1000;
    }
    return save;
  }

  static save(saveData) {
    try {
      saveData.timestamp = Date.now();
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(saveData));
      return true;
    } catch (e) {
      console.error("Failed to write to localStorage", e);
      return false;
    }
  }

  static migrateSave(oldSave) {
    const fresh = this.getInitialSaveState();
    if (oldSave && oldSave.meta) {
      fresh.meta = { ...fresh.meta, ...oldSave.meta };
    }
    if (oldSave && oldSave.currency) {
      fresh.currency = { ...fresh.currency, ...oldSave.currency };
    }
    return fresh;
  }
}
