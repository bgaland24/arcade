/**
 * sc-grapple.js — grapin lance par l'artilleur.
 *
 * Etats :
 *   IDLE       — range contre le vaisseau
 *   EXTEND     — la tete sort, oriente selon turret.angle au lancement
 *   HOLD       — tete accrochee a une cible (asteroide ou ennemi)
 *   RETRACT    — retour au vaisseau avec sa prise
 *
 * Interactions :
 *   - petit asteroide  : ramene au vaisseau -> effet selon type
 *       - FER       : +1 metal
 *       - OR        : +5 metal
 *       - GLACE     : refroidit chaleur a 0
 *       - VOLATILE  : +2 metal + explosion 80px a l'arrivee
 *   - grand asteroide  : devient bouclier orbital 6s (sc-ship gere l'orbite)
 *   - ennemi           : tiré hors formation ; si percute un autre ennemi = double kill
 */

const SC_GRAPPLE_STATE = { IDLE: 0, EXTEND: 1, HOLD: 2, RETRACT: 3 };

class ScGrapple {
  constructor() {
    this.state  = SC_GRAPPLE_STATE.IDLE;
    this.x = 0; this.y = 0;             // position de la tete
    this.angle = 0;                     // angle fixe au tir
    this.origin = { x: 0, y: 0 };       // point d'attache au vaisseau
    this.distance = 0;                  // distance parcourue (extend) ou restante (retract)
    this.range = SC.GRAPPLE.RANGE;      // peut etre augmente par shop
    this.cooldown = 0;
    this.prey = null;                   // asteroide tenu (petit) ou ennemi tire
    this.preyKind = null;               // 'ast' | 'enemy'
  }
  setRange(r) { this.range = r; }
  canLaunch() { return this.state === SC_GRAPPLE_STATE.IDLE && this.cooldown <= 0; }

  launch(shipX, shipY, angle) {
    this.state    = SC_GRAPPLE_STATE.EXTEND;
    this.angle    = angle;
    this.origin.x = shipX; this.origin.y = shipY;
    this.x = shipX; this.y = shipY;
    this.distance = 0;
    this.prey = null;
    this.preyKind = null;
  }

  update(dt, shipX, shipY, asteroidMgr, waveMgr, onCapture) {
    // Origin suit le vaisseau (pour retract)
    this.origin.x = shipX;
    this.origin.y = shipY;
    if (this.cooldown > 0) this.cooldown = Math.max(0, this.cooldown - dt);

    const spd = SC.GRAPPLE.SPEED * dt;

    if (this.state === SC_GRAPPLE_STATE.EXTEND) {
      this.x += Math.cos(this.angle) * spd;
      this.y += Math.sin(this.angle) * spd;
      this.distance += spd;

      // Cherche une prise
      // 1) petit asteroide (priorite)
      const small = asteroidMgr.findNearestForGrapple(this.x, this.y, SC.GRAPPLE.HEAD_R, a => a.isSmall());
      if (small) {
        small.grappled = true;
        this.prey = small; this.preyKind = 'ast';
        this.state = SC_GRAPPLE_STATE.RETRACT;
        return;
      }
      // 2) grand asteroide
      const big = asteroidMgr.findNearestForGrapple(this.x, this.y, SC.GRAPPLE.HEAD_R, a => !a.isSmall());
      if (big) {
        big.grappled = true;
        this.prey = big; this.preyKind = 'astBig';
        this.state = SC_GRAPPLE_STATE.RETRACT;
        return;
      }
      // 3) ennemi (standard uniquement : pas boss ni shield-frontal)
      if (waveMgr) {
        const enemy = waveMgr.findNearestGrappable(this.x, this.y, SC.GRAPPLE.HEAD_R);
        if (enemy) {
          enemy.grappled = true;
          this.prey = enemy; this.preyKind = 'enemy';
          this.state = SC_GRAPPLE_STATE.RETRACT;
          return;
        }
      }

      // Portee atteinte : retourne
      if (this.distance >= this.range ||
          this.x < -10 || this.x > SC.W + 10 ||
          this.y < SC.PLAY_TOP - 10 || this.y > SC.PLAY_BOTTOM + 10) {
        this.state = SC_GRAPPLE_STATE.RETRACT;
      }
    }
    else if (this.state === SC_GRAPPLE_STATE.RETRACT) {
      // Aller vers le vaisseau
      const dx = this.origin.x - this.x;
      const dy = this.origin.y - this.y;
      const d  = Math.hypot(dx, dy);

      if (this.prey && this.preyKind === 'ast') {
        // Deplace la prise a la tete
        this.prey.x = this.x;
        this.prey.y = this.y;
      } else if (this.prey && this.preyKind === 'astBig') {
        this.prey.x = this.x;
        this.prey.y = this.y;
      } else if (this.prey && this.preyKind === 'enemy') {
        // Tire l'ennemi vers le vaisseau
        this.prey.x = this.x;
        this.prey.y = this.y;
        // Check collision vs autres ennemis pendant le trajet
        if (waveMgr) {
          const other = waveMgr.findOtherAtPoint(this.prey, this.x, this.y, (this.prey.size || 14) * 1.2);
          if (other) {
            // Double kill sur collision — gere par game via onCapture avec flag
            onCapture && onCapture({ kind: 'enemySlam', prey: this.prey, target: other, x: this.x, y: this.y });
            this.prey.active = false;
            other.active = false;
            this.prey = null; this.preyKind = null;
            this.state = SC_GRAPPLE_STATE.RETRACT;  // rest reel
            this.cooldown = SC.GRAPPLE.COOLDOWN;
          }
        }
      }

      if (d <= spd) {
        // Arrive au vaisseau : applique l'effet
        if (this.prey) {
          onCapture && onCapture({ kind: 'arrived', prey: this.prey, preyKind: this.preyKind, x: shipX, y: shipY });
        }
        this.state = SC_GRAPPLE_STATE.IDLE;
        this.x = shipX; this.y = shipY;
        this.distance = 0;
        this.prey = null; this.preyKind = null;
        this.cooldown = SC.GRAPPLE.COOLDOWN;
      } else {
        this.x += (dx / d) * spd;
        this.y += (dy / d) * spd;
      }
    }
  }

  // Cancel anything en cours (overheat force retract vide)
  forceRetract() {
    if (this.prey) {
      if (this.preyKind === 'ast' || this.preyKind === 'astBig') this.prey.grappled = false;
      if (this.preyKind === 'enemy') this.prey.grappled = false;
      this.prey = null; this.preyKind = null;
    }
    if (this.state === SC_GRAPPLE_STATE.EXTEND) this.state = SC_GRAPPLE_STATE.RETRACT;
  }

  render(ctx, shipX, shipY, p2Color) {
    if (this.state === SC_GRAPPLE_STATE.IDLE) return;
    // Ligne depuis le vaisseau vers la tete
    ctx.save();
    ctx.strokeStyle = p2Color;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(shipX, shipY);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
    // Tete
    ctx.globalAlpha = 1;
    ctx.fillStyle = p2Color;
    ctx.fillRect(this.x - 4, this.y - 4, 8, 8);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
    ctx.restore();
  }
}
