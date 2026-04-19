/**
 * derby-horse.js — cheval + cavalier + mecanique rythmique.
 *
 * Mecanique :
 *  - alternance stricte L-R-L-R : si meme touche 2x -> pas d'elan
 *  - intervalle entre 2 taps determine le gain :
 *      < MASH_MAX         : mash, drain stamina, aucun gain
 *      [MASH_MAX, GOOD_MIN) : entre mash et bon : gain moyen
 *      [GOOD_MIN, GOOD_MAX] : zone optimale, plein gain + regen stamina
 *      (GOOD_MAX, WEAK_MAX] : tap lent, gain faible, regen lente
 *      > WEAK_MAX           : trop lent, gain minime
 *  - stamina 0 => cheval s'arrete STUN_TIME s
 *  - saut : touche dediee ; fenetre WINDOW avant contact avec une haie
 */

class DerbyHorse {
  constructor(index) {
    this.index = index; // 0 = P1, 1 = P2
    this.laneTop = index === 0 ? DRB.LANE1_TOP : DRB.LANE2_TOP;
    this.laneBot = index === 0 ? DRB.LANE1_BOT : DRB.LANE2_BOT;
    this.groundY = this.laneBot - DRB.HORSE.GROUND_OFFSET;

    // World-space : distance parcourue
    this.worldX   = 0;
    this.speed    = 0;     // px/s (gagne via taps, decays naturellement)
    this.stamina  = DRB.HORSE.STAM_MAX;
    this.alive    = true;

    // Rythme
    this.lastKey  = null;   // 'L' | 'R'
    this.lastTapT = -999;
    this.rhythmStatus = 'IDLE';      // IDLE | GOOD | WEAK | MASH | BAD_ALT
    this.rhythmFlash  = 0;           // s restantes de flash visuel

    // Saut
    this.jumpT    = 0;               // 0 si pas en saut, sinon temps ecoule dans le saut
    this.stagger  = 0;               // si > 0 => anime trebuche

    // Stats
    this.jumpsOk  = 0;
    this.jumpsMiss = 0;

    // Stun (stamina 0)
    this.stunT = 0;

    // Anim gallop
    this.gallopPhase = 0;

    // Elimination
    this.eliminated = false;

    // Dust
    this.dustTimer = 0;
  }

  // Saut : actif tant que jumpT > 0
  isJumping() { return this.jumpT > 0; }
  isStunned() { return this.stunT > 0; }

  // Appele par derby-game lors de la consommation des taps
  onGallopTap(dir, now) {
    if (!this.alive || this.eliminated) return;
    if (this.stunT > 0) return;

    if (this.lastKey === dir) {
      // Meme touche 2x = pas d'elan
      this.rhythmStatus = 'BAD_ALT';
      this.rhythmFlash = 0.25;
      return;
    }

    const interval = now - this.lastTapT;
    this.lastKey  = dir;
    this.lastTapT = now;

    let gain = 0;
    if (interval < DRB.RHYTHM.MASH_MAX) {
      // Mash
      this.rhythmStatus = 'MASH';
      this.rhythmFlash  = 0.25;
      this.stamina = Math.max(0, this.stamina - DRB.HORSE.STAM_DRAIN_MASH * 0.25);
      gain = DRB.HORSE.IMPULSE_MASH;
    } else if (interval < DRB.RHYTHM.GOOD_MIN) {
      // Proche du mash : demi-gain
      this.rhythmStatus = 'WEAK';
      this.rhythmFlash  = 0.2;
      gain = DRB.HORSE.IMPULSE_WEAK * 1.5;
    } else if (interval <= DRB.RHYTHM.GOOD_MAX) {
      // Sweet spot
      this.rhythmStatus = 'GOOD';
      this.rhythmFlash  = 0.3;
      gain = DRB.HORSE.IMPULSE_GOOD;
      // Regen ponctuelle
      this.stamina = Math.min(DRB.HORSE.STAM_MAX, this.stamina + 4);
    } else if (interval <= DRB.RHYTHM.WEAK_MAX) {
      this.rhythmStatus = 'WEAK';
      this.rhythmFlash  = 0.2;
      gain = DRB.HORSE.IMPULSE_WEAK;
    } else {
      this.rhythmStatus = 'WEAK';
      this.rhythmFlash  = 0.15;
      gain = DRB.HORSE.IMPULSE_WEAK * 0.5;
    }

    this.speed = Math.min(DRB.HORSE.SPEED_MAX, this.speed + gain);
  }

