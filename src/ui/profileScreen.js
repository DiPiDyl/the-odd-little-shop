// Player Profile, Statistics & Achievements Screen
import { soundFx } from "../audio/soundEffects.js";

export class ProfileScreen {
  constructor(app) {
    this.app = app;
  }

  claimAchievement(achId) {
    const ach = (this.app.saveData.achievements || []).find(a => a.id === achId);
    if (!ach || ach.claimed || ach.progress < ach.goal) return;

    ach.claimed = true;

    // Award reward
    if (ach.rewardType === "coins") {
      this.app.saveData.currency.coins = (this.app.saveData.currency.coins || 0) + ach.rewardValue;
    } else if (ach.rewardType === "scrap") {
      this.app.saveData.currency.scrap = (this.app.saveData.currency.scrap || 0) + ach.rewardValue;
    } else if (ach.rewardType === "gems") {
      this.app.saveData.currency.gems = (this.app.saveData.currency.gems || 0) + ach.rewardValue;
    } else if (ach.rewardType === "pack") {
      if (!this.app.saveData.inventory.packs) this.app.saveData.inventory.packs = {};
      this.app.saveData.inventory.packs[ach.rewardValue] = (this.app.saveData.inventory.packs[ach.rewardValue] || 0) + 1;
    }

    this.app.saveState();
    soundFx.playLegendaryFanfare();
    this.app.render();
  }

  setAvatar(emoji) {
    this.app.saveData.player.avatar = emoji;
    this.app.saveState();
    soundFx.playButtonClick();
    this.app.render();
  }

  render() {
    const p = this.app.saveData.player || { name: "CozyShopkeeper", level: 3, xp: 450, xpToNext: 1000, avatar: "🐱", rankTitle: "Master Peddler" };
    const stats = this.app.saveData.stats || { gamesPlayed: 14, wins: 11, losses: 3, packsOpened: 6, cardsCrafted: 2, damageDealt: 180, unitsSold: 9 };
    const achs = this.app.saveData.achievements || [];
    const winRate = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;
    const xpPercent = Math.min(100, Math.round((p.xp / p.xpToNext) * 100));

    const avatarChoices = ["🐱", "🦊", "🦉", "🦝", "🕯️", "🌙", "🧙‍♂️", "🪙"];

    return `
      <div class="profile-page-container">
        <!-- Top Bar -->
        <div class="profile-top-bar">
          <button class="btn btn-secondary btn-sm" onclick="window.app.showScreen('main_menu')">⬅ Return to Lobby</button>
          <h2 class="profile-title">📜 SHOPKEEPER DOSSIER & HONORS</h2>
          <div style="width: 140px;"></div>
        </div>

        <div class="profile-layout-grid">
          <!-- Left Column: Player Identity & XP Bar -->
          <div class="profile-card-panel identity-panel">
            <div class="avatar-large-stage">
              <div class="avatar-large-bubble">${p.avatar}</div>
              <div class="avatar-picker-row">
                ${avatarChoices.map(av => `
                  <button class="btn-avatar-select ${p.avatar === av ? 'active' : ''}" onclick="window.app.profile.setAvatar('${av}')">${av}</button>
                `).join('')}
              </div>
            </div>

            <div class="identity-info-block">
              <h3 class="player-display-name">${p.name}</h3>
              <span class="player-rank-badge">🏆 ${p.rankTitle || 'Master Peddler'} (Rank ${p.rankProgress || 3}/5)</span>
              
              <!-- Level & XP Progress -->
              <div class="profile-level-box">
                <div class="level-badge-circle">Lv. ${p.level}</div>
                <div class="xp-bar-wrapper">
                  <div class="xp-bar-fill" style="width: ${xpPercent}%;"></div>
                  <span class="xp-text">${p.xp} / ${p.xpToNext} XP</span>
                </div>
              </div>
            </div>

            <!-- Career Statistics -->
            <div class="stats-overview-box">
              <h4 class="section-subheading">📊 CAREER RECORD</h4>
              <div class="stat-pill-row">
                <div class="stat-metric-cell">
                  <span class="metric-num">${stats.gamesPlayed}</span>
                  <span class="metric-label">Games Played</span>
                </div>
                <div class="stat-metric-cell">
                  <span class="metric-num" style="color: var(--cozy-green);">${stats.wins}W - ${stats.losses}L</span>
                  <span class="metric-label">Win / Loss</span>
                </div>
                <div class="stat-metric-cell">
                  <span class="metric-num" style="color: var(--cozy-gold);">${winRate}%</span>
                  <span class="metric-label">Win Rate</span>
                </div>
              </div>

              <div class="stat-pill-row" style="margin-top: 10px;">
                <div class="stat-metric-cell">
                  <span class="metric-num">${stats.packsOpened}</span>
                  <span class="metric-label">Packs Opened</span>
                </div>
                <div class="stat-metric-cell">
                  <span class="metric-num">${stats.cardsCrafted}</span>
                  <span class="metric-label">Cards Crafted</span>
                </div>
                <div class="stat-metric-cell">
                  <span class="metric-num">${stats.unitsSold || 0}</span>
                  <span class="metric-label">Units Liquidated</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Achievements & Trophies -->
          <div class="profile-card-panel achievements-panel">
            <h4 class="section-subheading">🎖️ ACHIEVEMENTS & MILESTONES (${achs.filter(a => a.claimed).length}/${achs.length})</h4>

            <div class="achievements-scroll-list">
              ${achs.map(ach => {
                const isReady = !ach.claimed && ach.progress >= ach.goal;
                const isComplete = ach.claimed;
                const progressPct = Math.min(100, Math.round((ach.progress / ach.goal) * 100));

                return `
                  <div class="achievement-card ${isComplete ? 'completed' : (isReady ? 'ready-to-claim' : '')}">
                    <div class="ach-icon-cell">
                      ${isComplete ? '⭐' : (isReady ? '🎁' : '🔒')}
                    </div>
                    <div class="ach-info-cell">
                      <div class="ach-title-row">
                        <strong>${ach.title}</strong>
                        <span class="ach-reward-badge">${ach.rewardLabel}</span>
                      </div>
                      <p class="ach-desc">${ach.desc}</p>
                      <div class="ach-progress-bar">
                        <div class="ach-progress-fill" style="width: ${progressPct}%;"></div>
                        <span class="ach-progress-text">${ach.progress} / ${ach.goal}</span>
                      </div>
                    </div>
                    <div class="ach-action-cell">
                      ${isComplete ? `
                        <span class="claimed-check">✔ Claimed</span>
                      ` : (isReady ? `
                        <button class="btn btn-sm btn-primary pulse-btn" onclick="window.app.profile.claimAchievement('${ach.id}')">CLAIM</button>
                      ` : `
                        <span class="locked-status">In Progress</span>
                      `)}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
