/**
 * racer-obstacles.js — StarField, Asteroid, AsteroidManager, Pickup, PickupManager.
 *
 * StarField : fond spatial a 3 couches parallaxe, vitesse relative au defilement.
 * Asteroid  : rocher pixel-art polygonal, tourne en descendant.
 * Pickup    : pastille doree a collecter pour bonus de score.
 */

// ═══════════════════════════════════════════════════════════
class RacerStarField {
  constructor() {
    this.layers = [
      this._makeLayer(70, 0.22, 1, RACER.COLOR.STAR2),
      this._makeLayer(50, 0.55, 1, RACER.COLOR.STAR1),
      this._makeLayer(22, 1.0,  2, RACER.COLOR.STAR3),
    ];
  }
  _makeLayer(count, speed, size, color) {
    const stars = [];
    for (let i = 0; i < count; i++)
      stars.push({ x: Math.random() * RACER.W, y: Math.random() * RACER.H });
    return { stars, speed, size, color };
  }
  update(dt, worldSpeed) {
    const base = worldSpeed / RACER.START_SPEED;
    for (const layer of this.layers)
      for (const s of layer.stars) {
        s.y += layer.speed * base * 48 * dt;
        if (s.y > RACER.H) { s.y = 0; s.x = Math.random() * RACER.W; }
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
class Asteroid {
  constructor(x, y, radius, speed) {
    this.x         = x;
    this.y         = y;
    this.r         = radius;
    this.speed     = speed;
    this.rotation  = Math.random() * Math.PI * 2;
    this.rotSpeed  = (Math.random() - 0.5) * 1.6;
    this.active    = true;
    // Polygone pixel-art : 8 sommets, rayons aleatoires
    this.vertices  = [];
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a  = (i / n) * Math.PI * 2;
      const rr = radius * (0.75 + Math.random() * 0.35);
      this.vertices.push({ a, r: rr });
    }
  }
  update(dt, speedMult) {
    this.y += this.speed * speedMult * dt;
    this.rotation += this.rotSpeed * dt;
    if (this.y - this.r > RACER.H) this.active = false;
  }
  hits(cx, cy, halfW, halfH) {
    // Collision cercle vs rectangle (approx)
    const nx = Math.max(cx - halfW, Math.min(this.x, cx + halfW));
    const ny = Math.max(cy - halfH, Math.min(this.y, cy + halfH));
    const dx = this.x - nx;
    const dy = this.y - ny;
    return dx * dx + dy * dy < (this.r * 0.85) * (this.r * 0.85);
  }
  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    // Corps
    ctx.fillStyle   = RACER.COLOR.ASTEROID;
    ctx.strokeStyle = RACER.COLOR.ASTEROID_DK;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    for (let i = 0; i < this.vertices.length; i++) {
      const v = this.vertices[i];
      const vx = Math.cos(v.a) * v.r;
      const vy = Math.sin(v.a) * v.r;
      if (i === 0) ctx.moveTo(vx, vy);
      else         ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Reflet
    ctx.fillStyle = RACER.COLOR.ASTEROID_LT;
    ctx.fillRect(-this.r * 0.35, -this.r * 0.5, Math.max(3, this.r * 0.25), Math.max(3, this.r * 0.22));
    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════
class AsteroidManager {
  constructor() {
    this.list        = [];
    this.spawnTimer  = 0.8;  // premier spawn un peu retarde
  }
  reset() {
    this.list = [];
    this.spawnTimer = 0.8;
  }
  update(dt, worldSpeed, gameTime) {
    // Intervalle qui se resserre avec le temps
    const t     = Math.min(1, gameTime / RACER.ASTEROID_RATE_RAMP_SEC);
    const base  = RACER.ASTEROID_SPAWN_MAX * (1 - t) + RACER.ASTEROID_SPAWN_MIN * t;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this._spawn(worldSpeed);
      this.spawnTimer = base * (0.7 + Math.random() * 0.6);
    }

    // Update existants
    for (let i = this.list.length - 1; i >= 0; i--) {
      this.list[i].update(dt, 1.0);
      if (!this.list[i].active) this.list.splice(i, 1);
    }
  }
  _spawn(worldSpeed) {
    const r = RACER.ASTEROID_RADIUS_MIN
            + Math.random() * (RACER.ASTEROID_RADIUS_MAX - RACER.ASTEROID_RADIUS_MIN);
    const x = r + Math.random() * (RACER.W - 2 * r);
    const y = -r - 10;
    const v = worldSpeed * (1 - RACER.ASTEROID_SPEED_VAR + Math.random() * RACER.ASTEROID_SPEED_VAR * 2);
    this.list.push(new Asteroid(x, y, r, v));
  }
  render(ctx) {
    for (const a of this.list) a.render(ctx);
  }
}

// ═══════════════════════════════════════════════════════════
class Pickup {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.r  = RACER.PICKUP_RADIUS;
    this.active = true;
    this.phase  = 0;
  }
  update(dt) {
    this.y += this.speed * dt;
    this.phase += dt * 6;
    if (this.y - this.r > RACER.H) this.active = false;
  }
  hits(cx, cy, halfW, halfH) {
    const nx = Math.max(cx - halfW, Math.min(this.x, cx + halfW));
    const ny = Math.max(cy - halfH, Math.min(this.y, cy + halfH));
    const dx = this.x - nx;
    const dy = this.y - ny;
    return dx * dx + dy * dy < (this.r + 2) * (this.r + 2);
  }
  render(ctx) {
    const pulse = Math.sin(this.phase) * 0.3 + 0.7;
    ctx.save();
    ctx.translate(this.x, this.y);
    // Halo
    ctx.globalAlpha = 0.35 * pulse;
    ctx.fillStyle   = RACER.COLOR.PICKUP_GLOW;
    ctx.beginPath(); ctx.arc(0, 0, this.r + 4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    // Etoile simple (losange)
    ctx.fillStyle   = RACER.COLOR.PICKUP;
    ctx.beginPath();
    ctx.moveTo(0, -this.r);
    ctx.lineTo(this.r * 0.6, 0);
    ctx.lineTo(0, this.r);
    ctx.lineTo(-this.r * 0.6, 0);
    ctx.closePath();
    ctx.fill();
    // Centre
    ctx.fillStyle = '#fff';
    ctx.fillRect(-2, -2, 4, 4);
    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════
class PickupManager {
  constructor() {
    this.list = [];
    this.spawnTimer = RACER.PICKUP_SPAWN_EVERY;
  }
  reset() {
    this.list = [];
    this.spawnTimer = RACER.PICKUP_SPAWN_EVERY * 0.7;
  }
  update(dt, worldSpeed) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this._spawn(worldSpeed);
      this.spawnTimer = RACER.PICKUP_SPAWN_EVERY
                      + (Math.random() - 0.5) * 2 * RACER.PICKUP_SPAWN_JITTER;
    }
    for (let i = this.list.length - 1; i >= 0; i--) {
      this.list[i].update(dt);
      if (!this.list[i].active) this.list.splice(i, 1);
    }
  }
  _spawn(worldSpeed) {
    const x = 40 + Math.random() * (RACER.W - 80);
    this.list.push(new Pickup(x, -20, worldSpeed * 0.85));
  }
  checkCollisions(ships) {
    const collected = [];
    for (const p of this.list) {
      if (!p.active) continue;
      for (const s of ships) {
        if (!s.active) continue;
        if (p.hits(s.x, s.y, RACER.SHIP_HALF_W, RACER.SHIP_HALF_H)) {
          p.active = false;
          collected.push(s);
          break;
        }
      }
    }
    return collected;
  }
  render(ctx) {
    for (const p of this.list) p.render(ctx);
  }
}

// ═══════════════════════════════════════════════════════════
class RacerBoom {
  constructor(x, y, color) {
    this.x = x; this.y = y;
    this.time = 0;
    this.duration = 0.6;
    this.active = true;
    this.particles = [];
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 60 + Math.random() * 140;
      this.particles.push({
        x: 0, y: 0,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        size: 2 + Math.floor(Math.random() * 3),
        color: Math.random() < 0.5 ? color : '#FFDD44',
      });
    }
  }
  update(dt) {
    this.time += dt;
    if (this.time >= this.duration) this.active = false;
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
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
