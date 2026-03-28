/**
 * gx-particles.js — StarField, Explosion, ShieldFlash.
 */

// ═══════════════════════════════════════════════════════════
class StarField {
  constructor() {
    this.layers = [
      this._makeLayer(60, 0.25, 1, GX.COLOR.STAR2),
      this._makeLayer(45, 0.55, 1, GX.COLOR.STAR1),
      this._makeLayer(20, 1.0,  2, GX.COLOR.STAR3),
    ];
  }

  _makeLayer(count, speed, size, color) {
    const stars = [];
    for (let i = 0; i < count; i++)
      stars.push({ x: Math.random() * GX.W, y: Math.random() * GX.H });
    return { stars, speed, size, color };
  }

  update(dt) {
    for (const layer of this.layers)
      for (const s of layer.stars) {
        s.y += layer.speed * dt * 18;
        if (s.y > GX.H) { s.y = 0; s.x = Math.random() * GX.W; }
      }
  }

  render(ctx) {
    for (const layer of this.layers) {
      ctx.fillStyle = layer.color;
      for (const s of layer.stars)
        ctx.fillRect(Math.round(s.x), Math.round(s.y), layer.size, layer.size);
    }
  }
}

// ═══════════════════════════════════════════════════════════
class GxExplosion {
  constructor(x, y, radius = 24, palette = null) {
    this.x        = x;
    this.y        = y;
    this.radius   = radius;
    this.time     = 0;
    this.duration = 0.55;
    this.active   = true;
    this.palette  = palette || [GX.COLOR.STAR3, '#FF8800', '#FF2200'];

    this.particles = [];
    const count = Math.round(8 + radius * 0.5);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const spd   = 30 + Math.random() * radius * 2.2;
      this.particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 40,
        life: 1.0,
        size: 1 + (Math.random() * 3 | 0),
      });
    }
  }

  update(dt) {
    this.time += dt;
    if (this.time >= this.duration) { this.active = false; return; }
    const decay = dt / this.duration;
    for (const p of this.particles) {
      p.x   += p.vx * dt;
      p.y   += p.vy * dt;
      p.vy  += 120 * dt;
      p.life -= decay * 1.2;
    }
  }

  render(ctx) {
    const t     = this.time / this.duration;
    const alpha = 1 - t;
    const r     = 4 + t * this.radius;

    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
    g.addColorStop(0,   `rgba(255,255,220,${alpha})`);
    g.addColorStop(0.35,`${this.palette[0]}${_hexAlpha(alpha * 0.9)}`);
    g.addColorStop(0.7, `${this.palette[1]}${_hexAlpha(alpha * 0.5)}`);
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();

    for (const p of this.particles) {
      if (p.life <= 0) continue;
      const c = Math.floor(p.life * 255);
      ctx.fillStyle = `rgba(255,${Math.floor(c * 0.6)},0,${p.life})`;
      ctx.fillRect(p.x | 0, p.y | 0, p.size, p.size);
    }
  }
}

// ═══════════════════════════════════════════════════════════
class ShieldFlash {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.time = 0; this.duration = 0.4; this.active = true;
  }
  update(dt) { this.time += dt; if (this.time >= this.duration) this.active = false; }
  render(ctx) {
    const t = this.time / this.duration;
    const r = 20 + t * 18;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,238,255,${1 - t})`;
    ctx.lineWidth = 3 * (1 - t);
    ctx.stroke();
  }
}

// ═══════════════════════════════════════════════════════════
class BombFlash {
  constructor() { this.time = 0; this.duration = 0.5; this.active = false; }
  trigger() { this.time = 0; this.active = true; }
  update(dt) { if (!this.active) return; this.time += dt; if (this.time >= this.duration) this.active = false; }
  render(ctx) {
    if (!this.active) return;
    const alpha = Math.max(0, 0.5 * (1 - this.time / this.duration));
    ctx.fillStyle = `rgba(255,60,0,${alpha})`;
    ctx.fillRect(0, 0, GX.W, GX.H);
  }
}

// Convertit un alpha 0-1 en 2 chiffres hex pour les couleurs CSS hex
function _hexAlpha(a) {
  return Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0');
}
