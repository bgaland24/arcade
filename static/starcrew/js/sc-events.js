/**
 * sc-events.js — evenements spéciaux qui pimentent les vagues.
 *
 * STORM    : spawn d'asteroides x3 pendant 10s.
 * BLACKOUT : fond sombre, lumiere uniquement autour du vaisseau (rendu par le game).
 * WELL     : puits gravitationnel a position aleatoire, attire le vaisseau.
 * COMET    : marqueur rouge 1.6s puis trait transversal 880 px/s, instakill.
 */

const SC_EVENT_TYPES = ['STORM', 'BLACKOUT', 'WELL', 'COMET'];

class ScEventManager {
  constructor() {
    this.current = null;                 // { type, time, duration, ...props }
    this.cooldown = SC.EVENTS.COOLDOWN * 0.5;  // warmup
    this.announceText = '';
    this.announceAlpha = 0;
  }
  reset() { this.current = null; this.cooldown = SC.EVENTS.COOLDOWN * 0.5; this.announceAlpha = 0; }
  isActive() { return this.current !== null; }
  isBlackout() { return this.current && this.current.type === 'BLACKOUT'; }
  spawnMultiplier() {
    if (this.current && this.current.type === 'STORM') return SC.EVENTS.STORM_SPAWN_MULT;
    return 1;
  }
  worldSpeedMult() { return 1; }

  // Appelle pour appliquer force gravitationnelle au ship
  wellForceAt(shipX, shipY) {
    if (!this.current || this.current.type !== 'WELL') return null;
    const dx = this.current.x - shipX;
    const dy = this.current.y - shipY;
    const d  = Math.max(10, Math.hypot(dx, dy));
    if (d > SC.EVENTS.WELL_RADIUS) return null;
    const fall = 1 - d / SC.EVENTS.WELL_RADIUS;
    return {
      x: (dx / d) * SC.EVENTS.WELL_PULL * fall,
      y: (dy / d) * SC.EVENTS.WELL_PULL * fall,
    };
  }

  // Verifie instakill comete : retourne true si le trait touche un cercle
  cometKills(cx, cy, r) {
    if (!this.current || this.current.type !== 'COMET') return false;
    const c = this.current;
    if (c.phase !== 'STRIKE') return false;
    // Segment le long du trait de comete
    // position actuelle : c.trailHead, direction c.dir
    const ax = c.trailHead.x - Math.cos(c.dir) * 40; // bout arriere
    const ay = c.trailHead.y - Math.sin(c.dir) * 40;
    const bx = c.trailHead.x;
    const by = c.trailHead.y;
    return _scCircleSegment(cx, cy, r, ax, ay, bx, by);
  }

  update(dt, waveNumber) {
    if (this.announceAlpha > 0) this.announceAlpha = Math.max(0, this.announceAlpha - dt * 0.6);

    if (this.current) {
      this.current.time += dt;
      if (this.current.type === 'COMET') {
        if (this.current.phase === 'WARN' && this.current.time >= SC.EVENTS.COMET_WARN) {
          this.current.phase = 'STRIKE';
          this.current.time = 0;
        }
        if (this.current.phase === 'STRIKE') {
          this.current.trailHead.x += Math.cos(this.current.dir) * SC.EVENTS.COMET_SPD * dt;
          this.current.trailHead.y += Math.sin(this.current.dir) * SC.EVENTS.COMET_SPD * dt;
          if (this.current.trailHead.x < -100 || this.current.trailHead.x > SC.W + 100 ||
              this.current.trailHead.y < -100 || this.current.trailHead.y > SC.H + 100) {
            this.current = null;
            this.cooldown = SC.EVENTS.COOLDOWN;
          }
        }
      } else if (this.current.time >= this.current.duration) {
        this.current = null;
        this.cooldown = SC.EVENTS.COOLDOWN;
      }
    } else {
      this.cooldown -= dt;
      if (this.cooldown <= 0) {
        this._tryTrigger(waveNumber);
        if (!this.current) this.cooldown = 3;
      }
    }
  }

