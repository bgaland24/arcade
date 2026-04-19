/**
 * derby-hud.js — bandeau haut + jauges par cheval (stamina, vitesse, rythme).
 */

function drawDerbyHUD(ctx, data, horses, stormSpeed, p1name, p2name) {
  // Bandeau haut
  ctx.fillStyle = DRB.COLOR.HUD_BG;
  ctx.fillRect(0, 0, DRB.W, DRB.HUD_H);
  ctx.fillStyle = DRB.COLOR.HUD_TEXT;
  ctx.fillRect(0, DRB.HUD_H - 1, DRB.W, 1);

  // Centre : distance totale (la plus grande des 2)
  const maxD = Math.max(horses[0].worldX, horses[1].worldX);
  const distanceM = Math.floor(maxD / 20);
  ctx.textAlign = 'center';
  ctx.fillStyle = DRB.COLOR.HUD_TEXT;
  ctx.font = 'bold 20px "Courier New", monospace';
  ctx.fillText(`${distanceM} m`, DRB.W / 2, 24);
  ctx.font = '9px "Courier New", monospace';
  ctx.fillStyle = '#888';
  ctx.fillText('DISTANCE', DRB.W / 2, 34);
  ctx.fillText(`ORAGE ${Math.floor(stormSpeed)} px/s`, DRB.W / 2, 12);

  // Gauche : P1 stats
  ctx.textAlign = 'left';
  ctx.fillStyle = DRB.COLOR.P1_SADDLE;
  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.fillText(p1name.toUpperCase(), 10, 14);
  _drawStam(ctx, 10, 18, 120, horses[0].stamina / DRB.HORSE.STAM_MAX);
  _drawSpeed(ctx, 10, 28, 120, horses[0].speed / DRB.HORSE.SPEED_MAX, DRB.COLOR.P1_SADDLE);

  // Droite : P2 stats
  ctx.textAlign = 'right';
  ctx.fillStyle = DRB.COLOR.P2_SADDLE;
  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.fillText(p2name.toUpperCase(), DRB.W - 10, 14);
  _drawStam(ctx, DRB.W - 10 - 120, 18, 120, horses[1].stamina / DRB.HORSE.STAM_MAX);
  _drawSpeed(ctx, DRB.W - 10 - 120, 28, 120, horses[1].speed / DRB.HORSE.SPEED_MAX, DRB.COLOR.P2_SADDLE);

  ctx.textAlign = 'left';
}

function _drawStam(ctx, x, y, w, ratio) {
  ctx.fillStyle = '#222';
  ctx.fillRect(x, y, w, 5);
  let c = DRB.COLOR.STAM_OK;
  if (ratio < 0.35) c = DRB.COLOR.STAM_BAD;
  else if (ratio < 0.6) c = DRB.COLOR.STAM_WEAK;
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, ratio)), 5);
}

function _drawSpeed(ctx, x, y, w, ratio, color) {
  ctx.fillStyle = '#1a0a18';
  ctx.fillRect(x, y, w, 3);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, ratio)), 3);
}

// Annonce centrale (compte a rebours, gagnant)
function drawDerbyAnnounce(ctx, text, alpha, color) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.font = 'bold 40px "Courier New", monospace';
  ctx.fillStyle = color || DRB.COLOR.HUD_TEXT;
  ctx.shadowColor = color || 'rgba(244,196,48,0.6)';
  ctx.shadowBlur = 18;
  ctx.fillText(text, DRB.W / 2, DRB.H / 2);
  ctx.shadowBlur = 0;
  ctx.restore();
  ctx.textAlign = 'left';
}

// Boutons tactiles (bandes simples par couloir)
function drawDerbyMobileHints(ctx) {
  // Rendu tres discret : juste 2 bandes verticales semi-transparentes
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, DRB.HUD_H, DRB.W * 0.3, DRB.H - DRB.HUD_H);
  ctx.fillRect(DRB.W * 0.6, DRB.HUD_H, DRB.W * 0.4, DRB.H - DRB.HUD_H);
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = DRB.COLOR.HUD_TEXT;
  ctx.font = 'bold 10px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('L',    DRB.W * 0.15, DRB.H - 8);
  ctx.fillText('R',    DRB.W * 0.45, DRB.H - 8);
  ctx.fillText('JUMP', DRB.W * 0.80, DRB.H - 8);
  ctx.restore();
  ctx.textAlign = 'left';
}
