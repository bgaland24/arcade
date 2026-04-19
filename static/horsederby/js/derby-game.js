/**
 * derby-game.js — boucle principale Horse Derby.
 *
 * Etats : idle | countdown | playing | gameover
 */

let derbyCanvas, derbyCtx;
let derbyState = 'idle';
let derbyLastTs = 0;
let derbyRafId  = null;

// Sous-systemes
let derbyBgs, derbyFence;
let derbyHorses, derbyObstMgrs, derbyStorm;
let derbyDusts = [];

// Donnees de partie
let derbyData;
let derbyCountdown = 0;
let derbyAnnounceText = '';
let derbyAnnounceAlpha = 0;

let derbyP1name = 'Joueur 1';
let derbyP2name = 'Joueur 2';

// ── Init ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  derbyCanvas = document.getElementById('derbyCanvas');
  derbyCtx    = derbyCanvas.getContext('2d');
  derbyCanvas.width  = DRB.W;
  derbyCanvas.height = DRB.H;

  _derbyScaleCanvas();
  window.addEventListener('resize', _derbyScaleCanvas);

  initDerbyInput(derbyCanvas);

  document.getElementById('drb-start-btn').addEventListener('click', derbyStartGame);
  document.getElementById('drb-p1name').addEventListener('keydown', e => { if (e.key === 'Enter') derbyStartGame(); });
  document.getElementById('drb-p2name').addEventListener('keydown', e => { if (e.key === 'Enter') derbyStartGame(); });
  document.getElementById('drb-replay-btn').addEventListener('click', derbyReplayGame);

  derbyBgs = [
    new DerbyBackground(DRB.LANE1_TOP, DRB.LANE_H),
    new DerbyBackground(DRB.LANE2_TOP, DRB.LANE_H),
  ];
  derbyFence = new DerbyFence(DRB.FENCE_Y);
  _derbyIdleLoop();
});

function _derbyScaleCanvas() {
  const sx = window.innerWidth  / DRB.W;
  const sy = window.innerHeight / DRB.H;
  const s  = Math.min(sx, sy);
  derbyCanvas.style.width  = `${DRB.W * s}px`;
  derbyCanvas.style.height = `${DRB.H * s}px`;
}

let _derbyIdleRaf = null;
function _derbyIdleLoop() {
  if (derbyState !== 'idle') return;
  derbyCtx.fillStyle = DRB.COLOR.SKY_TOP;
  derbyCtx.fillRect(0, 0, DRB.W, DRB.H);
  derbyBgs[0].update(1 / 60, 140);
  derbyBgs[1].update(1 / 60, 140);
  derbyBgs[0].render(derbyCtx);
  derbyBgs[1].render(derbyCtx);
  derbyFence.update(1 / 60, 140);
  derbyFence.render(derbyCtx);
  _derbyIdleRaf = requestAnimationFrame(_derbyIdleLoop);
}

// ── Demarrage ────────────────────────────────────────────
function derbyStartGame() {
  derbyP1name = (document.getElementById('drb-p1name').value.trim() || 'Joueur 1').slice(0, 12);
  derbyP2name = (document.getElementById('drb-p2name').value.trim() || 'Joueur 2').slice(0, 12);
  hideDerbyWelcome();
  hideDerbyGameOver();
  if (_derbyIdleRaf) { cancelAnimationFrame(_derbyIdleRaf); _derbyIdleRaf = null; }
  resetDerbyTaps();
  _derbyInitGame();
  derbyState = 'countdown';
  derbyCountdown = 3.0;
  derbyLastTs = 0;
  if (derbyRafId) cancelAnimationFrame(derbyRafId);
  derbyRafId = requestAnimationFrame(_derbyLoop);
}

function derbyReplayGame() {
  hideDerbyGameOver();
  resetDerbyTaps();
  _derbyInitGame();
  derbyState = 'countdown';
  derbyCountdown = 3.0;
  derbyLastTs = 0;
  if (derbyRafId) cancelAnimationFrame(derbyRafId);
  derbyRafId = requestAnimationFrame(_derbyLoop);
}

function _derbyInitGame() {
  derbyHorses   = [new DerbyHorse(0), new DerbyHorse(1)];
  derbyObstMgrs = [new DerbyObstacleMgr(0), new DerbyObstacleMgr(1)];
  derbyStorm    = new DerbyStorm();
  derbyDusts    = [];

  derbyData = {
    winner:       null,
    gameTime:     0,
    duration_s:   0,
    score:        0,
    p1dist:       0,
    p2dist:       0,
    jumps_ok:     0,
    jumps_miss:   0,
  };
  derbyAnnounceAlpha = 0;
}

