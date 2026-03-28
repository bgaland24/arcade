'use strict';

function ppDrawBackground(ctx) {
  ctx.fillStyle = PP.COLOR.BG;
  ctx.fillRect(0, 0, PP.W, PP.H);
  ctx.strokeStyle = PP.COLOR.CENTER;
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 10]);
  ctx.beginPath(); ctx.moveTo(PP.W / 2, 0); ctx.lineTo(PP.W / 2, PP.H); ctx.stroke();
  ctx.setLineDash([]);
}

function ppDrawScores(ctx, p1, p2) {
  ctx.save();
  ctx.font = 'bold 88px "Courier New"';
  ctx.textBaseline = 'top';

  ctx.fillStyle = PP.COLOR.SCORE_BG;
  ctx.textAlign = 'right';
  ctx.fillText(p1.score, PP.W / 2 - 24, 8);
  ctx.textAlign = 'left';
  ctx.fillText(p2.score, PP.W / 2 + 24, 8);

  ctx.font = '9px "Courier New"';
  ctx.fillStyle = PP.COLOR.P1; ctx.textAlign = 'left';
  ctx.fillText(p1.name.toUpperCase(), PP.PADDLE_X_OFFSET + PP.PADDLE_W + 8, 8);
  ctx.fillStyle = PP.COLOR.P2; ctx.textAlign = 'right';
  ctx.fillText(p2.name.toUpperCase(), PP.W - PP.PADDLE_X_OFFSET - PP.PADDLE_W - 8, 8);
  ctx.restore();
}

function ppDrawBonusIndicators(ctx, p1, p2) {
  _bonusTag(ctx, p1, PP.PADDLE_X_OFFSET + PP.PADDLE_W + 8, PP.H - 10, false);
  _bonusTag(ctx, p2, PP.W - PP.PADDLE_X_OFFSET - PP.PADDLE_W - 8, PP.H - 10, true);
}

function _bonusTag(ctx, paddle, x, y, right) {
  if (!paddle.bonus) return;
  const col = PP.BONUS_COLOR[paddle.bonus];
  const suf = paddle.bonusTimer > 0 ? ' ' + (paddle.bonusTimer / 1000).toFixed(1) + 's' : '';
  ctx.save();
  ctx.font = 'bold 9px "Courier New"';
  ctx.textAlign = right ? 'right' : 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = col; ctx.shadowBlur = 6; ctx.shadowColor = col;
  ctx.fillText(paddle.bonus + suf, x, y);
  ctx.restore();
}

function ppDrawCountdown(ctx, text) {
  if (!text) return;
  ctx.save();
  ctx.font = 'bold 52px "Courier New"';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFD700';
  ctx.shadowBlur = 22; ctx.shadowColor = '#FFD700';
  ctx.fillText(text, PP.W / 2, PP.H / 2);
  ctx.restore();
}
