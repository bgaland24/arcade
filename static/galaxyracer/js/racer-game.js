/**
 * racer-game.js — boucle principale de Galaxy Racer.
 *
 * Etats : 'idle' | 'playing' | 'gameover'
 *
 * Regles :
 * - Defilement vertical continu, obstacles (asteroides) descendent.
 * - Chaque joueur a 3 vies ; touche un asteroide => perd 1 vie + invincibilite 1.6s.
 * - La partie se termine quand les DEUX joueurs sont a 0 vie.
 * - Pickup dores ramasses => +250 pts + 1 vie si possible... ici juste +score.
 * - Score = distance parcourue + bonus vies restantes + bonus pickups (calcule server-side).
 */

let racerCanvas, racerCtx;
let racerState = 'idle';
let racerLastTs = 0;
let racerRafId  = null;

// Sous-systemes
let racerStars, racerAsteroids, racerPickups;
let racerShips = [];
let racerBooms = [];

// Donnees de partie
let racerData;

// Noms joueurs
let racerP1name = 'Joueur 1';
let racerP2name = 'Joueur 2';

// ── Init page ────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  racerCanvas        = document.getElementById('racerCanvas');
  racerCtx           = racerCanvas.getContext('2d');
  racerCanvas.width  = RACER.W;
  racerCanvas.height = RACER.H;

  _racerScaleCanvas();
  window.addEventListener('resize', _racerScaleCanvas);

  initRacerInput(racerCanvas);

  document.getElementById('rcr-start-btn').addEventListener('click', racerStartGame);
  document.getElementById('rcr-p1name').addEventListener('keydown', e => { if (e.key === 'Enter') racerStartGame(); });
  document.getElementById('rcr-p2name').addEventListener('keydown', e => { if (e.key === 'Enter') racerStartGame(); });
  document.getElementById('rcr-replay-btn').addEventListener('click', racerReplayGame);

  racerStars = new RacerStarField();
  _racerIdleLoop();
});

function _racerScaleCanvas() {
  const sx = window.innerWidth  / RACER.W;
  const sy = window.innerHeight / RACER.H;
  const s  = Math.min(sx, sy);
  racerCanvas.style.width  = `${RACER.W * s}px`;
  racerCanvas.style.height = `${RACER.H * s}px`;
}

// ── Boucle idle (accueil) ────────────────────────────────
let _racerIdleRaf = null;
function _racerIdleLoop() {
  if (racerState !== 'idle') return;
  racerCtx.fillStyle = RACER.COLOR.BG;
  racerCtx.fillRect(0, 0, RACER.W, RACER.H);
  racerStars.update(1 / 60, RACER.START_SPEED);
  racerStars.render(racerCtx);
  _racerIdleRaf = requestAnimationFrame(_racerIdleLoop);
}

// ── Demarrage ────────────────────────────────────────────
function racerStartGame() {
  racerP1name = (document.getElementById('rcr-p1name').value.trim() || 'Joueur 1').slice(0, 12);
  racerP2name = (document.getElementById('rcr-p2name').value.trim() || 'Joueur 2').slice(0, 12);
  hideRacerWelcome();
  hideRacerGameOver();
  if (_racerIdleRaf) { cancelAnimationFrame(_racerIdleRaf); _racerIdleRaf = null; }
  resetRacerInput();
  _racerInitGame();
  racerState  = 'playing';
  racerLastTs = 0;
  if (racerRafId) cancelAnimationFrame(racerRafId);
  racerRafId = requestAnimationFrame(_racerLoop);
}

function racerReplayGame() {
  hideRacerGameOver();
  resetRacerInput();
  _racerInitGame();
  racerState  = 'playing';
  racerLastTs = 0;
  if (racerRafId) cancelAnimationFrame(racerRafId);
  racerRafId = requestAnimationFrame(_racerLoop);
}

function _racerInitGame() {
  racerAsteroids = new AsteroidManager();
  racerPickups   = new PickupManager();
  racerShips     = [new RacerShip(0), new RacerShip(1)];
  racerBooms     = [];

  racerData = {
    distance:   0,
    pickups:    0,
    worldSpeed: RACER.START_SPEED,
    maxSpeed:   RACER.START_SPEED,
    gameTime:   0,
    score:      0,   // affiche server-side a la fin
  };
}

