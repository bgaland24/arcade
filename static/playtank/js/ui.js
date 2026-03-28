/**
 * ui.js — rendu du HUD, boutons mobiles et écran de fin.
 */

// ── HUD ──────────────────────────────────────────────────
function drawHUD(ctx, tanks, timeLeft, wind, p1name, p2name) {
  const W  = CONFIG.CANVAS_W;
  const C  = CONFIG.COLOR;

  // Fond HUD
  ctx.fillStyle = C.HUD_BG;
  ctx.fillRect(0, 0, W, 46);
  // Ligne séparatrice
  ctx.fillStyle = 'rgba(255,215,0,0.25)';
  ctx.fillRect(0, 45, W, 1);

  // ── Joueur 1 (gauche) ──────────────────────────────────
  _drawPlayerHUD(ctx, tanks[0], p1name, 10, 'left');

  // ── Timer central ──────────────────────────────────────
  const timeStr = _formatTime(timeLeft);
  ctx.fillStyle = timeLeft < 30 && Math.floor(timeLeft * 2) % 2 === 0
    ? '#FF4444'
    : C.HUD_TEXT;
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(timeStr, W / 2, 30);

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '8px monospace';
  ctx.fillText('TEMPS', W / 2, 42);

  // ── Indicateur de vent ─────────────────────────────────
  _drawWind(ctx, wind, W / 2 + 72);

  // ── Joueur 2 (droite) ──────────────────────────────────
  _drawPlayerHUD(ctx, tanks[1], p2name, W - 10, 'right');
}

function _drawPlayerHUD(ctx, tank, name, startX, align) {
  const C   = CONFIG.COLOR;
  const dir = align === 'left' ? 1 : -1;

  // Barre colorée de joueur
  ctx.fillStyle = tank.playerIndex === 0 ? C.P1_BODY : C.P2_BODY;
  const barX = align === 'left' ? startX : startX - 3;
  ctx.fillRect(barX, 6, 3, 34);

  // Nom
  ctx.fillStyle = C.HUD_TEXT;
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = align;
  ctx.fillText(name.toUpperCase(), startX + dir * 8, 22);

  // Marqueurs de touches reçues (petits carrés)
  const hitBaseX = align === 'left' ? startX + 8 : startX - 8;
  for (let i = 0; i < CONFIG.HITS_TO_WIN; i++) {
    const xi = align === 'left'
      ? hitBaseX + i * 15
      : hitBaseX - (CONFIG.HITS_TO_WIN - 1 - i) * 15;
    ctx.fillStyle = i < tank.hits ? '#FF3333' : '#2a2a2a';
    ctx.fillRect(xi, 28, 11, 11);
    if (i < tank.hits) {
      ctx.fillStyle = '#FF9999';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('X', xi + 5, 37);
    }
  }

  // Barre de rechargement
  const reloadW  = 72;
  const reloadX  = align === 'left' ? hitBaseX + CONFIG.HITS_TO_WIN * 15 + 6 : hitBaseX - CONFIG.HITS_TO_WIN * 15 - 6 - reloadW;
  const pct      = tank.cooldown <= 0 ? 1 : 1 - tank.cooldown / CONFIG.FIRE_COOLDOWN_S;
  ctx.fillStyle  = '#1a1a1a';
  ctx.fillRect(reloadX, 28, reloadW, 11);
  ctx.fillStyle  = pct >= 1 ? '#00EE44' : (tank.playerIndex === 0 ? C.P1_BODY : C.P2_BODY);
  ctx.fillRect(reloadX, 28, reloadW * pct, 11);
  ctx.fillStyle  = 'rgba(255,255,255,0.45)';
  ctx.font       = '7px monospace';
  ctx.textAlign  = 'left';
  ctx.fillText(pct >= 1 ? 'PRET!' : 'RECHG', reloadX + 2, 37);
}

function _drawWind(ctx, wind, cx) {
  if (!CONFIG.WIND_ENABLED) return;
  const absW = Math.abs(wind);
  const pct  = absW / CONFIG.WIND_MAX_FORCE;
  const arrL = 4 + pct * 26;  // longueur flèche (4–30px)

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('VENT', cx, 14);

  if (absW < 1) {
    // Vent nul
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText('calme', cx, 40);
    return;
  }

  const goRight = wind > 0;
  const ax0 = cx - arrL / 2, ax1 = cx + arrL / 2;
  ctx.strokeStyle = `rgba(255,255,255,${0.4 + pct * 0.5})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ax0, 28); ctx.lineTo(ax1, 28);
  if (goRight) {
    ctx.moveTo(ax1, 28); ctx.lineTo(ax1 - 6, 23);
    ctx.moveTo(ax1, 28); ctx.lineTo(ax1 - 6, 33);
  } else {
    ctx.moveTo(ax0, 28); ctx.lineTo(ax0 + 6, 23);
    ctx.moveTo(ax0, 28); ctx.lineTo(ax0 + 6, 33);
  }
  ctx.stroke();

  const kmh = Math.round(absW / CONFIG.WIND_MAX_FORCE * 50);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${kmh} km/h`, cx, 41);
}

