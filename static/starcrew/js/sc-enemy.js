/**
 * sc-enemy.js — 4 types d'ennemis.
 *
 *   GRUNT   : basique, tue en 1 coup, tir simple.
 *   TANK    : 3 HP, face orientee vers le bas. Tire.
 *             - Canon P1 (tirs montant du bas) : arrive par derriere -> DEGATS
 *             - Laser P2 (angle quelconque) : si angle vs face_tank > 90 (backside) -> DEGATS
 *             Sinon : rebondit, 0 degat.
 *             Le grapin retourne le tank 180° (tiré hors formation = retourne son dos).
 *   SWARM   : 3 drones lies par cable. Tant que lies : -50% dgts reçus.
 *             Le grapin rompt un lien ; isoles -> tuables en 1 tir.
 *   SHIELD  : bouclier frontal (face superieure).
 *             - Tirs frappant la face superieure -> bloques (sauf LASER PERCANT rouge).
 *             - Tirs autres cotes -> normaux.
 */

let _scEnId = 1;

// Base class
class ScEnemy {
  constructor(type, x, y, waveBonus) {
    this.id = _scEnId++;
    this.type = type;
    this.x = x; this.y = y;
    this.spec = SC.ENEMY[type];
    this.hp   = this.spec.hp;
    this.size = this.spec.size;
    this.fireCd = this.spec.fire * (0.8 + Math.random() * 0.4);
    this.active = true;
    this.grappled = false;
    this.frozen = 0;            // s'il est gele/slow
    // Mouvement
    this.phase = Math.random() * Math.PI * 2;
    this.speed = 40 + Math.random() * 40 + waveBonus * 20;
    // Base direction de tir : vers le bas
    this.facing = Math.PI / 2;
    // Swarm
    this.swarmMate = null;      // id du suivant dans la chaine
    this.swarmNext = null;      // reference directe
    this.swarmPrev = null;
    this.linked = false;
    // Shield
    this.shieldFrontAngle = -Math.PI / 2; // face haut bloque tirs venant d'en bas
  }

  update(dt, waveMgr, bulletPool, playerX, playerY) {
    if (this.grappled) return;  // tire par le grapin
    // Pattern simple : descend puis slide
    this.phase += dt;
    const weave = Math.sin(this.phase * 1.2) * 80;
    this.x += Math.cos(this.phase) * 20 * dt;
    // Garder le swarm lateralement groupe si linked
    this.y += this.speed * 0.6 * dt;
    if (this.x < 30) this.x = 30;
    if (this.x > SC.W - 30) this.x = SC.W - 30;

    // Tir
    this.fireCd -= dt;
    if (this.fireCd <= 0 && this.y > SC.PLAY_TOP + 10 && this.y < SC.PLAY_BOTTOM - 40) {
      this.fireCd = this.spec.fire * (0.8 + Math.random() * 0.4);
      this._shoot(bulletPool, playerX, playerY);
    }

    // Sortie de l'ecran
    if (this.y > SC.PLAY_BOTTOM + 40) this.active = false;
  }

  _shoot(bulletPool, targetX, targetY) {
    const dx = targetX - this.x, dy = targetY - this.y;
    const d  = Math.max(0.1, Math.hypot(dx, dy));
    const spd = this.spec.bulletSpd;
    bulletPool.fireEnemy(this.x, this.y + this.size * 0.5,
                         (dx / d) * spd, (dy / d) * spd);
  }

