// Card Lab / Card Ideas Studio Screen
import { soundFx } from "../audio/soundEffects.js";
import { CardType, CardRarity, Keywords } from "../engine/cardModel.js";

export class CardLabScreen {
  constructor(app) {
    this.app = app;
    this.currentEditingId = null;

    // Current draft card state
    this.draft = {
      id: "draft_" + Date.now(),
      name: "Steam-Powered Kettle",
      type: CardType.MINION,
      faction: "cozy_counter",
      rarity: CardRarity.RARE,
      cost: 3,
      attack: 2,
      health: 4,
      durability: 0,
      emoji: "🫖",
      keywords: [Keywords.TAUNT, Keywords.BATTLECRY],
      description: "Taunt. Battlecry: Restore 3 Health to your Hero.",
      flavor: "Steams a pleasant whistle that wards off nocturnal thieves."
    };

    this.effectTrigger = "Battlecry";
    this.effectAction = "Restore 3 Health to your Hero";
  }

  getSavedIdeas() {
    return this.app.saveData.cardLabIdeas || [];
  }

  loadIdea(ideaId) {
    const idea = this.getSavedIdeas().find(i => i.id === ideaId);
    if (!idea) return;
    this.currentEditingId = idea.id;
    this.draft = JSON.parse(JSON.stringify(idea));
    soundFx.playCardSwoosh();
    this.app.render();
  }

  newIdea() {
    this.currentEditingId = null;
    this.draft = {
      id: "draft_" + Date.now(),
      name: "New Curio",
      type: CardType.MINION,
      faction: "cozy_counter",
      rarity: CardRarity.COMMON,
      cost: 2,
      attack: 2,
      health: 3,
      durability: 0,
      emoji: "📦",
      keywords: [],
      description: "",
      flavor: "Found tucked away in the back storage room."
    };
    soundFx.playButtonClick();
    this.app.render();
  }

  duplicateCurrentIdea() {
    const newId = "draft_" + Date.now();
    const cloned = { ...this.draft, id: newId, name: this.draft.name + " (Copy)" };
    this.app.saveData.cardLabIdeas.push(cloned);
    this.app.saveState();
    this.loadIdea(newId);
    soundFx.playCardPlay();
  }

  deleteCurrentIdea() {
    if (!this.currentEditingId) {
      this.newIdea();
      return;
    }
    const idx = this.app.saveData.cardLabIdeas.findIndex(i => i.id === this.currentEditingId);
    if (idx !== -1) {
      this.app.saveData.cardLabIdeas.splice(idx, 1);
      this.app.saveState();
      soundFx.playButtonClick();
      this.newIdea();
    }
  }

  saveDraft() {
    const warnings = this.validateDraft();
    if (warnings.length > 0 && warnings.some(w => w.critical)) {
      alert("Please resolve critical errors before saving:\n" + warnings.map(w => "• " + w.message).join("\n"));
      return;
    }

    if (!this.app.saveData.cardLabIdeas) this.app.saveData.cardLabIdeas = [];

    const existingIdx = this.app.saveData.cardLabIdeas.findIndex(i => i.id === (this.currentEditingId || this.draft.id));
    if (existingIdx !== -1) {
      this.app.saveData.cardLabIdeas[existingIdx] = { ...this.draft, id: this.currentEditingId };
    } else {
      const idToSave = "custom_" + Date.now();
      this.draft.id = idToSave;
      this.currentEditingId = idToSave;
      this.app.saveData.cardLabIdeas.push({ ...this.draft });
    }

    // Check achievement
    const ach = this.app.saveData.achievements.find(a => a.id === "ach_lab_creator");
    if (ach) ach.progress = Math.max(ach.progress, 1);

    this.app.saveState();
    soundFx.playSellCoin();
    this.app.render();
  }

