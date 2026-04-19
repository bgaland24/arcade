/**
 * input.js — gestion clavier + boutons tactiles.
 *
 * INPUT.p1 / INPUT.p2 exposent les actions booléennes :
 *   moveLeft, moveRight, turretUp, turretDown, fire
 *
 * Les boutons mobiles sont des zones sur le canvas (coordonnées internes 800×450).
 * Leur état est injecté ici via updateTouchButton().
 */

const INPUT = {
  p1: { moveLeft: false, moveRight: false, turretUp: false, turretDown: false, fire: false },
  p2: { moveLeft: false, moveRight: false, turretUp: false, turretDown: false, fire: false },
};

// ── Mapping clavier ──────────────────────────────────────
const KEY_MAP = {
  // Joueur 1
  'KeyJ':        ['p1', 'turretUp'],
  'KeyD':        ['p1', 'moveRight'],
  'KeyA':        ['p1', 'moveLeft'],
  'KeyG':        ['p1', 'turretDown'],
  'Space':       ['p1', 'fire'],
  // Joueur 2
  'ArrowLeft':   ['p2', 'moveLeft'],
  'ArrowRight':  ['p2', 'moveRight'],
  'Numpad4':     ['p2', 'turretUp'],
  'Numpad6':     ['p2', 'turretDown'],
  'Enter':       ['p2', 'fire'],
  'NumpadEnter': ['p2', 'fire'],
};

const KEYS_TO_PREVENT = new Set(Object.keys(KEY_MAP));

// ── Zones boutons mobiles (coordonnées canvas 800×450) ───
// Mise à jour dans ui.js après calcul de la mise en page.
const TOUCH_BUTTONS = {
  p1: {
    moveLeft:   { x:  10, y: 358, w: 52, h: 52 },
    moveRight:  { x:  66, y: 358, w: 52, h: 52 },
    turretUp:   { x:  66, y: 302, w: 52, h: 52 },
    turretDown: { x:  10, y: 302, w: 52, h: 52 },
    fire:       { x:  10, y: 252, w: 108, h: 44 },
  },
  p2: {
    moveLeft:   { x: 682, y: 358, w: 52, h: 52 },
    moveRight:  { x: 738, y: 358, w: 52, h: 52 },
    turretUp:   { x: 682, y: 302, w: 52, h: 52 },
    turretDown: { x: 738, y: 302, w: 52, h: 52 },
    fire:       { x: 682, y: 252, w: 108, h: 44 },
  },
};

// Touches tactiles actives : Map<touchId, {player, action}>
const _activeTouches = new Map();

// ── Initialisation ───────────────────────────────────────
function initInput(canvas) {
  // Clavier
  document.addEventListener('keydown', e => {
    const mapping = KEY_MAP[e.code];
    if (mapping) {
      INPUT[mapping[0]][mapping[1]] = true;
      if (KEYS_TO_PREVENT.has(e.code)) e.preventDefault();
    }
  });
  document.addEventListener('keyup', e => {
    const mapping = KEY_MAP[e.code];
    if (mapping) INPUT[mapping[0]][mapping[1]] = false;
  });

  // Touch — on canvas
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const cp = screenToCanvas(touch.clientX, touch.clientY, canvas);
      const hit = findTouchButton(cp.x, cp.y);
      if (hit) {
        INPUT[hit.player][hit.action] = true;
        _activeTouches.set(touch.identifier, hit);
      }
    }
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const hit = _activeTouches.get(touch.identifier);
      if (hit) {
        // Fire est edge-déclenché : on ne le réinitialise PAS ici
        // (game.js le réinitialise après usage si le cooldown est > 0)
        if (hit.action !== 'fire') INPUT[hit.player][hit.action] = false;
        _activeTouches.delete(touch.identifier);
      }
    }
  }, { passive: false });

  canvas.addEventListener('touchcancel', e => {
    for (const touch of e.changedTouches) {
      const hit = _activeTouches.get(touch.identifier);
      if (hit) {
        INPUT[hit.player][hit.action] = false;
        _activeTouches.delete(touch.identifier);
      }
    }
  }, { passive: false });
}

// ── Helpers ──────────────────────────────────────────────
function screenToCanvas(sx, sy, canvas) {
  const rect   = canvas.getBoundingClientRect();
  const scaleX = CONFIG.CANVAS_W / rect.width;
  const scaleY = CONFIG.CANVAS_H / rect.height;
  return {
    x: (sx - rect.left) * scaleX,
    y: (sy - rect.top)  * scaleY,
  };
}

function findTouchButton(cx, cy) {
  for (const player of ['p1', 'p2']) {
    for (const [action, btn] of Object.entries(TOUCH_BUTTONS[player])) {
      if (cx >= btn.x && cx <= btn.x + btn.w &&
          cy >= btn.y && cy <= btn.y + btn.h) {
        return { player, action };
      }
    }
  }
  return null;
}

// Indique si l'appareil est tactile (utilisé pour afficher ou non les boutons)
const IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

// Réinitialise tous les inputs (ex : changement d'écran)
function resetInput() {
  for (const p of ['p1', 'p2']) {
    for (const k of Object.keys(INPUT[p])) INPUT[p][k] = false;
  }
  _activeTouches.clear();
}
