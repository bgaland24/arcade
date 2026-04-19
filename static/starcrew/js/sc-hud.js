/**
 * sc-hud.js — HUD StarCrew : vies, chaleur tourelle, metal, vague, nom joueurs.
 */

function drawScHUD(ctx, data, ship, turret, p1name, p2name, waveMgr, eventMgr) {
  // Bandeau
  ctx.fillStyle = 'rgba(2,26,20,0.85)';
  ctx.fillRect(0, 0, SC.W, SC.PLAY_TOP);
  ctx.fillStyle = SC.COLOR.HUD_PRIMARY;
  ctx.fillRect(0, SC.PLAY_TOP - 1, SC.W, 1);

  // ── Pilote P1 (gauche) ──────────────────────────────────
  ctx.textAlign = 'left';
  ctx.fillStyle = SC.COLOR.P1;
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.fillText(p1name.toUpperCase(), 10, 16);
  ctx.font = '9px "Courier New", monospace';
  ctx.fillStyle = '#888';
  ctx.fillText('PILOTE', 10, 28);
  // Vies
  for (let i = 0; i < ship.maxLives; i++) {
    ctx.fillStyle = i < ship.lives ? SC.COLOR.P1 : '#333';
    ctx.fillRect(10 + i * 14,     36, 8, 4);
    ctx.fillRect(10 + i * 14 - 2, 40, 12, 2);
  }

  // ── Centre : vague + metal ──────────────────────────────
  ctx.textAlign = 'center';
  ctx.fillStyle = SC.COLOR.HUD_PRIMARY;
  ctx.font = 'bold 16px "Courier New", monospace';
  ctx.fillText(`VAGUE ${data.waveNumber}`, SC.W / 2, 20);
  // Metal
  ctx.font = 'bold 14px "Courier New", monospace';
  ctx.fillStyle = SC.COLOR.HUD_GOLD;
  ctx.fillText(`${data.metal} METAL`, SC.W / 2, 38);

  // Score (sous vague pour info)
  ctx.font = '9px "Courier New", monospace';
  ctx.fillStyle = '#888';
  ctx.fillText(`Kills ${data.kills}`, SC.W / 2 - 110, 20);
  ctx.fillText(`Wave ${data.waveNumber}`, SC.W / 2 + 110, 20);

  // Evenement actif
  if (eventMgr && eventMgr.isActive()) {
    ctx.fillStyle = '#FF4422';
    ctx.font = '9px "Courier New", monospace';
    let label = eventMgr.current.type;
    if (eventMgr.current.type === 'WELL')     label = 'PUITS';
    if (eventMgr.current.type === 'STORM')    label = 'TEMPETE';
    if (eventMgr.current.type === 'COMET')    label = 'COMETE';
    ctx.fillText(`EVENT ${label}`, SC.W / 2, 47);
  }

  // ── Artilleur P2 (droite) ───────────────────────────────
  ctx.textAlign = 'right';
  ctx.fillStyle = SC.COLOR.P2;
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.fillText(p2name.toUpperCase(), SC.W - 10, 16);
  ctx.font = '9px "Courier New", monospace';
  ctx.fillStyle = '#888';
  ctx.fillText('ARTILLEUR', SC.W - 10, 28);

  // Jauge chaleur tourelle
  const gw = 120, gx = SC.W - 10 - gw, gy = 36;
  ctx.fillStyle = '#222';
  ctx.fillRect(gx, gy, gw, 6);
  const heatMax = turret.heatMax();
  const ratio = Math.min(1, turret.heat / heatMax);
  let heatColor = SC.COLOR.HEAT_COOL;
  const level = turret.heatLevel();
  if (level === 'YELLOW') heatColor = SC.COLOR.HEAT_WARM;
  else if (level === 'RED') heatColor = SC.COLOR.HEAT_HOT;
  else if (level === 'LOCKED') heatColor = '#AAAAAA';
  ctx.fillStyle = heatColor;
  ctx.fillRect(gx, gy, gw * ratio, 6);
  // Marqueurs seuils
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(gx + gw * (SC.TURRET.HEAT_YELLOW / SC.TURRET.HEAT_MAX), gy - 1, 1, 8);
  ctx.fillRect(gx + gw * (SC.TURRET.HEAT_RED    / SC.TURRET.HEAT_MAX), gy - 1, 1, 8);
  // Texte jauge
  ctx.textAlign = 'right';
  ctx.fillStyle = heatColor;
  ctx.font = 'bold 8px "Courier New", monospace';
  let htxt = `HEAT ${Math.round(ratio * 100)}%`;
  if (level === 'LOCKED') htxt = 'OVERHEAT';
  else if (level === 'RED') htxt = `HEAT ${Math.round(ratio * 100)}% ★PIERCE`;
  ctx.fillText(htxt, SC.W - 10, gy - 2);

  ctx.textAlign = 'left';
}

