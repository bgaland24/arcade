/**
 * game.js — boucle principale, gestion d'état, coordination.
 *
 * États : 'playing' | 'gameover'
 * Les écrans accueil/fin sont gérés via le DOM (overlays HTML).
 */

// ── Variables globales de jeu ────────────────────────────
let canvas, ctx;
let terrain, tanks, projectiles, explosions;
let bonusManager;
let wind, windTimer;
let timeLeft;
let gameState = 'idle';
let lastTimestamp = 0;
let rafId = null;
let p1name = 'Joueur 1';
let p2name = 'Joueur 2';

// ── Initialisation de la page ────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('gameCanvas');
  ctx    = canvas.getContext('2d');

  canvas.width  = CONFIG.CANVAS_W;
  canvas.height = CONFIG.CANVAS_H;

  scaleCanvas();
  window.addEventListener('resize', scaleCanvas);

  initInput(canvas);

  // Boutons de l'accueil
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('p1name').addEventListener('keydown', e => { if (e.key === 'Enter') startGame(); });
  document.getElementById('p2name').addEventListener('keydown', e => { if (e.key === 'Enter') startGame(); });

  // Boutons de fin
  document.getElementById('replay-btn').addEventListener('click', replayGame);
  document.getElementById('menu-btn').addEventListener('click', goToMenu);

  // Dessin statique d'arrière-plan pendant l'accueil
  drawIdleBackground();
});

// ── Mise à l'échelle du canvas ────────────────────────────
function scaleCanvas() {
  const scaleX = window.innerWidth  / CONFIG.CANVAS_W;
  const scaleY = window.innerHeight / CONFIG.CANVAS_H;
  const scale  = Math.min(scaleX, scaleY);
  canvas.style.width  = `${CONFIG.CANVAS_W * scale}px`;
  canvas.style.height = `${CONFIG.CANVAS_H * scale}px`;
}

// ── Démarrage ─────────────────────────────────────────────
function startGame() {
  p1name = (document.getElementById('p1name').value.trim() || 'Joueur 1').slice(0, 12);
  p2name = (document.getElementById('p2name').value.trim() || 'Joueur 2').slice(0, 12);

  document.getElementById('welcome-screen').style.display = 'none';
  hideGameOverScreen();
  resetInput();
  initGame();
  gameState = 'playing';
  lastTimestamp = 0;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(gameLoop);
}

function replayGame() {
  hideGameOverScreen();
  resetInput();
  initGame();
  gameState = 'playing';
  lastTimestamp = 0;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(gameLoop);
}

function goToMenu() {
  window.location.href = '/lobby';
}

// ── Initialisation d'une partie ───────────────────────────
function initGame() {
  terrain     = new Terrain(CONFIG.CANVAS_W, CONFIG.CANVAS_H);
  projectiles = [];
  explosions  = [];
  timeLeft    = CONFIG.GAME_DURATION_S;

  // Positions initiales : ≈15% et ≈85% de la largeur
  const x1 = Math.floor(CONFIG.CANVAS_W * 0.15);
  const x2 = Math.floor(CONFIG.CANVAS_W * 0.85);
  tanks = [
    new Tank(x1, terrain, 1, 0),   // P1 face à droite
    new Tank(x2, terrain, -1, 1),  // P2 face à gauche
  ];

  // Vent initial aléatoire
  wind      = _randomWind();
  windTimer = CONFIG.WIND_CHANGE_INTERVAL;

  bonusManager = new BonusManager();
}

// ── Boucle principale ─────────────────────────────────────
function gameLoop(timestamp) {
  if (gameState !== 'playing') return;

  const dt = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.05) : 0;
  lastTimestamp = timestamp;

  update(dt);
  render();

  rafId = requestAnimationFrame(gameLoop);
}

// ── Mise à jour ───────────────────────────────────────────
function update(dt) {
  // Minuterie
  timeLeft -= dt;
  if (timeLeft <= 0) { endGame(-1); return; }

  // Vent
  windTimer -= dt;
  if (windTimer <= 0) {
    wind      = _randomWind();
    windTimer = CONFIG.WIND_CHANGE_INTERVAL;
  }

  // Tanks
  for (const tank of tanks) tank.update(dt);

  // Input → actions tanks
  _handleInput(dt);

  // Projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj   = projectiles[i];
    const result = proj.update(dt, terrain, wind);

    if (result === 'oob') {
      projectiles.splice(i, 1);
      continue;
    }

    if (result === 'terrain') {
      const radius = proj.explosive
        ? CONFIG.EXPLOSION_RADIUS * 2
        : CONFIG.EXPLOSION_RADIUS;
      terrain.destroy(proj.x, proj.y, radius);
      bonusManager.onTerrainChanged(terrain);
      explosions.push(new Explosion(proj.x, proj.y, radius));
      _checkSplash(proj, radius);
      projectiles.splice(i, 1);
      continue;
    }

    // Collision directe avec tank ennemi (en vol)
    let hit = false;
    for (const tank of tanks) {
      if (tank.playerIndex === proj.owner) continue;
      if (tank.containsPoint(proj.x, proj.y)) {
        const radius = proj.explosive ? CONFIG.EXPLOSION_RADIUS * 2 : CONFIG.EXPLOSION_RADIUS;
        explosions.push(new Explosion(proj.x, proj.y, radius));
        _dealHit(tank, proj.owner);
        projectiles.splice(i, 1);
        hit = true;
        break;
      }
    }
    if (hit) continue;
  }

  // Explosions
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].update(dt);
    if (!explosions[i].active) explosions.splice(i, 1);
  }

  // Bonus
  bonusManager.update(dt, terrain, tanks);
}

