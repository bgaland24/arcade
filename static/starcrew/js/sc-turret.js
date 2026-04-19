/**
 * sc-turret.js — tourelle P2 : rotation 360°, 2 lasers paralleles, chaleur.
 *
 * Chaleur :
 *  - 0..HEAT_YELLOW  : cyan, rayons normaux
 *  - HEAT_YELLOW..HEAT_RED : jaune
 *  - HEAT_RED..HEAT_MAX    : rouge, rayons PERÇANTS (traversent ennemis + boucliers frontaux)
 *  - >=HEAT_MAX            : overheat, tourelle + grapin bloques OVERHEAT_LOCK s
 */

class ScTurret {
  constructor() {
    this.angle = -Math.PI / 2;       // pointant vers le haut au depart
    this.heat  = 0;
    this.locked = 0;                 // secondes de blocage restant (overheat)
    this.fireTimer = 0;              // petit throttling pour espacer les tirs laser
    this.fireInterval = 0.11;        // secondes entre 2 volees de 2 lasers
    // Stats
    this.shotsFired = 0;
    this.shotsHit   = 0;
  }

  setHeatCapacityMult(mult) {
    this.heatCapacity = SC.TURRET.HEAT_MAX * mult;
  }
  heatMax() {
    return this.heatCapacity || SC.TURRET.HEAT_MAX;
  }

  isLocked() { return this.locked > 0; }
  isPiercing() { return this.heat >= SC.TURRET.HEAT_RED && this.locked <= 0; }

  heatLevel() {
    if (this.locked > 0) return 'LOCKED';
    if (this.heat >= SC.TURRET.HEAT_RED)    return 'RED';
    if (this.heat >= SC.TURRET.HEAT_YELLOW) return 'YELLOW';
    return 'COOL';
  }

  // Rotation par input P2 (rotL / rotR)
  update(dt, input, shipX, shipY, bulletPool, grapple, onHeatCool) {
    // Unlock countdown
    if (this.locked > 0) {
      this.locked = Math.max(0, this.locked - dt);
      // Pendant le lock : refroidissement accelere
      this.heat = Math.max(0, this.heat - SC.TURRET.COOL_PER_SEC * 2.5 * dt);
      if (this.locked === 0 && onHeatCool) onHeatCool();
    }

    // Rotation (360° libre)
    if (input.rotL) this.angle -= SC.TURRET.ROT_SPEED * dt;
    if (input.rotR) this.angle += SC.TURRET.ROT_SPEED * dt;

    // Tir (zenith du bonheur et de la chauffe)
    this.fireTimer -= dt;
    if (input.fire && !this.isLocked() && this.fireTimer <= 0) {
      this._fireLaserPair(shipX, shipY, bulletPool);
      this.fireTimer = this.fireInterval;
      this.heat = Math.min(this.heatMax(), this.heat + SC.TURRET.HEAT_PER_SEC * this.fireInterval);
      // Check overheat
      if (this.heat >= this.heatMax()) {
        this.locked = SC.TURRET.OVERHEAT_LOCK;
        this.heat   = this.heatMax();
        // Force grapin a rentrer vide
        if (grapple) grapple.forceRetract();
      }
    } else if (!input.fire) {
      this.heat = Math.max(0, this.heat - SC.TURRET.COOL_PER_SEC * dt);
    }
  }

  _fireLaserPair(shipX, shipY, bulletPool) {
    const a = this.angle;
    const perpX = -Math.sin(a);
    const perpY =  Math.cos(a);
    const off   = SC.TURRET.LASER_OFFSET;
    // On tire depuis le canon de la tourelle, a ~18px du centre
    const muzzleX = shipX + Math.cos(a) * 20;
    const muzzleY = shipY + Math.sin(a) * 20;

    const pierce = this.isPiercing();
    bulletPool.firePlayerLaser(muzzleX + perpX * off, muzzleY + perpY * off, a, pierce);
    bulletPool.firePlayerLaser(muzzleX - perpX * off, muzzleY - perpY * off, a, pierce);
    this.shotsFired += 2;
  }

  // Refroidissement force (pickup glace par exemple)
  coolDown(amount) {
    this.heat = Math.max(0, this.heat - amount);
  }
  coolDownFull() { this.heat = 0; }

  render(ctx, shipX, shipY) {
    // Couleur selon niveau
    let baseColor;
    switch (this.heatLevel()) {
      case 'RED':    baseColor = SC.COLOR.LASER_HOT;  break;
      case 'YELLOW': baseColor = SC.COLOR.LASER_WARM; break;
      case 'LOCKED': baseColor = '#555555'; break;
      default:       baseColor = SC.COLOR.LASER_COOL;
    }
    // Base
    ctx.save();
    ctx.translate(shipX, shipY);
    ctx.rotate(this.angle);
    // Corps cylindrique
    ctx.fillStyle = '#333333';
    ctx.fillRect(-5, -10, 22, 20);
    ctx.fillStyle = baseColor;
    ctx.fillRect(12, -3, 10, 6);
    ctx.fillStyle = this.isLocked() ? '#222' : baseColor;
    ctx.fillRect(16, -6, 4, 12);
    // 2 sorties de laser
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(20, -SC.TURRET.LASER_OFFSET - 0.5, 3, 1);
    ctx.fillRect(20,  SC.TURRET.LASER_OFFSET - 0.5, 3, 1);
    // Fumee si locked
    if (this.isLocked()) {
      ctx.fillStyle = 'rgba(200,200,200,0.5)';
      for (let i = 0; i < 3; i++)
        ctx.fillRect(10 + i * 3, -6 + Math.random() * 12, 2, 2);
    }
    ctx.restore();
  }

  renderAimIndicator(ctx, shipX, shipY) {
    // Petite ligne pointillee montrant la direction, utile si faible contraste
    ctx.save();
    ctx.strokeStyle = this.isPiercing() ? '#FF6644' : 'rgba(136,204,255,0.35)';
    ctx.setLineDash([3, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    const x2 = shipX + Math.cos(this.angle) * 70;
    const y2 = shipY + Math.sin(this.angle) * 70;
    ctx.moveTo(shipX + Math.cos(this.angle) * 22,
               shipY + Math.sin(this.angle) * 22);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}
