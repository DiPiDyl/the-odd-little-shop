// 16:9 Storybook Digital Card Game Main Menu & Lobby Screen
import { soundFx } from "../audio/soundEffects.js";

export class MainMenuScreen {
  constructor(app) {
    this.app = app;
    this.selectedMode = "ranked"; // 'ranked', 'casual', 'practice'
    this.selectedEnemyId = "rowdy_imp";
  }

  claimMission(missionId) {
    const m = (this.app.saveData.missions || []).find(x => x.id === missionId);
    if (!m || m.claimed || m.progress < m.goal) return;

    m.claimed = true;
    if (m.rewardType === "coins") {
      this.app.saveData.currency.coins = (this.app.saveData.currency.coins || 0) + m.rewardValue;
    } else if (m.rewardType === "scrap") {
      this.app.saveData.currency.scrap = (this.app.saveData.currency.scrap || 0) + m.rewardValue;
    } else if (m.rewardType === "pack") {
      if (!this.app.saveData.inventory.packs) this.app.saveData.inventory.packs = {};
      this.app.saveData.inventory.packs[m.rewardValue] = (this.app.saveData.inventory.packs[m.rewardValue] || 0) + 1;
    }

    this.app.saveData.player.xp = (this.app.saveData.player.xp || 0) + 100;
    this.app.saveState();
    soundFx.playLegendaryStinger();
    this.app.render();
  }

  claimDaily() {
    const daily = this.app.saveData.dailyReward || { currentDay: 4, streakDays: 4, lastClaimDate: null };
    const today = new Date().toDateString();
    if (daily.lastClaimDate === today) {
      alert("You have already claimed today's daily reward! Come back tomorrow.");
      return;
    }
    daily.lastClaimDate = today;
    this.app.saveData.currency.gems = (this.app.saveData.currency.gems || 0) + 15;
    this.app.saveData.currency.coins = (this.app.saveData.currency.coins || 0) + 75;
    this.app.saveState();
    soundFx.playCoinShower();
    alert("🎉 Daily Streak Reward Claimed: +75 Coins 🪙 & +15 Gems 💎!");
    this.app.render();
  }

