/**
 * sc-game.js — boucle principale StarCrew.
 *
 * Etats : idle | inter_wave | playing | shop | gameover
 */

let scCanvas, scCtx;
let scState   = 'idle';
let scLastTs  = 0;
let scRafId   = null;

// Sous-systemes
let scStars, scBullets, scAsteroids, scWave, scEvents, scShop;
let scShip, scTurret, scGrapple;
let scExplosions = [];
let scFloatTexts = [];
let scShockwaves = [];

// Donnees de partie
let scData;
let scInterWaveTimer = 0;
let scAnnounceText   = '';
let scAnnounceAlpha  = 0;

let scP1name = 'Joueur 1';
let scP2name = 'Joueur 2';

// ── Init page ────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  scCanvas        = document.getElementById('scCanvas');
  scCtx           = scCanvas.getContext('2d');
  scCanvas.width  = SC.W;
  scCanvas.height = SC.H;

  _scScaleCanvas();
  window.addEventListener('resize', _scScaleCanvas);

  initScInput(scCanvas);

  document.getElementById('sc-start-btn').addEventListener('click', scStartGame);
  document.getElementById('sc-p1name').addEventListener('keydown', e => { if (e.key === 'Enter') scStartGame(); });
  document.getElementById('sc-p2name').addEventListener('keydown', e => { if (e.key === 'Enter') scStartGame(); });
  document.getElementById('sc-replay-btn').addEventListener('click', scReplayGame);

  scStars = new ScStarField();
  _scIdleLoop();
});

function _scScaleCanvas() {
  const sx = window.innerWidth  / SC.W;
  const sy = window.innerHeight / SC.H;
  const s  = Math.min(sx, sy);
  scCanvas.style.width  = `${SC.W * s}px`;
  scCanvas.style.height = `${SC.H * s}px`;
}

let _scIdleRaf = null;
function _scIdleLoop() {
  if (scState !== 'idle') return;
  scCtx.fillStyle = SC.COLOR.BG;
  scCtx.fillRect(0, 0, SC.W, SC.H);
  scStars.update(1 / 60);
  scStars.render(scCtx);
  _scIdleRaf = requestAnimationFrame(_scIdleLoop);
}

// ── Demarrage ────────────────────────────────────────────
function scStartGame() {
  scP1name = (document.getElementById('sc-p1name').value.trim() || 'Pilote').slice(0, 12);
  scP2name = (document.getElementById('sc-p2name').value.trim() || 'Artilleur').slice(0, 12);
  hideCrewWelcome();
  hideCrewGameOver();
  if (_scIdleRaf) { cancelAnimationFrame(_scIdleRaf); _scIdleRaf = null; }
  resetScInput();
  _scInitGame();
  _scStartNextWave();
  scLastTs = 0;
  if (scRafId) cancelAnimationFrame(scRafId);
  scRafId = requestAnimationFrame(_scLoop);
}

function scReplayGame() {
  hideCrewGameOver();
  resetScInput();
  _scInitGame();
  _scStartNextWave();
  scLastTs = 0;
  if (scRafId) cancelAnimationFrame(scRafId);
  scRafId = requestAnimationFrame(_scLoop);
}

function _scInitGame() {
  scBullets    = new ScBulletPool(120, 80);
  scAsteroids  = new ScAsteroidManager();
  scShip       = new ScShip();
  scTurret     = new ScTurret();
  scTurret.setHeatCapacityMult(1.0);
  scGrapple    = new ScGrapple();
  scWave       = new ScWaveManager(scBullets);
  scEvents     = new ScEventManager();
  scShop       = new ScShop();
  scShop.reset();
  scExplosions = [];
  scFloatTexts = [];
  scShockwaves = [];

  scData = {
    waveNumber:  0,
    metal:       0,
    kills:       0,
    shotsFired:  0,   // depuis turret + ship
    shotsHit:    0,
    wavesCompleted: 0,
    gameTime:    0,
    score:       0,
  };
}

