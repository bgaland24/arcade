'use strict';

let ppCanvas, ppCtx;
let ppState = 'idle';
let ppRafId = null, ppLastTime = null;
let ppP1, ppP2, ppBalls, ppBonusZone, ppMovingBonus, ppBumpers;
let ppBonusSpawnTimer, ppGameTime, ppServeTimer, ppServeRight;

function ppInit() {
  ppCanvas = document.getElementById('pp-canvas');
  ppCtx    = ppCanvas.getContext('2d');

  document.getElementById('pp-start-btn').addEventListener('click', ppStartGame);
  document.getElementById('pp-p1name').addEventListener('keydown', e => { if (e.key === 'Enter') ppStartGame(); });
  document.getElementById('pp-p2name').addEventListener('keydown', e => { if (e.key === 'Enter') ppStartGame(); });
  document.getElementById('pp-replay-btn').addEventListener('click', ppStartGame);
  document.getElementById('pp-lobby-btn').addEventListener('click', () => { window.location.href = '/lobby'; });

  ppRenderIdle();
}

function ppRenderIdle() {
  const ctx = ppCtx;
  ppDrawBackground(ctx);
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = PP.COLOR.P1;
  ctx.fillRect(PP.PADDLE_X_OFFSET, PP.H / 2 - PP.PADDLE_H / 2, PP.PADDLE_W, PP.PADDLE_H);
  ctx.fillStyle = PP.COLOR.P2;
  ctx.fillRect(PP.W - PP.PADDLE_X_OFFSET - PP.PADDLE_W, PP.H / 2 - PP.PADDLE_H / 2, PP.PADDLE_W, PP.PADDLE_H);
  ctx.globalAlpha = 1;
}

function ppStartGame() {
  const n1 = (document.getElementById('pp-p1name').value.trim() || 'Joueur 1').slice(0, 12);
  const n2 = (document.getElementById('pp-p2name').value.trim() || 'Joueur 2').slice(0, 12);
  ppHideWelcome(); ppHideGameOver();

  ppP1 = new PPPaddle('left',  n1);
  ppP2 = new PPPaddle('right', n2);
  ppBalls           = [];
  ppBonusZone       = null;
  ppMovingBonus     = null;
  ppBumpers         = [];
  ppBonusSpawnTimer = 6000;
  ppGameTime        = 0;
  ppServeRight      = Math.random() < 0.5;
  ppState           = 'serving';
  ppServeTimer      = PP.SERVE_DELAY_MS;

  ppLastTime = null;
  if (ppRafId) cancelAnimationFrame(ppRafId);
  ppRafId = requestAnimationFrame(ppLoop);
}

function ppLoop(ts) {
  if (!ppLastTime) ppLastTime = ts;
  const dt = Math.min((ts - ppLastTime) / 1000, 0.05);
  ppLastTime = ts;
  ppUpdate(dt);
  ppRender();
  if (ppState !== 'gameover') ppRafId = requestAnimationFrame(ppLoop);
}

function ppUpdate(dt) {
  if (ppState === 'serving') {
    ppP1.update(dt, PP_INPUT.p1Up, PP_INPUT.p1Down);
    ppP2.update(dt, PP_INPUT.p2Up, PP_INPUT.p2Down);
    ppServeTimer -= dt * 1000;
    if (ppServeTimer <= 0) {
      ppBalls = [ppMakeBall(ppServeRight)];
      ppState = 'playing';
    }
    return;
  }
  if (ppState !== 'playing') return;

  ppGameTime += dt * 1000;
  ppP1.update(dt, PP_INPUT.p1Up, PP_INPUT.p1Down);
  ppP2.update(dt, PP_INPUT.p2Up, PP_INPUT.p2Down);

  for (let i = ppBalls.length - 1; i >= 0; i--) {
    const ball = ppBalls[i];
    ball.update(dt, ppBumpers);

    if (ball.x + ball.r < 0) {
      ppP2.score++;
      ppBalls.splice(i, 1);
      if (ppP2.score >= PP.WIN_SCORE) { ppEndGame(); return; }
      if (ppBalls.length === 0) ppPoint(false);
      continue;
    }
    if (ball.x - ball.r > PP.W) {
      ppP1.score++;
      ppBalls.splice(i, 1);
      if (ppP1.score >= PP.WIN_SCORE) { ppEndGame(); return; }
      if (ppBalls.length === 0) ppPoint(true);
      continue;
    }
    ppPaddleHit(ball, ppP1, ppP2);
    ppPaddleHit(ball, ppP2, ppP1);
  }

  for (let i = ppBumpers.length - 1; i >= 0; i--) {
    ppBumpers[i].update(dt);
    if (ppBumpers[i].expired) ppBumpers.splice(i, 1);
  }

  if (ppBonusZone) {
    ppBonusZone.update(dt);
    if (ppBonusZone.expired) {
      ppBonusZone = null; ppBonusSpawnTimer = PP.BONUS_SPAWN_DELAY;
    } else {
      for (const b of ppBalls) {
        if (ppBonusZone.hitByBall(b)) {
          ppMovingBonus = new PPMovingBonus(ppBonusZone);
          ppBonusZone = null; break;
        }
      }
    }
  }

  if (ppMovingBonus) {
    ppMovingBonus.update(dt);
    if (ppMovingBonus.expired) {
      ppMovingBonus = null; ppBonusSpawnTimer = PP.BONUS_SPAWN_DELAY;
    } else {
      const target = ppMovingBonus.toLeft ? ppP1 : ppP2;
      const other  = ppMovingBonus.toLeft ? ppP2 : ppP1;
      if (ppMovingBonus.hitsPaddle(target)) {
        ppActivateBonus(ppMovingBonus.type, target, other);
        ppMovingBonus = null; ppBonusSpawnTimer = PP.BONUS_SPAWN_DELAY;
      }
    }
  }

  if (!ppBonusZone && !ppMovingBonus) {
    ppBonusSpawnTimer -= dt * 1000;
    if (ppBonusSpawnTimer <= 0) { ppBonusZone = new PPBonusZone(); ppBonusSpawnTimer = 0; }
  }
}

