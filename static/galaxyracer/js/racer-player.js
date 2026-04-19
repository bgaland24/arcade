/**
 * racer-player.js — vaisseau joueur.
 *
 * Deplacement lateral uniquement (y fixe). Boost = lift vertical (remontee
 * visuelle de SHIP_Y a SHIP_Y - BOOST_LIFT) qui aide a esquiver les gros
 * obstacles, limite par une jauge qui se recharge.
 */

class RacerShip {
  constructor(index) {
    this.index        = index;                       // 0 = P1, 1 = P2
    this.color        = index === 0 ? RACER.COLOR.P1      : RACER.COLOR.P2;
    this.colorDark    = index === 0 ? RACER.COLOR.P1_DARK : RACER.COLOR.P2_DARK;
    this.colorGlow    = index === 0 ? RACER.COLOR.P1_GLOW : RACER.COLOR.P2_GLOW;
    // P1 a gauche, P2 a droite au demarrage
    this.x            = index === 0 ? RACER.W * 0.32 : RACER.W * 0.68;
    this.targetY      = RACER.SHIP_Y;
    this.y            = RACER.SHIP_Y;
    this.lives        = RACER.START_LIVES;
    this.active       = true;
    this.invincible   = 0;                           // secondes restantes
    this.boostEnergy  = RACER.BOOST_MAX;             // secondes disponibles
    this.boostActive  = false;
    this.thrustPhase  = Math.random() * Math.PI * 2;
  }

  update(dt, input) {
    if (!this.active) return;

    // Deplacement horizontal
    let vx = 0;
    if (input.left)  vx -= 1;
    if (input.right) vx += 1;
    this.x += vx * RACER.MOVE_SPEED * dt;
    const margin = RACER.SHIP_HALF_W + 4;
    if (this.x < margin)          this.x = margin;
    if (this.x > RACER.W - margin) this.x = RACER.W - margin;

    // Boost
    this.boostActive = input.boost && this.boostEnergy > 0.02;
    if (this.boostActive) {
      this.boostEnergy = Math.max(0, this.boostEnergy - dt);
      this.targetY     = RACER.SHIP_Y - RACER.BOOST_LIFT;
    } else {
      this.boostEnergy = Math.min(RACER.BOOST_MAX, this.boostEnergy + RACER.BOOST_REGEN * dt);
      this.targetY     = RACER.SHIP_Y;
    }
    // Easing vertical
    this.y += (this.targetY - this.y) * Math.min(1, dt * 7);

    // Invincibilite
    if (this.invincible > 0) this.invincible = Math.max(0, this.invincible - dt);

    // Flame oscillation
    this.thrustPhase += dt * (this.boostActive ? 26 : 14);
  }

  hit() {
    if (!this.active || this.invincible > 0) return false;
    this.lives--;
    this.invincible = RACER.INVINCIBLE_DUR;
    if (this.lives <= 0) {
      this.lives = 0;
      this.active = false;
      return true; // mort definitive
    }
    return false;
  }

  render(ctx) {
    if (!this.active && this.invincible === 0 && this.lives === 0) return;
    // Clignotement invincibilite : 1 frame sur 2 (environ) eteinte
    if (this.invincible > 0 && Math.floor(this.invincible * 14) % 2 === 0) return;

    const x = Math.round(this.x);
    const y = Math.round(this.y);

    // Reacteur (flamme derriere)
    const flameSize = 6 + Math.abs(Math.sin(this.thrustPhase)) * (this.boostActive ? 9 : 4);
    ctx.fillStyle = this.boostActive ? RACER.COLOR.BOOST : this.colorGlow;
    ctx.fillRect(x - 6, y + 14, 4, flameSize);
    ctx.fillRect(x + 2, y + 14, 4, flameSize);
    ctx.fillStyle = '#FFDD66';
    ctx.fillRect(x - 5, y + 14, 2, flameSize * 0.6);
    ctx.fillRect(x + 3, y + 14, 2, flameSize * 0.6);

    // Corps principal (losange pixel)
    ctx.fillStyle = this.color;
    ctx.fillRect(x - 8,  y - 4, 16, 18);    // fuselage
    ctx.fillRect(x - 12, y + 2, 24, 10);    // ailes
    ctx.fillRect(x - 2,  y - 14, 4, 10);    // nez

    // Ombre / volumes
    ctx.fillStyle = this.colorDark;
    ctx.fillRect(x - 12, y + 10, 24, 2);    // base ailes
    ctx.fillRect(x - 8,  y + 12, 16, 2);    // base fuselage
    ctx.fillRect(x - 2,  y - 14, 1, 10);    // cote nez sombre

    // Cockpit
    ctx.fillStyle = this.colorGlow;
    ctx.fillRect(x - 2, y - 2, 4, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 1, y - 2, 2, 2);

    // Bouclier visuel quand invincible (apres le clignotement)
    if (this.invincible > 0.0) {
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.25 * Math.sin(this.invincible * 18);
      ctx.strokeStyle = this.colorGlow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y + 2, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