// ── Boucle ───────────────────────────────────────────────
function _derbyLoop(ts) {
  const dt = derbyLastTs ? Math.min((ts - derbyLastTs) / 1000, 0.05) : 0;
  derbyLastTs = ts;

  _derbyUpdate(dt, ts / 1000);
  _derbyRender();

  if (derbyState !== 'gameover')
    derbyRafId = requestAnimationFrame(_derbyLoop);
}

// ── Update ───────────────────────────────────────────────
function _derbyUpdate(dt, nowSeconds) {
  // Consomme les taps de cette frame
  const taps = consumeDerbyTaps();

  // Animations toujours
  derbyBgs[0].update(dt, derbyStorm ? derbyStorm.speed : 140);
  derbyBgs[1].update(dt, derbyStorm ? derbyStorm.speed : 140);
  derbyFence.update(dt, derbyStorm ? derbyStorm.speed : 140);
  for (let i = derbyDusts.length - 1; i >= 0; i--) {
    derbyDusts[i].update(dt);
    if (!derbyDusts[i].active) derbyDusts.splice(i, 1);
  }
  if (derbyAnnounceAlpha > 0) derbyAnnounceAlpha = Math.max(0, derbyAnnounceAlpha - dt * 0.8);

  if (derbyState === 'countdown') {
    derbyCountdown -= dt;
    if (derbyCountdown <= 0) {
      derbyState = 'playing';
      derbyAnnounceText  = 'GO !';
      derbyAnnounceAlpha = 1;
    }
    // Autoriser les taps pendant le countdown ? Non : on ignore
    return;
  }

  if (derbyState !== 'playing') return;

  derbyData.gameTime += dt;

  // Consomme les taps galop et saut
  for (const idx of [0, 1]) {
    const t = taps[idx === 0 ? 'p1' : 'p2'];
    const horse = derbyHorses[idx];
    if (t.left)  horse.onGallopTap('L', nowSeconds);
    if (t.right) horse.onGallopTap('R', nowSeconds);
    if (t.jump)  horse.onJumpTap(derbyObstMgrs[idx].list);
  }

  // Update horses
  for (const h of derbyHorses) h.update(dt, nowSeconds);

  // Dust : emission sous chevaux rapides
  for (const h of derbyHorses) {
    if (h._dustTick) {
      const sx = h.screenX(derbyStorm.worldX);
      derbyDusts.push(new DerbyDust(sx - 10, h.groundY + 2));
    }
  }

  // Update obstacles (besoin de horseWorldX pour spawn relatif + GC)
  for (let i = 0; i < 2; i++) {
    derbyObstMgrs[i].update(dt, derbyData.gameTime, derbyHorses[i].worldX);
  }

  // Collisions hurdles
  _derbyCheckHurdles();

  // Update storm
  derbyStorm.update(dt, derbyData.gameTime);

  // Elimination
  for (const h of derbyHorses) {
    if (!h.alive || h.eliminated) continue;
    if (derbyStorm.caughtUp(h)) {
      h.eliminated = true;
    }
  }

  // Fin de partie ? (au moins un eliminé, l'autre gagne)
  const aliveCount = derbyHorses.filter(h => !h.eliminated).length;
  if (aliveCount <= 1 && !derbyData.winner) {
    const alive = derbyHorses.find(h => !h.eliminated);
    if (alive) {
      derbyData.winner = alive.index === 0 ? 'P1' : 'P2';
      derbyAnnounceText = alive.index === 0 ? `${derbyP1name} GAGNE !` : `${derbyP2name} GAGNE !`;
    } else {
      derbyData.winner = '';
      derbyAnnounceText = 'DRAW';
    }
    derbyAnnounceAlpha = 1;
    _derbyEndGame();
  }
}