function ppPaddleHit(ball, paddle, opponent) {
  if (!paddle.hitsBall(ball)) return;
  const towardMe = (paddle.side === 'left'  && ball.vx < 0) ||
                   (paddle.side === 'right' && ball.vx > 0);
  if (!towardMe) return;

  const impact = paddle.impactRatio(ball);
  const angle  = impact * (65 * Math.PI / 180);
  let   speed  = Math.min(Math.hypot(ball.vx, ball.vy) + PP.BALL_SPEED_INC, PP.BALL_SPEED_MAX);
  const dir    = paddle.side === 'left' ? 1 : -1;

  if (paddle.bonus === 'TURBO') { speed = Math.min(speed * 2, PP.BALL_SPEED_MAX); paddle._expire(); }

  ball.vx = dir * Math.cos(angle) * speed;
  ball.vy = Math.sin(angle) * speed;

  if (paddle.side === 'left')  ball.x = Math.max(ball.x, paddle.x + paddle.w / 2 + ball.r + 1);
  else                         ball.x = Math.min(ball.x, paddle.x - paddle.w / 2 - ball.r - 1);

  if (paddle.bonus === 'GHOST') { ball.invisible = true; ball.invisTimer = 2000; paddle._expire(); }
  if (paddle.bonus === 'CURVE') { ball.curveFactor = impact * 130; }
}

function ppActivateBonus(type, player, opponent) {
  switch (type) {
    case 'BIG':    player.applyBonus('BIG');      break;
    case 'TINY':   opponent.applyBonus('TINY');   break;
    case 'FREEZE': opponent.applyBonus('FREEZE'); break;
    case 'TURBO':
    case 'GHOST':
    case 'CURVE':  player.applyBonus(type);       break;
    case 'SPLIT':
      if (ppBalls.length === 1) {
        const orig  = ppBalls[0];
        const a     = (Math.random() * 50 - 25) * Math.PI / 180;
        const spd   = Math.hypot(orig.vx, orig.vy);
        const clone = new PPBall(
          (orig.vx > 0 ? -1 : 1) * Math.cos(a) * spd,
          Math.sin(a) * spd
        );
        ppBalls.push(clone);
      }
      break;
    case 'BUMPER':
      ppBumpers = ppSpawnBumpers();
      break;
  }
}

function ppPoint(p1Scored) {
  ppServeRight = p1Scored;
  ppState      = 'serving';
  ppServeTimer = PP.SERVE_DELAY_MS;
}

function ppEndGame() {
  ppState = 'gameover';
  const winner  = ppP1.score >= PP.WIN_SCORE ? ppP1 : ppP2;
  const loser   = winner === ppP1 ? ppP2 : ppP1;
  const timeSec = ppGameTime / 1000;

  fetch('/api/pongpong/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      winner_name:  winner.name,
      loser_name:   loser.name,
      winner_score: winner.score,
      loser_score:  loser.score,
      time_seconds: Math.round(timeSec),
    }),
  }).catch(() => {})
  .finally(() => {
    fetch('/api/pongpong/scores').then(r => r.json()).catch(() => [])
      .then(scores => ppShowGameOver(winner.name, ppP1, ppP2, timeSec, scores));
  });
}

function ppRender() {
  const ctx = ppCtx;
  ppDrawBackground(ctx);
  for (const b of ppBumpers)   b.draw(ctx);
  if (ppBonusZone)   ppBonusZone.draw(ctx);
  if (ppMovingBonus) ppMovingBonus.draw(ctx);
  ppP1.draw(ctx); ppP2.draw(ctx);
  for (const b of ppBalls) b.draw(ctx);
  ppDrawScores(ctx, ppP1, ppP2);
  ppDrawBonusIndicators(ctx, ppP1, ppP2);
  if (ppState === 'serving') {
    const s = Math.ceil(ppServeTimer / 1000);
    ppDrawCountdown(ctx, s > 0 ? String(s) : '');
  }
}

window.addEventListener('DOMContentLoaded', ppInit);
