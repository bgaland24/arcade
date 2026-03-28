/**
 * gx-wave.js — gestion des vagues, formations et boss.
 */
class WaveManager {
  constructor(bulletPool) {
    this.pool       = bulletPool;
    this.enemies    = [];
    this.boss       = null;
    this.waveNumber = 0;
    this.gameTime   = 0; // temps total écoulé (pour sinusoïdes)
    this.waveActive = false;
    this.allClear   = false;
    this.players    = null; // injecté par game.js

    // Formation drift collectif (toute la formation bouge ensemble)
    this.formationX  = 0;
    this.formationDir= 1;
  }

  // ── Démarrage d'une vague ────────────────────────────────
  startWave(n) {
    this.waveNumber  = n;
    this.enemies     = [];
    this.boss        = null;
    this.waveActive  = true;
    this.allClear    = false;
    this.formationX  = 0;
    this.formationDir= 1;

    if (n % 5 === 0) {
      this._spawnBoss(n);
    } else {
      this._spawnFormation(n);
    }
  }

  _spawnFormation(n) {
    const count   = Math.min(GX.BASE_ENEMY_COUNT + (n - 1) * GX.ENEMY_COUNT_STEP, GX.MAX_ENEMY_COUNT);
    const cols    = Math.ceil(Math.sqrt(count * 1.6));
    const rows    = Math.ceil(count / cols);
    const totalW  = (cols - 1) * GX.FORMATION_GAP_X;
    const startX  = (GX.W - totalW) / 2;
    const startY  = GX.FORMATION_TOP;

    let placed = 0;
    for (let row = 0; row < rows && placed < count; row++) {
      for (let col = 0; col < cols && placed < count; col++) {
        const hx   = startX + col * GX.FORMATION_GAP_X;
        const hy   = startY + row * GX.FORMATION_GAP_Y;
        const type = this._pickType(row, rows);
        this.enemies.push(createEnemy(type, hx, hy, n));
        placed++;
      }
    }
  }

  _pickType(row, totalRows) {
    // Rangée 0 (haut) : Elite / rangées 1-2 : Heavy+Soldier / reste : Grunt
    if (row === 0) return 'ELITE';
    const ratio = row / (totalRows - 1);
    if (ratio < 0.35) return 'HEAVY';
    if (ratio < 0.65) return 'SOLDIER';
    return 'GRUNT';
  }

  _spawnBoss(n) {
    this.boss         = new Boss(n, this.pool);
    this.boss.players = this.players;
  }

  // ── Mise à jour ─────────────────────────────────────────
  update(dt, slowFactor) {
    if (!this.waveActive) return;
    this.gameTime += dt;

    // Dérive globale de la formation — inverse si un ennemi touche les bords
    const fdrift  = 22 * slowFactor * dt;
    const margin  = 28;
    const active  = this.enemies.filter(e => e.active);
    if (active.length) {
      const minX = Math.min(...active.map(e => e.homeX));
      const maxX = Math.max(...active.map(e => e.homeX));
      if (minX + this.formationDir * fdrift < margin)       this.formationDir =  1;
      if (maxX + this.formationDir * fdrift > GX.W - margin) this.formationDir = -1;
    }

    // Ennemis
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.active) { this.enemies.splice(i, 1); continue; }

      e.homeX += this.formationDir * fdrift;

      const result = e.update(dt, this.gameTime, slowFactor, this.players);
      if (result === 'fire')       this._enemyFire(e, false);
      if (result === 'fire_aimed') this._enemyFire(e, true);

      // Clamp final de la position visible (couvre tous les comportements individuels)
      const half = e.size / 2 + 2;
      e.x = Math.max(half, Math.min(GX.W - half, e.x));
      e.y = Math.max(GX.PLAY_TOP + half, Math.min(GX.H - 10, e.y));
    }

    // Boss
    if (this.boss && this.boss.active) {
      this.boss.update(dt, this.gameTime, slowFactor);
    }

    // Fin de vague
    if (this.enemies.length === 0 && (!this.boss || !this.boss.active)) {
      this.waveActive = false;
      this.allClear   = true;
    }
  }

  _enemyFire(enemy, aimed) {
    if (!this.pool) return;
    const spd = enemy.bulletSpd;

    if (aimed && this.players) {
      const alive = this.players.filter(p => p.active && !p.invincible);
      if (alive.length) {
        const target = alive[Math.floor(Math.random() * alive.length)];
        const dx  = target.x - enemy.x;
        const dy  = target.y - enemy.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        this.pool.acquireEnemy(enemy.x, enemy.y + enemy.size / 2,
          (dx / len) * spd, (dy / len) * spd);
        return;
      }
    }

    // Tir droit + éventuel spread pour Heavy
    if (enemy.type === 'HEAVY') {
      this.pool.acquireEnemy(enemy.x - 4, enemy.y + enemy.size / 2, -15, spd);
      this.pool.acquireEnemy(enemy.x + 4, enemy.y + enemy.size / 2,  15, spd);
    } else {
      this.pool.acquireEnemy(enemy.x, enemy.y + enemy.size / 2, 0, spd);
    }
  }

  // ── Rendu ────────────────────────────────────────────────
  render(ctx) {
    for (const e of this.enemies) e.render(ctx);
    if (this.boss && this.boss.active) this.boss.render(ctx);
  }

  isWaveComplete() {
    return !this.waveActive && this.allClear;
  }

  getRemainingCount() {
    return this.enemies.length + (this.boss && this.boss.active ? 1 : 0);
  }
}
