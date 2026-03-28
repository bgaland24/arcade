'use strict';
class PPPaddle {
  constructor(side, name) {
    this.side  = side;
    this.name  = name;
    this.x     = side === 'left'
      ? PP.PADDLE_X_OFFSET + PP.PADDLE_W / 2
      : PP.W - PP.PADDLE_X_OFFSET - PP.PADDLE_W / 2;
    this.y     = PP.H / 2;
    this.w     = PP.PADDLE_W;
    this.h     = PP.PADDLE_H;
    this.color = side === 'left' ? PP.COLOR.P1 : PP.COLOR.P2;
    this.score = 0;
    this.heightMult = 1.0;
    this.speedMult  = 1.0;
    this.bonus      = null;
    this.bonusTimer = 0;
  }

  get effectiveH() { return this.h * this.heightMult; }

  update(dt, up, down) {
    const spd = PP.PADDLE_SPEED * this.speedMult;
    if (up)   this.y -= spd * dt;
    if (down) this.y += spd * dt;
    const half = this.effectiveH / 2;
    this.y = Math.max(half, Math.min(PP.H - half, this.y));

    if (this.bonusTimer > 0) {
      this.bonusTimer -= dt * 1000;
      if (this.bonusTimer <= 0) this._expire();
    }
  }

  _expire() {
    if (this.bonus === 'BIG')    this.heightMult = 1.0;
    if (this.bonus === 'TINY')   this.heightMult = 1.0;
    if (this.bonus === 'FREEZE') this.speedMult  = 1.0;
    this.bonus = null; this.bonusTimer = 0;
  }

  applyBonus(type) {
    this._expire();
    this.bonus = type;
    const d = PP.BONUS_DURATION;
    switch (type) {
      case 'BIG':    this.heightMult = 1.9; this.bonusTimer = d.BIG;    break;
      case 'TINY':   this.heightMult = 0.5; this.bonusTimer = d.TINY;   break;
      case 'FREEZE': this.speedMult  = 0.3; this.bonusTimer = d.FREEZE; break;
      case 'TURBO':
      case 'GHOST':
      case 'CURVE':  this.bonusTimer = d.CURVE; break;
      default: this.bonus = null;
    }
  }

  hitsBall(ball) {
    return ball.x - ball.r < this.x + this.w / 2 &&
           ball.x + ball.r > this.x - this.w / 2 &&
           ball.y - ball.r < this.y + this.effectiveH / 2 &&
           ball.y + ball.r > this.y - this.effectiveH / 2;
  }

  impactRatio(ball) {
    return Math.max(-1, Math.min(1, (ball.y - this.y) / (this.effectiveH / 2)));
  }

  draw(ctx) {
    const h = this.effectiveH;
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10; ctx.shadowColor = this.color;
    ctx.fillRect(this.x - this.w / 2, this.y - h / 2, this.w, h);
    ctx.restore();
  }
}
