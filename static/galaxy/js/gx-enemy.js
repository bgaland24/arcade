/**
 * gx-enemy.js — 4 types d'ennemis avec comportements distincts.
 *
 * Coordonnées :
 *   homeX/homeY = position de formation de base
 *   x/y         = position réelle (homeX + dérive animée)
 *
 * Retours de update() : null | 'fire' (déclenche un tir dans WaveManager)
 */
class Enemy {
  constructor(type, homeX, homeY, waveNumber) {
    this.type       = type;
    this.homeX      = homeX;
    this.homeY      = homeY;
    this.x          = homeX;
    this.y          = homeY;
    this.waveNumber = waveNumber;
    this.active     = true;

    // Stats de base selon le type
    const cfg     = GX.ENEMY[type];
    this.maxHp    = cfg.hp;
    this.hp       = cfg.hp;
    this.pts      = cfg.pts;
    this.baseSpd  = cfg.speed;
    this.size     = cfg.size;

    // Tir
    const fireScale      = 1 + waveNumber * GX.WAVE_FIRE_MULT;
    this.fireInterval    = cfg.fireInterval / fireScale;
    this.fireCooldown    = Math.random() * cfg.fireInterval; // désynchronise les ennemis
    this.bulletSpd       = cfg.bulletSpd + waveNumber * 4;

    // Mouvement
    const spdScale  = 1 + waveNumber * GX.WAVE_SPEED_MULT;
    this.speed      = cfg.speed * spdScale;
    this.moveTimer  = Math.random() * Math.PI * 2; // phase perso
    this.diveActive = false;
    this.diveTarget = null;
    this.diveTimer  = 0;

    // Flash de dégât
    this.hitFlash   = 0;
  }

  // ── Mouvement commun : oscillation sinusoïdale de la formation ──
  _baseMove(t, formationDriftX) {
    this.homeX += formationDriftX;
    this.homeX  = Math.max(20, Math.min(GX.W - 20, this.homeX));
  }

  takeDamage(amount = 1) {
    this.hp -= amount;
    this.hitFlash = 0.18;
    return this.hp <= 0;
  }

  // ── Retourne les composantes vx/vy pour un tir droit ───
  _straightShot() { return { vx: 0, vy: this.bulletSpd }; }

  update(dt, t, slowFactor, players) {
    if (!this.active) return null;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    this.moveTimer += dt;
    return null; // override dans les sous-classes
  }

  render(ctx) {
    if (!this.active) return;
    const x = this.x | 0, y = this.y | 0;
    const flashing = this.hitFlash > 0 && Math.floor(this.hitFlash * 14) % 2 === 0;
    this._draw(ctx, x, y, flashing);
  }

  _draw(ctx, x, y, flashing) { /* override */ }

  // Barre de vie mini (pour ennemis multi-hp)
  _drawHealthBar(ctx, x, y) {
    if (this.maxHp <= 1) return;
    const w = this.size;
    ctx.fillStyle = '#300';
    ctx.fillRect(x - w / 2, y + this.size / 2 + 2, w, 3);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(x - w / 2, y + this.size / 2 + 2, w * (this.hp / this.maxHp), 3);
  }
}

// ═══════════════════════════════════════════════════════════
/** Grunt : ennemi de base, mouvement en vague horizontale */
class Grunt extends Enemy {
  constructor(hx, hy, wave) { super('GRUNT', hx, hy, wave); }

  update(dt, t, slowFactor, players) {
    super.update(dt, t, slowFactor, players);
    const eff = dt * slowFactor;
    // Dérive sinusoïdale
    this.x = this.homeX + Math.sin(t * 0.8 + this.moveTimer) * 18;
    this.y = this.homeY + Math.sin(t * 0.4 + this.moveTimer * 0.5) * 6;

    // Tir
    this.fireCooldown -= eff;
    if (this.fireCooldown <= 0) {
      this.fireCooldown = this.fireInterval + Math.random() * 0.5;
      return 'fire';
    }
    return null;
  }

