/**
 * gx-game.js — boucle principale Galaxy Space Attack Invader.
 *
 * États : 'idle' | 'playing' | 'inter_wave' | 'gameover'
 */

let gxCanvas, gxCtx;
let gxState = 'idle';
let gxLastTs = 0;
let gxRafId  = null;

// Sous-systèmes
let gxStarField, gxBulletPool, gxPowerUpMgr, gxWaveMgr;
let gxPlayers  = [];
let gxExplosions= [];
let gxBombFlash;

// Données de partie
let gxGameData;
let gxInterWaveTimer = 0;
let gxAnnounceText   = '';
let gxAnnounceAlpha  = 0;
let gxSlowActive     = false;  // true si un joueur a le power-up SLOW actif

// Noms des joueurs
let gxP1name = 'Joueur 1';
let gxP2name = 'Joueur 2';

// ── Init page ────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  gxCanvas        = document.getElementById('gxCanvas');
  gxCtx           = gxCanvas.getContext('2d');
  gxCanvas.width  = GX.W;
  gxCanvas.height = GX.H;

  _gxScaleCanvas();
  window.addEventListener('resize', _gxScaleCanvas);

  initGxInput(gxCanvas);

  document.getElementById('gx-start-btn').addEventListener('click', gxStartGame);
  document.getElementById('gx-p1name').addEventListener('keydown', e => { if (e.key === 'Enter') gxStartGame(); });
  document.getElementById('gx-p2name').addEventListener('keydown', e => { if (e.key === 'Enter') gxStartGame(); });
  document.getElementById('gx-replay-btn').addEventListener('click', gxReplayGame);

  // Fond animé pendant l'accueil
  gxStarField = new StarField();
  _gxIdleLoop();
});

function _gxScaleCanvas() {
  const sx = window.innerWidth  / GX.W;
  const sy = window.innerHeight / GX.H;
  const s  = Math.min(sx, sy);
  gxCanvas.style.width  = `${GX.W * s}px`;
  gxCanvas.style.height = `${GX.H * s}px`;
}

// ── Boucle idle (écran d'accueil) ────────────────────────
let _idleRaf = null;
function _gxIdleLoop() {
  if (gxState !== 'idle') return;
  gxCtx.fillStyle = GX.COLOR.BG;
  gxCtx.fillRect(0, 0, GX.W, GX.H);
  gxStarField.update(1 / 60);
  gxStarField.render(gxCtx);
  _idleRaf = requestAnimationFrame(_gxIdleLoop);
}

// ── Démarrage ─────────────────────────────────────────────
function gxStartGame() {
  gxP1name = (document.getElementById('gx-p1name').value.trim() || 'Joueur 1').slice(0, 12);
  gxP2name = (document.getElementById('gx-p2name').value.trim() || 'Joueur 2').slice(0, 12);
  hideGalaxyWelcome();
  hideGalaxyGameOver();
  if (_idleRaf) { cancelAnimationFrame(_idleRaf); _idleRaf = null; }
  resetGxInput();
  _gxInitGame();
  gxState  = 'inter_wave';
  gxLastTs = 0;
  if (gxRafId) cancelAnimationFrame(gxRafId);
  gxRafId = requestAnimationFrame(_gxLoop);
}

function gxReplayGame() {
  hideGalaxyGameOver();
  resetGxInput();
  _gxInitGame();
  gxState  = 'inter_wave';
  gxLastTs = 0;
  if (gxRafId) cancelAnimationFrame(gxRafId);
  gxRafId = requestAnimationFrame(_gxLoop);
}

function _gxInitGame() {
  gxBulletPool  = new BulletPool(150, 200);
  gxPowerUpMgr  = new PowerUpManager();
  gxWaveMgr     = new WaveManager(gxBulletPool);
  gxBombFlash   = new BombFlash();
  gxExplosions  = [];
  gxSlowActive  = false;

  gxPlayers = [
    new PlayerShip(0, gxBulletPool),
    new PlayerShip(1, gxBulletPool),
  ];
  gxWaveMgr.players = gxPlayers;

  gxGameData = {
    lives:       GX.START_LIVES,
    score:       0,
    killPoints:  0,
    kills:       0,
    shotsFired:  0,
    shotsHit:    0,
    waveReached: 0,
  };

  // Annonce vague 1
  _gxStartInterWave(1);
}

// ── Boucle principale ────────────────────────────────────
function _gxLoop(ts) {
  const dt = gxLastTs ? Math.min((ts - gxLastTs) / 1000, 0.05) : 0;
  gxLastTs = ts;

  _gxUpdate(dt);
  _gxRender();
  gxRafId = requestAnimationFrame(_gxLoop);
}

