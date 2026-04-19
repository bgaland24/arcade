/**
 * derby-obstacle.js — haies a sauter.
 *
 * Chaque couloir a son propre manager. Obstacles en world-space, consommes
 * (puis retires) quand leur worldX < horse.worldX - 50.
 */

class DerbyHurdle {
  constructor(worldX, laneY) {
    this.worldX = worldX;
    this.laneY  = laneY;
    this.w      = DRB.OBST.HURDLE_W;
    this.h      = DRB.OBST.HURDLE_H;
    this.active = true;
    this.hitStatus = null;  // null, 'JUMPED_OK', 'CRASHED'
  }
  render(ctx, screenX, groundY) {
    if (!this.active) return;
    const x = screenX;
    const y = groundY - this.h + 4;
    // Barre horizontale
    ctx.fillStyle = DRB.COLOR.HURDLE_DARK;
    ctx.fillRect(x - 2, y - 2, this.w + 4, 4);
    ctx.fillStyle = DRB.COLOR.HURDLE;
    ctx.fillRect(x, y, this.w, 3);
    ctx.fillRect(x + this.w * 0.2, y, this.w * 0.15, 3);
    // Montants
    ctx.fillStyle = DRB.COLOR.HURDLE_DARK;
    ctx.fillRect(x, y, 2, this.h);
    ctx.fillRect(x + this.w - 2, y, 2, this.h);
    // Fanion
    ctx.fillStyle = DRB.COLOR.P1_SADDLE;
    ctx.fillRect(x - 2, y - 6, 6, 4);
  }
}

class DerbyObstacleMgr {
  constructor(lane) {
    this.lane = lane;                    // 0 ou 1
    this.laneTop = lane === 0 ? DRB.LANE1_TOP : DRB.LANE2_TOP;
    this.laneBot = lane === 0 ? DRB.LANE1_BOT : DRB.LANE2_BOT;
    this.groundY = this.laneBot - DRB.HORSE.GROUND_OFFSET;
    this.list = [];
    this.spawnTimer = 2.5;
  }

  reset() { this.list = []; this.spawnTimer = 2.5; }

  update(dt, gameTime, horseWorldX) {
    // Intervalle qui raccourcit avec le temps
    const t = Math.min(1, gameTime / DRB.OBST.SPAWN_RAMP_SECONDS);
    const interval = DRB.OBST.SPAWN_START_INTERVAL * (1 - t)
                   + DRB.OBST.SPAWN_MIN_INTERVAL * t;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this._spawn(horseWorldX);
      // Random jitter
      this.spawnTimer = interval * (0.8 + Math.random() * 0.4);
    }

    // Garbage collect
    for (let i = this.list.length - 1; i >= 0; i--) {
      if (this.list[i].worldX < horseWorldX - 60) this.list.splice(i, 1);
    }
  }
  _spawn(horseWorldX) {
    const worldX = horseWorldX + DRB.OBST.SPAWN_AHEAD_X;
    this.list.push(new DerbyHurdle(worldX, this.laneBot));
  }

  // Trouve la prochaine hurdle a proximite pour detection saut
  upcomingHurdle(horseWorldX, lookahead) {
    let best = null, bestGap = Infinity;
    for (const h of this.list) {
      if (!h.active) continue;
      const gap = h.worldX - horseWorldX;
      if (gap > -4 && gap < lookahead && gap < bestGap) { best = h; bestGap = gap; }
    }
    return best;
  }

  render(ctx, horseScreenX, horseWorldX) {
    for (const h of this.list) {
      const delta = h.worldX - horseWorldX;
      const screenX = horseScreenX + delta * 0.45;  // meme scale que horse
      if (screenX < -30 || screenX > DRB.W + 30) continue;
      h.render(ctx, screenX, this.groundY);
    }
  }
}
