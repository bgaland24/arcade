/**
 * racer-config.js — parametres regables de Galaxy Racer.
 */
const RACER = Object.freeze({

  // ── Canvas ──────────────────────────────────────────────
  W: 800, H: 450,
  PLAY_TOP:    48,
  PLAY_BOTTOM: 430,

  // ── Joueurs ─────────────────────────────────────────────
  SHIP_Y:            372,     // hauteur fixe des vaisseaux (pres du bas)
  SHIP_HALF_W:       14,      // demi-largeur collision
  SHIP_HALF_H:       18,      // demi-hauteur
  MOVE_SPEED:        290,     // px/s
  START_LIVES:       3,
  INVINCIBLE_DUR:    1.6,     // secondes apres un hit

  // Boost : pousse le vaisseau vers l'avant (remonte) pendant qu'active
  BOOST_LIFT:        34,      // px remontes max pendant boost
  BOOST_MAX:         2.5,     // secondes de boost total par partie
  BOOST_REGEN:       0.18,    // secondes de boost regenerees par seconde de jeu

  // ── Defilement du monde ────────────────────────────────
  START_SPEED:       210,     // px/s au debut (vitesse de descente des obstacles)
  MAX_SPEED:         520,     // plafond
  SPEED_RAMP:        6,       // px/s ajoutes par seconde de jeu

  // ── Asteroides ──────────────────────────────────────────
  ASTEROID_SPAWN_MIN: 0.18,   // intervalle minimum entre 2 spawns (secondes)
  ASTEROID_SPAWN_MAX: 0.65,   // intervalle maximum (plus rare au debut)
  ASTEROID_RADIUS_MIN: 14,
  ASTEROID_RADIUS_MAX: 32,
  ASTEROID_SPEED_VAR: 0.25,   // +/- 25% par rapport a la vitesse de base
  // a quelle vitesse de jeu on atteint spawn_min (0..1)
  ASTEROID_RATE_RAMP_SEC: 60,

  // ── Pickups ─────────────────────────────────────────────
  PICKUP_SPAWN_EVERY: 7.5,    // secondes (moyenne) entre 2 pickups
  PICKUP_SPAWN_JITTER: 3.0,
  PICKUP_RADIUS:      10,

  // ── Couleurs ────────────────────────────────────────────
  COLOR: {
    BG:         '#07001a',
    STAR1:      '#ffffff',
    STAR2:      '#aa77ff',
    STAR3:      '#ffccee',
    P1:         '#FF6622',
    P1_DARK:    '#CC2200',
    P1_GLOW:    '#FFAA44',
    P2:         '#22AAFF',
    P2_DARK:    '#0055CC',
    P2_GLOW:    '#88CCFF',
    ASTEROID:   '#AA6688',
    ASTEROID_DK:'#442233',
    ASTEROID_LT:'#DDAACC',
    PICKUP:     '#FFDD33',
    PICKUP_GLOW:'#FFFF99',
    HUD_TEXT:   '#FF66CC',
    HUD_BG:     'rgba(10,0,30,0.8)',
    BOOST:      '#FF00AA',
  },
});