  _tryTrigger(waveNumber) {
    const eligible = [];
    if (waveNumber >= SC.EVENTS.STORM_MIN_WAVE)    eligible.push('STORM');
    if (waveNumber >= SC.EVENTS.BLACKOUT_MIN_WAVE) eligible.push('BLACKOUT');
    if (waveNumber >= SC.EVENTS.WELL_MIN_WAVE)     eligible.push('WELL');
    if (waveNumber >= SC.EVENTS.COMET_MIN_WAVE)    eligible.push('COMET');
    if (eligible.length === 0) return;

    const type = eligible[Math.floor(Math.random() * eligible.length)];
    if (type === 'STORM') {
      this.current = { type, time: 0, duration: SC.EVENTS.STORM_DURATION };
      this._announce('⚠ TEMPETE ⚠');
    } else if (type === 'BLACKOUT') {
      this.current = { type, time: 0, duration: SC.EVENTS.BLACKOUT_DURATION };
      this._announce('⚠ BLACKOUT ⚠');
    } else if (type === 'WELL') {
      const x = 150 + Math.random() * (SC.W - 300);
      const y = SC.PLAY_TOP + 40 + Math.random() * (SC.PLAY_BOTTOM - SC.PLAY_TOP - 80);
      this.current = { type, time: 0, duration: SC.EVENTS.WELL_DURATION, x, y };
      this._announce('⚠ PUITS GRAVITATIONNEL ⚠');
    } else if (type === 'COMET') {
      // Comete : trajectoire horizontale ou diagonale
      const fromLeft = Math.random() < 0.5;
      const yStart = SC.PLAY_TOP + 40 + Math.random() * (SC.PLAY_BOTTOM - SC.PLAY_TOP - 80);
      const angle = fromLeft
        ? (Math.random() * 0.3 - 0.15)
        : Math.PI + (Math.random() * 0.3 - 0.15);
      const start = {
        x: fromLeft ? -60 : SC.W + 60,
        y: yStart,
      };
      this.current = {
        type, time: 0, duration: SC.EVENTS.COMET_WARN + 2.0,
        phase: 'WARN', dir: angle, trailHead: { ...start }, start,
      };
      this._announce('⚠⚠ COMETE ⚠⚠');
    }
  }

  _announce(text) {
    this.announceText  = text;
    this.announceAlpha = 1.0;
  }

  render(ctx) {
    if (!this.current) return;
    const c = this.current;
    if (c.type === 'WELL') {
      // Vortex pulsant
      ctx.save();
      ctx.translate(c.x, c.y);
      for (let r = SC.EVENTS.WELL_RADIUS; r > 10; r -= 24) {
        ctx.globalAlpha = 0.14 * (1 - r / SC.EVENTS.WELL_RADIUS);
        ctx.strokeStyle = '#9944FF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.6 + 0.3 * Math.sin(c.time * 6);
      ctx.fillStyle = '#6622AA';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    else if (c.type === 'COMET') {
      if (c.phase === 'WARN') {
        // Marqueur rouge pulsant le long de la trajectoire prevue
        const pulse = 0.5 + 0.5 * Math.sin(c.time * 18);
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.35 * pulse;
        ctx.strokeStyle = '#FF0022';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(c.start.x, c.start.y);
        const endX = c.start.x + Math.cos(c.dir) * (SC.W + 120);
        const endY = c.start.y + Math.sin(c.dir) * (SC.W + 120);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      } else {
        // Trait blanc + trail rouge
        ctx.save();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 5;
        const tailX = c.trailHead.x - Math.cos(c.dir) * 120;
        const tailY = c.trailHead.y - Math.sin(c.dir) * 120;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(c.trailHead.x, c.trailHead.y);
        ctx.stroke();
        ctx.strokeStyle = '#FF6622';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

// Segment/cercle helper
function _scCircleSegment(cx, cy, r, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const fx = ax - cx, fy = ay - cy;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return false;
  const sq = Math.sqrt(disc);
  const t1 = (-b - sq) / (2 * a);
  const t2 = (-b + sq) / (2 * a);
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}
