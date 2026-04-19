/**
 * sc-input.js — clavier + touch pour StarCrew.
 * P1 : WASD deplacement (canon tire auto).
 * P2 : fleches + Entree (rotation, tir lasers, grapin, shop).
 */

const SC_INPUT = {
  p1: { up: false, down: false, left: false, right: false },
  p2: { rotL: false, rotR: false, fire: false, grapple: false, enter: false },
};

// keydown/keyup maintiennent l'etat
const SC_KEY_HOLD_MAP = {
  'KeyW':        ['p1', 'up'],
  'KeyZ':        ['p1', 'up'],
  'KeyS':        ['p1', 'down'],
  'KeyA':        ['p1', 'left'],
  'KeyQ':        ['p1', 'left'],
  'KeyD':        ['p1', 'right'],
  'ArrowLeft':   ['p2', 'rotL'],
  'ArrowRight':  ['p2', 'rotR'],
  'KeyO':        ['p2', 'fire'],
  'KeyP':        ['p2', 'grapple'],
};
// ces touches sont "edge" (evenement unique) : 'Enter', 'Escape'
const SC_KEYS_PREVENT = new Set([
  ...Object.keys(SC_KEY_HOLD_MAP),
  'Enter', 'NumpadEnter',
]);

// Drapeaux d'evenement one-shot consommes par la boucle
const SC_EVENTS = {
  enterPressed:  false,
  escapePressed: false,
};

// ── Touch zones (canvas coords) ──────────────────────────
const SC_TOUCH_BUTTONS = {
  p1: {
    up:    { x:  64, y: 295, w: 52, h: 52 },
    down:  { x:  64, y: 395, w: 52, h: 52 },
    left:  { x:   8, y: 345, w: 52, h: 52 },
    right: { x: 120, y: 345, w: 52, h: 52 },
  },
  p2: {
    rotL:    { x: 628, y: 345, w: 52, h: 52 },
    rotR:    { x: 740, y: 345, w: 52, h: 52 },
    fire:    { x: 684, y: 295, w: 52, h: 52 },
    grapple: { x: 684, y: 395, w: 52, h: 52 },
  },
};

const _scActiveTouches = new Map();

function initScInput(canvas) {
  document.addEventListener('keydown', e => {
    if (SC_KEY_HOLD_MAP[e.code]) {
      const [p, k] = SC_KEY_HOLD_MAP[e.code];
      SC_INPUT[p][k] = true;
    }
    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      SC_INPUT.p2.enter = true;
      SC_EVENTS.enterPressed = true;
    }
    if (e.code === 'Escape') SC_EVENTS.escapePressed = true;
    if (SC_KEYS_PREVENT.has(e.code) || e.code === 'Escape') e.preventDefault();
  });
  document.addEventListener('keyup', e => {
    if (SC_KEY_HOLD_MAP[e.code]) {
      const [p, k] = SC_KEY_HOLD_MAP[e.code];
      SC_INPUT[p][k] = false;
    }
    if (e.code === 'Enter' || e.code === 'NumpadEnter') SC_INPUT.p2.enter = false;
  });

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const cp  = _scScreenToCanvas(t.clientX, t.clientY, canvas);
      const hit = _scFindButton(cp.x, cp.y);
      if (hit) {
        SC_INPUT[hit.player][hit.action] = true;
        _scActiveTouches.set(t.identifier, hit);
      }
    }
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const hit = _scActiveTouches.get(t.identifier);
      if (hit) {
        SC_INPUT[hit.player][hit.action] = false;
        _scActiveTouches.delete(t.identifier);
      }
    }
  }, { passive: false });

  canvas.addEventListener('touchcancel', e => {
    for (const t of e.changedTouches) {
      const hit = _scActiveTouches.get(t.identifier);
      if (hit) {
        SC_INPUT[hit.player][hit.action] = false;
        _scActiveTouches.delete(t.identifier);
      }
    }
  }, { passive: false });
}

function resetScInput() {
  for (const k of Object.keys(SC_INPUT.p1)) SC_INPUT.p1[k] = false;
  for (const k of Object.keys(SC_INPUT.p2)) SC_INPUT.p2[k] = false;
  SC_EVENTS.enterPressed  = false;
  SC_EVENTS.escapePressed = false;
  _scActiveTouches.clear();
}

// Consomme l'evenement Entree (appele par le shop)
function consumeScEnter() {
  if (SC_EVENTS.enterPressed) { SC_EVENTS.enterPressed = false; return true; }
  return false;
}
function consumeScEscape() {
  if (SC_EVENTS.escapePressed) { SC_EVENTS.escapePressed = false; return true; }
  return false;
}

function _scScreenToCanvas(sx, sy, canvas) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (sx - r.left) * (SC.W / r.width),
    y: (sy - r.top)  * (SC.H / r.height),
  };
}
function _scFindButton(cx, cy) {
  for (const player of ['p1', 'p2'])
    for (const [action, btn] of Object.entries(SC_TOUCH_BUTTONS[player]))
      if (cx >= btn.x && cx <= btn.x + btn.w && cy >= btn.y && cy <= btn.y + btn.h)
        return { player, action };
  return null;
}

const SC_IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
