/**
 * sc-particles.js — StarField, Explosion, Spark, Shockwave.
 */

class ScStarField {
  constructor() {
    this.layers = [
      this._makeLayer(70, 0.20, 1, SC.COLOR.STAR2),
      this._makeLayer(45, 0.50, 1, SC.COLOR.STAR1),
      this._makeLayer(20, 1.0,  2, SC.COLOR.STAR3),
    ];
  }
  _makeLayer(count, speed, size, color) {
    const stars = [];
    for (let i = 0; i < count; i++)
      stars.push({ x: Math.random() * SC.W, y: Math.random() * SC.H });
    return { stars, speed, size, color };
  }
  update(dt) {
    for (const layer of this.layers)
      for (const s of layer.stars) {
        s.y += layer.speed * dt * 22;
        if (s.y > SC.H) { s.y = 0; s.x = Math.random() * SC.W; }
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

class ScExplosion {
  constructor(x, y, radius = 20, palette = null) {
    this.x = x; this.y = y;
    this.radius = radius;
    this.time = 0;
    this.duration = 0.5 + radius * 0.01;
    this.active = true;
    this.palette = palette || ['#FFDD66', '#FF8822', '#FF2200'];
    this.particles = [];
    const n = Math.max(8, Math.floor(radius * 0.8));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 40 + Math.random() * 150;
      this.particles.push({
        x: 0, y: 0,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        size: 2 + Math.floor(Math.random() * 3),
        color: this.palette[Math.floor(Math.random() * this.palette.length)],
      });
    }
  }
  update(dt) {
    this.time += dt;
    if (this.time >= this.duration) this.active = false;
    for (const p of this.particles) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.92; p.vy *= 0.92;
    }
  }
  render(ctx) {
    const alpha = 1 - this.time / this.duration;
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.translate(this.x, this.y);
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.restore();
  }
}

class ScShockwave {
  constructor(x, y, maxR, color = '#FFDD44') {
    this.x = x; this.y = y;
    this.time = 0;
    this.duration = 0.5;
    this.maxR = maxR;
    this.color = color;
    this.active = true;
  }
  update(dt) {
    this.time += dt;
    if (this.time >= this.duration) this.active = false;
  }
  render(ctx) {
    const t = this.time / this.duration;
    const r = this.maxR * t;
    ctx.save();
    ctx.globalAlpha = 0.7 * (1 - t);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// Texte flottant (ex : "+5 METAL")
class ScFloatText {
  constructor(x, y, text, color = '#FFAA00') {
    this.x = x; this.y = y;
    this.text = text;
    this.color = color;
    this.time = 0;
    this.duration = 1.0;
    this.active = true;
  }
  update(dt) {
    this.time += dt;
    this.y -= 24 * dt;
    if (this.time >= this.duration) this.active = false;
  }
  render(ctx) {
    const alpha = 1 - this.time / this.duration;
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillStyle = this.color;
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
    ctx.textAlign = 'left';
  }
}
