/**
 * gx-bullet.js — balles joueur + ennemies avec pool de réutilisation.
 */

class PlayerBullet {
  constructor() { this.active = false; }

  reset(x, y, type = 'SINGLE') {
    this.x = x; this.y = y; this.active = true; this.type = type;
    // SINGLE: 1 balle droite / DOUBLE: 2 cols / TRIPLE: 3 cols
    // Cette instance représente toujours une balle individuelle
  }

  update(dt) {
    if (!this.active) return;
    this.y -= GX.PLAYER_BULLET_SPD * dt;
    if (this.y < GX.PLAY_TOP - 10) this.active = false;
  }

  render(ctx) {
    if (!this.active) return;
    const x = this.x | 0, y = this.y | 0;
    // Glow
    const g = ctx.createRadialGradient(x, y, 0, x, y, 6);
    g.addColorStop(0,   'rgba(255,255,100,0.8)');
    g.addColorStop(1,   'rgba(255,200,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 6, y - 6, 12, 12);
    // Pixel
    ctx.fillStyle = GX.COLOR.BULLET_P;
    ctx.fillRect(x - 2, y - 5, 4, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 1, y - 5, 2, 3);
  }

  // AABB simple
  hits(ex, ey, ew, eh) {
    return this.active
      && this.x >= ex - ew / 2 && this.x <= ex + ew / 2
      && this.y >= ey - eh / 2 && this.y <= ey + eh / 2;
  }
}

// ═══════════════════════════════════════════════════════════
class EnemyBullet {
  constructor() { this.active = false; }

  reset(x, y, vx, vy) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.active = true;
  }

  update(dt) {
    if (!this.active) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.y > GX.H + 10 || this.x < -10 || this.x > GX.W + 10) this.active = false;
  }

  render(ctx) {
    if (!this.active) return;
    const x = this.x | 0, y = this.y | 0;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 5);
    g.addColorStop(0, 'rgba(255,100,50,0.9)');
    g.addColorStop(1, 'rgba(255,50,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 5, y - 5, 10, 10);
    ctx.fillStyle = GX.COLOR.BULLET_E;
    ctx.fillRect(x - 2, y - 4, 4, 8);
  }

  hitsPlayer(px, py) {
    return this.active && Math.abs(this.x - px) < 10 && Math.abs(this.y - py) < 12;
  }
}

// ═══════════════════════════════════════════════════════════
class BulletPool {
  constructor(playerCount = 120, enemyCount = 180) {
    this.playerBullets = Array.from({ length: playerCount }, () => new PlayerBullet());
    this.enemyBullets  = Array.from({ length: enemyCount  }, () => new EnemyBullet());
  }

  acquirePlayer(x, y) {
    const b = this.playerBullets.find(b => !b.active);
    if (b) b.reset(x, y);
    return b || null;
  }

  acquireEnemy(x, y, vx, vy) {
    const b = this.enemyBullets.find(b => !b.active);
    if (b) b.reset(x, y, vx, vy);
    return b || null;
  }

  updateAll(dt) {
    for (const b of this.playerBullets) b.update(dt);
    for (const b of this.enemyBullets)  b.update(dt);
  }

  renderAll(ctx) {
    for (const b of this.enemyBullets)  b.render(ctx);
    for (const b of this.playerBullets) b.render(ctx);
  }

  deactivateEnemyBullets() {
    for (const b of this.enemyBullets) b.active = false;
  }

  reset() {
    for (const b of this.playerBullets) b.active = false;
    for (const b of this.enemyBullets)  b.active = false;
  }
}
