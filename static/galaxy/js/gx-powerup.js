/**
 * gx-powerup.js — power-ups avec 7 types.
 */

// Table de tirage pondéré construite depuis GX.POWERUP_WEIGHTS
// (recalculée une fois au chargement — mettre à jour si POWERUP_WEIGHTS change)
const GX_POWERUP_POOL = (() => {
  const pool = [];
  for (const [type, weight] of Object.entries(GX.POWERUP_WEIGHTS))
    for (let i = 0; i < weight; i++) pool.push(type);
  return pool;
})();

class PowerUp {
  constructor(x, y, type) {
    this.x        = x;
    this.y        = y;
    this.type     = type;
    this.active   = true;
    this.collected= false;
    this.bobTimer = Math.random() * Math.PI * 2; // phase de flottement
  }

  update(dt) {
    if (!this.active) return;
    this.y        += GX.POWERUP_FALL_SPD * dt;
    this.bobTimer += dt * 3;
    if (this.y > GX.H + 20) this.active = false;
  }

  render(ctx) {
    if (!this.active) return;
    const x   = this.x | 0;
    const y   = (this.y + Math.sin(this.bobTimer) * 3) | 0;
    const col = GX.COLOR.POWERUP[this.type];
    const r   = 11;

    // Halo pulsant
    const pulse = 0.5 + 0.5 * Math.sin(this.bobTimer * 2);
    ctx.beginPath();
    ctx.arc(x, y, r + 4 + pulse * 4, 0, Math.PI * 2);
    ctx.fillStyle = `${col}22`;
    ctx.fill();

    // Fond
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Lettre
    ctx.fillStyle = '#000';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.type[0], x, y + 4);
  }

  hitPlayer(px, py) {
    return this.active && Math.abs(this.x - px) < 20 && Math.abs(this.y - py) < 20;
  }
}

// ═══════════════════════════════════════════════════════════
class PowerUpManager {
  constructor() { this.items = []; }

  maybeSpawn(x, y) {
    if (Math.random() < GX.POWERUP_DROP_CHANCE) {
      const type = GX_POWERUP_POOL[Math.floor(Math.random() * GX_POWERUP_POOL.length)];
      this.items.push(new PowerUp(x, y, type));
    }
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      this.items[i].update(dt);
      if (!this.items[i].active) this.items.splice(i, 1);
    }
  }

  render(ctx) {
    for (const p of this.items) p.render(ctx);
  }

  // Retourne la liste des power-ups collectés par ship (les retire de la liste)
  checkCollisions(ships) {
    const collected = [];
    for (let i = this.items.length - 1; i >= 0; i--) {
      const pu = this.items[i];
      for (const ship of ships) {
        if (ship.invincible) continue;
        if (pu.hitPlayer(ship.x, ship.y)) {
          pu.active = false;
          collected.push({ type: pu.type, ship });
          this.items.splice(i, 1);
          break;
        }
      }
    }
    return collected;
  }

  reset() { this.items = []; }
}
