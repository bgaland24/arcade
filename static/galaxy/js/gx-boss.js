/**
 * gx-boss.js — Boss à 3 phases.
 *
 * Phase 1 (100%→65%) : balayage horizontal lent, tir 3-way
 * Phase 2 (65%→30%)  : plongées verticales, tir 5-way + visé
 * Phase 3 (30%→0%)   : mouvement erratique, tir 8-way burst + visé + spread
 */
class Boss {
  constructor(waveNumber, bulletPool) {
    this.waveNumber = waveNumber;
    this.pool       = bulletPool;
    this.active     = true;
    this.phase      = 1;

    // HP croissants par boss
    const bossIndex = Math.floor((waveNumber - 1) / 5); // 0 = premier boss
    this.maxHp = GX.BOSS_BASE_HP + bossIndex * 80;
    this.hp    = this.maxHp;

    // Position initiale (centre haut)
    this.x = GX.W / 2;
    this.y = GX.PLAY_TOP + 50;

    // Mouvement
    this.moveTimer  = 0;
    this.sweepDir   = 1;
    this.sweepX     = GX.W / 2;
    this.diveActive = false;
    this.diveTargetY= 0;
    this.diveVy     = 0;
    this.erraticTimer = 0;
    this.erraticVx    = 0;
    this.erraticVy    = 0;

    // Tir
    this.fireCooldown     = 1.5;
    this.burstCooldown    = 0;
    this.burstCount       = 0;

    // Hit flash
    this.hitFlash   = 0;

    // Référence aux joueurs (injectée par WaveManager)
    this.players    = null;

    this.size       = 48; // demi-largeur pour la hitbox
  }

  // ── Transitions de phase ─────────────────────────────────
  checkPhase() {
    const ratio = this.hp / this.maxHp;
    if (ratio <= GX.BOSS_PHASE_THRESHOLDS[1] && this.phase < 3) {
      this.phase = 3;
      this.fireCooldown = 0.6;
    } else if (ratio <= GX.BOSS_PHASE_THRESHOLDS[0] && this.phase < 2) {
      this.phase = 2;
      this.fireCooldown = 1.0;
    }
  }

  takeDamage(amount = 1) {
    this.hp -= amount;
    this.hitFlash = 0.15;
    this.checkPhase();
    return this.hp <= 0;
  }

  // ── Mise à jour ─────────────────────────────────────────
  update(dt, t, slowFactor) {
    if (!this.active) return;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    this.moveTimer += dt;
    const eff = dt * slowFactor;

    switch (this.phase) {
      case 1: this._updatePhase1(eff, t); break;
      case 2: this._updatePhase2(dt, eff, t); break;
      case 3: this._updatePhase3(dt, eff, t); break;
    }

    // Tir
    this.fireCooldown -= dt;
    if (this.fireCooldown <= 0) {
      this._fire();
      switch (this.phase) {
        case 1: this.fireCooldown = 2.2; break;
        case 2: this.fireCooldown = 1.4; break;
        case 3: this.fireCooldown = 0.7; break;
      }
    }
  }

  _updatePhase1(eff, t) {
    // Balayage horizontal lent
    this.sweepX += this.sweepDir * 60 * eff;
    if (this.sweepX > GX.W - 80 || this.sweepX < 80) this.sweepDir *= -1;
    this.x = this.sweepX;
    this.y = GX.PLAY_TOP + 55 + Math.sin(t * 0.5) * 15;
  }

  _updatePhase2(dt, eff, t) {
    if (!this.diveActive) {
      // Balayage + plongée périodique
      this.sweepX += this.sweepDir * 80 * eff;
      if (this.sweepX > GX.W - 80 || this.sweepX < 80) this.sweepDir *= -1;
      this.x = this.sweepX;
      this.y = GX.PLAY_TOP + 60 + Math.sin(t * 0.8) * 20;

      // Déclenche plongée toutes les 3s
      if (Math.floor(this.moveTimer) % 4 === 3 && dt < 0.1) {
        this.diveActive  = true;
        this.diveTargetY = GX.PLAY_BOTTOM - 80;
        this.diveVy      = 280;
      }
    } else {
      this.y += this.diveVy * dt;
      if (this.y >= this.diveTargetY) {
        this.y = this.diveTargetY;
        this.diveVy = -320;
      }
      if (this.diveVy < 0 && this.y <= GX.PLAY_TOP + 60) {
        this.y = GX.PLAY_TOP + 60;
        this.diveActive = false;
      }
    }
  }

  _updatePhase3(dt, eff, t) {
    // Mouvement erratique
    this.erraticTimer -= dt;
    if (this.erraticTimer <= 0) {
      this.erraticTimer = 0.3 + Math.random() * 0.5;
      const angle       = Math.random() * Math.PI * 2;
      const spd         = 80 + Math.random() * 100;
      this.erraticVx    = Math.cos(angle) * spd;
      this.erraticVy    = Math.sin(angle) * spd * 0.6;
    }
    this.x += this.erraticVx * eff;
    this.y += this.erraticVy * eff;
    // Rebond sur les bords
    const padX = 60, padYmin = GX.PLAY_TOP + 30, padYmax = GX.PLAY_BOTTOM * 0.55;
    if (this.x < padX || this.x > GX.W - padX)   this.erraticVx *= -1;
    if (this.y < padYmin || this.y > padYmax)     this.erraticVy *= -1;
    this.x = Math.max(padX, Math.min(GX.W - padX, this.x));
    this.y = Math.max(padYmin, Math.min(padYmax, this.y));
  }

