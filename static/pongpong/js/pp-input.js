'use strict';
const PP_INPUT = { p1Up: false, p1Down: false, p2Up: false, p2Down: false };

(function () {
  // e.code = position physique, indépendant de la disposition clavier (AZERTY/QWERTY)
  // KeyW = touche Z en AZERTY, W en QWERTY — position "haut" naturelle pour P1
  const MAP = {
    'KeyW': 'p1Up', 'KeyS': 'p1Down',
    'ArrowUp': 'p2Up', 'ArrowDown': 'p2Down',
  };
  document.addEventListener('keydown', e => {
    if (MAP[e.code]) { PP_INPUT[MAP[e.code]] = true; e.preventDefault(); }
  });
  document.addEventListener('keyup', e => {
    if (MAP[e.code]) PP_INPUT[MAP[e.code]] = false;
  });

  function bind(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    const on  = e => { PP_INPUT[key] = true;  e.preventDefault(); };
    const off = e => { PP_INPUT[key] = false; };
    el.addEventListener('touchstart',  on,  { passive: false });
    el.addEventListener('touchend',    off, { passive: false });
    el.addEventListener('touchcancel', off, { passive: false });
    el.addEventListener('mousedown',   on);
    el.addEventListener('mouseup',     off);
    el.addEventListener('mouseleave',  off);
  }
  bind('pp-p1-up',   'p1Up');
  bind('pp-p1-down', 'p1Down');
  bind('pp-p2-up',   'p2Up');
  bind('pp-p2-down', 'p2Down');
})();