  validateDraft() {
    const warnings = [];
    if (!this.draft.name || !this.draft.name.trim()) {
      warnings.push({ critical: true, message: "Card Name cannot be empty." });
    }
    if (this.draft.type === CardType.MINION && this.draft.health <= 0) {
      warnings.push({ critical: true, message: "Minions must have at least 1 Health." });
    }
    if (this.draft.type === CardType.WEAPON && this.draft.durability <= 0) {
      warnings.push({ critical: true, message: "Weapons must have at least 1 Durability." });
    }
    if (!this.draft.description || !this.draft.description.trim()) {
      warnings.push({ critical: false, message: "Vanilla card: No card text provided." });
    }
    return warnings;
  }

  toggleKeyword(keyword) {
    const idx = this.draft.keywords.indexOf(keyword);
    if (idx === -1) {
      this.draft.keywords.push(keyword);
    } else {
      this.draft.keywords.splice(idx, 1);
    }
    this.updateDescriptionFromGuided();
    soundFx.playCardHover();
    this.app.render();
  }

  applyGuidedEffect() {
    let text = "";
    if (this.draft.keywords.length > 0) {
      const kwNames = this.draft.keywords.map(k => k.charAt(0).toUpperCase() + k.slice(1).replace("_", " "));
      text += kwNames.join(". ") + ". ";
    }
    text += `${this.effectTrigger}: ${this.effectAction}.`;
    this.draft.description = text.trim();
    soundFx.playCardHover();
    this.app.render();
  }

  updateDescriptionFromGuided() {
    if (this.draft.keywords.length > 0 && !this.draft.description.includes(this.effectTrigger)) {
      const kwNames = this.draft.keywords.map(k => k.charAt(0).toUpperCase() + k.slice(1).replace("_", " "));
      this.draft.description = kwNames.join(". ") + ".";
    }
  }

