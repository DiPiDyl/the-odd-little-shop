// Settings & Accessibility Modal
import { soundFx } from "../audio/soundEffects.js";
import { SaveManager } from "../save/saveManager.js";

export class SettingsModal {
  constructor(app) {
    this.app = app;
    this.isOpen = false;
  }

  open() {
    this.isOpen = true;
    soundFx.playButtonClick();
    this.app.render();
  }

  close() {
    this.isOpen = false;
    soundFx.playButtonClick();
    this.app.render();
  }

  updateSetting(key, value) {
    if (!this.app.saveData.settings) this.app.saveData.settings = {};
    this.app.saveData.settings[key] = value;
    this.app.saveState();
    if (key === "soundVolume") {
      soundFx.masterVolume = parseFloat(value);
    }
    this.app.render();
  }

  resetAllData() {
    if (confirm("⚠️ WARNING: This will reset all your cards, decks, curio ideas, and currency back to defaults. Are you completely sure?")) {
      const fresh = SaveManager.getInitialSaveState();
      this.app.saveData = fresh;
      this.app.saveState();
      this.close();
      this.app.showScreen("main_menu");
    }
  }

  render() {
    if (!this.isOpen) return "";
    const s = this.app.saveData.settings || { soundVolume: 0.8, musicVolume: 0.5, reducedMotion: false, fastCombat: false };

    return `
      <div class="modal-backdrop" onclick="window.app.settingsModal.close()">
        <div class="settings-modal-dialog" onclick="event.stopPropagation()">
          <div class="settings-modal-header">
            <h3>⚙️ GAME SETTINGS & PREFERENCES</h3>
            <button class="modal-close-btn" onclick="window.app.settingsModal.close()">✖</button>
          </div>

          <div class="settings-content-body">
            <!-- Audio Section -->
            <div class="settings-group">
              <h4 class="settings-section-title">🔊 AUDIO & SOUND FX</h4>
              
              <div class="setting-row">
                <label class="setting-label">Sound FX Volume (${Math.round((s.soundVolume ?? 0.8) * 100)}%)</label>
                <input type="range" min="0" max="1" step="0.05" value="${s.soundVolume ?? 0.8}" class="setting-slider" oninput="window.app.settingsModal.updateSetting('soundVolume', this.value); window.app.soundFx.playCardHover();">
              </div>

              <div class="setting-row">
                <label class="setting-label">Atmospheric Soundscapes</label>
                <input type="checkbox" ${s.musicVolume > 0 ? 'checked' : ''} class="setting-checkbox" onchange="window.app.settingsModal.updateSetting('musicVolume', this.checked ? 0.5 : 0);">
              </div>
            </div>

            <!-- Visuals & Accessibility -->
            <div class="settings-group">
              <h4 class="settings-section-title">👁️ ACCESSIBILITY & ANIMATION</h4>
              
              <div class="setting-row">
                <div class="setting-info">
                  <span class="setting-label">Reduced Motion</span>
                  <span class="setting-subtext">Disables screen shaking and rapid visual flashes.</span>
                </div>
                <input type="checkbox" ${s.reducedMotion ? 'checked' : ''} class="setting-checkbox" onchange="window.app.settingsModal.updateSetting('reducedMotion', this.checked);">
              </div>

              <div class="setting-row">
                <div class="setting-info">
                  <span class="setting-label">Fast Combat Mode (2x Speed)</span>
                  <span class="setting-subtext">Accelerates lane clashes and spell animations.</span>
                </div>
                <input type="checkbox" ${s.fastCombat ? 'checked' : ''} class="setting-checkbox" onchange="window.app.settingsModal.updateSetting('fastCombat', this.checked);">
              </div>
            </div>

            <!-- Danger Zone -->
            <div class="settings-group danger-zone">
              <h4 class="settings-section-title" style="color: var(--danger-red);">⚠️ DATA MANAGEMENT</h4>
              <div class="setting-row">
                <div class="setting-info">
                  <span class="setting-label">Clear & Reset Save Data</span>
                  <span class="setting-subtext">Restore default starting collection, currency, and decks.</span>
                </div>
                <button class="btn btn-sm btn-danger" onclick="window.app.settingsModal.resetAllData()">Reset Progress</button>
              </div>
            </div>
          </div>

          <div class="settings-modal-footer">
            <button class="btn btn-primary" onclick="window.app.settingsModal.close()">Save & Close</button>
          </div>
        </div>
      </div>
    `;
  }
}