// ── Mise à jour ──────────────────────────────────────────
function _gxUpdate(dt) {
  // Stars toujours actives
  gxStarField.update(dt);

  // Flash bombe
  gxBombFlash.update(dt);

  // Explosions
  for (let i = gxExplosions.length - 1; i >= 0; i--) {
    gxExplosions[i].update(dt);
    if (!gxExplosions[i].active) gxExplosions.splice(i, 1);
  }

  if (gxState === 'inter_wave') {
    _gxUpdateInterWave(dt);
    return;
  }
  if (gxState !== 'playing') return;

  // ── Slowdown actif ? ────────────────────────────────────
  gxSlowActive = gxPlayers.some(p => p.hasPowerup('SLOW'));
  const slowFactor = gxSlowActive ? GX.SLOW_FACTOR : 1.0;

  // ── Joueurs ─────────────────────────────────────────────
  for (const ship of gxPlayers) {
    const inp = ship.playerIndex === 0 ? GX_INPUT.p1 : GX_INPUT.p2;
    ship.update(dt, inp);

    // Bombe
    if (inp.bomb && ship.canBomb() && ship.useBomb()) {
      _gxTriggerBomb(ship);
      inp.bomb = false; // évite répétition
    }

    // Sync stats de tir
    gxGameData.shotsFired = gxPlayers.reduce((s, p) => s + p.shotsFired, 0);
    gxGameData.shotsHit   = gxPlayers.reduce((s, p) => s + p.shotsHit,   0);
  }

  // ── Balles ──────────────────────────────────────────────
  gxBulletPool.updateAll(dt * slowFactor);  // les balles ennemies aussi ralentissent
  // Balles joueurs ne sont pas ralenties (logique de jeu)
  for (const b of gxBulletPool.playerBullets) if (b.active) {
    b.y -= GX.PLAYER_BULLET_SPD * dt;  // override — vitesse normale
    if (b.y < GX.PLAY_TOP - 10) b.active = false;
  }

  // ── Vague ────────────────────────────────────────────────
  gxWaveMgr.update(dt, slowFactor);

  // ── Power-ups ────────────────────────────────────────────
  gxPowerUpMgr.update(dt);
  const collected = gxPowerUpMgr.checkCollisions(gxPlayers);
  for (const { type, ship } of collected) {
    _gxApplyPowerup(type, ship);
  }

  // ── Collisions ───────────────────────────────────────────
  _gxCheckCollisions();

  // ── Fin de vague ? ───────────────────────────────────────
  if (gxWaveMgr.isWaveComplete()) {
    const bonus = gxWaveMgr.waveNumber * 300;
    gxGameData.score += bonus;
    _gxStartInterWave(gxWaveMgr.waveNumber + 1);
  }

  // Annonce en jeu (fade out)
  if (gxAnnounceAlpha > 0) gxAnnounceAlpha -= dt * 1.5;
}

function _gxUpdateInterWave(dt) {
  gxInterWaveTimer -= dt;
  gxAnnounceAlpha   = Math.min(1, gxInterWaveTimer / (GX.INTER_WAVE_DELAY * 0.5));
  if (gxInterWaveTimer <= 0) {
    gxState = 'playing';
    gxWaveMgr.startWave(gxGameData.waveReached);
    gxAnnounceAlpha = 0;
  }
}

function _gxStartInterWave(nextWave) {
  gxGameData.waveReached = nextWave;
  gxState                = 'inter_wave';
  gxInterWaveTimer       = GX.INTER_WAVE_DELAY;
  gxAnnounceText         = nextWave % 5 === 0
    ? `⚠  BOSS  ⚠`
    : `VAGUE  ${nextWave}`;
  gxAnnounceAlpha        = 1;
  gxBulletPool.reset();
}

// ── Collisions ───────────────────────────────────────────
function _gxCheckCollisions() {
  // Balles joueurs vs ennemis
  for (const b of gxBulletPool.playerBullets) {
    if (!b.active) continue;
    // vs ennemis
    for (const e of gxWaveMgr.enemies) {
      if (!e.active) continue;
      if (b.hits(e.x, e.y, e.size * 1.4, e.size * 1.4)) {
        b.active = false;
        const killed = e.takeDamage(1);
        // Compte hit
        const shooterIdx = _gxBulletOwner(b);
        if (shooterIdx >= 0) gxPlayers[shooterIdx].shotsHit++;
        if (killed) _gxKillEnemy(e);
        break;
      }
    }
    // vs boss
    if (b.active && gxWaveMgr.boss && gxWaveMgr.boss.active) {
      const boss = gxWaveMgr.boss;
      if (boss.containsPoint(b.x, b.y)) {
        b.active = false;
        const shooterIdx = _gxBulletOwner(b);
        if (shooterIdx >= 0) gxPlayers[shooterIdx].shotsHit++;
        const killed = boss.takeDamage(1);
        gxExplosions.push(new GxExplosion(b.x, b.y, 10, [GX.COLOR.BOSS_P1, '#FF8800', '#FF2200']));
        if (killed) _gxKillBoss(boss);
      }
    }
  }

  // Balles ennemies vs joueurs
  for (const b of gxBulletPool.enemyBullets) {
    if (!b.active) continue;
    for (const ship of gxPlayers) {
      if (!ship.active || ship.invincible) continue;
      if (b.hitsPlayer(ship.x, ship.y)) {
        b.active = false;
        const lifeLost = ship.hit();
        if (ship.hasPowerup('SHIELD')) {
          gxExplosions.push(new ShieldFlash(ship.x, ship.y));
        } else if (lifeLost) {
          gxExplosions.push(new GxExplosion(ship.x, ship.y, 20));
          gxGameData.lives--;
          if (gxGameData.lives <= 0) {
            _gxEndGame();
            return;
          }
        }
        break;
      }
    }
  }
}