function _scStartNextWave() {
  const next = scData.waveNumber + 1;
  scData.waveNumber = next;
  scAnnounceText  = next % 5 === 0 ? `⚠ VAGUE ${next} ⚠` : `VAGUE ${next}`;
  scAnnounceAlpha = 1;
  scInterWaveTimer = SC.WAVE.INTER_DELAY;
  scState = 'inter_wave';
  scBullets.deactivateEnemyBullets();
}

// ── Boucle principale ────────────────────────────────────
function _scLoop(ts) {
  const dt = scLastTs ? Math.min((ts - scLastTs) / 1000, 0.05) : 0;
  scLastTs = ts;

  _scUpdate(dt);
  _scRender();

  if (scState !== 'gameover')
    scRafId = requestAnimationFrame(_scLoop);
}

// ── Update ───────────────────────────────────────────────
function _scUpdate(dt) {
  // Animations toujours actives
  scStars.update(dt);
  for (let i = scExplosions.length - 1; i >= 0; i--) {
    scExplosions[i].update(dt);
    if (!scExplosions[i].active) scExplosions.splice(i, 1);
  }
  for (let i = scShockwaves.length - 1; i >= 0; i--) {
    scShockwaves[i].update(dt);
    if (!scShockwaves[i].active) scShockwaves.splice(i, 1);
  }
  for (let i = scFloatTexts.length - 1; i >= 0; i--) {
    scFloatTexts[i].update(dt);
    if (!scFloatTexts[i].active) scFloatTexts.splice(i, 1);
  }

  if (scAnnounceAlpha > 0) scAnnounceAlpha = Math.max(0, scAnnounceAlpha - dt * 0.8);

  if (scState === 'inter_wave') {
    scInterWaveTimer -= dt;
    if (scInterWaveTimer <= 0) {
      scWave.startWave(scData.waveNumber);
      scState = 'playing';
    }
    return;
  }

  if (scState === 'shop') {
    const act = scShop.update(dt, SC_INPUT);
    if (act) {
      if (act.action === 'buy') {
        const res = scShop.tryBuy(scData.metal);
        if (res.success) {
          scData.metal -= res.metalSpent;
          _scApplyShopEffect(res.id);
          scShop.refresh(scData.metal);
          scFloatTexts.push(new ScFloatText(scShip.x, scShip.y - 30, 'ACHAT !', SC.COLOR.HUD_GOLD));
        }
      } else if (act.action === 'skip' || act.action === 'timeout') {
        scShop.hide();
        _scStartNextWave();
      }
    }
    return;
  }

  if (scState !== 'playing') return;

  scData.gameTime += dt;

  // ── Evenements ──────────────────────────────────────────
  scEvents.update(dt, scData.waveNumber);
  const wellForce = scEvents.wellForceAt(scShip.x, scShip.y);

  // ── Ship + canon ────────────────────────────────────────
  scShip.update(dt, SC_INPUT.p1, scBullets, wellForce);

  // ── Tourelle + lasers ──────────────────────────────────
  scTurret.update(dt, SC_INPUT.p2, scShip.x, scShip.y, scBullets, scGrapple);

  // ── Grapin ──────────────────────────────────────────────
  if (SC_INPUT.p2.grapple && scGrapple.canLaunch() && !scTurret.isLocked()) {
    scGrapple.launch(scShip.x, scShip.y, scTurret.angle);
  }
  scGrapple.update(dt, scShip.x, scShip.y, scAsteroids, scWave, (evt) => {
    _scOnGrappleEvent(evt);
  });

  // ── Asteroides ──────────────────────────────────────────
  const spawnMult = scEvents.spawnMultiplier();
  scAsteroids.update(dt, scData.gameTime, spawnMult, 1.0);

  // ── Vague ───────────────────────────────────────────────
  scWave.update(dt, scShip.x, scShip.y, 1.0);

  // ── Balles ──────────────────────────────────────────────
  scBullets.updateAll(dt);

  // ── Collisions ──────────────────────────────────────────
  _scCheckCollisions();

  // ── Comete instakill ────────────────────────────────────
  if (scShip.active && scEvents.cometKills(scShip.x, scShip.y, SC.SHIP.BODY_R)) {
    _scHitShip(true);
  }

  // ── Bouclier orbital : bloque balles ennemies ──────────
  if (scShip.orbitalShield) {
    scShip.orbitalShield.checkBlocks(scBullets.enemy);
  }

  // ── Fin de vague ? ──────────────────────────────────────
  if (scWave.isWaveComplete() && scWave.active) {
    scData.wavesCompleted++;
    scWave.active = false;
    // Shop
    scShop.show(scData.metal, scData.waveNumber + 1, null);
    scState = 'shop';
  }

  // ── Fin de partie ? ─────────────────────────────────────
  if (!scShip.active) {
    _scEndGame();
  }
}