// ── Boutons tactiles ─────────────────────────────────────
function drawScMobileButtons(ctx) {
  for (const player of ['p1', 'p2']) {
    const color = player === 'p1' ? SC.COLOR.P1 : SC.COLOR.P2;
    for (const [action, btn] of Object.entries(SC_TOUCH_BUTTONS[player])) {
      const pressed = SC_INPUT[player][action];
      ctx.save();
      ctx.globalAlpha = pressed ? 0.55 : 0.22;
      ctx.fillStyle   = color;
      ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = color;
      ctx.lineWidth   = 1.5;
      ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.w - 1, btn.h - 1);
      ctx.fillStyle = '#fff';
      ctx.font      = 'bold 12px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const cx = btn.x + btn.w / 2;
      const cy = btn.y + btn.h / 2;
      let label = '';
      if (action === 'up')      label = '\u25B2';
      else if (action === 'down')  label = '\u25BC';
      else if (action === 'left')  label = '\u25C0';
      else if (action === 'right') label = '\u25B6';
      else if (action === 'rotL')  label = '\u21BA';
      else if (action === 'rotR')  label = '\u21BB';
      else if (action === 'fire')  label = 'FIRE';
      else if (action === 'grapple') label = 'GRAP';
      ctx.fillText(label, cx, cy);
      ctx.restore();
    }
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// Annonce centrale (events, nouvelle vague)
function drawScAnnounce(ctx, text, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.font = 'bold 28px "Courier New", monospace';
  ctx.fillStyle = '#FF4422';
  ctx.shadowColor = 'rgba(255,68,34,0.6)';
  ctx.shadowBlur = 16;
  ctx.fillText(text, SC.W / 2, SC.H / 2 - 40);
  ctx.shadowBlur = 0;
  ctx.restore();
  ctx.textAlign = 'left';
}

function drawScWaveAnnounce(ctx, text, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.font = 'bold 32px "Courier New", monospace';
  ctx.fillStyle = SC.COLOR.HUD_PRIMARY;
  ctx.shadowColor = 'rgba(0,221,170,0.6)';
  ctx.shadowBlur = 16;
  ctx.fillText(text, SC.W / 2, SC.H / 2);
  ctx.shadowBlur = 0;
  ctx.restore();
  ctx.textAlign = 'left';
}

// Blackout : voile sombre sauf cercle lumineux autour du ship + traits lasers
function drawScBlackout(ctx, shipX, shipY) {
  // Voile
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(0, SC.PLAY_TOP, SC.W, SC.H - SC.PLAY_TOP);
  // "Trou" eclaire avec gradient radial
  const grad = ctx.createRadialGradient(shipX, shipY, 10, shipX, shipY, SC.EVENTS.BLACKOUT_LIGHT_R);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.7, 'rgba(0,0,0,0.5)');
  grad.addColorStop(1, 'rgba(0,0,0,0.78)');
  ctx.globalCompositeOperation = 'destination-out';
  // Dessine un disque qui "efface" le voile
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(shipX, shipY, SC.EVENTS.BLACKOUT_LIGHT_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
