'use strict';
class PPBall {
  constructor(vx, vy) {
    this.x  = PP.W / 2;
    this.y  = PP.H / 2;
    this.vx = vx;
    this.vy = vy;
    this.r  = PP.BALL_R;
    this.invisible  = false;
    this.invisTimer = 0;
    this.curveFactor = 0;
  }

  update(dt, bumpers) {
    if (this.curveFactor !== 0) {
      this.vy += this.curveFactor * dt;
      this.curveFactor *= Math.pow(0.15, dt);
      if (Math.abs(this.curveFactor) < 0.5) this.curveFactor = 0;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.y - this.r < 0)      { this.y = this.r;           this.vy =  Math.abs(this.vy); this.curveFactor = 0; }
    if (this.y + this.r > PP.H)   { this.y = PP.H - this.r;    this.vy = -Math.abs(this.vy); this.curveFactor = 0; }

    if (this.invisible) {
      this.invisTimer -= dt * 1000;
      if (this.invisTimer <= 0) this.invisible = false;
    }

    for (const b of bumpers) {
      const dx = this.x - b.x, dy = this.y - b.y;
      const d  = Math.hypot(dx, dy);
      if (d < this.r + b.r && d > 0) {
        const nx = dx / d, ny = dy / d;
        const dot = this.vx * nx + this.vy * ny;
        this.vx -= 2 * dot * nx;
        this.vy -= 2 * dot * ny;
        this.x = b.x + (this.r + b.r + 1) * nx;
        this.y = b.y + (this.r + b.r + 1) * ny;
        this.curveFactor = 0;
      }
    }
  }

  draw(ctx) {
    if (this.invisible) return;
    ctx.save();
    ctx.fillStyle = PP.COLOR.BALL;
    ctx.shadowBlur = 14; ctx.shadowColor = PP.COLOR.BALL;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function ppMakeBall(toRight) {
  const angle = (Math.random() * 50 - 25) * Math.PI / 180;
  const s = PP.BALL_SPEED_INIT;
  const d = toRight ? 1 : -1;
  return new PPBall(d * Math.cos(angle) * s, Math.sin(angle) * s);
}
