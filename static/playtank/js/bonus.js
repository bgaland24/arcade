/**
 * bonus.js — parachutage de bonus aléatoires pendant la partie.
 *
 * Types : EXPLOSIF, RAFALE, BOUCLIER, REPARATION, NITRO
 * Max 3 bonus présents simultanément sur le champ.
 * Chaque bonus tombe en parachute depuis le haut du canvas.
 * Un tank qui passe dessus le collecte.
 */

// ── Constantes bonus ─────────────────────────────────────
const BONUS_TYPES = ['EXPLOSIF', 'RAFALE', 'BOUCLIER', 'REPARATION', 'NITRO'];

const BONUS_META = {
  EXPLOSIF:  { color: '#FF4400', icon: '💥', label: 'EXPLOSIF',  duration: 0   },
  RAFALE:    { color: '#FFAA00', icon: '⚡',  label: 'RAFALE',    duration: 15  },
  BOUCLIER:  { color: '#00CCFF', icon: '🛡',  label: 'BOUCLIER',  duration: 0   },
  REPARATION:{ color: '#00FF88', icon: '+',   label: 'RÉPAR.',    duration: 0   },
  NITRO:     { color: '#FF00FF', icon: 'N',   label: 'NITRO',     duration: 10  },
};

const BONUS_FALL_SPEED   = 55;   // px/s de chute du parachute
const BONUS_MAX_ON_FIELD = 3;    // maximum simultané
const BONUS_SPAWN_INTERVAL_MIN = 12;  // secondes entre spawns (min)
const BONUS_SPAWN_INTERVAL_MAX = 22;  // secondes entre spawns (max)
const BONUS_COLLECT_RADIUS = 30; // distance de collecte (px)
const BONUS_CHUTE_W = 28;        // largeur visuelle du colis
const BONUS_CHUTE_H = 22;

// ── Classe Bonus ─────────────────────────────────────────
class Bonus {
  constructor(type, x) {
    this.type    = type;
    this.x       = x;
    this.y       = 46;            // démarre juste sous le HUD
    this.landed  = false;
    this.landY   = 0;
    this.active  = true;
    this.pulse   = 0;             // animation pulsation une fois posé
  }

  update(dt, terrain) {
    this.pulse += dt * 3;

    if (!this.landed) {
      this.y += BONUS_FALL_SPEED * dt;
      const groundY = terrain.getY(Math.round(this.x)) - BONUS_CHUTE_H / 2;
      if (this.y >= groundY) {
        this.y      = groundY;
        this.landY  = groundY;
        this.landed = true;
      }
    }
  }

  // Retourne true si le tank est assez proche pour collecter
  collides(tank) {
    const dx = tank.x - this.x;
    const dy = tank.y - this.y;
    return Math.sqrt(dx * dx + dy * dy) < BONUS_COLLECT_RADIUS;
  }

  render(ctx) {
    const meta = BONUS_META[this.type];
    const x    = Math.round(this.x);
    const y    = Math.round(this.y);

    if (!this.landed) {
      // ── Parachute ─────────────────────────────────────
      // Dôme
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y - BONUS_CHUTE_H - 8, 18, Math.PI, 0, false);
      ctx.fillStyle = meta.color + 'AA';
      ctx.fill();
      ctx.strokeStyle = meta.color;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Cordes
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x - 14, y - BONUS_CHUTE_H - 6);
      ctx.lineTo(x - BONUS_CHUTE_W / 2, y - BONUS_CHUTE_H / 2);
      ctx.moveTo(x + 14, y - BONUS_CHUTE_H - 6);
      ctx.lineTo(x + BONUS_CHUTE_W / 2, y - BONUS_CHUTE_H / 2);
      ctx.moveTo(x, y - BONUS_CHUTE_H - 8);
      ctx.lineTo(x, y - BONUS_CHUTE_H / 2);
      ctx.stroke();
      ctx.restore();
    }

    // ── Colis ────────────────────────────────────────────
    const pulse = this.landed ? Math.sin(this.pulse) * 2 : 0;
    const bx = x - BONUS_CHUTE_W / 2;
    const by = y - BONUS_CHUTE_H + pulse;
    const bw = BONUS_CHUTE_W;
    const bh = BONUS_CHUTE_H;

    // Fond
    ctx.fillStyle = '#1a1208';
    ctx.fillRect(bx, by, bw, bh);
    // Bordure colorée
    ctx.strokeStyle = meta.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
    // Reflet haut
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(bx, by, bw, 4);

    // Icône / lettre
    ctx.fillStyle = meta.color;
    ctx.font      = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(meta.icon, x, by + bh - 5);

    // Label sous la caisse (posée uniquement)
    if (this.landed) {
      ctx.fillStyle = `rgba(255,255,255,${0.5 + Math.sin(this.pulse) * 0.2})`;
      ctx.font      = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(meta.label, x, by + bh + 9);
    }
  }
}

// ── Gestionnaire de bonus ────────────────────────────────
class BonusManager {
  constructor() {
    this.bonuses     = [];
    this.spawnTimer  = _nextSpawnDelay();
  }

  update(dt, terrain, tanks) {
    // Spawn
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = _nextSpawnDelay();
      if (this.bonuses.length < BONUS_MAX_ON_FIELD) {
        this._spawn(terrain);
      }
    }

    // Mise à jour des bonus existants
    for (const b of this.bonuses) b.update(dt, terrain);

    // Collecte
    for (let i = this.bonuses.length - 1; i >= 0; i--) {
      const b = this.bonuses[i];
      for (const tank of tanks) {
        if (b.collides(tank)) {
          _applyBonus(b.type, tank, tanks);
          this.bonuses.splice(i, 1);
          break;
        }
      }
    }
  }

  reset() {
    this.bonuses    = [];
    this.spawnTimer = _nextSpawnDelay();
  }

  render(ctx) {
    for (const b of this.bonuses) b.render(ctx);
  }

  // Appelé par terrain.destroy() pour repositionner les bonus posés
  onTerrainChanged(terrain) {
    for (const b of this.bonuses) {
      if (b.landed) {
        const newY = terrain.getY(Math.round(b.x)) - BONUS_CHUTE_H / 2;
        b.y     = newY;
        b.landY = newY;
      }
    }
  }

  _spawn(terrain) {
    const margin = 80;
    const x = margin + Math.random() * (CONFIG.CANVAS_W - margin * 2);
    const type = BONUS_TYPES[Math.floor(Math.random() * BONUS_TYPES.length)];
    this.bonuses.push(new Bonus(type, x));
  }
}

// ── Application des effets ────────────────────────────────
function _applyBonus(type, tank, tanks) {
  switch (type) {
    case 'EXPLOSIF':
      tank.bonusExplosif = true;
      break;

    case 'RAFALE':
      tank.bonusRafale = BONUS_META.RAFALE.duration;
      break;

    case 'BOUCLIER':
      tank.bonusBouclier = true;
      break;

    case 'REPARATION':
      if (tank.hits > 0) tank.hits--;
      break;

    case 'NITRO':
      tank.bonusNitro = BONUS_META.NITRO.duration;
      break;
  }
}

function _nextSpawnDelay() {
  return BONUS_SPAWN_INTERVAL_MIN
    + Math.random() * (BONUS_SPAWN_INTERVAL_MAX - BONUS_SPAWN_INTERVAL_MIN);
}