  // Saut : renvoie true si fenetre de contact OK avec une hurdle
  onJumpTap(obstacleList) {
    if (!this.alive || this.eliminated) return;
    if (this.stunT > 0 || this.isJumping()) return;
    this.jumpT = 0.001;
    this.stamina = Math.max(0, this.stamina - DRB.HORSE.STAM_COST_JUMP);
    // Pas de validation ici : la validation a lieu au moment ou la hurdle
    // arrive a hauteur du cheval (derby-game gere la collision en tenant
    // compte de jumpT > 0)
  }

  update(dt, now) {
    if (!this.alive || this.eliminated) return;

    // Decay naturel de la vitesse
    this.speed = Math.max(DRB.HORSE.SPEED_MIN, this.speed - DRB.HORSE.DECAY * dt);

    // Stamina : en idle (pas de tap recent), regen lente ; sinon deja geree par tap
    if (now - this.lastTapT > 0.8) {
      this.stamina = Math.min(DRB.HORSE.STAM_MAX, this.stamina + DRB.HORSE.STAM_REGEN_SLOW * dt);
    } else {
      this.stamina = Math.min(DRB.HORSE.STAM_MAX, this.stamina + DRB.HORSE.STAM_REGEN * dt);
    }

    // Saut animation
    if (this.jumpT > 0) {
      this.jumpT += dt;
      if (this.jumpT >= DRB.JUMP.DURATION) this.jumpT = 0;
    }

    // Stagger (trebuche)
    if (this.stagger > 0) {
      this.stagger = Math.max(0, this.stagger - dt);
    }

    // Stun stamina 0
    if (this.stamina <= 0 && this.stunT <= 0) {
      this.stunT = DRB.HORSE.STUN_TIME;
      this.speed = 0;
    }
    if (this.stunT > 0) {
      this.stunT = Math.max(0, this.stunT - dt);
      this.speed = 0;
      if (this.stunT === 0) {
        // Recupere stamina partielle
        this.stamina = DRB.HORSE.STAM_MAX * 0.6;
      }
    }

    // Flash rythmique
    if (this.rhythmFlash > 0) this.rhythmFlash = Math.max(0, this.rhythmFlash - dt);

    // Avance en world (par rapport a la tempete)
    this.worldX += this.speed * dt;

    // Gallop anim
    this.gallopPhase += (this.speed / 80 + 2) * dt;

    // Dust quand galop actif
    this.dustTimer -= dt;
    if (this.speed > 80 && !this.isJumping() && this.stunT <= 0 && this.dustTimer <= 0) {
      this.dustTimer = 0.14;
      this._dustTick = true;
    } else {
      this._dustTick = false;
    }
  }

  // Saut rate : appele par derby-game
  onJumpMiss() {
    this.speed = Math.max(DRB.HORSE.SPEED_MIN, this.speed - DRB.HORSE.MISS_PENALTY);
    this.stagger = DRB.HORSE.MISS_STAGGER;
    this.jumpsMiss++;
  }
  onJumpSuccess() {
    this.jumpsOk++;
  }

  // Screen X du cheval (base sur l'ecart avec la tempete)
  screenX(stormWorldX) {
    // gap entre cheval et tempete
    const gap = this.worldX - stormWorldX;
    // 0 gap => cheval a 160px (proche du bord gauche)
    // grand gap => cheval a DRB.HORSE.SCREEN_X (520)
    const minX = 140;
    const maxX = DRB.HORSE.SCREEN_X;
    const scale = 0.45; // 1px gap = 0.45px screen
    return Math.max(minX, Math.min(maxX, minX + gap * scale));
  }

  // Position Y actuelle (avec saut)
  renderY() {
    let y = this.groundY;
    if (this.jumpT > 0) {
      const t = this.jumpT / DRB.JUMP.DURATION;
      const arc = Math.sin(t * Math.PI);
      y -= arc * DRB.JUMP.HEIGHT;
    }
    return y;
  }