// ── Boucle principale ────────────────────────────────────
function _racerLoop(ts) {
  const dt = racerLastTs ? Math.min((ts - racerLastTs) / 1000, 0.05) : 0;
  racerLastTs = ts;

  _racerUpdate(dt);
  _racerRender();

  if (racerState !== 'gameover')
    racerRafId = requestAnimationFrame(_racerLoop);
}

// ── Mise a jour ──────────────────────────────────────────
function _racerUpdate(dt) {
  if (racerState !== 'playing') return;

  racerData.gameTime += dt;
  // Acceleration progressive
  racerData.worldSpeed = Math.min(
    RACER.MAX_SPEED,
    RACER.START_SPEED + RACER.SPEED_RAMP * racerData.gameTime,
  );
  if (racerData.worldSpeed > racerData.maxSpeed) racerData.maxSpeed = racerData.worldSpeed;

  // Distance parcourue (en metres = pixels / 10)
  racerData.distance += racerData.worldSpeed * dt / 10;

  // Stars
  racerStars.update(dt, racerData.worldSpeed);

  // Ships
  for (const s of racerShips) {
    const inp = s.index === 0 ? RACER_INPUT.p1 : RACER_INPUT.p2;
    s.update(dt, inp);
  }

  // Asteroides
  racerAsteroids.update(dt, racerData.worldSpeed, racerData.gameTime);

  // Pickups
  racerPickups.update(dt, racerData.worldSpeed);

  // Booms
  for (let i = racerBooms.length - 1; i >= 0; i--) {
    racerBooms[i].update(dt);
    if (!racerBooms[i].active) racerBooms.splice(i, 1);
  }

  // Collisions ship vs asteroides
  for (const s of racerShips) {
    if (!s.active || s.invincible > 0) continue;
    for (const a of racerAsteroids.list) {
      if (!a.active) continue;
      if (a.hits(s.x, s.y, RACER.SHIP_HALF_W, RACER.SHIP_HALF_H)) {
        const died = s.hit();
        racerBooms.push(new RacerBoom(s.x, s.y, s.color));
        if (died) {
          racerBooms.push(new RacerBoom(s.x, s.y, s.colorGlow));
        }
        // L'asteroide est brise
        a.active = false;
        racerBooms.push(new RacerBoom(a.x, a.y, RACER.COLOR.ASTEROID_LT));
        break;
      }
    }
  }

  // Pickups ramasses
  const collected = racerPickups.checkCollisions(racerShips);
  for (const ship of collected) {
    racerData.pickups++;
    // Petit effet visuel
    racerBooms.push(new RacerBoom(ship.x, ship.y - 10, RACER.COLOR.PICKUP));
  }

  // Fin de partie : les deux sont morts
  if (!racerShips[0].active && !racerShips[1].active) {
    _racerEndGame();
  }
}

// ── Fin de partie ────────────────────────────────────────
function _racerEndGame() {
  if (racerState === 'gameover') return;
  racerState = 'gameover';

  const d = racerData;
  const p1Left = racerShips[0].lives;
  const p2Left = racerShips[1].lives;
  d.anyoneAlive = (p1Left + p2Left) > 0;

  fetch('/api/galaxyracer/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      p1_name:       racerP1name,
      p2_name:       racerP2name,
      distance:      Math.floor(d.distance),
      p1_lives_left: p1Left,
      p2_lives_left: p2Left,
      pickups:       d.pickups,
      max_speed:     Math.floor(d.maxSpeed),
    }),
  })
  .then(r => r.json())
  .then(res => { d.score = res.score || Math.floor(d.distance); })
  .catch(() => { d.score = Math.floor(d.distance); })
  .finally(() => {
    fetch('/api/galaxyracer/scores')
      .then(r => r.json())
      .catch(() => [])
      .then(scores => showRacerGameOver(d, racerP1name, racerP2name, scores));
  });
}

// ── Rendu ────────────────────────────────────────────────
function _racerRender() {
  const ctx = racerCtx;

  ctx.fillStyle = RACER.COLOR.BG;
  ctx.fillRect(0, 0, RACER.W, RACER.H);

  racerStars.render(ctx);

  if (racerState === 'idle') return;

  racerAsteroids.render(ctx);
  racerPickups.render(ctx);
  for (const s of racerShips) s.render(ctx);
  for (const b of racerBooms) b.render(ctx);

  if (racerData) {
    drawRacerHUD(ctx, racerData, racerShips, racerP1name, racerP2name);
  }

  if (RACER_IS_TOUCH) drawRacerMobileButtons(ctx);
}
