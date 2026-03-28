'use strict';

class PPBonusZone {
  constructor() {
    const m = 80, cx = PP.W / 2;
    const left = Math.random() < 0.5;
    this.x    = left ? m + Math.random() * (cx - m * 1.5) : cx + m * 0.5 + Math.random() * (cx - m * 1.5);
    this.y    = m + Math.random() * (PP.H - m * 2);
    this.r    = PP.BONUS_ZONE_R;
    this.type = PP.BONUS_TYPES[Math.floor(Math.random() * PP.BONUS_TYPES.length)];
    this.color = PP.BONUS_COLOR[this.type];
    this.age   = 0;
    this.pulse = Math.random() * Math.PI * 2;
  }

  get expired() { return this.age >= PP.BONUS_ZONE_TIMEOUT; }

  update(dt) { this.age += dt * 1000; this.pulse += dt * 3; }

  hitByBall(ball) { return Math.hypot(ball.x - this.x, ball.y - this.y) < this.r + ball.r; }

  draw(ctx) {
    const fade  = Math.min(1, (PP.BONUS_ZONE_TIMEOUT - this.age) / 2000);
    const scale = 1 + 0.1 * Math.sin(this.pulse);
    ctx.save();
    ctx.globalAlpha = fade * 0.9;
    ctx.translate(this.x, this.y); ctx.scale(scale, scale);
    ctx.strokeStyle = this.color; ctx.lineWidth = 2;
    ctx.shadowBlur = 12; ctx.shadowColor = this.color;
    ctx.fillStyle = this.color + '28';
    ctx.beginPath(); ctx.arc(0, 0, this.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = this.color;
    ctx.font = 'bold 7px "Courier New"';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText(this.type, 0, 0);
    ctx.restore();
  }
}

class PPMovingBonus {
  constructor(zone) {
    this.x     = zone.x; this.y = zone.y;
    this.r     = zone.r; this.type = zone.type; this.color = zone.color;
    this.toLeft = zone.x < PP.W / 2;
    this.vx    = this.toLeft ? -PP.BONUS_MOVE_SPEED : PP.BONUS_MOVE_SPEED;
    this.age   = 0; this.pulse = 0;
  }

  get expired() { return this.age >= PP.BONUS_MOVE_TIMEOUT || this.x < -this.r || this.x > PP.W + this.r; }

  update(dt) { this.x += this.vx * dt; this.age += dt * 1000; this.pulse += dt * 5; }

  hitsPaddle(p) {
    return Math.abs(this.x - p.x) < p.w / 2 + this.r &&
           Math.abs(this.y - p.y) < p.effectiveH / 2 + this.r;
  }

  draw(ctx) {
    const fade = Math.min(1, (PP.BONUS_MOVE_TIMEOUT - this.age) / 1000);
    ctx.save();
    ctx.globalAlpha = fade;
    // Trail
    ctx.strokeStyle = this.color + '35';
    ctx.lineWidth = this.r * 2; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.x + (this.toLeft ? this.r * 4 : -this.r * 4), this.y);
    ctx.lineTo(this.x, this.y); ctx.stroke();
    // Circle
    ctx.strokeStyle = this.color; ctx.lineWidth = 2;
    ctx.shadowBlur = 14; ctx.shadowColor = this.color;
    ctx.fillStyle = this.color + '35';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * (1 + 0.1 * Math.sin(this.pulse)), 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 7px "Courier New"';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText(this.type, this.x, this.y);
    ctx.restore();
  }
}

class PPBumper {
  constructor(x, y) {
    this.x = x; this.y = y; this.r = PP.BUMPER_R;
    this.age = 0; this.pulse = Math.random() * Math.PI * 2;
  }
  get expired() { return this.age >= PP.BUMPER_DURATION; }
  update(dt) { this.age += dt * 1000; this.pulse += dt * 2; }
  draw(ctx) {
    const fade = Math.min(1, (PP.BUMPER_DURATION - this.age) / 2000);
    const r = this.r * (1 + 0.08 * Math.sin(this.pulse));
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.fillStyle = PP.BONUS_COLOR.BUMPER + '28';
    ctx.strokeStyle = PP.BONUS_COLOR.BUMPER; ctx.lineWidth = 2;
    ctx.shadowBlur = 10; ctx.shadowColor = PP.BONUS_COLOR.BUMPER;
    ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}

function ppSpawnBumpers() {
  return [
    new PPBumper(PP.W * 0.35, PP.H * 0.2 + Math.random() * PP.H * 0.6),
    new PPBumper(PP.W * 0.65, PP.H * 0.2 + Math.random() * PP.H * 0.6),
  ];
}
