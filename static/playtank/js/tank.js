/**
 * Tank — classe principale du tank + classe Explosion.
 *
 * localAngle : angle de la tourelle en degrés
 *   0   = horizontal (vers la droite dans l'espace local)
 *   90  = vertical (vers le haut)
 *   175 = quasi horizontal (vers la gauche dans l'espace local)
 *
 * dir :  1 = tank faisant face à droite (Joueur 1)
 *       -1 = tank faisant face à gauche  (Joueur 2)
 *
 * Formule de tir :
 *   vx = dir * cos(localAngle) * SHELL_SPEED
 *   vy =      -sin(localAngle) * SHELL_SPEED
 */
class Tank {
  constructor(x, terrain, dir, playerIndex) {
    this.x           = x;
    this.terrain     = terrain;
    this.dir         = dir;          // 1 ou -1
    this.playerIndex = playerIndex;  // 0 ou 1
    this.localAngle  = 45;           // °, même valeur pour les deux tanks
    this.hits        = 0;
    this.cooldown    = 0;
    this.shotsFired  = 0;
    this.shotsHit    = 0;
    this.hitFlash    = 0;            // secondes restantes de flash de dégât

    const C = CONFIG.COLOR;
    this.color  = playerIndex === 0 ? C.P1_BODY : C.P2_BODY;
    this.dark   = playerIndex === 0 ? C.P1_DARK : C.P2_DARK;
  }

  // ── Position terrain ────────────────────────────────────
  get y() { return this.terrain.getY(this.x); }

  // ── Déplacement ─────────────────────────────────────────
  move(direction, dt) {
    const newX = this.x + direction * CONFIG.TANK_SPEED * dt;
    this.x = Math.max(28, Math.min(this.terrain.width - 28, newX));
  }

  // ── Rotation tourelle ────────────────────────────────────
  rotateTurret(direction, dt) {
    this.localAngle += direction * CONFIG.TURRET_SPEED * dt;
    this.localAngle  = Math.max(CONFIG.TURRET_MIN_ANGLE,
                       Math.min(CONFIG.TURRET_MAX_ANGLE, this.localAngle));
  }

  // ── Tir ─────────────────────────────────────────────────
  canFire() { return this.cooldown <= 0; }

  fire() {
    if (!this.canFire()) return null;
    this.cooldown = CONFIG.FIRE_COOLDOWN_S;
    this.shotsFired++;

    const rad    = this.localAngle * Math.PI / 180;
    const barLen = 30;
    const pivX   = this.x;
    const pivY   = this.y - 22;

    // Position pointe du canon (dans l'espace monde)
    const tipX = pivX + this.dir * Math.cos(rad) * barLen;
    const tipY = pivY -           Math.sin(rad)  * barLen;

    const spd = CONFIG.SHELL_SPEED;
    return new Projectile(
      tipX, tipY,
      this.dir * Math.cos(rad) * spd,
      -Math.sin(rad) * spd,
      this.playerIndex
    );
  }

  // ── Mise à jour ─────────────────────────────────────────
  update(dt) {
    if (this.cooldown  > 0) this.cooldown  -= dt;
    if (this.hitFlash  > 0) this.hitFlash  -= dt;
  }

  // ── Dégâts ──────────────────────────────────────────────
  receiveHit() {
    this.hits++;
    this.hitFlash = 0.45;
  }

  isAlive() { return this.hits < CONFIG.HITS_TO_WIN; }

  // ── Collision grossière ──────────────────────────────────
  containsPoint(px, py) {
    return (
      px >= this.x - 22 && px <= this.x + 22 &&
      py >= this.y - 26 && py <= this.y +  8
    );
  }

  // ── Rendu pixel-art ─────────────────────────────────────
  render(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);

    // Flash de dégât : clignote en orange
    const flashing = this.hitFlash > 0 && Math.floor(this.hitFlash * 10) % 2 === 0;
    const bodyC    = flashing ? '#FF9900' : this.color;
    const darkC    = flashing ? '#CC4400' : this.dark;

