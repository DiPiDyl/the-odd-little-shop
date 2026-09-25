// Local Save & Collection Manager (Versioned JSON)
const SAVE_STORAGE_KEY = "the_odd_little_shop_save_v1";

export class SaveManager {
  static getInitialSaveState() {
    return {
      version: 1,
      timestamp: Date.now(),
      meta: {
        unlockedCards: [
          // Cozy Counter starting pool
          "cozy_armchair", "cozy_candle", "cozy_teddy", "cozy_toaster",
          "cozy_mirror", "cozy_left_sock", "cozy_right_sock", "cozy_teapot",
          "cozy_porridge", "cozy_polish", "cozy_broom", "cozy_fern",
          "cozy_bargain_sticker", "cozy_grandfather_clock", "cozy_tapestry",
          // Midnight Bazaar starting pool
          "midnight_key", "midnight_urn", "midnight_night_light", "midnight_dagger",
          "midnight_crate", "midnight_nesting_doll", "midnight_salvage", "midnight_doubloon",
          "midnight_looking_glass", "midnight_contract", "midnight_scrap_rat",
          "midnight_borrowed_face", "midnight_whispering_orb", "midnight_pocketwatch",
          "midnight_black_market_stall"
        ],
        unlockedShopkeepers: ["cozy_curator", "midnight_broker"],
        completedRuns: 0
      },
      activeRun: null
    };
  }

  static loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_STORAGE_KEY);
      if (!raw) return this.getInitialSaveState();
      const parsed = JSON.parse(raw);
      if (parsed.version === 1) {
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
    // Migration hook for future schema versions
    return { ...this.getInitialSaveState(), ...oldSave, version: 1 };
  }
}