function _derbyCheckHurdles() {
  for (let i = 0; i < 2; i++) {
    const h  = derbyHorses[i];
    if (!h.alive || h.eliminated) continue;
    const om = derbyObstMgrs[i];
    for (const hu of om.list) {
      if (!hu.active || hu.hitStatus) continue;
      const gap = hu.worldX - h.worldX;
      // Le cheval touche la hurdle quand gap ~= 0
      if (gap <= 4 && gap >= -6) {
        // Check saut
        if (h.isJumping()) {
          hu.hitStatus = 'JUMPED_OK';
          hu.active = false;
          h.onJumpSuccess();
          derbyData.jumps_ok++;
        } else {
          hu.hitStatus = 'CRASHED';
          hu.active = false;
          h.onJumpMiss();
          derbyData.jumps_miss++;
        }
      }
    }
  }
}

// ── Fin partie ───────────────────────────────────────────
function _derbyEndGame() {
  if (derbyState === 'gameover') return;
  derbyState = 'gameover';
  const d = derbyData;
  d.p1dist = Math.floor(derbyHorses[0].worldX / 20);
  d.p2dist = Math.floor(derbyHorses[1].worldX / 20);
  const dist_m = Math.max(d.p1dist, d.p2dist);
  d.duration_s = Math.floor(d.gameTime);

  fetch('/api/horsederby/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      p1_name:    derbyP1name,
      p2_name:    derbyP2name,
      winner:     d.winner,
      distance_m: dist_m,
      jumps_ok:   d.jumps_ok,
      jumps_miss: d.jumps_miss,
      duration_s: d.duration_s,
    }),
  })
  .then(r => r.json())
  .then(res => { d.score = res.score || 0; })
  .catch(() => { d.score = dist_m * 10 + d.jumps_ok * 200 + (d.winner ? 2500 : 0); })
  .finally(() => {
    fetch('/api/horsederby/scores')
      .then(r => r.json())
      .catch(() => [])
      .then(scores => showDerbyGameOver(d, derbyP1name, derbyP2name, scores));
  });
}

// ── Render ───────────────────────────────────────────────
function _derbyRender() {
  const ctx = derbyCtx;

  // HUD bandeau (rend plus tard pour etre par-dessus)
  ctx.fillStyle = DRB.COLOR.SKY_TOP;
  ctx.fillRect(0, 0, DRB.W, DRB.H);

  // Render chaque couloir
  for (let i = 0; i < 2; i++) {
    const laneTop = i === 0 ? DRB.LANE1_TOP : DRB.LANE2_TOP;
    const laneBot = i === 0 ? DRB.LANE1_BOT : DRB.LANE2_BOT;
    const bg = derbyBgs[i];
    bg.render(ctx);

    if (derbyState === 'idle') continue;

    const horse = derbyHorses[i];
    const horseScreenX = horse.screenX(derbyStorm.worldX);

    // Obstacles
    derbyObstMgrs[i].render(ctx, horseScreenX, horse.worldX);

    // Cheval
    horse.render(ctx, horseScreenX);

    // Dust (cette moitie d'ecran)
    for (const d of derbyDusts) {
      if (d.y >= laneTop && d.y <= laneBot) d.render(ctx);
    }

    // Storm (par-dessus tout, avec degrade)
    derbyStorm.renderInLane(ctx, laneTop, laneBot, horse.worldX, horseScreenX);

    // Label gagnant/perdant
    if (horse.eliminated) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, laneTop, DRB.W, laneBot - laneTop);
      ctx.fillStyle = DRB.COLOR.DANGER;
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ELIMINE', DRB.W / 2, (laneTop + laneBot) / 2);
      ctx.textAlign = 'left';
      ctx.restore();
    }
  }

  // Fence entre les couloirs
  derbyFence.render(ctx);

  // HUD
  if (derbyData && derbyState !== 'idle') {
    drawDerbyHUD(ctx, derbyData, derbyHorses, derbyStorm ? derbyStorm.speed : 0,
                 derbyP1name, derbyP2name);
  }

  // Annonces
  if (derbyState === 'countdown') {
    const n = Math.ceil(derbyCountdown);
    drawDerbyAnnounce(ctx, String(n), 1.0, DRB.COLOR.HUD_TEXT);
  } else if (derbyAnnounceAlpha > 0) {
    const color = derbyData && derbyData.winner === 'P1' ? DRB.COLOR.P1_SADDLE
                : derbyData && derbyData.winner === 'P2' ? DRB.COLOR.P2_SADDLE
                : DRB.COLOR.HUD_TEXT;
    drawDerbyAnnounce(ctx, derbyAnnounceText, derbyAnnounceAlpha, color);
  }

  if (DRB_IS_TOUCH && derbyState === 'playing') drawDerbyMobileHints(ctx);
}
