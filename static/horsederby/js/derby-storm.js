/**
 * derby-storm.js — orage qui poursuit les chevaux par la gauche.
 *
 * Rendu pixel-art : nuages sombres empiles, eclairs aleatoires. Chaque couloir
 * a son propre affichage mais le worldX de l'orage est partage entre les 2
 * (la tempete est une seule entite pour garantir l'equite).
 */

class DerbyStorm {
  constructor() {
    this.worldX = -300;                  // part avec 300 px d'avance derriere
    this.speed  = DRB.STORM.START_SPEED;
    this.flashTimer = 1.0;
    this.flash = 0;                      // 0..1 intensite eclair
    this.bolt = null;                    // {x, y, points, ttl}
  }

  reset() {
    this.worldX = -300;
    this.speed  = DRB.STORM.START_SPEED;
    this.flashTimer = 1.0;
    this.flash = 0;
    this.bolt = null;
  }

  update(dt, gameTime) {
    this.speed = Math.min(
      DRB.STORM.MAX_SPEED,
      DRB.STORM.START_SPEED + DRB.STORM.SPEED_RAMP * gameTime,
    );
    this.worldX += this.speed * dt;

    // Eclair aleatoire
    this.flashTimer -= dt;
    if (this.flashTimer <= 0) {
      this.flashTimer = 0.6 + Math.random() * 2.0;
      this.flash = 1.0;
      this.bolt = this._makeBolt();
    }
    this.flash = Math.max(0, this.flash - dt * 2.2);
  }

  _makeBolt() {
    // Bolt zigzag de 40..80 px vertical, x dans la zone de tempete
    const x = 20 + Math.random() * 60;
    const startY = 8;
    const endY   = 80 + Math.random() * 60;
    const steps  = 6;
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      points.push({
        x: x + (Math.random() - 0.5) * 18,
        y: startY + (endY - startY) * t,
      });
    }
    return { points, ttl: 0.15 };
  }

  // Render la tempete dans un couloir donne
  renderInLane(ctx, laneTopY, laneBotY, horseWorldX, horseScreenX) {
    // Position ecran de la tempete
    const delta = this.worldX - horseWorldX;
    const stormScreenX = horseScreenX + delta * 0.45;

    // On dessine la zone a gauche de stormScreenX : tout ce qui est derriere
    // l'orage est "dans" l'orage
    const w = Math.max(0, stormScreenX + DRB.STORM.VISIBLE_W);
    if (w <= 0) return;

    const laneH = laneBotY - laneTopY;
    // Degrade sombre
    const grad = ctx.createLinearGradient(0, laneTopY, Math.min(w, DRB.W), laneTopY);
    grad.addColorStop(0.00, DRB.COLOR.STORM_DEEP);
    grad.addColorStop(0.60, DRB.COLOR.STORM_MID);
    grad.addColorStop(1.00, 'rgba(60,24,90,0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, laneTopY, Math.min(w, DRB.W), laneH);

    // Silhouettes de nuages pixel
    ctx.fillStyle = DRB.COLOR.STORM_DEEP;
    const cloudStep = 18;
    const cloudOff = (this.worldX * 0.4) % cloudStep;
    for (let x = -cloudOff; x < Math.min(w, DRB.W) + cloudStep; x += cloudStep) {
      const y1 = laneTopY + 6  + ((Math.floor(x / cloudStep) * 13) % 18);
      const y2 = laneTopY + 40 + ((Math.floor(x / cloudStep) * 7)  % 22);
      ctx.fillRect(Math.round(x), y1, 14, 12);
      ctx.fillRect(Math.round(x + 8), y2, 18, 14);
    }
    // Reflets plus clairs
    ctx.fillStyle = DRB.COLOR.STORM_MID;
    for (let x = -cloudOff; x < Math.min(w, DRB.W); x += cloudStep) {
      const y = laneTopY + 22 + ((Math.floor(x / cloudStep) * 11) % 24);
      ctx.fillRect(Math.round(x + 4), y, 10, 6);
    }

    // Eclair
    if (this.flash > 0.05 && this.bolt) {
      ctx.save();
      ctx.globalAlpha = this.flash;
      ctx.fillStyle = DRB.COLOR.STORM_FLASH;
      ctx.fillRect(0, laneTopY, Math.min(w, DRB.W), laneH);
      ctx.globalAlpha = 1;
      // Trace du bolt
      ctx.strokeStyle = DRB.COLOR.LIGHTNING;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const pts = this.bolt.points;
      ctx.moveTo(pts[0].x, laneTopY + pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, laneTopY + pts[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Bord vertical rougeatre danger
    ctx.save();
    ctx.fillStyle = DRB.COLOR.DANGER;
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(performance.now() * 0.01);
    ctx.fillRect(Math.min(w, DRB.W) - 3, laneTopY, 3, laneH);
    ctx.restore();
  }

  // Renvoie true si la tempete a rattrape/depasse le cheval
  caughtUp(horse) {
    return horse.worldX <= this.worldX;
  }
}