function _gxBulletOwner(b) {
  // Heuristique : balle dans la moitié gauche → P1, droite → P2
  return b.x < GX.W / 2 ? 0 : 1;
}

function _gxKillEnemy(enemy) {
  enemy.active = false;
  gxGameData.score      += enemy.pts;
  gxGameData.killPoints += enemy.pts;
  gxGameData.kills++;
  gxExplosions.push(new GxExplosion(enemy.x, enemy.y, enemy.size * 0.8));
  gxPowerUpMgr.maybeSpawn(enemy.x, enemy.y);
}

function _gxKillBoss(boss) {
  boss.active = false;
  gxGameData.score      += 2000 + boss.waveNumber * 100;
  gxGameData.killPoints += 2000 + boss.waveNumber * 100;
  gxGameData.kills++;
  // Grande explosion
  for (let i = 0; i < 8; i++) {
    gxExplosions.push(new GxExplosion(
      boss.x + (Math.random() - 0.5) * 80,
      boss.y + (Math.random() - 0.5) * 40,
      20 + Math.random() * 20,
      [GX.COLOR.BOSS_P1, GX.COLOR.BOSS_P2, '#FF0000']
    ));
  }
}

// ── Power-ups ────────────────────────────────────────────
function _gxApplyPowerup(type, ship) {
  if (type === 'LIFE') {
    gxGameData.lives = Math.min(GX.START_LIVES, gxGameData.lives + 1);
    return;
  }
  if (type === 'BOMB') {
    _gxTriggerBomb(ship);
    return;
  }
  ship.applyPowerup(type);
}

function _gxTriggerBomb(ship) {
  gxBombFlash.trigger();
  // Dégâts à tous les ennemis
  for (const e of gxWaveMgr.enemies) {
    if (!e.active) continue;
    const killed = e.takeDamage(GX.BOMB_DAMAGE);
    if (killed) _gxKillEnemy(e);
  }
  if (gxWaveMgr.boss && gxWaveMgr.boss.active) {
    const killed = gxWaveMgr.boss.takeDamage(GX.BOMB_DAMAGE);
    if (killed) _gxKillBoss(gxWaveMgr.boss);
  }
  // Efface les balles ennemies
  gxBulletPool.deactivateEnemyBullets();
}

// ── Fin de partie ────────────────────────────────────────
function _gxEndGame() {
  if (gxState === 'gameover') return;
  gxState = 'gameover';

  const data = gxGameData;
  fetch('/api/galaxy/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      p1_name:      gxP1name,
      p2_name:      gxP2name,
      kill_points:  data.killPoints,
      shots_fired:  data.shotsFired,
      shots_hit:    data.shotsHit,
      wave_reached: data.waveReached,
      kills:        data.kills,
    }),
  })
  .then(r => r.json())
  .then(res => { data.score = res.score || data.score; })
  .catch(() => {})
  .finally(() => {
    fetch('/api/galaxy/scores')
      .then(r => r.json())
      .catch(() => [])
      .then(scores => showGalaxyGameOver(data, gxP1name, gxP2name, scores));
  });
}

// ── Rendu ────────────────────────────────────────────────
function _gxRender() {
  const ctx = gxCtx;

  // Fond
  ctx.fillStyle = GX.COLOR.BG;
  ctx.fillRect(0, 0, GX.W, GX.H);

  // Étoiles
  gxStarField.render(ctx);

  if (gxState === 'gameover') {
    // Continuer à afficher le dernier état
    _gxRenderWorld(ctx);
    return;
  }

  _gxRenderWorld(ctx);

  // Annonce inter-vague
  if (gxAnnounceAlpha > 0) {
    drawWaveAnnounce(ctx, gxAnnounceText, Math.min(1, gxAnnounceAlpha));
  }

  // Flash bombe
  gxBombFlash.render(ctx);
}

function _gxRenderWorld(ctx) {
  // Ennemis + boss
  gxWaveMgr.render(ctx);

  // Power-ups
  gxPowerUpMgr.render(ctx);

  // Explosions
  for (const ex of gxExplosions) ex.render(ctx);

  // Balles
  gxBulletPool.renderAll(ctx);

  // Joueurs
  for (const ship of gxPlayers) ship.render(ctx);

  // HUD
  if (gxGameData) {
    drawGalaxyHUD(ctx, gxGameData, gxPlayers, gxWaveMgr, gxP1name, gxP2name);
  }

  // Boutons mobile
  if (GX_IS_TOUCH) drawGalaxyMobileButtons(ctx);
}
