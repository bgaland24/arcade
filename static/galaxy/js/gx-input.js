/**
 * gx-input.js — clavier + touch pour Galaxy.
 * Actions : up, down, left, right, bomb
 * Le tir est automatique (géré dans PlayerShip).
 */

const GX_INPUT = {
  p1: { up: false, down: false, left: false, right: false, bomb: false },
  p2: { up: false, down: false, left: false, right: false, bomb: false },
};

const GX_KEY_MAP = {
  // Joueur 1 — WASD + Espace
  'KeyW':        ['p1', 'up'],
  'KeyS':        ['p1', 'down'],
  'KeyA':        ['p1', 'left'],
  'KeyD':        ['p1', 'right'],
  'Space':       ['p1', 'bomb'],
  // Joueur 2 — Flèches + Entrée
  'ArrowUp':     ['p2', 'up'],
  'ArrowDown':   ['p2', 'down'],
  'ArrowLeft':   ['p2', 'left'],
  'ArrowRight':  ['p2', 'right'],
  'Enter':       ['p2', 'bomb'],
  'NumpadEnter': ['p2', 'bomb'],
};

const GX_KEYS_PREVENT = new Set(Object.keys(GX_KEY_MAP));

// ── Zones boutons tactiles (coords canvas 800×450) ───────
const GX_TOUCH_BUTTONS = {
  p1: {
    left:  { x:  8,  y: 310, w: 52, h: 52 },
    right: { x:  64, y: 310, w: 52, h: 52 },
    up:    { x:  64, y: 255, w: 52, h: 52 },
    down:  { x:  8,  y: 365, w: 52, h: 52 },
    bomb:  { x:  8,  y: 255, w: 52, h: 52 },
  },
  p2: {
    left:  { x: 680, y: 310, w: 52, h: 52 },
    right: { x: 736, y: 310, w: 52, h: 52 },
    up:    { x: 680, y: 255, w: 52, h: 52 },
    down:  { x: 736, y: 365, w: 52, h: 52 },
    bomb:  { x: 736, y: 255, w: 52, h: 52 },
  },
};

const _gxActiveTouches = new Map();

function initGxInput(canvas) {
  document.addEventListener('keydown', e => {
    const m = GX_KEY_MAP[e.code];
    if (m) {
      GX_INPUT[m[0]][m[1]] = true;
      if (GX_KEYS_PREVENT.has(e.code)) e.preventDefault();
    }
  });
  document.addEventListener('keyup', e => {
    const m = GX_KEY_MAP[e.code];
    if (m) GX_INPUT[m[0]][m[1]] = false;
  });

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const cp  = _gxScreenToCanvas(t.clientX, t.clientY, canvas);
      const hit = _gxFindButton(cp.x, cp.y);
      if (hit) {
        GX_INPUT[hit.player][hit.action] = true;
        _gxActiveTouches.set(t.identifier, hit);
      }
    }
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const hit = _gxActiveTouches.get(t.identifier);
      if (hit) {
        GX_INPUT[hit.player][hit.action] = false;
        _gxActiveTouches.delete(t.identifier);
      }
    }
  }, { passive: false });

  canvas.addEventListener('touchcancel', e => {
    for (const t of e.changedTouches) {
      const hit = _gxActiveTouches.get(t.identifier);
      if (hit) {
        GX_INPUT[hit.player][hit.action] = false;
        _gxActiveTouches.delete(t.identifier);
      }
    }
  }, { passive: false });
}

function resetGxInput() {
  for (const p of ['p1', 'p2'])
    for (const k of Object.keys(GX_INPUT[p])) GX_INPUT[p][k] = false;
  _gxActiveTouches.clear();
}

function _gxScreenToCanvas(sx, sy, canvas) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (sx - r.left) * (GX.W / r.width),
    y: (sy - r.top)  * (GX.H / r.height),
  };
}

function _gxFindButton(cx, cy) {
  for (const player of ['p1', 'p2'])
    for (const [action, btn] of Object.entries(GX_TOUCH_BUTTONS[player]))
      if (cx >= btn.x && cx <= btn.x + btn.w && cy >= btn.y && cy <= btn.y + btn.h)
        return { player, action };
  return null;
}

const GX_IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