function _formatTime(s) {
  const m  = Math.floor(Math.max(0, s) / 60);
  const ss = Math.floor(Math.max(0, s) % 60);
  return `${m}:${ss.toString().padStart(2, '0')}`;
}

// ── Boutons tactiles ─────────────────────────────────────
function drawMobileButtons(ctx) {
  const alpha = 0.5;
  ctx.save();
  ctx.globalAlpha = alpha;

  for (const [player, buttons] of Object.entries(TOUCH_BUTTONS)) {
    const isP1 = player === 'p1';
    const bg   = isP1 ? CONFIG.COLOR.P1_BODY : CONFIG.COLOR.P2_BODY;

    for (const [action, btn] of Object.entries(buttons)) {
      const pressed = INPUT[player][action];
      ctx.globalAlpha = pressed ? 0.8 : alpha;
      ctx.fillStyle   = action === 'fire' ? (pressed ? '#FF8800' : '#880000') : bg;
      ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth   = 1;
      ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

      // Label
      ctx.globalAlpha = pressed ? 1 : 0.75;
      ctx.fillStyle   = '#fff';
      ctx.font        = action === 'fire' ? 'bold 11px monospace' : 'bold 14px monospace';
      ctx.textAlign   = 'center';
      const label = {
        moveLeft:   '◄',
        moveRight:  '►',
        turretUp:   '▲',
        turretDown: '▼',
        fire:       'FEU!',
      }[action];
      ctx.fillText(label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 5);
    }
  }

  ctx.restore();
}

// ── Écran de fin (DOM) ────────────────────────────────────
function showGameOverScreen(winnerName, winnerIdx, tanks, timeUsed, scores) {
  const C = CONFIG.COLOR;

  // Banner vainqueur
  const banner   = document.getElementById('winner-banner');
  const winColor = winnerIdx === 0 ? C.P1_BODY : winnerIdx === 1 ? C.P2_BODY : '#888';
  if (winnerIdx >= 0) {
    banner.innerHTML = `<span style="color:${winColor}">${winnerName.toUpperCase()}</span> GAGNE !`;
  } else {
    banner.innerHTML = '<span style="color:#888">EGALITE !</span>';
  }

  // Stats du vainqueur
  if (winnerIdx >= 0) {
    const wt = tanks[winnerIdx];
    const acc = wt.shotsFired > 0 ? Math.round(wt.shotsHit / wt.shotsFired * 100) : 0;
    document.getElementById('game-stats').innerHTML =
      `Temps : ${_formatTime(timeUsed)} &nbsp;|&nbsp; `+
      `Précision : ${acc}% &nbsp;|&nbsp; `+
      `Obus : ${wt.shotsFired}`;
  } else {
    document.getElementById('game-stats').textContent = `Temps total : ${_formatTime(timeUsed)}`;
  }

  // Leaderboard
  _renderLeaderboard(scores, winnerName, winnerIdx >= 0);

  document.getElementById('gameover-screen').style.display = 'flex';
}

function hideGameOverScreen() {
  document.getElementById('gameover-screen').style.display = 'none';
}

function _renderLeaderboard(scores, newPlayerName, hasWinner) {
  const lb = document.getElementById('leaderboard');
  if (!scores || scores.length === 0) {
    lb.innerHTML = '<p style="color:#666;font-size:11px;text-align:center;padding:12px">Aucun score enregistré</p>';
    return;
  }

  let html = '<table><thead><tr>'
    + '<th>#</th><th>NOM</th><th style="text-align:right">SCORE</th>'
    + '<th style="text-align:right">TEMPS</th>'
    + '<th style="text-align:right">PREC.</th>'
    + '<th style="text-align:right">OBUS</th>'
    + '</tr></thead><tbody>';

  scores.forEach((s, i) => {
    const isNew = hasWinner
      && i === 0
      && s.player_name.toLowerCase() === newPlayerName.toLowerCase();
    const cls = isNew ? ' class="new-entry"' : '';
    const acc = Math.round((s.accuracy || 0) * 100);
    const timeStr = _formatTime(s.time_seconds || 0);
    html += `<tr${cls}>`
      + `<td>${i + 1}</td>`
      + `<td>${s.player_name}</td>`
      + `<td style="text-align:right">${s.score}</td>`
      + `<td style="text-align:right">${timeStr}</td>`
      + `<td style="text-align:right">${acc}%</td>`
      + `<td style="text-align:right">${s.shells_used}</td>`
      + (isNew ? '<td style="color:#FFD700;font-size:9px"> ◄ NOUVEAU</td>' : '<td></td>')
      + '</tr>';
  });

  html += '</tbody></table>';
  lb.innerHTML = html;
}
