/**
 * sc-bullet.js — pool de projectiles pour canon P1, lasers P2, ennemis.
 *
 * Une seule classe ScBullet avec kind :
 *   'cannon'  — projectile blanc, cap +dgts canon, vers le haut
 *   'laser'   — rayon court cyan/jaune/rouge, direction libre, perce si hot
 *   'enemy'   — balle rouge ennemie
 */

class ScBullet {
  constructor() {
    this.active = false;
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.kind = 'cannon';
    this.damage = 1;
    this.pierce = false;        // laser percant (traverse ennemis + boucliers)
    this.hitIds = null;         // ids deja touches si pierce
    this.life  = 0;             // pour lasers, duree max
  }
  spawnCannon(x, y, damage) {
    this.active = true;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = -SC.SHIP.CANNON_SPD;
    this.kind = 'cannon';
    this.damage = damage;
    this.pierce = false;
    this.hitIds = null;
    this.life = 3;
  }
  spawnLaser(x, y, angle, pierce) {
    this.active = true;
    this.x = x; this.y = y;
    this.vx = Math.cos(angle) * SC.TURRET.LASER_SPD;
    this.vy = Math.sin(angle) * SC.TURRET.LASER_SPD;
    this.kind = 'laser';
    this.damage = SC.TURRET.LASER_DMG;
    this.pierce = pierce;
    this.hitIds = pierce ? new Set() : null;
    this.life = 1.4;
    this.angle = angle;
  }
  spawnEnemy(x, y, vx, vy) {
    this.active = true;
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.kind = 'enemy';
    this.damage = 1;
    this.pierce = false;
    this.hitIds = null;
    this.life = 6;
  }
  update(dt) {
    if (!this.active) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0 ||
        this.x < -20 || this.x > SC.W + 20 ||
        this.y < -20 || this.y > SC.H + 20) {
      this.active = false;
    }
  }
  render(ctx) {
    if (!this.active) return;
    if (this.kind === 'cannon') {
      ctx.fillStyle = SC.COLOR.CANNON_BULLET;
      ctx.fillRect(Math.round(this.x) - 2, Math.round(this.y) - 6, 4, 10);
      ctx.fillStyle = '#FFAA44';
      ctx.fillRect(Math.round(this.x) - 1, Math.round(this.y) - 2, 2, 3);
    } else if (this.kind === 'laser') {
      const color = this.pierce ? SC.COLOR.LASER_HOT : SC.COLOR.LASER_WARM;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.fillStyle = color;
      ctx.fillRect(-SC.TURRET.LASER_LEN / 2, -1, SC.TURRET.LASER_LEN, 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-SC.TURRET.LASER_LEN / 4, -0.5, SC.TURRET.LASER_LEN / 2, 1);
      ctx.restore();
    } else if (this.kind === 'enemy') {
      ctx.fillStyle = SC.COLOR.ENEMY_BULLET;
      ctx.fillRect(Math.round(this.x) - 2, Math.round(this.y) - 2, 4, 6);
      ctx.fillStyle = '#FFBB88';
      ctx.fillRect(Math.round(this.x) - 1, Math.round(this.y) - 1, 2, 2);
    }
  }
}

class ScBulletPool {
  constructor(sizePlayer, sizeEnemy) {
    this.player = [];
    this.enemy  = [];
    for (let i = 0; i < sizePlayer; i++) this.player.push(new ScBullet());
    for (let i = 0; i < sizeEnemy;  i++) this.enemy.push(new ScBullet());
  }
  _nextPlayer() {
    for (const b of this.player) if (!b.active) return b;
    return null;
  }
  _nextEnemy() {
    for (const b of this.enemy) if (!b.active) return b;
    return null;
  }
  firePlayerCannon(x, y, damage) {
    const b = this._nextPlayer();
    if (b) b.spawnCannon(x, y, damage);
    return b;
  }
  firePlayerLaser(x, y, angle, pierce) {
    const b = this._nextPlayer();
    if (b) b.spawnLaser(x, y, angle, pierce);
    return b;
  }
  fireEnemy(x, y, vx, vy) {
    const b = this._nextEnemy();
    if (b) b.spawnEnemy(x, y, vx, vy);
    return b;
  }
  updateAll(dt) {
    for (const b of this.player) b.update(dt);
    for (const b of this.enemy)  b.update(dt);
  }
  renderAll(ctx) {
    for (const b of this.player) b.render(ctx);
    for (const b of this.enemy)  b.render(ctx);
  }
  deactivateEnemyBullets() {
    for (const b of this.enemy) b.active = false;
  }
  reset() {
    for (const b of this.player) b.active = false;
    for (const b of this.enemy)  b.active = false;
  }
}
