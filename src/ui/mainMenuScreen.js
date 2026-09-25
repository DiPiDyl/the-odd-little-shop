// 16:9 Storybook Cartoon Main Menu Screen
import { soundFx } from "../audio/soundEffects.js";

export class MainMenuScreen {
  constructor(app) {
    this.app = app;
  }

  render() {
    const player = this.app.saveData.player || { name: "CozyCat", level: 3, avatar: "🐱", rankProgress: 3, rankMax: 5 };
    const cur = this.app.saveData.currency || { coins: 280, gems: 15, scrap: 80 };
    const packs = this.app.saveData.inventory.packs || { cozy_pack: 0, midnight_pack: 0, oddity_pack: 0 };
    const totalPacks = (packs.cozy_pack || 0) + (packs.midnight_pack || 0) + (packs.oddity_pack || 0);
    const missions = this.app.saveData.missions || [];
    const daily = this.app.saveData.dailyReward || { currentDay: 4, streakDays: 4 };

    return `
      <div class="main-menu-container">
        <!-- Floating Storybook Particles Background -->
        <div class="particle-ambient p1">🍃</div>
        <div class="particle-ambient p2">✨</div>
        <div class="particle-ambient p3">🍂</div>
        <div class="particle-ambient p4">⭐</div>

        <!-- Top HUD -->
        <div class="top-hud-bar">
          <!-- Player Profile Card -->
          <div class="hud-profile-card">
            <div class="profile-avatar">${player.avatar}</div>
            <div class="profile-info">
              <span class="profile-name">${player.name}</span>
              <span class="profile-level">Lv. ${player.level} Shopkeeper</span>
            </div>
          </div>

          <!-- Currency & Settings Bar -->
          <div class="hud-currencies">
            <div class="hud-stat-pill coins">
              <span class="pill-icon">🪙</span>
              <span class="pill-value">${cur.coins}</span>
            </div>
            <div class="hud-stat-pill gems">
              <span class="pill-icon">💎</span>
              <span class="pill-value">${cur.gems}</span>
            </div>
            <div class="hud-stat-pill scrap">
              <span class="pill-icon">⚙️</span>
              <span class="pill-value">${cur.scrap}</span>
            </div>
            <button class="btn-icon" title="Mail" onclick="alert('Shop Post: New shipments arrived from the Bazaar!')">📫</button>
            <button class="btn-icon" title="Settings" onclick="window.app.showSettingsModal()">⚙️</button>
          </div>
        </div>

        <!-- Main Body: 3-Column Layout -->
        <div class="menu-main-content">
          <!-- Left Column: Missions -->
          <div class="menu-side-col left-col">
            <h4 class="col-title">📜 ACTIVE MISSIONS</h4>
            
            ${missions.map(m => `
              <div class="mission-card ${m.id === 'm_win_battles' ? 'cozy-mission' : 'midnight-mission'}">
                <div class="mission-header">
                  <strong>${m.title}</strong>
                  <span class="mission-reward-tag">${m.rewardLabel}</span>
                </div>
                <div class="mission-desc">${m.desc}</div>
                <div class="mission-progress-bar">
                  <div class="mission-progress-fill" style="width: ${(m.progress / m.goal) * 100}%;"></div>
                  <span class="progress-text">${m.progress} / ${m.goal}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Center Column: Dominant BATTLE Hub & Rival Shopkeepers -->
          <div class="menu-center-col">
            <!-- Rival Shopkeepers Header Art -->
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

            <!-- Central Battle Trigger Card -->
            <div class="battle-hero-panel" onclick="window.app.startSelectedBattle()">
              <div class="battle-title-banner">
                <span style="font-size: 2.2rem;">⚔️</span>
                <span>OPEN THE SHOP COUNTER!</span>
              </div>
              <div class="battle-rank-bar">
                <span>RANK PROGRESS: GOLD COUNTER</span>
                <div class="rank-meter">
                  <div class="rank-meter-fill" style="width: ${(player.rankProgress / player.rankMax) * 100}%;"></div>
                </div>
                <span>${player.rankProgress} / ${player.rankMax} ⭐</span>
              </div>
              <button class="btn-play-hero">
                ENTER 5-LANE BATTLE ➔
              </button>
            </div>
          </div>

          <!-- Right Column: Daily Rewards, News & Streaks -->
          <div class="menu-side-col right-col">
            <!-- Daily Reward Card -->
            <div class="side-feature-card daily-card">
              <div class="card-badge">DAILY REWARD</div>
              <div style="font-size: 2.2rem; margin: 4px 0;">🎁</div>
              <div style="font-weight: bold;">Day ${daily.currentDay} of 7</div>
              <p style="font-size: 0.75rem; color: #555;">Claim daily free packs, coins, and gems!</p>
              <button class="btn btn-sm btn-primary" style="margin-top: 6px;"
                onclick="alert('Day 4 reward claimed: +15 Gems!')">✓ Claimed</button>
            </div>

            <!-- News & Event Card -->
            <div class="side-feature-card news-card">
              <div class="card-badge">SHOP NOTICE</div>
              <div style="font-weight: bold; margin-top: 4px;">Midnight Bazaar Visiting!</div>
              <p style="font-size: 0.75rem; color: #555;">
                Oddity stock in the pawn shop has 20% extra barter opportunities this week.
              </p>
            </div>

            <!-- Streak Tracker -->
            <div class="streak-tracker-pill">
              <span>🔥</span>
              <span><strong>${daily.streakDays} DAY</strong> VISIT STREAK</span>
            </div>
          </div>
        </div>

        <!-- Bottom Navigation Bar -->
        <nav class="bottom-nav-bar">
          <button class="nav-item" onclick="window.app.showScreen('deckbuilder')">
            <span class="nav-icon">🎒</span>
            <span class="nav-label">Deckbuilder (20)</span>
          </button>

          <button class="nav-item" onclick="window.app.showCollectionModal()">
            <span class="nav-icon">📚</span>
            <span class="nav-label">Collection</span>
          </button>

          <button class="nav-item has-badge" onclick="window.app.showScreen('packs')">
            <span class="nav-icon">🎁</span>
            <span class="nav-label">Card Packs</span>
            ${totalPacks > 0 ? `<span class="nav-bubble">${totalPacks}</span>` : ''}
          </button>

          <button class="nav-item" onclick="window.app.pawnModal.show()">
            <span class="nav-icon">🏪</span>
            <span class="nav-label">Pawn Shop</span>
          </button>

          <button class="nav-item disabled" title="Coming Soon" onclick="alert('Cooperative shopkeeping challenges coming in future update!')">
            <span class="nav-icon">👥</span>
            <span class="nav-label">Friends (Soon)</span>
          </button>
        </nav>
      </div>
    `;
  }
}
