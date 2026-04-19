/**
 * sc-ship.js — vaisseau partage. P1 le deplace, canon principal tire auto vers le haut.
 *
 * Gere aussi le bouclier orbital (grand asteroide ramene = orbite 6s, absorbe 3 tirs).
 */

class ScOrbitalShield {
  constructor(asteroid, durationBonus) {
    this.asteroid = asteroid;
    this.duration = SC.SHIELD.DURATION + (durationBonus || 0);
    this.time = 0;
    this.hitsLeft = SC.SHIELD.MAX_HITS;
    this.phase = Math.random() * Math.PI * 2;
    this.active = true;
  }
  update(dt, shipX, shipY) {
    this.time += dt;
    this.phase += SC.SHIELD.ORBIT_SPD * dt;
    if (this.time >= this.duration || this.hitsLeft <= 0) {
      this.active = false;
      this.asteroid.active = false;
      return;
    }
    this.asteroid.x = shipX + Math.cos(this.phase) * SC.SHIELD.ORBIT_R;
    this.asteroid.y = shipY + Math.sin(this.phase) * SC.SHIELD.ORBIT_R;
  }
  checkBlocks(enemyBullets) {
    // Le rocher lui-meme a un r ; si une balle ennemie touche, elle est bloquee
    const a = this.asteroid;
    for (const b of enemyBullets) {
      if (!b.active) continue;
      const dx = a.x - b.x, dy = a.y - b.y;
      if (dx * dx + dy * dy < (a.r + 4) ** 2) {
        b.active = false;
        this.hitsLeft--;
        if (this.hitsLeft <= 0) { this.active = false; a.active = false; return; }
      }
    }
  }
  render(ctx) {
    // Petit indicateur de charges restantes au-dessus de l'asteroide
    const a = this.asteroid;
    ctx.save();
    ctx.fillStyle = SC.COLOR.SHIELD_RING;
    for (let i = 0; i < this.hitsLeft; i++) {
      ctx.fillRect(a.x - 6 + i * 4, a.y - a.r - 8, 3, 3);
    }
    // Anneau subtil autour
    ctx.strokeStyle = SC.COLOR.SHIELD_RING;
    ctx.globalAlpha = 0.3 + 0.3 * Math.sin(this.time * 6);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

class ScShip {
  constructor() {
    this.x = SC.W / 2;
    this.y = SC.H - 80;
    this.lives = SC.SHIP.START_LIVES;
    this.maxLives = SC.SHIP.START_LIVES;
    this.invincible = 0;
    this.active = true;
    this.fireTimer = 0;
    this.cannonDamage = SC.SHIP.CANNON_DMG;
    this.orbitalShield = null;

    // Stats
    this.shotsFired = 0;
    this.shotsHit   = 0;
  }
  addLife() {
    if (this.lives < this.maxLives) this.lives++;
  }
  raiseMaxLives(by) {
    this.maxLives = Math.min(SC.SHIP.MAX_LIVES, this.maxLives + by);
    this.lives = Math.min(this.maxLives, this.lives + by);
  }
  upgradeCannon() { this.cannonDamage++; }

  update(dt, input, bulletPool, wellForce) {
    if (!this.active) return;

    // Pousse du puits gravitationnel si present (event)
    let px = 0, py = 0;
    if (wellForce) { px = wellForce.x; py = wellForce.y; }

    let vx = 0, vy = 0;
    if (input.up)    vy -= 1;
    if (input.down)  vy += 1;
    if (input.left)  vx -= 1;
    if (input.right) vx += 1;
    const mag = Math.hypot(vx, vy);
    if (mag > 0) { vx /= mag; vy /= mag; }
    this.x += (vx * SC.SHIP.SPEED + px) * dt;
    this.y += (vy * SC.SHIP.SPEED + py) * dt;

    // Clamp
    const m = SC.SHIP.BODY_R;
    if (this.x < m)                this.x = m;
    if (this.x > SC.W - m)         this.x = SC.W - m;
    if (this.y < SC.PLAY_TOP + m)  this.y = SC.PLAY_TOP + m;
    if (this.y > SC.PLAY_BOTTOM - m) this.y = SC.PLAY_BOTTOM - m;

    // Canon auto
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      bulletPool.firePlayerCannon(this.x, this.y - 18, this.cannonDamage);
      this.fireTimer = SC.SHIP.CANNON_RATE;
      this.shotsFired++;
    }

    if (this.invincible > 0) this.invincible = Math.max(0, this.invincible - dt);

    // Bouclier
    if (this.orbitalShield) {
      this.orbitalShield.update(dt, this.x, this.y);
      if (!this.orbitalShield.active) this.orbitalShield = null;
    }
  }

  hit() {
    if (this.invincible > 0) return false;
    this.lives--;
    this.invincible = SC.SHIP.INVINCIBLE;
    if (this.lives <= 0) { this.lives = 0; this.active = false; return true; }
    return false;
  }

  attachOrbitalShield(asteroid) {
    if (this.orbitalShield) this.orbitalShield.active = false;  // remplace
    this.orbitalShield = new ScOrbitalShield(asteroid);
  }

  render(ctx) {
    if (!this.active) return;
    // Clignotement invincibilite
    if (this.invincible > 0 && Math.floor(this.invincible * 14) % 2 === 0) {
      // render pale
      ctx.globalAlpha = 0.5;
    }
    const x = Math.round(this.x);
    const y = Math.round(this.y);

    // Corps central (emerald)
    ctx.fillStyle = SC.COLOR.HUD_PRIMARY;
    ctx.fillRect(x - 10, y - 6, 20, 16);
    ctx.fillRect(x - 14, y + 2, 28, 8);
    // Ailes pilote (orange P1)
    ctx.fillStyle = SC.COLOR.P1;
    ctx.fillRect(x - 16, y + 4, 4, 8);
    ctx.fillStyle = SC.COLOR.P2;
    ctx.fillRect(x + 12, y + 4, 4, 8);
    // Sommet (cockpit)
    ctx.fillStyle = SC.COLOR.HUD_GOLD;
    ctx.fillRect(x - 4, y - 12, 8, 7);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x - 2, y - 10, 4, 3);
    // Base du reacteur
    ctx.fillStyle = SC.COLOR.HUD_PRIMARY;
    ctx.fillRect(x - 6, y + 10, 12, 2);
    // Flammes
    const fl = 4 + Math.abs(Math.sin(performance.now() * 0.03)) * 5;
    ctx.fillStyle = SC.COLOR.HUD_GOLD;
    ctx.fillRect(x - 4, y + 12, 3, fl);
    ctx.fillRect(x + 1, y + 12, 3, fl);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x - 3, y + 12, 1, fl * 0.5);
    ctx.fillRect(x + 2, y + 12, 1, fl * 0.5);

    ctx.globalAlpha = 1;

    if (this.orbitalShield) this.orbitalShield.render(ctx);
  }
}