  render(ctx, screenX) {
    const y = this.renderY();
    const pal = this.index === 0
      ? { body: DRB.COLOR.P1_BODY, mane: DRB.COLOR.P1_MANE, saddle: DRB.COLOR.P1_SADDLE, rider: DRB.COLOR.P1_RIDER }
      : { body: DRB.COLOR.P2_BODY, mane: DRB.COLOR.P2_MANE, saddle: DRB.COLOR.P2_SADDLE, rider: DRB.COLOR.P2_RIDER };

    ctx.save();
    ctx.translate(screenX, y);

    if (this.stagger > 0) {
      ctx.rotate(Math.sin(this.stagger * 25) * 0.12);
    }

    const phase = Math.floor(this.gallopPhase) % 4;

    // Corps cheval (vu de profil, regardant la droite)
    // Base
    ctx.fillStyle = pal.body;
    ctx.fillRect(-22, -18, 38, 14);       // tronc
    ctx.fillRect(13, -24, 10, 8);         // cou
    ctx.fillRect(19, -26, 10, 8);         // tete
    ctx.fillRect(27, -24, 2, 4);          // museau

    // Criniere
    ctx.fillStyle = pal.mane;
    ctx.fillRect(13, -26, 8, 4);
    ctx.fillRect(-22, -22, 6, 8);         // queue

    // Yeux
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(24, -23, 2, 2);
    ctx.fillStyle = '#000';
    ctx.fillRect(25, -22, 1, 1);

    // Selle
    ctx.fillStyle = pal.saddle;
    ctx.fillRect(-8, -20, 16, 5);
    // Etrier
    ctx.fillStyle = '#221';
    ctx.fillRect(-4, -15, 2, 4);
    ctx.fillRect(6,  -15, 2, 4);

    // Cavalier (simple)
    ctx.fillStyle = pal.rider;
    ctx.fillRect(-4, -30, 8, 10);         // torse
    ctx.fillRect(-3, -36, 6, 6);          // tete
    ctx.fillStyle = pal.saddle;
    ctx.fillRect(-3, -40, 6, 4);          // casque
    ctx.fillStyle = '#000';
    ctx.fillRect(-1, -34, 2, 1);          // œil du cavalier

    // Pattes : animation galloping, 4 phases
    ctx.fillStyle = pal.body;
    const p = phase;
    // Patte avant gauche
    if (p === 0) ctx.fillRect(8, -4, 3, 8);
    else         ctx.fillRect(10, -4, 3, 6);
    // Patte avant droite
    if (p === 1) ctx.fillRect(12, -4, 3, 8);
    else         ctx.fillRect(8, -4, 3, 6);
    // Patte arriere gauche
    if (p === 2) ctx.fillRect(-18, -4, 3, 8);
    else         ctx.fillRect(-16, -4, 3, 6);
    // Patte arriere droite
    if (p === 3) ctx.fillRect(-14, -4, 3, 8);
    else         ctx.fillRect(-18, -4, 3, 6);

    // Effet saut : patte avant tendue
    if (this.jumpT > 0) {
      ctx.fillRect(12, -8, 3, 10);
      ctx.fillRect(8,  -6, 3, 10);
    }

    // Flash rythmique au-dessus
    if (this.rhythmFlash > 0) {
      const a = this.rhythmFlash / 0.3;
      let color = DRB.COLOR.RHYTHM_GOOD;
      if (this.rhythmStatus === 'MASH' || this.rhythmStatus === 'BAD_ALT') color = DRB.COLOR.RHYTHM_MASH;
      else if (this.rhythmStatus === 'WEAK') color = DRB.COLOR.RHYTHM_WEAK;
      ctx.globalAlpha = a;
      ctx.fillStyle = color;
      ctx.fillRect(-4, -48, 8, 3);
      ctx.globalAlpha = 1;
    }

    // Anneau stun
    if (this.stunT > 0) {
      ctx.strokeStyle = DRB.COLOR.DANGER;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(this.stunT * 18);
      ctx.beginPath();
      ctx.arc(0, -8, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      // 3 etoiles Znz
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillText('z z z', -12, -42);
    }

    ctx.restore();
  }
}