  // Test si une balle inflige des degats reels (dépend du type)
  // Retourne { damage, blocked (bool), blockedAt {x,y} }
  receiveHit(bullet) {
    if (!this.active) return { damage: 0, blocked: false };
    const dmg = bullet.damage;
    // Angle de la balle par rapport a l'ennemi
    // Pour cannon : direction (0, -SHIP.CANNON_SPD), arrive en montant. Les cannons
    // viennent TOUJOURS du bas. Le tank regarde le bas -> un cannon vient par derriere.
    const bulletDirAngle = Math.atan2(bullet.vy, bullet.vx);
    // Direction "vers l'ennemi depuis la balle" = bulletDirAngle
    // Direction "face de l'ennemi" = this.facing

    if (this.type === 'TANK') {
      // Bullet direction doit venir du cote oppose a la face de l'ennemi
      // Le tank regarde vers this.facing. Si la balle vient DERRIERE : dot < 0
      const dot = Math.cos(bulletDirAngle - this.facing);
      // Si le laser perce, il fait toujours des degats
      if (bullet.pierce) {
        this.hp -= dmg;
        if (this.hp <= 0) this.active = false;
        return { damage: dmg, blocked: false };
      }
      if (dot < 0) {
        // Arriere : degats
        this.hp -= dmg;
        if (this.hp <= 0) this.active = false;
        return { damage: dmg, blocked: false };
      } else {
        // Avant : bloque
        return { damage: 0, blocked: true };
      }
    }

    if (this.type === 'SHIELD') {
      // Bouclier frontal (haut). Balle venant du bas et allant vers le haut (cannon) est BLOQUEE
      // sauf si pierce.
      if (bullet.pierce) {
        this.hp -= dmg;
        if (this.hp <= 0) this.active = false;
        return { damage: dmg, blocked: false };
      }
      // Si la balle monte (vy < 0) et touche la moitie haute : bloquee
      // Approximation : si le vecteur (bullet.x - this.x, bullet.y - this.y) est oriente vers le haut
      // (=signifie que la balle touche la face superieure)
      const hitDy = bullet.y - this.y;
      if (hitDy < 0) {
        return { damage: 0, blocked: true };
      }
      this.hp -= dmg;
      if (this.hp <= 0) this.active = false;
      return { damage: dmg, blocked: false };
    }

    if (this.type === 'SWARM') {
      // Lie = degats divises par 2 (minimum 0 si 1 dgt)
      if (this.linked) {
        // Reduit degats : 1 dgt -> 0.5 ecrase a 0 (immortel tant que lie)
        return { damage: 0, blocked: true };
      }
      this.hp -= dmg;
      if (this.hp <= 0) this.active = false;
      return { damage: dmg, blocked: false };
    }

    // Grunt
    this.hp -= dmg;
    if (this.hp <= 0) this.active = false;
    return { damage: dmg, blocked: false };
  }

  hitsPoint(px, py, r = 0) {
    const dx = this.x - px, dy = this.y - py;
    return dx * dx + dy * dy < (this.size + r) ** 2;
  }
  hitsRect(cx, cy, halfW, halfH) {
    const nx = Math.max(cx - halfW, Math.min(this.x, cx + halfW));
    const ny = Math.max(cy - halfH, Math.min(this.y, cy + halfH));
    const dx = this.x - nx, dy = this.y - ny;
    return dx * dx + dy * dy < (this.size * 0.85) ** 2;
  }

  // Appele quand le grapin attrape l'ennemi : il se retourne (face vers le haut)
  onGrappled() {
    if (this.type === 'TANK') this.facing = -Math.PI / 2; // dos desormais en bas -> cannon P1 fait degats
  }

  render(ctx) {
    const spec = this.spec;
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'GRUNT') {
      ctx.fillStyle = spec.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-3, -3, 2, 2);
      ctx.fillRect(1, -3, 2, 2);
    }
    else if (this.type === 'TANK') {
      // Rotation selon facing
      ctx.rotate(this.facing + Math.PI / 2); // si facing = PI/2 (bas), rot = PI -> affichage inversé "normal"
      ctx.fillStyle = '#662222';
      ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
      ctx.fillStyle = spec.color;
      ctx.fillRect(-this.size + 2, -this.size + 2, this.size * 2 - 4, this.size);  // plaque avant
      ctx.fillStyle = '#331111';
      ctx.fillRect(-this.size + 2, 0, this.size * 2 - 4, this.size - 2);   // arriere plus sombre
      ctx.fillStyle = '#FFAA00';
      ctx.fillRect(-3, -this.size + 2, 6, 3);  // œil frontal
    }
    else if (this.type === 'SWARM') {
      ctx.fillStyle = spec.color;
      // Coeur losange
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.lineTo(this.size, 0);
      ctx.lineTo(0, this.size);
      ctx.lineTo(-this.size, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-2, -1, 4, 2);
    }
    else if (this.type === 'SHIELD') {
      ctx.fillStyle = spec.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      // Bouclier sup
      ctx.fillStyle = '#FFFFEE';
      ctx.fillRect(-this.size / 1.2, -this.size - 3, this.size * 1.6, 3);
      ctx.fillStyle = '#CCAA44';
      ctx.fillRect(-this.size / 1.2, -this.size - 4, this.size * 1.6, 1);
      ctx.fillStyle = '#000';
      ctx.fillRect(-2, -2, 4, 2);
    }
    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════
// Câble visible pour swarm : rendu separe par le wave manager
function _scRenderSwarmLinks(ctx, enemies) {
  ctx.save();
  ctx.strokeStyle = '#CC77FF';
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.6;
  for (const e of enemies) {
    if (e.type === 'SWARM' && e.linked && e.swarmNext && e.swarmNext.active && e.swarmNext.linked) {
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(e.swarmNext.x, e.swarmNext.y);
      ctx.stroke();
    }
  }
  ctx.restore();
}