  render() {
    const player = this.app.saveData.player || { name: "CozyShopkeeper", level: 3, xp: 450, xpToNext: 1000, avatar: "🐱", rankTitle: "Master Peddler", rankProgress: 3, rankMax: 5 };
    const cur = this.app.saveData.currency || { coins: 350, gems: 25, scrap: 120 };
    const packs = this.app.saveData.inventory.packs || { cozy_pack: 0, midnight_pack: 0, oddity_pack: 0 };
    const totalPacks = (packs.cozy_pack || 0) + (packs.midnight_pack || 0) + (packs.oddity_pack || 0);
    const missions = this.app.saveData.missions || [];
    const daily = this.app.saveData.dailyReward || { currentDay: 4, streakDays: 4 };
    const todayClaimed = daily.lastClaimDate === new Date().toDateString();

    return `
      <div class="main-menu-container">
        <!-- Floating Storybook Particles Background -->
        <div class="particle-ambient p1">🍃</div>
        <div class="particle-ambient p2">✨</div>
        <div class="particle-ambient p3">🍂</div>
        <div class="particle-ambient p4">⭐</div>

        <!-- Top HUD -->
        <div class="top-hud-bar">
          <!-- Player Profile Card (Clickable to open profile) -->
          <div class="hud-profile-card" onclick="window.app.showScreen('profile')" title="Open Shopkeeper Profile">
            <div class="profile-avatar">${player.avatar}</div>
            <div class="profile-info">
              <span class="profile-name">${player.name}</span>
              <span class="profile-level">Lv. ${player.level} • ${player.rankTitle || 'Peddler'}</span>
            </div>
          </div>

          <!-- Currency & Global Action Bar -->
          <div class="hud-currencies">
            <div class="hud-stat-pill coins" title="Coins: Earned from victories & selling stock">
              <span class="pill-icon">🪙</span>
              <span class="pill-value">${cur.coins}</span>
            </div>
            <div class="hud-stat-pill gems" title="Gems: Premium curio currency">
              <span class="pill-icon">💎</span>
              <span class="pill-value">${cur.gems}</span>
            </div>
            <div class="hud-stat-pill scrap" title="Scrap: Forged from duplicates to craft missing cards">
              <span class="pill-icon">⚙️</span>
              <span class="pill-value">${cur.scrap}</span>
            </div>
            <button class="btn-icon" title="How to Play Tutorial" onclick="window.app.showTutorialModal()">📖</button>
            <button class="btn-icon" title="Game Settings" onclick="window.app.showSettingsModal()">⚙️</button>
          </div>
        </div>

        <!-- Main Body: 3-Column Layout -->
        <div class="menu-main-content">
          <!-- Left Column: Missions / Quests -->
          <div class="menu-side-col left-col">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <h4 class="col-title" style="margin-bottom: 0;">📜 ACTIVE QUESTS</h4>
              <span style="font-size: 0.75rem; color: var(--wood-light); font-weight: bold;">Refreshes Daily</span>
            </div>
            
            ${missions.map(m => {
              const isReady = !m.claimed && m.progress >= m.goal;
              const isClaimed = m.claimed;
              const pct = Math.min(100, Math.round((m.progress / m.goal) * 100));

              return `
                <div class="mission-card ${m.id === 'm_win_battles' ? 'cozy-mission' : 'midnight-mission'} ${isReady ? 'ready-mission' : ''}">
                  <div class="mission-header">
                    <strong>${m.title}</strong>
                    <span class="mission-reward-tag">${m.rewardLabel}</span>
                  </div>
                  <div class="mission-desc">${m.desc}</div>
                  <div class="mission-progress-bar">
                    <div class="mission-progress-fill" style="width: ${pct}%;"></div>
                    <span class="progress-text">${m.progress} / ${m.goal}</span>
                  </div>
                  <div style="margin-top: 6px; text-align: right;">
                    ${isClaimed ? `
                      <span style="font-size: 0.72rem; color: var(--wood-light);">✔ Completed</span>
                    ` : (isReady ? `
                      <button class="btn btn-sm btn-primary pulse-btn" onclick="window.app.mainMenu.claimMission('${m.id}')">CLAIM REWARD</button>
                    ` : `
                      <span style="font-size: 0.72rem; color: var(--wood-med);">In Progress</span>
                    `)}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Center Column: Dominant BATTLE Hub & Mode Selector -->
          <div class="menu-center-col">
            <!-- Rival Showdown Art Stage -->
            <div class="rivals-stage">
              <div class="rival-figure cozy-rival">
                <div class="rival-portrait">🕯️</div>
                <span class="rival-tag">The Cozy Curator</span>
              </div>

              <div class="rival-clash-sparkle">
                <span class="sparkle-burst">💥</span>
                <span class="vs-text">VS</span>
              </div>

              <div class="rival-figure midnight-rival">
                <div class="rival-portrait">🌙</div>
                <span class="rival-tag">The Midnight Broker</span>
              </div>
            </div>

            <!-- Central Battle Hero Panel -->
            <div class="battle-hero-panel">
              <!-- Mode Selection Chips -->
              <div class="battle-mode-selector">
                <button class="mode-tab-btn ${this.selectedMode === 'ranked' ? 'active' : ''}" 
                  onclick="window.app.mainMenu.selectedMode = 'ranked'; window.app.render();">
                  🏆 Ranked Match
                </button>
                <button class="mode-tab-btn ${this.selectedMode === 'casual' ? 'active' : ''}" 
                  onclick="window.app.mainMenu.selectedMode = 'casual'; window.app.render();">
                  ☕ Casual Duel
                </button>
                <button class="mode-tab-btn ${this.selectedMode === 'practice' ? 'active' : ''}" 
                  onclick="window.app.mainMenu.selectedMode = 'practice'; window.app.render();">
                  🤖 AI Practice
                </button>
              </div>

              <!-- Battle Rank / Difficulty Info -->
              <div class="battle-rank-bar">
                <span>${this.selectedMode === 'ranked' ? 'RANK LADDER: GOLD COUNTER' : (this.selectedMode === 'casual' ? 'CASUAL MATCHMAKING' : 'TRAINING ARENA')}</span>
                <div class="rank-meter">
                  <div class="rank-meter-fill" style="width: ${(player.rankProgress / player.rankMax) * 100}%;"></div>
                </div>
                <span>${player.rankProgress} / ${player.rankMax} ⭐</span>
              </div>

              <!-- Deck Choice Selector -->
              <div class="battle-deck-selector-row">
                <span style="font-size: 0.8rem; font-weight: bold; color: var(--wood-dark);">ACTIVE DECK:</span>
                <button class="btn btn-sm ${this.app.currentFaction === 'cozy_counter' ? 'btn-primary' : 'btn-secondary'}" 
                  onclick="window.app.currentFaction = 'cozy_counter'; window.app.render();">
                  🕯️ Cozy Counter (20)
                </button>
                <button class="btn btn-sm ${this.app.currentFaction === 'midnight_bazaar' ? 'btn-primary' : 'btn-secondary'}" 
                  onclick="window.app.currentFaction = 'midnight_bazaar'; window.app.render();">
                  🌙 Midnight Bazaar (20)
                </button>
              </div>

              <!-- Primary Action Launch Button -->
              <button class="btn-play-hero pulse-btn" onclick="window.app.startSelectedBattle(window.app.currentFaction, window.app.mainMenu.selectedEnemyId)">
                ⚔️ ENTER 5-LANE BATTLE ➔
              </button>
            </div>
          </div>

          <!-- Right Column: Daily Rewards, News & Streaks -->
          <div class="menu-side-col right-col">
            <!-- Daily Login Reward Card -->
            <div class="side-feature-card daily-card">
              <div class="card-badge">DAILY LOGIN STREAK</div>
              <div style="font-size: 2.2rem; margin: 4px 0;">🎁</div>
              <div style="font-weight: bold;">Day ${daily.currentDay} of 7</div>
              <p style="font-size: 0.75rem; color: #555;">Claim free coins, gems, and curio packs daily!</p>
              <button class="btn btn-sm ${todayClaimed ? 'btn-secondary' : 'btn-primary pulse-btn'}" style="margin-top: 6px;"
                onclick="window.app.mainMenu.claimDaily()">
                ${todayClaimed ? '✓ Claimed Today' : '🎁 Claim Today\'s Loot'}
              </button>
            </div>

            <!-- News & Event Card -->
            <div class="side-feature-card news-card">
              <div class="card-badge">SHOP NOTICE</div>
              <div style="font-weight: bold; margin-top: 4px;">Midnight Bazaar Visiting!</div>
              <p style="font-size: 0.75rem; color: #555;">
                Curios in the Pawn Shop have 20% extra barter opportunities this week.
              </p>
            </div>

            <!-- Streak Tracker -->
            <div class="streak-tracker-pill">
              <span>🔥</span>
              <span><strong>${daily.streakDays} DAY</strong> VISIT STREAK</span>
            </div>
          </div>
        </div>

        <!-- Bottom Navigation Bar: Full CCG Suite -->
        <nav class="bottom-nav-bar">
          <button class="nav-item" onclick="window.app.showScreen('collection')">
            <span class="nav-icon">📖</span>
            <span class="nav-label">Collection & Craft</span>
          </button>

          <button class="nav-item" onclick="window.app.showScreen('deckbuilder')">
            <span class="nav-icon">🎒</span>
            <span class="nav-label">Deckbuilder (20)</span>
          </button>

          <button class="nav-item has-badge" onclick="window.app.showScreen('packs')">
            <span class="nav-icon">🎁</span>
            <span class="nav-label">Packs & Shop</span>
            ${totalPacks > 0 ? `<span class="nav-bubble">${totalPacks}</span>` : ''}
          </button>

          <button class="nav-item" onclick="window.app.showScreen('card_lab')">
            <span class="nav-icon">🔬</span>
            <span class="nav-label">Card Lab (Studio)</span>
          </button>

          <button class="nav-item" onclick="window.app.showScreen('profile')">
            <span class="nav-icon">📜</span>
            <span class="nav-label">Profile & Stats</span>
          </button>

          <button class="nav-item" onclick="window.app.pawnModal.open()">
            <span class="nav-icon">🏪</span>
            <span class="nav-label">Pawn Shop</span>
          </button>
        </nav>
      </div>
    `;
  }
}
