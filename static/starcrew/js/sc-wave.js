/**
 * sc-wave.js — gestion des vagues StarCrew.
 *
 * Composition des vagues :
 *   - Vague 1-2 : grunts
 *   - Vague 3+ : quelques tanks (~20%)
 *   - Vague 4+ : swarm en chaine (3 lies)
 *   - Vague 5+ : shield (quelques-uns)
 */

class ScWaveManager {
  constructor(bulletPool) {
    this.bulletPool  = bulletPool;
    this.enemies     = [];
    this.waveNumber  = 0;
    this.spawnQueue  = [];       // liste { type, delay } a spawner
    this.spawnTimer  = 0;
    this.active      = false;
  }

  reset() {
    this.enemies    = [];
    this.waveNumber = 0;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.active     = false;
  }

  startWave(n) {
    this.waveNumber = n;
    this.enemies = [];
    this.spawnQueue = [];
    const waveBonus = (n - 1) * SC.WAVE.SPEED_MULT;
    const count = Math.min(
      SC.WAVE.MAX_COUNT,
      SC.WAVE.BASE_COUNT + (n - 1) * SC.WAVE.COUNT_STEP,
    );

    // Types possibles selon vague
    const pool = ['GRUNT'];
    if (n >= 3) pool.push('TANK');
    if (n >= 5) pool.push('SHIELD');

    // Spawn sequentiel
    let delay = 0.15;
    for (let i = 0; i < count; i++) {
      const type = pool[Math.floor(Math.random() * pool.length)];
      this.spawnQueue.push({ type, delay });
      delay = 0.35 + Math.random() * 0.35;
    }
    // Ajout swarm (chaine de 3) a partir de vague 4, max 2 chaines
    if (n >= 4) {
      const chains = Math.min(2, 1 + Math.floor((n - 4) / 3));
      for (let c = 0; c < chains; c++) {
        this.spawnQueue.push({ type: 'SWARM_CHAIN', delay: 0.6 + c * 0.8 });
      }
    }

    this.spawnTimer = 0;
    this.active = true;
  }

  update(dt, playerX, playerY, speedMult) {
    // Spawn queue
    if (this.spawnQueue.length > 0) {
      this.spawnTimer += dt;
      while (this.spawnQueue.length > 0 && this.spawnTimer >= this.spawnQueue[0].delay) {
        const next = this.spawnQueue.shift();
        this.spawnTimer = 0;
        this._spawn(next.type);
      }
    }
    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt * speedMult, this, this.bulletPool, playerX, playerY);
      if (!e.active) {
        // Si c'etait un swarm lie, casse le lien avec voisins
        if (e.type === 'SWARM') this._breakSwarmLink(e);
        this.enemies.splice(i, 1);
      }
    }
  }

  isWaveComplete() {
    return this.active && this.enemies.length === 0 && this.spawnQueue.length === 0;
  }

  _spawn(type) {
    if (type === 'SWARM_CHAIN') {
      // 3 swarm lies
      const baseX = 80 + Math.random() * (SC.W - 160);
      const waveBonus = (this.waveNumber - 1) * SC.WAVE.SPEED_MULT;
      const drones = [];
      for (let i = 0; i < 3; i++) {
        const e = new ScEnemy('SWARM', baseX + i * 30 - 30, -30 - i * 16, waveBonus);
        e.linked = true;
        drones.push(e);
        this.enemies.push(e);
      }
      drones[0].swarmNext = drones[1];
      drones[1].swarmPrev = drones[0]; drones[1].swarmNext = drones[2];
      drones[2].swarmPrev = drones[1];
      return;
    }
    const x = 40 + Math.random() * (SC.W - 80);
    const y = -30;
    const waveBonus = (this.waveNumber - 1) * SC.WAVE.SPEED_MULT;
    this.enemies.push(new ScEnemy(type, x, y, waveBonus));
  }

  _breakSwarmLink(e) {
    if (e.swarmPrev) { e.swarmPrev.swarmNext = null; e.swarmPrev.linked = false; }
    if (e.swarmNext) { e.swarmNext.swarmPrev = null; e.swarmNext.linked = false; }
  }

  // Le grapin rompt un lien : isole l'ennemi capturé + ses voisins
  breakSwarmLinkOn(e) {
    e.linked = false;
    if (e.swarmPrev) {
      e.swarmPrev.swarmNext = null;
      // Si le voisin n'a pas d'autre lien, lui aussi est isole
      if (!e.swarmPrev.swarmPrev) e.swarmPrev.linked = false;
    }
    if (e.swarmNext) {
      e.swarmNext.swarmPrev = null;
      if (!e.swarmNext.swarmNext) e.swarmNext.linked = false;
    }
    e.swarmPrev = null; e.swarmNext = null;
  }

  // API pour grapin
  findNearestGrappable(hx, hy, tolerance) {
    let best = null, bestD2 = Infinity;
    for (const e of this.enemies) {
      if (!e.active || e.grappled) continue;
      // Les tanks : OK (on les retourne)
      // Les shield : OK (on les retourne aussi)
      // Les swarm : OK (on brise le lien)
      const dx = e.x - hx, dy = e.y - hy;
      const d2 = dx * dx + dy * dy;
      const r  = e.size + tolerance;
      if (d2 < r * r && d2 < bestD2) { best = e; bestD2 = d2; }
    }
    return best;
  }

  findOtherAtPoint(excludeEnemy, px, py, r) {
    for (const e of this.enemies) {
      if (!e.active || e === excludeEnemy) continue;
      const dx = e.x - px, dy = e.y - py;
      if (dx * dx + dy * dy < (e.size + r) ** 2) return e;
    }
    return null;
  }

  render(ctx) {
    _scRenderSwarmLinks(ctx, this.enemies);
    for (const e of this.enemies) e.render(ctx);
  }
}
