/**
 * derby-particles.js — elements d'ambiance : fond crepuscule, collines,
 * sol defilant, nuages de poussiere sous les sabots, eclats d'eclair.
 */

// ═══════════════════════════════════════════════════════════
class DerbyBackground {
  constructor(laneTopY, laneH) {
    this.top = laneTopY;
    this.h   = laneH;
    // Hills parallax (2 couches)
    this.hillsFar = this._makeHills(40, 18, DRB.COLOR.HILL_FAR);
    this.hillsNear = this._makeHills(28, 32, DRB.COLOR.HILL_NEAR);
    // Scroll offset
    this.offsetFar = 0;
    this.offsetNear = 0;
    this.offsetGround = 0;
  }
  _makeHills(count, height, color) {
    const pts = [];
    for (let i = 0; i < count; i++) {
      pts.push({ x: (i / count) * DRB.W * 2, h: height * (0.65 + Math.random() * 0.7) });
    }
    return { pts, color, step: (DRB.W * 2) / count };
  }
  update(dt, worldSpeed) {
    this.offsetFar    += worldSpeed * DRB.PARALLAX.HILLS_SPEED * 0.4 * dt;
    this.offsetNear   += worldSpeed * DRB.PARALLAX.HILLS_SPEED * dt;
    this.offsetGround += worldSpeed * DRB.PARALLAX.GROUND_SPEED * dt;
  }
  render(ctx) {
    // Sky gradient
    const grad = ctx.createLinearGradient(0, this.top, 0, this.top + this.h);
    grad.addColorStop(0.00, DRB.COLOR.SKY_TOP);
    grad.addColorStop(0.55, DRB.COLOR.SKY_MID);
    grad.addColorStop(1.00, DRB.COLOR.SKY_BOT);
    ctx.fillStyle = grad;
    ctx.fillRect(0, this.top, DRB.W, this.h);

    // Hills far
    this._renderHills(ctx, this.hillsFar, this.offsetFar, this.top + this.h * 0.55);
    // Hills near
    this._renderHills(ctx, this.hillsNear, this.offsetNear, this.top + this.h * 0.72);

    // Ground (dirt strip)
    const groundY = this.top + this.h - 36;
    ctx.fillStyle = DRB.COLOR.GROUND_DIRT;
    ctx.fillRect(0, groundY, DRB.W, 36);
    ctx.fillStyle = DRB.COLOR.GROUND_GRASS;
    ctx.fillRect(0, groundY, DRB.W, 4);
    // Ground parallax dots (cailloux)
    ctx.fillStyle = '#3a1e0d';
    const step = 26;
    const off = (this.offsetGround * 0.6) % step;
    for (let x = -off; x < DRB.W + step; x += step) {
      ctx.fillRect(Math.round(x), groundY + 10 + ((Math.floor(x / step) * 17) % 12), 3, 2);
      ctx.fillRect(Math.round(x + 13), groundY + 22 + ((Math.floor(x / step) * 23) % 8), 2, 2);
    }
  }
  _renderHills(ctx, hills, offset, baseY) {
    ctx.fillStyle = hills.color;
    ctx.beginPath();
    const off = offset % (hills.step * hills.pts.length);
    ctx.moveTo(0, baseY + 30);
    for (let i = 0; i < hills.pts.length; i++) {
      const x1 = i * hills.step - off;
      const x2 = (i + 1) * hills.step - off;
      const y1 = baseY - hills.pts[i].h;
      const y2 = baseY - hills.pts[(i + 1) % hills.pts.length].h;
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.lineTo(DRB.W + 10, baseY + 30);
    ctx.closePath();
    ctx.fill();
  }
}

// ═══════════════════════════════════════════════════════════
class DerbyDust {
  // Petit nuage de poussiere sous un cheval
  constructor(x, y) {
    this.x = x; this.y = y;
    this.time = 0;
    this.duration = 0.5;
    this.active = true;
    this.vx = -40 - Math.random() * 40;
    this.vy = -20 - Math.random() * 30;
    this.size = 4 + Math.random() * 3;
  }
  update(dt) {
    this.time += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 60 * dt;
    if (this.time >= this.duration) this.active = false;
  }
  render(ctx) {
    const a = 1 - this.time / this.duration;
    ctx.save();
    ctx.globalAlpha = a * 0.5;
    ctx.fillStyle = '#C9AE8A';
    ctx.fillRect(Math.round(this.x), Math.round(this.y), this.size, this.size);
    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════
class DerbyFence {
  // Barriere pixel-art entre les 2 couloirs
  constructor(y) { this.y = y; this.offset = 0; }
  update(dt, worldSpeed) { this.offset = (this.offset + worldSpeed * dt) % 20; }
  render(ctx) {
    ctx.fillStyle = DRB.COLOR.FENCE_DARK;
    ctx.fillRect(0, this.y, DRB.W, DRB.FENCE_H);
    ctx.fillStyle = DRB.COLOR.FENCE;
    ctx.fillRect(0, this.y + 2, DRB.W, 2);
    ctx.fillRect(0, this.y + 6, DRB.W, 2);
    // Poteaux verticaux
    for (let x = -this.offset; x < DRB.W; x += 20) {
      ctx.fillStyle = DRB.COLOR.FENCE_DARK;
      ctx.fillRect(Math.round(x), this.y, 2, DRB.FENCE_H);
    }
  }
}
