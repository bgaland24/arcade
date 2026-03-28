/**
 * gx-player.js — vaisseau joueur (tir automatique, power-ups, bombe).
 *
 * playerIndex : 0 = P1 (orange, gauche), 1 = P2 (bleu, droite)
 */
class PlayerShip {
  constructor(playerIndex, bulletPool) {
    this.playerIndex = playerIndex;
    this.pool        = bulletPool;
    this.color       = playerIndex === 0 ? GX.COLOR.P1      : GX.COLOR.P2;
    this.dark        = playerIndex === 0 ? GX.COLOR.P1_DARK : GX.COLOR.P2_DARK;

    // Position de départ
    this.x = playerIndex === 0 ? GX.W * 0.3 : GX.W * 0.7;
    this.y = GX.PLAY_BOTTOM - 20;

    this.vx = 0; this.vy = 0;

    // Tir
    this.fireCooldown = GX.PLAYER_FIRE_RATE * (playerIndex * 0.5); // décalage initial
    this.shotsFired   = 0;
    this.shotsHit     = 0;

    // Vie / invincibilité
    this.invincible  = false;
    this.invTimer    = 0;

    // Power-ups actifs  { type → secondes restantes }
    this.powerups = {};

    // Bombe
    this.bombCooldown = 0;
    this.BOMB_COOLDOWN = 8;

    // Stats
    this.active = true;
  }

  // ── Mise à jour ─────────────────────────────────────────
  update(dt, input) {
    if (!this.active) return;

    // Déplacement
    const speed = GX.PLAYER_SPEED;
    this.x += (input.right - input.left) * speed * dt;
    this.y += (input.down  - input.up)   * speed * dt;

    // Clamp dans toute la zone de jeu
    const margin = 14;
    this.x = Math.max(margin, Math.min(GX.W - margin, this.x));
    this.y = Math.max(GX.PLAY_TOP + margin, Math.min(GX.PLAY_BOTTOM - margin, this.y));

    // Invincibilité
    if (this.invincible) {
      this.invTimer -= dt;
      if (this.invTimer <= 0) { this.invincible = false; this.invTimer = 0; }
    }

    // Power-ups : décrémenter durées
    for (const type of Object.keys(this.powerups)) {
      if (GX.POWERUP_DURATION[type] > 0) {
        this.powerups[type] -= dt;
        if (this.powerups[type] <= 0) delete this.powerups[type];
      }
    }

    // Tir automatique
    this.fireCooldown -= dt;
    if (this.fireCooldown <= 0) {
      this._fire();
      const rapid = this.hasPowerup('RAPID');
      this.fireCooldown = rapid ? GX.PLAYER_FIRE_RATE * 0.45 : GX.PLAYER_FIRE_RATE;
    }

    // Bombe
    if (this.bombCooldown > 0) this.bombCooldown -= dt;
  }

  _fire() {
    const hasDouble = this.hasPowerup('DOUBLE');
    const hasTriple = this.hasPowerup('TRIPLE');

    if (hasTriple) {
      this.pool.acquirePlayer(this.x - 8, this.y - 14);
      this.pool.acquirePlayer(this.x,     this.y - 14);
      this.pool.acquirePlayer(this.x + 8, this.y - 14);
      this.shotsFired += 3;
    } else if (hasDouble) {
      this.pool.acquirePlayer(this.x - 5, this.y - 14);
      this.pool.acquirePlayer(this.x + 5, this.y - 14);
      this.shotsFired += 2;
    } else {
      this.pool.acquirePlayer(this.x, this.y - 14);
      this.shotsFired++;
    }
  }

  // ── Power-ups ────────────────────────────────────────────
  applyPowerup(type) {
    if (type === 'LIFE') return; // géré dans game.js
    if (type === 'BOMB') return; // géré dans game.js
    const dur = GX.POWERUP_DURATION[type];
    if (dur > 0) this.powerups[type] = dur;
  }

  hasPowerup(type) { return !!this.powerups[type]; }

  activateShield() { this.powerups['SHIELD'] = GX.POWERUP_DURATION.SHIELD; }

  // ── Bombe ────────────────────────────────────────────────
  canBomb() { return this.bombCooldown <= 0; }

  useBomb() {
    if (!this.canBomb()) return false;
    this.bombCooldown = this.BOMB_COOLDOWN;
    return true;
  }

  // ── Touche ───────────────────────────────────────────────
  hit() {
    if (this.invincible) return false;
    if (this.hasPowerup('SHIELD')) {
      delete this.powerups['SHIELD'];
      this.invincible = true;
      this.invTimer   = 1.2;
      return false; // bouclier absorbe
    }
    this.invincible = true;
    this.invTimer   = GX.INVINCIBLE_DURATION;
    return true; // vie perdue
  }

  // ── Helpers input ────────────────────────────────────────
  get _input() {
    const raw = this.playerIndex === 0 ? GX_INPUT.p1 : GX_INPUT.p2;
    return {
      left:  raw.left  ? 1 : 0,
      right: raw.right ? 1 : 0,
      up:    raw.up    ? 1 : 0,
      down:  raw.down  ? 1 : 0,
    };
  }

  // ── Rendu pixel-art ─────────────────────────────────────
  render(ctx) {
    if (!this.active) return;

    // Clignotement pendant invincibilité
    if (this.invincible && Math.floor(this.invTimer * 8) % 2 === 0) return;

    const x = this.x | 0, y = this.y | 0;
    const c = this.color, d = this.dark;

    // Bouclier visuel
    if (this.hasPowerup('SHIELD')) {
      const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.005);
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,238,255,${pulse})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Réacteurs (derrière le vaisseau)
    ctx.fillStyle = `rgba(255,140,0,${0.6 + 0.4 * Math.sin(Date.now() * 0.02)})`;
    ctx.fillRect(x - 6, y + 8,  4, 6 + (Math.random() * 3 | 0));
    ctx.fillRect(x + 2, y + 8,  4, 6 + (Math.random() * 3 | 0));

    // Corps vaisseau (forme pixel-art)
    // Aile gauche
    ctx.fillStyle = d;
    ctx.fillRect(x - 16, y + 2,  6, 8);
    // Aile droite
    ctx.fillRect(x + 10, y + 2,  6, 8);

    // Corps central
    ctx.fillStyle = c;
    ctx.fillRect(x - 10, y - 2,  20, 14);
    ctx.fillRect(x - 6,  y - 10, 12, 10);
    ctx.fillRect(x - 2,  y - 16, 4,  8);

    // Cabine (bulle)
    ctx.fillStyle = 'rgba(200,240,255,0.7)';
    ctx.fillRect(x - 4, y - 8, 8, 6);

    // Reflet
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x - 10, y - 2, 20, 3);

    // Canon
    ctx.fillStyle = d;
    ctx.fillRect(x - 2, y - 18, 4, 5);

    // Label P1/P2 minuscule
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`P${this.playerIndex + 1}`, x, y + 20);
  }
}
