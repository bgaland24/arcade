/**
 * Terrain — génération procédurale, destruction, rendu.
 * Les hauteurs sont stockées en pixel par colonne X.
 */
class Terrain {
  constructor(width, height) {
    this.width  = width;
    this.height = height;
    this.heights = new Float32Array(width);
    this.generate();

    // Cache du gradient (recréé si la fenêtre change)
    this._gradCache = null;
  }

  // ── Génération ──────────────────────────────────────────
  generate() {
    const seed1 = Math.random() * Math.PI * 2;
    const seed2 = Math.random() * Math.PI * 2;
    const seed3 = Math.random() * Math.PI * 2;
    const base  = this.height * CONFIG.TERRAIN_BASE_RATIO;

    for (let x = 0; x < this.width; x++) {
      let h = base;
      h += Math.sin(x * 0.007 + seed1) * CONFIG.TERRAIN_AMP1;
      h += Math.sin(x * 0.016 + seed2) * CONFIG.TERRAIN_AMP2;
      h += Math.sin(x * 0.042 + seed3) * CONFIG.TERRAIN_AMP3;
      this.heights[x] = h;
    }

    // Limites min/max
    const lo = this.height * 0.26;
    const hi = this.height * 0.88;
    for (let x = 0; x < this.width; x++) {
      this.heights[x] = Math.max(lo, Math.min(hi, this.heights[x]));
    }

    // Lissage pour éviter les pentes trop abruptes
    for (let pass = 0; pass < CONFIG.TERRAIN_SMOOTH_PASS; pass++) {
      for (let x = 1; x < this.width - 1; x++) {
        this.heights[x] = (this.heights[x - 1] + this.heights[x] * 2 + this.heights[x + 1]) / 4;
      }
    }

    this._gradCache = null;
  }

  // ── Accesseur ───────────────────────────────────────────
  getY(x) {
    const xi = Math.max(0, Math.min(this.width - 1, Math.round(x)));
    return this.heights[xi];
  }

  // ── Destruction (cratère circulaire) ────────────────────
  destroy(cx, cy, radius) {
    const x0 = Math.max(0,              Math.floor(cx - radius));
    const x1 = Math.min(this.width - 1, Math.ceil(cx  + radius));
    for (let x = x0; x <= x1; x++) {
      const dx    = x - cx;
      const depth = Math.sqrt(Math.max(0, radius * radius - dx * dx));
      const floor = cy + depth;
      if (floor > this.heights[x]) {
        this.heights[x] = Math.min(floor, this.height - 2);
      }
    }
    this._gradCache = null;
  }

  // ── Rendu ───────────────────────────────────────────────
  render(ctx) {
    const W = this.width;
    const H = this.height;

    // Gradient de terrain (recréé une fois)
    if (!this._gradCache) {
      this._gradCache = ctx.createLinearGradient(0, 220, 0, H);
      this._gradCache.addColorStop(0,   CONFIG.COLOR.TERRAIN_TOP);
      this._gradCache.addColorStop(0.3, CONFIG.COLOR.TERRAIN_MID);
      this._gradCache.addColorStop(1,   CONFIG.COLOR.TERRAIN_BOT);
    }

    // Contour + remplissage
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, this.heights[0]);
    for (let x = 1; x < W; x++) {
      ctx.lineTo(x, this.heights[x]);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = this._gradCache;
    ctx.fill();

    // Ligne de surface
    ctx.beginPath();
    ctx.moveTo(0, this.heights[0]);
    for (let x = 1; x < W; x++) {
      ctx.lineTo(x, this.heights[x]);
    }
    ctx.strokeStyle = CONFIG.COLOR.TERRAIN_LINE;
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Petits détails pixel-art (graviers)
    ctx.fillStyle = CONFIG.COLOR.TERRAIN_BOT;
    for (let i = 0; i < 100; i++) {
      const tx = (i * 113 + 47) % W;
      const ty = this.getY(tx) + 5 + (i * 37) % 18;
      if (ty < H - 4) ctx.fillRect(tx, ty, 2, 2);
    }
  }
}