// ── Collisions complexes ────────────────────────────────
function _scCheckCollisions() {
  // Ship vs asteroides (non grappiné, non bouclier)
  if (scShip.active) {
    for (const a of scAsteroids.list) {
      if (!a.active || a.grappled) continue;
      if (scShip.orbitalShield && a === scShip.orbitalShield.asteroid) continue;
      if (a.hits(scShip.x, scShip.y, SC.SHIP.BODY_R * 0.7, SC.SHIP.BODY_R * 0.7)) {
        a.active = false;
        scExplosions.push(new ScExplosion(a.x, a.y, a.r * 0.8));
        _scHitShip(false);
        if (a.type === 'VOLATILE') {
          // Explose en zone aussi
          _scExplodeVolatile(a.x, a.y);
        }
        break;
      }
    }
  }

  // Balles joueur (cannon + lasers) vs ennemis
  const playerBullets = scBullets.player;
  for (const b of playerBullets) {
    if (!b.active) continue;
    for (const e of scWave.enemies) {
      if (!e.active) continue;
      if (b.hitIds && b.hitIds.has(e.id)) continue;
      if (e.hitsPoint(b.x, b.y, 2)) {
        const res = e.receiveHit(b);
        scTurret && b.kind === 'laser' && (scTurret.shotsHit += (res.damage > 0 ? 1 : 0));
        if (b.kind === 'cannon' && res.damage > 0) scShip.shotsHit++;
        if (b.pierce) {
          b.hitIds.add(e.id);
          // traverse : on continue la boucle
        } else {
          b.active = false;
        }
        if (res.blocked) {
          scExplosions.push(new ScExplosion(b.x, b.y, 8, ['#FFFFFF', '#DDDDDD']));
        } else if (res.damage > 0 && !e.active) {
          _scOnEnemyKilled(e);
        } else if (res.damage > 0) {
          scExplosions.push(new ScExplosion(b.x, b.y, 8, ['#FFCC66', '#FF6644']));
        }
        if (!b.pierce) break;
      }
    }
    // Balles joueur vs asteroides (lasers uniquement les cassent ?)
    // Pour MVP, les balles n'interagissent pas avec les asteroides.
  }

  // Balles ennemies vs ship
  if (scShip.active) {
    for (const b of scBullets.enemy) {
      if (!b.active) continue;
      const dx = b.x - scShip.x, dy = b.y - scShip.y;
      if (dx * dx + dy * dy < SC.SHIP.BODY_R * SC.SHIP.BODY_R) {
        b.active = false;
        _scHitShip(false);
        break;
      }
    }
  }
}

function _scOnEnemyKilled(e) {
  scData.kills++;
  scExplosions.push(new ScExplosion(e.x, e.y, e.size * 1.2));
  scFloatTexts.push(new ScFloatText(e.x, e.y, `+${e.spec.pts}`, SC.COLOR.HUD_GOLD));
  // Brise le lien swarm si concerné
  if (e.type === 'SWARM') scWave.breakSwarmLinkOn(e);
}