  _draw(ctx, x, y, flashing) {
    const c = flashing ? '#ffffff' : GX.COLOR.GRUNT;
    // Corps carré classique style space invader
    ctx.fillStyle = c;
    ctx.fillRect(x - 7, y - 5,  14, 10);
    ctx.fillRect(x - 5, y - 8,  10,  5);
    // Antennes
    ctx.fillRect(x - 7, y - 12,  2,  5);
    ctx.fillRect(x + 5, y - 12,  2,  5);
    // Yeux
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 4, y - 4,   3,  3);
    ctx.fillRect(x + 1, y - 4,   3,  3);
    // Pattes
    ctx.fillStyle = c;
    ctx.fillRect(x - 9, y + 4,   3,  4);
    ctx.fillRect(x - 2, y + 4,   3,  4);
    ctx.fillRect(x + 5, y + 4,   3,  4);
  }
}

// ═══════════════════════════════════════════════════════════
/** Soldier : 2 HP, plonge latéralement quand blessé */
class Soldier extends Enemy {
  constructor(hx, hy, wave) {
    super('SOLDIER', hx, hy, wave);
    this.diveDir = 0;
  }

  update(dt, t, slowFactor, players) {
    super.update(dt, t, slowFactor, players);
    const eff = dt * slowFactor;

    if (this.hp < this.maxHp && !this.diveActive) {
      // Déclenche une plongée latérale
      this.diveActive = true;
      this.diveDir    = this.homeX < GX.W / 2 ? 1 : -1;
    }

    if (this.diveActive) {
      this.homeX += this.diveDir * this.speed * eff * 0.6;
      this.x      = this.homeX;
      this.y      = this.homeY + Math.sin(t * 1.2 + this.moveTimer) * 12;
    } else {
      this.x = this.homeX + Math.sin(t * 0.7 + this.moveTimer) * 22;
      this.y = this.homeY;
    }

    this.fireCooldown -= eff;
    if (this.fireCooldown <= 0) {
      this.fireCooldown = this.fireInterval + Math.random() * 0.4;
      return 'fire';
    }
    return null;
  }

  _draw(ctx, x, y, flashing) {
    const c = flashing ? '#ffffff' : GX.COLOR.SOLDIER;
    ctx.fillStyle = c;
    // Corps hexagonal pixel-art
    ctx.fillRect(x - 8,  y - 6,   16,  12);
    ctx.fillRect(x - 5,  y - 10,  10,   6);
    ctx.fillRect(x - 5,  y + 6,   10,   5);
    // Canon
    ctx.fillStyle = flashing ? '#ffffff' : '#AA8800';
    ctx.fillRect(x - 2,  y - 13,   4,   5);
    // Yeux
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 5,  y - 4,    4,   4);
    ctx.fillRect(x + 1,  y - 4,    4,   4);
    this._drawHealthBar(ctx, x, y);
  }
}

// ═══════════════════════════════════════════════════════════
/** Heavy : 4 HP, gros, tir en 2 directions, charge vers le bas */
class Heavy extends Enemy {
  constructor(hx, hy, wave) {
    super('HEAVY', hx, hy, wave);
    this.chargeTimer = 3 + Math.random() * 3;
    this.charging    = false;
  }

  update(dt, t, slowFactor, players) {
    super.update(dt, t, slowFactor, players);
    const eff = dt * slowFactor;

    this.chargeTimer -= eff;
    if (this.chargeTimer <= 0 && !this.charging) {
      this.charging    = true;
      this.chargeTimer = 4 + Math.random() * 2;
    }
    if (this.charging) {
      this.homeY += this.speed * 0.5 * eff;
      if (this.homeY > GX.PLAY_BOTTOM - 40) {
        // Remonte
        this.homeY   -= 80;
        this.charging = false;
      }
    }
    this.x = this.homeX + Math.sin(t * 0.5 + this.moveTimer) * 14;
    this.y = this.homeY + (this.charging ? Math.sin(t * 3) * 5 : 0);

    this.fireCooldown -= eff;
    if (this.fireCooldown <= 0) {
      this.fireCooldown = this.fireInterval + Math.random() * 0.3;
      return 'fire'; // WaveManager tirera 2 balles
    }
    return null;
  }