    ctx.save();
    ctx.translate(x, y);
    if (this.dir < 0) ctx.scale(-1, 1); // flip pour P2

    // Ombre portée
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(-22, 4, 44, 8);

    // Chenilles
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-22, -4, 44, 12);
    // Maillons
    ctx.fillStyle = '#3a3a3a';
    for (let i = -18; i <= 12; i += 8) ctx.fillRect(i, -3, 7, 10);
    // Roues
    ctx.fillStyle = '#555';
    for (let i = -13; i <= 13; i += 13) ctx.fillRect(i - 4, -1, 8, 7);

    // Corps principal
    ctx.fillStyle = bodyC;
    ctx.fillRect(-18, -16, 36, 14);
    // Reflet haut
    ctx.fillStyle = 'rgba(255,255,255,0.13)';
    ctx.fillRect(-18, -16, 36, 4);
    // Ombre bas
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(-18, -6,  36, 4);
    // Ligne de blindage
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(-18, -11, 36, 2);
    // Rivets
    ctx.fillStyle = darkC;
    ctx.fillRect(-15, -14, 4, 4);
    ctx.fillRect(11,  -14, 4, 4);

    // Base tourelle
    ctx.fillStyle = bodyC;
    ctx.fillRect(-10, -24, 20, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(-10, -24, 20, 3);
    ctx.fillStyle = darkC;
    ctx.fillRect(-10, -16,  3, 2);
    ctx.fillRect(7,   -16,  3, 2);

    // Canon (rotation autour du pivot de tourelle)
    const rad = this.localAngle * Math.PI / 180;
    ctx.save();
    ctx.translate(0, -22);
    ctx.rotate(-rad);  // -rad car Y vers le bas en canvas
    ctx.fillStyle = darkC;
    ctx.fillRect(-2, -3, 33, 7);
    ctx.fillStyle = bodyC;
    ctx.fillRect(-2, -2, 31, 5);
    // Embout du canon
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(29, -3, 5, 7);
    // Reflet canon
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(-2, -3, 31, 2);
    ctx.restore();

    ctx.restore(); // fin du flip éventuel

    // Marqueurs de touches (au-dessus du tank)
    for (let i = 0; i < CONFIG.HITS_TO_WIN; i++) {
      const mx = x - (CONFIG.HITS_TO_WIN - 1) * 7 + i * 14;
      const my = y - 38;
      ctx.fillStyle = i < this.hits ? '#FF3333' : '#333';
      ctx.fillRect(mx - 5, my - 5, 11, 11);
      if (i < this.hits) {
        ctx.fillStyle = '#FFaaaa';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('X', mx, my + 4);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════
/**
 * Explosion — animation visuelle après un impact.
 */
class Explosion {
  constructor(x, y) {
    this.x        = x;
    this.y        = y;
    this.time     = 0;
    this.duration = 0.65;
    this.active   = true;

    // Particules de débris
    this.particles = [];
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.3;
      const spd   = 40 + Math.random() * 90;
      this.particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 50,
        life: 1.0,
        size: 2 + Math.random() * 3 | 0,
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
      p.vy  += 180 * dt; // gravité particules
      p.life -= decay * 1.1;
    }
  }

  render(ctx) {
    const t     = this.time / this.duration;
    const alpha = 1 - t;
    const r     = 8 + t * 28;

    // Boule de feu centrale
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
    g.addColorStop(0,   `rgba(255,255,220,${alpha})`);
    g.addColorStop(0.3, `rgba(255,160,0,${alpha * 0.85})`);
    g.addColorStop(0.7, `rgba(200,50,0,${alpha * 0.5})`);
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Particules
    for (const p of this.particles) {
      if (p.life <= 0) continue;
      const c = Math.floor(100 + p.life * 155);
      ctx.fillStyle = `rgba(255,${c},0,${p.life})`;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
  }
}