function _scHitShip(fromComet) {
  if (scShip.hit()) {
    scExplosions.push(new ScExplosion(scShip.x, scShip.y, 40, ['#FFDD66', '#FF8822', '#FF2200']));
  } else if (!fromComet) {
    scExplosions.push(new ScExplosion(scShip.x, scShip.y, 20, ['#FFCC66', '#FF8822']));
  }
}

// ── Grapple events ──────────────────────────────────────
function _scOnGrappleEvent(evt) {
  if (evt.kind === 'enemySlam') {
    // Double kill
    scData.kills += 2;
    scExplosions.push(new ScExplosion(evt.x, evt.y, 30, ['#FFCC66', '#FF8822']));
    scFloatTexts.push(new ScFloatText(evt.x, evt.y, 'DOUBLE !', SC.COLOR.HUD_GOLD));
    if (evt.target.type === 'SWARM') scWave.breakSwarmLinkOn(evt.target);
    if (evt.prey.type === 'SWARM') scWave.breakSwarmLinkOn(evt.prey);
    return;
  }
  if (evt.kind === 'arrived') {
    const p = evt.prey;
    if (evt.preyKind === 'ast') {
      if (p.type === 'FER') {
        scData.metal += SC.ASTEROID.METAL_FER;
        scFloatTexts.push(new ScFloatText(evt.x, evt.y - 20, '+1 METAL', SC.COLOR.METAL));
      } else if (p.type === 'OR') {
        scData.metal += SC.ASTEROID.METAL_OR;
        scFloatTexts.push(new ScFloatText(evt.x, evt.y - 20, '+5 METAL', SC.COLOR.HUD_GOLD));
      } else if (p.type === 'GLACE') {
        scTurret.coolDownFull();
        scFloatTexts.push(new ScFloatText(evt.x, evt.y - 20, 'COOL!', SC.COLOR.LASER_COOL));
      } else if (p.type === 'VOLATILE') {
        scData.metal += SC.ASTEROID.METAL_VOLATILE;
        scFloatTexts.push(new ScFloatText(evt.x, evt.y - 20, 'BOOM! +2', SC.COLOR.VOLATILE_ORE));
        _scExplodeVolatile(evt.x, evt.y);
      }
      p.active = false;
    }
    else if (evt.preyKind === 'astBig') {
      // Devient bouclier orbital. On laisse grappled=true pour que l'AsteroidManager
      // n'applique pas sa gravite ; l'orbite est pilotee par ScOrbitalShield.
      scShip.attachOrbitalShield(p);
      scFloatTexts.push(new ScFloatText(evt.x, evt.y - 20, 'BOUCLIER !', SC.COLOR.SHIELD_RING));
    }
    else if (evt.preyKind === 'enemy') {
      // Ennemi tiré au contact : le retourner + légers dégats + brise eventuel lien swarm
      p.grappled = false;
      p.onGrappled && p.onGrappled();
      if (p.type === 'SWARM') scWave.breakSwarmLinkOn(p);
      // inflige 1 degat symbolique
      p.hp = Math.max(0, p.hp - 1);
      if (p.hp <= 0) { p.active = false; _scOnEnemyKilled(p); }
      scExplosions.push(new ScExplosion(evt.x, evt.y, 14, ['#FFCCAA', '#FFAA44']));
    }
  }
}

function _scExplodeVolatile(x, y) {
  scShockwaves.push(new ScShockwave(x, y, SC.ASTEROID.VOLATILE_RADIUS, '#FF6622'));
  scExplosions.push(new ScExplosion(x, y, SC.ASTEROID.VOLATILE_RADIUS * 0.8,
                    ['#FFDD66', '#FF6622', '#AA2200']));
  // Degats aux ennemis dans le rayon
  for (const e of scWave.enemies) {
    if (!e.active) continue;
    const dx = e.x - x, dy = e.y - y;
    if (dx * dx + dy * dy < SC.ASTEROID.VOLATILE_RADIUS ** 2) {
      e.hp -= SC.ASTEROID.VOLATILE_DAMAGE;
      if (e.hp <= 0) { e.active = false; _scOnEnemyKilled(e); }
    }
  }
  // Detruit autres asteroides proches
  for (const a of scAsteroids.list) {
    if (!a.active || a.grappled) continue;
    const dx = a.x - x, dy = a.y - y;
    if (dx * dx + dy * dy < SC.ASTEROID.VOLATILE_RADIUS ** 2) {
      a.active = false;
      scExplosions.push(new ScExplosion(a.x, a.y, a.r * 0.6));
    }
  }
}

