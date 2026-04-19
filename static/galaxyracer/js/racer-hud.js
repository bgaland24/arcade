/**
 * racer-hud.js — rendu du HUD (distance, vies, jauges boost).
 */

function drawRacerHUD(ctx, data, ships, p1name, p2name) {
  // ── Bandeau du haut ─────────────────────────────────────
  ctx.fillStyle = RACER.COLOR.HUD_BG;
  ctx.fillRect(0, 0, RACER.W, RACER.PLAY_TOP);
  ctx.fillStyle = RACER.COLOR.HUD_TEXT;
  ctx.fillRect(0, RACER.PLAY_TOP - 1, RACER.W, 1);

  // ── Distance (centre) ───────────────────────────────────
  const dist = Math.floor(data.distance);
  ctx.textAlign = 'center';
  ctx.fillStyle = RACER.COLOR.HUD_TEXT;
  ctx.font      = 'bold 22px "Courier New", monospace';
  ctx.fillText(`${dist} m`, RACER.W / 2, 28);
  ctx.fillStyle = '#aaa';
  ctx.font      = '9px "Courier New", monospace';
  ctx.fillText('DISTANCE', RACER.W / 2, 42);

  // ── Vitesse (sous-titre) ────────────────────────────────
  ctx.fillStyle = '#888';
  ctx.font      = '9px "Courier New", monospace';
  ctx.fillText(`${Math.floor(data.worldSpeed)} px/s`, RACER.W / 2 - 80, 42);
  ctx.fillText(`PICKUPS ${data.pickups}`, RACER.W / 2 + 90, 42);

  // ── P1 (gauche) ─────────────────────────────────────────
  const s1 = ships[0];
  ctx.textAlign = 'left';
  ctx.fillStyle = RACER.COLOR.P1;
  ctx.font      = 'bold 12px "Courier New", monospace';
  ctx.fillText(p1name.toUpperCase(), 10, 18);
  _drawLives(ctx, 10, 24, s1.lives, RACER.START_LIVES, RACER.COLOR.P1);
  _drawBoostGauge(ctx, 10, 34, 72, s1.boostEnergy / RACER.BOOST_MAX, RACER.COLOR.P1);

  // ── P2 (droite) ─────────────────────────────────────────
  const s2 = ships[1];
  ctx.textAlign = 'right';
  ctx.fillStyle = RACER.COLOR.P2;
  ctx.font      = 'bold 12px "Courier New", monospace';
  ctx.fillText(p2name.toUpperCase(), RACER.W - 10, 18);
  _drawLives(ctx, RACER.W - 10 - RACER.START_LIVES * 14, 24, s2.lives, RACER.START_LIVES, RACER.COLOR.P2);
  _drawBoostGauge(ctx, RACER.W - 10 - 72, 34, 72, s2.boostEnergy / RACER.BOOST_MAX, RACER.COLOR.P2);
  ctx.textAlign = 'left';
}

function _drawLives(ctx, x, y, lives, max, color) {
  for (let i = 0; i < max; i++) {
    const alive = i < lives;
    ctx.fillStyle = alive ? color : '#333';
    // Petit icone de vaisseau simplifie
    ctx.fillRect(x + i * 14,     y,     8, 6);
    ctx.fillRect(x + i * 14 - 2, y + 4, 12, 2);
  }
}

function _drawBoostGauge(ctx, x, y, w, ratio, color) {
  ratio = Math.max(0, Math.min(1, ratio));
  ctx.fillStyle = '#222';
  ctx.fillRect(x, y, w, 5);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * ratio, 5);
}

// ── Boutons tactiles ─────────────────────────────────────
function drawRacerMobileButtons(ctx) {
  for (const player of ['p1', 'p2']) {
    const color = player === 'p1' ? RACER.COLOR.P1 : RACER.COLOR.P2;
    for (const [action, btn] of Object.entries(RACER_TOUCH_BUTTONS[player])) {
      const pressed = RACER_INPUT[player][action];
      ctx.save();
      ctx.globalAlpha = pressed ? 0.55 : 0.22;
      ctx.fillStyle   = color;
      ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = color;
      ctx.lineWidth   = 1.5;
      ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.w - 1, btn.h - 1);
      // Icone
      ctx.fillStyle = '#fff';
      ctx.font      = 'bold 14px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const cx = btn.x + btn.w / 2;
      const cy = btn.y + btn.h / 2;
      let label = '';
      if (action === 'left')  label = '\u25C0';
      if (action === 'right') label = '\u25B6';
      if (action === 'boost') label = 'BOOST';
      ctx.fillText(label, cx, cy);
      ctx.restore();
    }
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}