function _handleInput(dt) {
  const actions = [
    [tanks[0], INPUT.p1],
    [tanks[1], INPUT.p2],
  ];
  for (const [tank, inp] of actions) {
    if (inp.moveLeft)    tank.move(-1, dt);
    if (inp.moveRight)   tank.move(1, dt);
    if (inp.turretUp)    tank.rotateTurret(1, dt);
    if (inp.turretDown)  tank.rotateTurret(-1, dt);
    if (inp.fire) {
      const proj = tank.fire();
      if (proj) {
        projectiles.push(proj);
        // Sur mobile, fire reste true via touch — on ne le reset pas ;
        // le cooldown du tank empêche le sur-tir.
      }
    }
  }
}

function _checkSplash(proj, explosionRadius) {
  const r = explosionRadius * CONFIG.SPLASH_RATIO;
  for (const tank of tanks) {
    if (tank.playerIndex === proj.owner) continue;
    const dx   = tank.x - proj.x;
    const dy   = tank.y - proj.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < r) {
      _dealHit(tank, proj.owner);
    }
  }
}

function _dealHit(tank, attackerIdx) {
  const absorbed = tank.receiveHit() === false;
  if (!absorbed) {
    tanks[attackerIdx].shotsHit++;
    if (!tank.isAlive()) endGame(attackerIdx);
  }
}

// ── Fin de partie ─────────────────────────────────────────
function endGame(winnerIdx) {
  if (gameState !== 'playing') return;
  gameState = 'gameover';

  const timeUsed = CONFIG.GAME_DURATION_S - Math.max(0, timeLeft);

  // Si temps écoulé : vainqueur = celui qui a pris le moins de touches
  if (winnerIdx < 0) {
    if (tanks[0].hits < tanks[1].hits)      winnerIdx = 0;
    else if (tanks[1].hits < tanks[0].hits) winnerIdx = 1;
    // sinon reste -1 (égalité)
  }

  const winnerName  = winnerIdx >= 0 ? [p1name, p2name][winnerIdx] : '';
  const winnerTank  = winnerIdx >= 0 ? tanks[winnerIdx] : null;

  // Poster le score du vainqueur puis récupérer le classement
  const postScore = winnerTank
    ? fetch('/api/playtank/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_name:   winnerName,
          opponent_name: winnerIdx === 0 ? p2name : p1name,
          time_seconds:  timeUsed,
          shots_fired:   winnerTank.shotsFired,
          shots_hit:     winnerTank.shotsHit,
        }),
      }).catch(() => {})
    : Promise.resolve();

  postScore.finally(() => {
    fetch('/api/playtank/scores')
      .then(r => r.json())
      .catch(() => [])
      .then(scores => {
        showGameOverScreen(winnerName, winnerIdx, tanks, timeUsed, scores);
      });
  });
}

// ── Rendu ─────────────────────────────────────────────────
function render() {
  // Fond ciel (Desert Storm)
  const sky = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_H);
  sky.addColorStop(0,   CONFIG.COLOR.SKY_TOP);
  sky.addColorStop(0.7, CONFIG.COLOR.SKY_BTM);
  sky.addColorStop(1,   '#B86040');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

  // Soleil (Desert Storm)
  _drawSun(ctx);

  // Terrain
  terrain.render(ctx);

  // Explosions (derrière les tanks)
  for (const exp of explosions) exp.render(ctx);

  // Tanks
  for (const tank of tanks) tank.render(ctx);

  // Projectiles
  for (const proj of projectiles) proj.render(ctx);

  // Bonus (parachutés)
  bonusManager.render(ctx);

  // HUD
  drawHUD(ctx, tanks, timeLeft, wind, p1name, p2name);

  // Boutons mobiles ou contrôles clavier
  if (IS_TOUCH) drawMobileButtons(ctx);
  else drawControls(ctx);
}

function _drawSun(ctx) {
  const sx = CONFIG.CANVAS_W * 0.78;
  const sy = 38;
  const sr = 22;
  const g  = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 2.5);
  g.addColorStop(0,   'rgba(255,255,200,0.9)');
  g.addColorStop(0.3, 'rgba(255,210,80,0.5)');
  g.addColorStop(1,   'rgba(255,180,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(sx - sr * 2.5, sy - sr * 2.5, sr * 5, sr * 5);
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,240,150,0.85)';
  ctx.fill();
}

// ── Arrière-plan inactif (pendant l'accueil) ──────────────
function drawIdleBackground() {
  if (gameState === 'playing') return;
  const sky = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_H);
  sky.addColorStop(0,   CONFIG.COLOR.SKY_TOP);
  sky.addColorStop(0.7, CONFIG.COLOR.SKY_BTM);
  sky.addColorStop(1,   '#B86040');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
  _drawSun(ctx);
  if (terrain) terrain.render(ctx);
}

// ── Utilitaires ──────────────────────────────────────────
function _randomWind() {
  return (Math.random() - 0.5) * 2 * CONFIG.WIND_MAX_FORCE;
}