  render() {
    const warnings = this.validateDraft();
    const savedIdeas = this.getSavedIdeas();
    const cur = this.draft;

    const allKeywords = [
      { id: Keywords.TAUNT, label: "🛡️ Taunt", tip: "Enemies must attack this minion first." },
      { id: Keywords.BATTLECRY, label: "📢 Battlecry", tip: "Does something when played from hand." },
      { id: Keywords.DEATHRATTLE, label: "💀 Deathrattle", tip: "Does something when destroyed." },
      { id: Keywords.RUSH, label: "⚡ Rush", tip: "Can attack opposing lane immediately." },
      { id: Keywords.DIVINE_SHIELD, label: "✨ Divine Shield", tip: "Ignores the first instance of damage." },
      { id: Keywords.LIFESTEAL, label: "🩸 Lifesteal", tip: "Damage dealt also heals your Hero." },
      { id: Keywords.DISCOVER, label: "🔍 Discover", tip: "Choose 1 of 3 random cards." },
      { id: Keywords.FREEZE, label: "❄️ Freeze", tip: "Frozen targets lose their next attack." }
    ];

    const rarityBadgeColors = {
      common: "#b0b0b0",
      rare: "#3b82f6",
      epic: "#a855f7",
      legendary: "#f59e0b"
    };

    return `
      <div class="card-lab-container">
        <!-- Top Studio Header -->
        <div class="lab-header">
          <div class="lab-header-left">
            <button class="btn btn-secondary btn-sm" onclick="window.app.showScreen('main_menu')">⬅ Return to Lobby</button>
            <h2 class="lab-title">🔬 THE CARD LAB — CREATIVE STUDIO</h2>
          </div>
          <div class="lab-header-actions">
            <button class="btn btn-sm btn-secondary" onclick="window.app.cardLab.newIdea()">✨ New Curio</button>
            <button class="btn btn-sm btn-secondary" onclick="window.app.cardLab.duplicateCurrentIdea()">📋 Duplicate</button>
            ${this.currentEditingId ? `<button class="btn btn-sm btn-danger" onclick="window.app.cardLab.deleteCurrentIdea()">🗑️ Delete</button>` : ''}
            <button class="btn btn-sm btn-primary" onclick="window.app.cardLab.saveDraft()">💾 Save Idea</button>
          </div>
        </div>

        <!-- 3-Column Studio Workspace -->
        <div class="lab-workspace">
          <!-- Left Column: Controls & Attribute Tuners -->
          <div class="lab-panel lab-controls-panel">
            <h4 class="panel-section-title">⚙️ CARD PARAMETERS</h4>
            
            <!-- Name & Emoji -->
            <div class="lab-field-group">
              <label class="lab-label">Card Name</label>
              <input type="text" class="lab-input" value="${cur.name}" placeholder="e.g. Whispering Kettle" oninput="window.app.cardLab.draft.name = this.value; window.app.render();">
            </div>

            <div class="lab-row-2">
              <div class="lab-field-group">
                <label class="lab-label">Card Type</label>
                <select class="lab-select" onchange="window.app.cardLab.draft.type = this.value; window.app.render();">
                  <option value="${CardType.MINION}" ${cur.type === CardType.MINION ? 'selected' : ''}>Minion (Creature / Item)</option>
                  <option value="${CardType.SPELL}" ${cur.type === CardType.SPELL ? 'selected' : ''}>Spell (Trick / Reagent)</option>
                  <option value="${CardType.WEAPON}" ${cur.type === CardType.WEAPON ? 'selected' : ''}>Weapon (Shop Tool)</option>
                </select>
              </div>

              <div class="lab-field-group">
                <label class="lab-label">Faction Theme</label>
                <select class="lab-select" onchange="window.app.cardLab.draft.faction = this.value; window.app.render();">
                  <option value="cozy_counter" ${cur.faction === 'cozy_counter' ? 'selected' : ''}>🕯️ The Cozy Counter</option>
                  <option value="midnight_bazaar" ${cur.faction === 'midnight_bazaar' ? 'selected' : ''}>🌙 The Midnight Bazaar</option>
                  <option value="neutral" ${cur.faction === 'neutral' ? 'selected' : ''}>⚖️ Neutral Curiosity</option>
                </select>
              </div>
            </div>

            <div class="lab-row-2">
              <div class="lab-field-group">
                <label class="lab-label">Rarity Tier</label>
                <select class="lab-select" onchange="window.app.cardLab.draft.rarity = this.value; window.app.render();">
                  <option value="common" ${cur.rarity === 'common' ? 'selected' : ''}>⚪ Common</option>
                  <option value="rare" ${cur.rarity === 'rare' ? 'selected' : ''}>🔵 Rare</option>
                  <option value="epic" ${cur.rarity === 'epic' ? 'selected' : ''}>🟣 Epic</option>
                  <option value="legendary" ${cur.rarity === 'legendary' ? 'selected' : ''}>🟠 Legendary</option>
                </select>
              </div>

              <div class="lab-field-group">
                <label class="lab-label">Icon / Emoji</label>
                <input type="text" class="lab-input" style="text-align: center; font-size: 1.3rem;" value="${cur.emoji}" maxlength="4" oninput="window.app.cardLab.draft.emoji = this.value; window.app.render();">
              </div>
            </div>

            <!-- Stats (Cost, Atk, HP/Dur) -->
            <div class="lab-stats-grid">
              <div class="stat-dial cost-dial">
                <span class="stat-dial-label">MANA</span>
                <div class="dial-controls">
                  <button class="btn-dial" onclick="window.app.cardLab.draft.cost = Math.max(0, window.app.cardLab.draft.cost - 1); window.app.render();">-</button>
                  <span class="dial-val">${cur.cost}</span>
                  <button class="btn-dial" onclick="window.app.cardLab.draft.cost = Math.min(10, window.app.cardLab.draft.cost + 1); window.app.render();">+</button>
                </div>
              </div>

              ${cur.type !== CardType.SPELL ? `
                <div class="stat-dial atk-dial">
                  <span class="stat-dial-label">ATTACK</span>
                  <div class="dial-controls">
                    <button class="btn-dial" onclick="window.app.cardLab.draft.attack = Math.max(0, window.app.cardLab.draft.attack - 1); window.app.render();">-</button>
                    <span class="dial-val">${cur.attack}</span>
                    <button class="btn-dial" onclick="window.app.cardLab.draft.attack = Math.min(20, window.app.cardLab.draft.attack + 1); window.app.render();">+</button>
                  </div>
                </div>
              ` : ''}

              ${cur.type === CardType.MINION ? `
                <div class="stat-dial hp-dial">
                  <span class="stat-dial-label">HEALTH</span>
                  <div class="dial-controls">
                    <button class="btn-dial" onclick="window.app.cardLab.draft.health = Math.max(1, window.app.cardLab.draft.health - 1); window.app.render();">-</button>
                    <span class="dial-val">${cur.health}</span>
                    <button class="btn-dial" onclick="window.app.cardLab.draft.health = Math.min(30, window.app.cardLab.draft.health + 1); window.app.render();">+</button>
                  </div>
                </div>
              ` : ''}

              ${cur.type === CardType.WEAPON ? `
                <div class="stat-dial dur-dial">
                  <span class="stat-dial-label">DURABILITY</span>
                  <div class="dial-controls">
                    <button class="btn-dial" onclick="window.app.cardLab.draft.durability = Math.max(1, window.app.cardLab.draft.durability - 1); window.app.render();">-</button>
                    <span class="dial-val">${cur.durability}</span>
                    <button class="btn-dial" onclick="window.app.cardLab.draft.durability = Math.min(10, window.app.cardLab.draft.durability + 1); window.app.render();">+</button>
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Keyword Selector -->
            <div class="lab-field-group">
              <label class="lab-label">Active Keywords</label>
              <div class="keyword-chips-container">
                ${allKeywords.map(kw => {
                  const active = cur.keywords.includes(kw.id);
                  return `
                    <button class="keyword-chip ${active ? 'active' : ''}" title="${kw.tip}" onclick="window.app.cardLab.toggleKeyword('${kw.id}')">
                      ${kw.label}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Guided Effect Builder -->
            <div class="guided-effect-box">
              <span class="lab-label">Guided Ability Constructor</span>
              <div class="lab-row-2">
                <select class="lab-select" onchange="window.app.cardLab.effectTrigger = this.value;">
                  <option value="Battlecry">Battlecry</option>
                  <option value="Deathrattle">Deathrattle</option>
                  <option value="Start of Round">Start of Round</option>
                  <option value="End of Round">End of Round</option>
                  <option value="When Damaged">When Damaged</option>
                  <option value="When Sold">When Sold</option>
                </select>

                <select class="lab-select" onchange="window.app.cardLab.effectAction = this.value;">
                  <option value="Deal 3 Damage to target enemy">Deal 3 Damage to enemy</option>
                  <option value="Deal 1 Damage to ALL enemies">Deal 1 Damage to ALL enemies</option>
                  <option value="Restore 4 Health to your Hero">Restore 4 Health to Hero</option>
                  <option value="Draw 1 card">Draw 1 card</option>
                  <option value="Give friendly Minion +2/+2">Give friendly Minion +2/+2</option>
                  <option value="Gain 50 Coins">Gain 50 Coins</option>
                  <option value="Discover a Cozy item">Discover a Cozy item</option>
                </select>
              </div>
              <button class="btn btn-sm btn-secondary" style="width: 100%; margin-top: 6px;" onclick="window.app.cardLab.applyGuidedEffect()">⚡ Insert into Card Text</button>
            </div>

            <!-- Card Text & Flavor -->
            <div class="lab-field-group">
              <label class="lab-label">Card Description Text</label>
              <textarea class="lab-textarea" rows="2" placeholder="e.g. Taunt. Battlecry: Restore 3 Health." oninput="window.app.cardLab.draft.description = this.value; window.app.render();">${cur.description}</textarea>
            </div>

            <div class="lab-field-group">
              <label class="lab-label">Flavor Lore Text</label>
              <input type="text" class="lab-input" placeholder="e.g. Kept on the top shelf, where only the brave dare reach." value="${cur.flavor}" oninput="window.app.cardLab.draft.flavor = this.value; window.app.render();">
            </div>
          </div>

          <!-- Center Column: WYSIWYG Live Preview Stage -->
          <div class="lab-panel lab-preview-stage">
            <h4 class="panel-section-title">🃏 LIVE CARD PREVIEW</h4>
            
            <div class="preview-card-wrapper">
              <div class="preview-curio-card faction-${cur.faction} rarity-${cur.rarity}">
                <!-- Top Mana Gem -->
                <div class="preview-mana-gem">${cur.cost}</div>

                <!-- Rarity Crown Gem -->
                <div class="preview-rarity-gem" style="color: ${rarityBadgeColors[cur.rarity] || '#fff'};" title="${cur.rarity.toUpperCase()}">
                  ${cur.rarity === 'legendary' ? '👑' : '💎'}
                </div>

                <!-- Card Name Banner -->
                <div class="preview-name-banner">
                  <span class="preview-name-text">${cur.name || 'Unnamed Curio'}</span>
                </div>

                <!-- Card Artwork Frame -->
                <div class="preview-art-frame">
                  <div class="preview-art-emoji">${cur.emoji}</div>
                  <div class="preview-type-badge">${cur.type.toUpperCase()}</div>
                </div>

                <!-- Card Text Box -->
                <div class="preview-textbox">
                  <p class="preview-description">${cur.description || '<em style="opacity: 0.5;">No ability text</em>'}</p>
                  ${cur.flavor ? `<p class="preview-flavor">"${cur.flavor}"</p>` : ''}
                </div>

                <!-- Bottom Stat Orbs -->
                <div class="preview-stat-ribbon">
                  ${cur.type !== CardType.SPELL ? `
                    <div class="preview-orb atk-orb" title="Attack">${cur.attack}</div>
                  ` : '<div></div>'}

                  ${cur.type === CardType.MINION ? `
                    <div class="preview-orb hp-orb" title="Health">${cur.health}</div>
                  ` : ''}

                  ${cur.type === CardType.WEAPON ? `
                    <div class="preview-orb dur-orb" title="Durability">${cur.durability}</div>
                  ` : ''}
                </div>
              </div>
            </div>

            <!-- Validation Warnings Box -->
            <div class="lab-warnings-box">
              ${warnings.length === 0 ? `
                <div class="warning-item ok">✅ Card passes all validation rules and is ready to play!</div>
              ` : warnings.map(w => `
                <div class="warning-item ${w.critical ? 'crit' : 'note'}">
                  ${w.critical ? '⚠️' : 'ℹ️'} ${w.message}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Right Column: Card Lab Archives / Ideas Library -->
          <div class="lab-panel lab-archive-panel">
            <h4 class="panel-section-title">📚 SAVED LAB EXPERIMENTS (${savedIdeas.length})</h4>

            <div class="saved-ideas-list">
              ${savedIdeas.length === 0 ? `
                <div class="empty-state-notice">
                  <p>🔬 No saved cards yet!</p>
                  <p style="font-size: 0.85rem; color: var(--wood-light);">Use the controls on the left to design your first custom card, then hit "Save Idea".</p>
                </div>
              ` : savedIdeas.map(idea => `
                <div class="saved-idea-card ${this.currentEditingId === idea.id ? 'active-editing' : ''}" onclick="window.app.cardLab.loadIdea('${idea.id}')">
                  <div class="saved-idea-icon">${idea.emoji || '📦'}</div>
                  <div class="saved-idea-info">
                    <div class="saved-idea-name">${idea.name}</div>
                    <div class="saved-idea-meta">
                      <span class="badge ${idea.rarity}">${idea.rarity}</span>
                      <span>${idea.cost} Mana</span>
                      <span>${idea.type}</span>
                    </div>
                  </div>
                  <button class="btn-quick-delete" title="Delete Idea" onclick="event.stopPropagation(); window.app.cardLab.currentEditingId = '${idea.id}'; window.app.cardLab.deleteCurrentIdea();">✖</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
