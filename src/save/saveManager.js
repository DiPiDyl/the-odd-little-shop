// Local Save & Progression Manager (Versioned JSON - V2 Overhaul)
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
        avatar: "🐱",
        rankProgress: 3,
        rankMax: 5
      },
      currency: {
        coins: 280,
        gems: 15,
        scrap: 80
      },
      inventory: {
        packs: {
          cozy_pack: 2,
          midnight_pack: 1,
          oddity_pack: 0
        },
        cardCopies
      },
      decks: {
        cozy_counter: cozyStartingDeck,
        midnight_bazaar: midnightStartingDeck
      },
      missions: [
        {
          id: "m_win_battles",
          title: "COZY QUEST",
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
        }
      ],
      dailyReward: {
        currentDay: 4,
        lastClaimDate: null,
        streakDays: 4
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
        return parsed;
      }
      return this.migrateSave(parsed);
    } catch (e) {
      console.warn("Failed to load local save, resetting to defaults", e);
      return this.getInitialSaveState();
    }
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
    return fresh;
  }
}
