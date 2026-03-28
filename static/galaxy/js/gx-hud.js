/**
 * gx-hud.js — HUD du jeu Galaxy (vies, score, vague, power-ups actifs).
 */
function drawGalaxyHUD(ctx, state, players, waveManager, p1name, p2name) {
  const W = GX.W;

  // Fond HUD haut
  ctx.fillStyle = GX.COLOR.HUD_BG;
  ctx.fillRect(0, 0, W, GX.PLAY_TOP);
  ctx.fillStyle = 'rgba(0,238,255,0.2)';
  ctx.fillRect(0, GX.PLAY_TOP - 1, W, 1);

  // ── Score (centre) ──────────────────────────────────────
  ctx.fillStyle = GX.COLOR.HUD_TEXT;
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(String(state.score).padStart(8, '0'), W / 2, 32);
  ctx.fillStyle = 'rgba(0,238,255,0.4)';
  ctx.font = '8px monospace';
  ctx.fillText('SCORE', W / 2, 43);

  // ── Vague (droite) ──────────────────────────────────────
  ctx.fillStyle = GX.COLOR.HUD_TEXT;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`VAGUE ${waveManager.waveNumber}`, W - 10, 28);

  // Ennemis restants
  const remaining = waveManager.getRemainingCount();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '9px monospace';
  ctx.fillText(`${remaining} ennemi${remaining !== 1 ? 's' : ''}`, W - 10, 42);

  // ── Vies (gauche) ───────────────────────────────────────
  const iconW = 12;
  for (let i = 0; i < GX.START_LIVES; i++) {
    const ix = 10 + i * (iconW + 4);
    if (i < state.lives) {
      // Petit vaisseau plein (P1 et P2 alternés)
      ctx.fillStyle = i % 2 === 0 ? GX.COLOR.P1 : GX.COLOR.P2;
      ctx.fillRect(ix, 12, iconW, 8);
      ctx.fillRect(ix + 2, 8, iconW - 4, 5);
      ctx.fillRect(ix + iconW / 2 - 1, 6, 2, 4);
    } else {
      ctx.fillStyle = '#222';
      ctx.fillRect(ix, 12, iconW, 8);
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '8px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('VIES', 10, 43);

  // ── Power-ups actifs ─────────────────────────────────────
  _drawActivePowerups(ctx, players);
}

function _drawActivePowerups(ctx, players) {
  let xOffset = 110;
  for (const player of players) {
    for (const [type, remaining] of Object.entries(player.powerups)) {
      if (!GX.POWERUP_DURATION[type]) continue;
      const col  = GX.COLOR.POWERUP[type];
      const dur  = GX.POWERUP_DURATION[type];
      const pct  = remaining / dur;
      const x    = xOffset;
      const y    = 25;
      const r    = 10;

      // Fond
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `${col}33`;
      ctx.fill();

      // Arc de décompte
      ctx.beginPath();
      ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Lettre
      ctx.fillStyle = col;
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(type[0], x, y + 3);

      xOffset += 26;
    }
  }
}

// ── Affichage inter-vague ────────────────────────────────
function drawWaveAnnounce(ctx, text, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle   = 'rgba(0,0,10,0.7)';
  ctx.fillRect(0, GX.H / 2 - 40, GX.W, 80);
  ctx.fillStyle   = GX.COLOR.HUD_TEXT;
  ctx.font        = 'bold 28px monospace';
  ctx.textAlign   = 'center';
  ctx.fillText(text, GX.W / 2, GX.H / 2 + 10);
  ctx.restore();
}

// ── Boutons tactiles ────────────────────────────────────
function drawGalaxyMobileButtons(ctx) {
  ctx.save();
  for (const [player, buttons] of Object.entries(GX_TOUCH_BUTTONS)) {
    const col = player === 'p1' ? GX.COLOR.P1 : GX.COLOR.P2;
    for (const [action, btn] of Object.entries(buttons)) {
      const pressed     = GX_INPUT[player][action];
      ctx.globalAlpha   = pressed ? 0.85 : 0.45;
      ctx.fillStyle     = action === 'bomb' ? (pressed ? '#FF6600' : '#440000') : col;
      ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
      ctx.strokeStyle   = 'rgba(255,255,255,0.25)';
      ctx.lineWidth     = 1;
      ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
      ctx.globalAlpha   = pressed ? 1 : 0.7;
      ctx.fillStyle     = '#fff';
      ctx.font          = action === 'bomb' ? 'bold 9px monospace' : 'bold 13px monospace';
      ctx.textAlign     = 'center';
      const label = { left:'◄', right:'►', up:'▲', down:'▼', bomb:'BOM' }[action];
      ctx.fillText(label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 5);
    }
  }
  ctx.restore();
}
