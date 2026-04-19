/**
 * derby-input.js — clavier + touch pour Horse Derby.
 *
 * Chaque cheval a 2 touches de galop (gauche/droite) et 1 touche de saut.
 * Les pressions de galop sont traitees en "edge" (une impulsion par appui, pas
 * maintenue) pour forcer l'alternance.
 *
 * P1 : KeyA (gauche), KeyD (droite), KeyW (saut)
 * P2 : ArrowLeft, ArrowRight, ArrowUp
 */

// Drapeaux edge consommes par derby-horse
const DRB_TAPS = {
  p1: { left: false, right: false, jump: false },
  p2: { left: false, right: false, jump: false },
};

const DRB_KEYS_PREVENT = new Set([
  'KeyA', 'KeyD', 'KeyW', 'KeyQ', 'KeyZ',
  'ArrowLeft', 'ArrowRight', 'ArrowUp',
]);

function initDerbyInput(canvas) {
  document.addEventListener('keydown', e => {
    if (e.repeat) { if (DRB_KEYS_PREVENT.has(e.code)) e.preventDefault(); return; }
    switch (e.code) {
      case 'KeyA': case 'KeyQ': DRB_TAPS.p1.left = true; break;
      case 'KeyD':              DRB_TAPS.p1.right = true; break;
      case 'KeyW': case 'KeyZ': DRB_TAPS.p1.jump = true; break;
      case 'ArrowLeft':         DRB_TAPS.p2.left = true; break;
      case 'ArrowRight':        DRB_TAPS.p2.right = true; break;
      case 'ArrowUp':           DRB_TAPS.p2.jump = true; break;
    }
    if (DRB_KEYS_PREVENT.has(e.code)) e.preventDefault();
  });
  // Pas de keyup : les drapeaux sont remis a false apres consommation dans horse.update

  // Touch : bandes gauche/droite/haut. Chaque tap declenche une impulsion.
  const _touchMap = { p1: null, p2: null };
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const cp = _drbScreenToCanvas(t.clientX, t.clientY, canvas);
      const lane = cp.y < DRB.FENCE_Y ? 'p1' : 'p2';
      const btn  = _drbFindTouchButton(cp.x, cp.y);
      if (btn === 'left')  DRB_TAPS[lane].left  = true;
      if (btn === 'right') DRB_TAPS[lane].right = true;
      if (btn === 'jump')  DRB_TAPS[lane].jump  = true;
    }
  }, { passive: false });
  canvas.addEventListener('touchend', e => {
    e.preventDefault();
  }, { passive: false });
}

function consumeDerbyTaps() {
  const s = {
    p1: { ...DRB_TAPS.p1 },
    p2: { ...DRB_TAPS.p2 },
  };
  for (const p of ['p1', 'p2'])
    for (const k of Object.keys(DRB_TAPS[p])) DRB_TAPS[p][k] = false;
  return s;
}

function resetDerbyTaps() {
  for (const p of ['p1', 'p2'])
    for (const k of Object.keys(DRB_TAPS[p])) DRB_TAPS[p][k] = false;
}

function _drbScreenToCanvas(sx, sy, canvas) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (sx - r.left) * (DRB.W / r.width),
    y: (sy - r.top)  * (DRB.H / r.height),
  };
}

// Bandes tactiles par couloir : left = 0-30% , right = 30-60%, jump = 60-100%
function _drbFindTouchButton(cx, cy) {
  const w = DRB.W;
  if (cx < w * 0.3)  return 'left';
  if (cx < w * 0.6)  return 'right';
  return 'jump';
}

const DRB_IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
