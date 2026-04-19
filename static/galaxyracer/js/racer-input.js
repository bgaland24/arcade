/**
 * racer-input.js — clavier + touch pour Galaxy Racer.
 * Actions : left, right, boost.
 */

const RACER_INPUT = {
  p1: { left: false, right: false, boost: false },
  p2: { left: false, right: false, boost: false },
};

const RACER_KEY_MAP = {
  // P1 — ZQSD/AZERTY friendly + WASD
  'KeyA':       ['p1', 'left'],
  'KeyQ':       ['p1', 'left'],
  'KeyD':       ['p1', 'right'],
  'KeyW':       ['p1', 'boost'],
  'KeyZ':       ['p1', 'boost'],
  // P2 — fleches
  'ArrowLeft':  ['p2', 'left'],
  'ArrowRight': ['p2', 'right'],
  'ArrowUp':    ['p2', 'boost'],
};

const RACER_KEYS_PREVENT = new Set(Object.keys(RACER_KEY_MAP));

// ── Zones boutons tactiles (coords canvas 800x450) ───────
const RACER_TOUCH_BUTTONS = {
  p1: {
    left:  { x:   8, y: 370, w: 52, h: 52 },
    right: { x:  64, y: 370, w: 52, h: 52 },
    boost: { x:   8, y: 310, w: 108, h: 52 },
  },
  p2: {
    left:  { x: 684, y: 370, w: 52, h: 52 },
    right: { x: 740, y: 370, w: 52, h: 52 },
    boost: { x: 684, y: 310, w: 108, h: 52 },
  },
};

const _racerActiveTouches = new Map();

function initRacerInput(canvas) {
  document.addEventListener('keydown', e => {
    const m = RACER_KEY_MAP[e.code];
    if (m) {
      RACER_INPUT[m[0]][m[1]] = true;
      if (RACER_KEYS_PREVENT.has(e.code)) e.preventDefault();
    }
  });
  document.addEventListener('keyup', e => {
    const m = RACER_KEY_MAP[e.code];
    if (m) RACER_INPUT[m[0]][m[1]] = false;
  });

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const cp  = _racerScreenToCanvas(t.clientX, t.clientY, canvas);
      const hit = _racerFindButton(cp.x, cp.y);
      if (hit) {
        RACER_INPUT[hit.player][hit.action] = true;
        _racerActiveTouches.set(t.identifier, hit);
      }
    }
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const hit = _racerActiveTouches.get(t.identifier);
      if (hit) {
        RACER_INPUT[hit.player][hit.action] = false;
        _racerActiveTouches.delete(t.identifier);
      }
    }
  }, { passive: false });

  canvas.addEventListener('touchcancel', e => {
    for (const t of e.changedTouches) {
      const hit = _racerActiveTouches.get(t.identifier);
      if (hit) {
        RACER_INPUT[hit.player][hit.action] = false;
        _racerActiveTouches.delete(t.identifier);
      }
    }
  }, { passive: false });
}

function resetRacerInput() {
  for (const p of ['p1', 'p2'])
    for (const k of Object.keys(RACER_INPUT[p])) RACER_INPUT[p][k] = false;
  _racerActiveTouches.clear();
}

function _racerScreenToCanvas(sx, sy, canvas) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (sx - r.left) * (RACER.W / r.width),
    y: (sy - r.top)  * (RACER.H / r.height),
  };
}

function _racerFindButton(cx, cy) {
  for (const player of ['p1', 'p2'])
    for (const [action, btn] of Object.entries(RACER_TOUCH_BUTTONS[player]))
      if (cx >= btn.x && cx <= btn.x + btn.w && cy >= btn.y && cy <= btn.y + btn.h)
        return { player, action };
  return null;
}

const RACER_IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
