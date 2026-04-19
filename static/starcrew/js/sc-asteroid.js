/**
 * sc-asteroid.js — 4 types d'asteroides : fer, or, glace, volatile.
 * Scrollent verticalement. Petit (<=18) = grappable + ramenable.
 * Grand (>18) = grappable => deviendra bouclier orbital (voir sc-grapple).
 */

let _scAstId = 1;

const SC_ASTEROID_TYPE_COLORS = {
  FER:      { fill: '#8A8A8A', dark: '#444444', light: '#BBBBBB' },
  OR:       { fill: '#FFCC22', dark: '#AA7700', light: '#FFEE88' },
  GLACE:    { fill: '#88DDFF', dark: '#3377AA', light: '#CCEEFF' },
  VOLATILE: { fill: '#FF4422', dark: '#882211', light: '#FFAA66' },
};

class ScAsteroid {
  constructor(x, y, radius, speed, type) {
    this.id = _scAstId++;
    this.x = x; this.y = y;
    this.r = radius;
    this.speed = speed;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 1.4;
    this.type = type;
    this.active = true;
    this.grappled = false;            // true si tenu par le grapin
    this.pulseTime = Math.random() * 10;

    this.vertices = [];
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = radius * (0.78 + Math.random() * 0.3);
      this.vertices.push({ a, r: rr });
    }
  }
  isSmall() { return this.r <= SC.ASTEROID.R_SMALL_MAX; }

  update(dt, globalSpeedMult) {
    if (this.grappled) return;
    this.y += this.speed * globalSpeedMult * dt;
    this.rotation += this.rotSpeed * dt;
    this.pulseTime += dt;
    if (this.y - this.r > SC.H + 10) this.active = false;
  }
  hits(cx, cy, halfW, halfH) {
    const nx = Math.max(cx - halfW, Math.min(this.x, cx + halfW));
    const ny = Math.max(cy - halfH, Math.min(this.y, cy + halfH));
    const dx = this.x - nx;
    const dy = this.y - ny;
    return dx * dx + dy * dy < (this.r * 0.88) ** 2;
  }
  hitsPoint(px, py, tolerance = 0) {
    const dx = this.x - px, dy = this.y - py;
    return dx * dx + dy * dy < (this.r + tolerance) ** 2;
  }

  render(ctx) {
    const pal = SC_ASTEROID_TYPE_COLORS[this.type];
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Halo pulsant pour volatile
    if (this.type === 'VOLATILE') {
      const pulse = 0.4 + 0.3 * Math.sin(this.pulseTime * 5);
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#FF6644';
      ctx.beginPath();
      ctx.arc(0, 0, this.r + 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.beginPath();
    for (let i = 0; i < this.vertices.length; i++) {
      const v = this.vertices[i];
      const vx = Math.cos(v.a) * v.r;
      const vy = Math.sin(v.a) * v.r;
      if (i === 0) ctx.moveTo(vx, vy);
      else         ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.fillStyle = pal.fill;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = pal.dark;
    ctx.stroke();

    // Reflet
    ctx.fillStyle = pal.light;
    ctx.fillRect(-this.r * 0.35, -this.r * 0.5, Math.max(3, this.r * 0.25), Math.max(3, this.r * 0.22));

    // Indicateur si grandement valable (halo dore)
    if (this.type === 'OR') {
      ctx.strokeStyle = '#FFEE88';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, this.r + 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Type marker pour glace (etoile blanche)
    if (this.type === 'GLACE') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-1, -this.r * 0.5, 2, 4);
      ctx.fillRect(-this.r * 0.5, -1, 4, 2);
    }

    ctx.restore();
  }
}

class ScAsteroidManager {
  constructor() {
    this.list = [];
    this.spawnTimer = 1.5;
  }
  reset() { this.list = []; this.spawnTimer = 1.5; }

  update(dt, gameTime, spawnMultiplier, globalSpeedMult) {
    // Spawn interval diminue avec le temps
    const base = Math.max(SC.ASTEROID.SPAWN_MIN,
                          SC.ASTEROID.SPAWN_BASE - gameTime * 0.008);
    this.spawnTimer -= dt * spawnMultiplier;
    if (this.spawnTimer <= 0) {
      this._spawn();
      this.spawnTimer = base * (0.7 + Math.random() * 0.6);
    }
    for (let i = this.list.length - 1; i >= 0; i--) {
      this.list[i].update(dt, globalSpeedMult);
      if (!this.list[i].active) this.list.splice(i, 1);
    }
  }
  _spawn() {
    // Taille : 40% grands, 60% petits
    const big = Math.random() < 0.35;
    const r = big
      ? SC.ASTEROID.R_BIG_MIN + Math.random() * (SC.ASTEROID.R_BIG_MAX - SC.ASTEROID.R_BIG_MIN)
      : SC.ASTEROID.R_SMALL_MIN + Math.random() * (SC.ASTEROID.R_SMALL_MAX - SC.ASTEROID.R_SMALL_MIN);
    const x = r + Math.random() * (SC.W - 2 * r);
    const y = -r - 10;
    const speed = SC.ASTEROID.SPEED_MIN
                + Math.random() * (SC.ASTEROID.SPEED_MAX - SC.ASTEROID.SPEED_MIN);
    const type = _scRollType();
    this.list.push(new ScAsteroid(x, y, r, speed, type));
  }
  add(asteroid) { this.list.push(asteroid); }

  findNearestForGrapple(hx, hy, tolerance, predicate) {
    let best = null, bestD2 = Infinity;
    for (const a of this.list) {
      if (!a.active || a.grappled) continue;
      if (predicate && !predicate(a)) continue;
      const dx = a.x - hx, dy = a.y - hy;
      const d2 = dx * dx + dy * dy;
      const r  = a.r + tolerance;
      if (d2 < r * r && d2 < bestD2) { best = a; bestD2 = d2; }
    }
    return best;
  }

  render(ctx) {
    for (const a of this.list) a.render(ctx);
  }
}

function _scRollType() {
  const w = SC.ASTEROID.TYPES_WEIGHTS;
  const total = w.FER + w.OR + w.GLACE + w.VOLATILE;
  let r = Math.random() * total;
  if ((r -= w.FER) < 0)      return 'FER';
  if ((r -= w.OR) < 0)       return 'OR';
  if ((r -= w.GLACE) < 0)    return 'GLACE';
  return 'VOLATILE';
}