  _draw(ctx, x, y, flashing) {
    const c = flashing ? '#ffffff' : GX.COLOR.HEAVY;
    ctx.fillStyle = c;
    ctx.fillRect(x - 10, y - 8,   20,  16);
    ctx.fillRect(x - 7,  y - 14,  14,   8);
    ctx.fillRect(x - 7,  y + 8,   14,   6);
    // Épaules
    ctx.fillRect(x - 13, y - 4,    5,  10);
    ctx.fillRect(x + 8,  y - 4,    5,  10);
    // Visière
    ctx.fillStyle = flashing ? '#ccc' : '#FF8888';
    ctx.fillRect(x - 6,  y - 6,   12,   6);
    // Canon double
    ctx.fillStyle = flashing ? '#ffffff' : '#882222';
    ctx.fillRect(x - 6,  y - 17,   3,   6);
    ctx.fillRect(x + 3,  y - 17,   3,   6);
    this._drawHealthBar(ctx, x, y);
  }
}

// ═══════════════════════════════════════════════════════════
/** Elite : 3 HP, tire en visant le joueur le plus proche */
class Elite extends Enemy {
  constructor(hx, hy, wave) {
    super('ELITE', hx, hy, wave);
    this.erraticTimer = 0;
    this.erraticDx    = 0;
  }

  update(dt, t, slowFactor, players) {
    super.update(dt, t, slowFactor, players);
    const eff = dt * slowFactor;

    // Mouvement erratique
    this.erraticTimer -= eff;
    if (this.erraticTimer <= 0) {
      this.erraticTimer = 0.6 + Math.random() * 0.8;
      this.erraticDx    = (Math.random() - 0.5) * 60;
    }
    this.homeX = Math.max(30, Math.min(GX.W - 30, this.homeX + this.erraticDx * eff));
    this.x = this.homeX + Math.sin(t * 1.1 + this.moveTimer) * 10;
    this.y = this.homeY + Math.sin(t * 0.9 + this.moveTimer) * 10;

    this.fireCooldown -= eff;
    if (this.fireCooldown <= 0) {
      this.fireCooldown = this.fireInterval + Math.random() * 0.3;
      return 'fire_aimed'; // WaveManager calculera l'angle vers le joueur
    }
    return null;
  }

  _draw(ctx, x, y, flashing) {
    const c = flashing ? '#ffffff' : GX.COLOR.ELITE;
    ctx.fillStyle = c;
    // Forme de diamant allongé
    ctx.fillRect(x - 9,  y - 4,   18,   8);
    ctx.fillRect(x - 6,  y - 10,  12,   8);
    ctx.fillRect(x - 6,  y + 2,   12,   8);
    ctx.fillRect(x - 3,  y - 14,   6,   6);
    // Ailes
    ctx.fillStyle = flashing ? '#ddd' : '#9922DD';
    ctx.fillRect(x - 16, y - 2,    8,   4);
    ctx.fillRect(x + 8,  y - 2,    8,   4);
    // Oeil central
    ctx.fillStyle = flashing ? '#eee' : '#FF00FF';
    ctx.fillRect(x - 3,  y - 3,    6,   6);
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 1,  y - 1,    2,   2);
    this._drawHealthBar(ctx, x, y);
  }
}

// Factory
function createEnemy(type, hx, hy, wave) {
  switch (type) {
    case 'GRUNT':   return new Grunt(hx, hy, wave);
    case 'SOLDIER': return new Soldier(hx, hy, wave);
    case 'HEAVY':   return new Heavy(hx, hy, wave);
    case 'ELITE':   return new Elite(hx, hy, wave);
  }
}