  // ── Tir selon la phase ───────────────────────────────────
  _fire() {
    switch (this.phase) {
      case 1: this._fireNWay(3, Math.PI / 2, Math.PI / 6); break;
      case 2:
        this._fireNWay(5, Math.PI / 2, Math.PI / 8);
        this._fireAimed();
        break;
      case 3:
        this._fireNWay(8, 0, Math.PI / 4);  // burst circulaire
        this._fireAimed();
        this._fireNWay(3, Math.PI / 2, Math.PI / 5);
        break;
    }
  }

  _fireNWay(n, centerAngle, spread) {
    const spd = 160 + this.waveNumber * 5;
    for (let i = 0; i < n; i++) {
      const a  = centerAngle + (i - (n - 1) / 2) * spread;
      const vx = Math.cos(a) * spd;
      const vy = Math.sin(a) * spd;
      this.pool.acquireEnemy(this.x, this.y + 30, vx, vy);
    }
  }

  _fireAimed() {
    if (!this.players) return;
    const alive = this.players.filter(p => p.active && !p.invincible);
    if (!alive.length) return;
    const target = alive[Math.floor(Math.random() * alive.length)];
    const dx  = target.x - this.x;
    const dy  = target.y - this.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const spd = 200 + this.waveNumber * 5;
    this.pool.acquireEnemy(this.x, this.y + 30, (dx / len) * spd, (dy / len) * spd);
  }

  // ── Hitbox ───────────────────────────────────────────────
  containsPoint(bx, by) {
    return Math.abs(bx - this.x) < this.size && Math.abs(by - this.y) < this.size * 0.65;
  }

  // ── Rendu ────────────────────────────────────────────────
  render(ctx) {
    if (!this.active) return;
    const x = this.x | 0, y = this.y | 0;
    const flash = this.hitFlash > 0 && Math.floor(this.hitFlash * 16) % 2 === 0;

    // Couleur selon phase
    const colors = {
      1: GX.COLOR.BOSS_P1,
      2: GX.COLOR.BOSS_P2,
      3: GX.COLOR.BOSS_P3,
    };
    const c = flash ? '#ffffff' : colors[this.phase];

    // Aura
    const pulse = 0.4 + 0.3 * Math.sin(this.moveTimer * 3);
    ctx.beginPath();
    ctx.arc(x, y, this.size + 8 + pulse * 6, 0, Math.PI * 2);
    ctx.fillStyle = `${c}18`;
    ctx.fill();

    // Corps
    ctx.fillStyle = c;
    // Hull principal
    ctx.fillRect(x - 44, y - 18, 88, 36);
    ctx.fillRect(x - 32, y - 34, 64, 20);
    ctx.fillRect(x - 32, y + 16, 64, 18);
    ctx.fillRect(x - 20, y - 44, 40, 14);
    // Nacelles latérales
    ctx.fillStyle = flash ? '#ccc' : _bossDark(this.phase);
    ctx.fillRect(x - 60, y - 10, 18, 20);
    ctx.fillRect(x + 42, y - 10, 18, 20);
    // Canons
    ctx.fillRect(x - 56, y + 6,   4, 16);
    ctx.fillRect(x + 52, y + 6,   4, 16);
    ctx.fillRect(x - 4,  y + 18,  8, 18);

    // Cabine / visière
    const visiera = this.phase === 3 ? '#FF00FF' : this.phase === 2 ? '#FF2244' : '#FF8800';
    ctx.fillStyle = flash ? '#fff' : visiera;
    ctx.fillRect(x - 16, y - 12, 32, 24);
    ctx.fillRect(x - 10, y - 20, 20, 12);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - 12, y - 10, 24, 18);
    // Pupilles
    ctx.fillStyle = flash ? '#fff' : c;
    if (this.phase === 3) {
      // 4 yeux en phase 3
      for (let i = -1; i <= 1; i += 2)
        for (let j = -1; j <= 1; j += 2)
          ctx.fillRect(x + i * 6 - 2, y + j * 4 - 2, 4, 4);
    } else {
      ctx.fillRect(x - 8, y - 4, 6, 6);
      ctx.fillRect(x + 2, y - 4, 6, 6);
    }

    // Reflets
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x - 44, y - 18, 88, 5);

    // Barre de vie
    this._drawHealthBar(ctx, x, y);
  }

  _drawHealthBar(ctx, x, y) {
    const bw  = 110, bh = 8;
    const bx  = x - bw / 2;
    const by  = y - this.size - 20;
    const pct = Math.max(0, this.hp / this.maxHp);

    ctx.fillStyle = '#200';
    ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = '#400';
    ctx.fillRect(bx, by, bw, bh);

    const hpColor = pct > 0.5 ? '#00FF44' : pct > 0.25 ? '#FFAA00' : '#FF2222';
    ctx.fillStyle = hpColor;
    ctx.fillRect(bx, by, bw * pct, bh);

    // Phase indicators
    const t1 = GX.BOSS_PHASE_THRESHOLDS[0];
    const t2 = GX.BOSS_PHASE_THRESHOLDS[1];
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(bx + bw * t1 - 1, by, 2, bh);
    ctx.fillRect(bx + bw * t2 - 1, by, 2, bh);

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`BOSS  PH.${this.phase}  ${this.hp}/${this.maxHp}`, x, by - 3);
  }
}

function _bossDark(phase) {
  return phase === 3 ? '#880088' : phase === 2 ? '#880011' : '#884400';
}