function _scApplyShopEffect(id) {
  if (id === 'COOL') {
    // +25% capacite chaleur (cumulable). On agrandit heatCapacity.
    const cur = scTurret.heatCapacity || SC.TURRET.HEAT_MAX;
    scTurret.heatCapacity = cur + SC.TURRET.HEAT_MAX * 0.25;
  } else if (id === 'GRAPPLE') {
    scGrapple.setRange(SC.GRAPPLE.RANGE * 1.5);
  } else if (id === 'LIFE') {
    scShip.raiseMaxLives(1);
  } else if (id === 'CANNON') {
    scShip.upgradeCannon();
  }
}

// ── Fin de partie ────────────────────────────────────────
function _scEndGame() {
  if (scState === 'gameover') return;
  scState = 'gameover';
  const d = scData;
  d.shotsFired = scTurret.shotsFired + scShip.shotsFired;
  d.shotsHit   = scTurret.shotsHit   + scShip.shotsHit;

  fetch('/api/starcrew/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      p1_name:         scP1name,
      p2_name:         scP2name,
      kills:           d.kills,
      waves_completed: d.wavesCompleted,
      metal_collected: d.metal,
      shots_fired:     d.shotsFired,
      shots_hit:       d.shotsHit,
    }),
  })
  .then(r => r.json())
  .then(res => { d.score = res.score || 0; })
  .catch(() => { d.score = d.kills * 100 + d.wavesCompleted * 500 + d.metal * 10; })
  .finally(() => {
    fetch('/api/starcrew/scores')
      .then(r => r.json())
      .catch(() => [])
      .then(scores => showCrewGameOver(d, scP1name, scP2name, scores));
  });
}

// ── Render ───────────────────────────────────────────────
function _scRender() {
  const ctx = scCtx;

  ctx.fillStyle = SC.COLOR.BG;
  ctx.fillRect(0, 0, SC.W, SC.H);
  scStars.render(ctx);

  if (scState === 'idle') return;

  // Ordre : asteroides en fond, ennemis, ship, balles, effets, HUD
  scAsteroids.render(ctx);
  scWave.render(ctx);
  scEvents.render(ctx);
  scGrapple.render(ctx, scShip.x, scShip.y, SC.COLOR.P2);
  scShip.render(ctx);
  scTurret.renderAimIndicator(ctx, scShip.x, scShip.y);
  scTurret.render(ctx, scShip.x, scShip.y);
  scBullets.renderAll(ctx);
  for (const ex of scExplosions) ex.render(ctx);
  for (const sw of scShockwaves) sw.render(ctx);
  for (const ft of scFloatTexts) ft.render(ctx);

  // Blackout rendu AVANT HUD pour que le HUD reste lisible
  if (scEvents.isBlackout() && scShip.active)
    drawScBlackout(ctx, scShip.x, scShip.y);

  // HUD
  if (scData) drawScHUD(ctx, scData, scShip, scTurret, scP1name, scP2name, scWave, scEvents);

  // Annonces
  if (scAnnounceAlpha > 0) drawScWaveAnnounce(ctx, scAnnounceText, scAnnounceAlpha);
  if (scEvents.announceAlpha > 0) drawScAnnounce(ctx, scEvents.announceText, scEvents.announceAlpha);

  if (SC_IS_TOUCH && scState === 'playing') drawScMobileButtons(ctx);
}
