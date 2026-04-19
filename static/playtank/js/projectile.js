/**
 * Projectile — physique réaliste avec gravité et vent.
 *
 * Chaque frame :
 *   vx += wind * dt
 *   vy += GRAVITY * dt
 *   x  += vx * dt
 *   y  += vy * dt
 *
 * Retours de update() :
 *   null      → encore en vol
 *   'terrain' → impact sol (explosion + destruction terrain)
 *   'oob'     → sorti des limites (pas d'effet)
 */
class Projectile {
  constructor(x, y, vx, vy, owner, explosive = false) {
    this.x         = x;
    this.y         = y;
    this.vx        = vx;
    this.vy        = vy;
    this.owner     = owner;      // index joueur (0 ou 1)
    this.explosive = explosive;  // rayon d'explosion ×2 si true
    this.active    = true;

    // Traînée visuelle
    this.trail  = [];
    this.TRAIL_MAX = 22;
  }

  update(dt, terrain, wind) {
    // Enregistre position pour la traînée
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.TRAIL_MAX) this.trail.shift();

    // Physique
    if (CONFIG.WIND_ENABLED) this.vx += wind * dt;
    this.vy += CONFIG.GRAVITY * dt;
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;

    // Hors limites latérales ou sol canvas
    if (this.x < -20 || this.x > terrain.width + 20 || this.y > terrain.height + 10) {
      this.active = false;
      return 'oob';
    }

    // Impact terrain
    if (this.x >= 0 && this.x < terrain.width && this.y >= terrain.getY(this.x)) {
      this.active = false;
      return 'terrain';
    }

    return null;
  }

  render(ctx) {
    if (this.trail.length < 2) return;

    // Traînée pointillée
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255,220,80,0.30)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    this.trail.forEach((p, i) =>
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
    );
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Halo lumineux
    const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 7);
    glow.addColorStop(0, 'rgba(255,240,100,0.8)');
    glow.addColorStop(1, 'rgba(255,150,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(this.x - 7, this.y - 7, 14, 14);

    // Pixel obus (rouge si explosif)
    ctx.fillStyle = this.explosive ? '#FF2200' : CONFIG.COLOR.BULLET;
    ctx.fillRect(this.x - 3, this.y - 3, 6, 6);
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.x - 2, this.y - 2, 2, 2);

    // Anneau rouge pulsant autour de l'obus explosif
    if (this.explosive) {
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 100);
      ctx.beginPath();
      ctx.arc(this.x, this.y, 8 + pulse * 3, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,50,0,${0.5 + pulse * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}
