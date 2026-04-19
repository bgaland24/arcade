/**
 * derby-config.js — parametres de Horse Derby.
 *
 * Course infinie, 2 couloirs empiles, orage qui remonte par la gauche.
 * Dernier cheval en course = gagnant.
 */
const DRB = Object.freeze({

  // ── Canvas ──────────────────────────────────────────────
  W: 800, H: 450,
  HUD_H: 40,

  // Lanes (coordonnees Y, dans le canvas)
  LANE1_TOP: 40,
  LANE1_BOT: 240,
  FENCE_Y:   240,
  FENCE_H:   10,
  LANE2_TOP: 250,
  LANE2_BOT: 450,
  LANE_H:    200,

  // ── Cheval ──────────────────────────────────────────────
  HORSE: {
    SCREEN_X:      520,      // position fixe du cheval a l'ecran (si pas eliminate)
    GROUND_OFFSET: 28,       // distance cheval -> bas du couloir
    BODY_W:        48,
    BODY_H:        30,
    DECAY:         32,       // px/s perdus naturellement par le galop
    IMPULSE_GOOD:  52,       // gain par tap dans la zone optimale
    IMPULSE_WEAK:  16,       // gain par tap trop lent
    IMPULSE_MASH:  0,        // aucun gain si mash
    SPEED_MIN:     0,
    SPEED_MAX:     520,      // plafond de vitesse de galop
    STAM_MAX:      100,
    STAM_REGEN:    12,       // regen / s dans la bonne zone
    STAM_REGEN_SLOW: 5,      // regen / s si tap lent
    STAM_DRAIN_MASH: 28,     // drain / s si mash
    STAM_COST_JUMP: 12,      // cost par saut
    STUN_TIME:     1.5,      // s de stop si stamina = 0
    MISS_PENALTY:  70,       // vitesse perdue sur saut rate
    MISS_STAGGER:  0.5,      // s d'animation trebuche
  },

  // Tap rhythm windows (seconds between alternate key presses)
  RHYTHM: {
    MASH_MAX:   0.15,   // < 0.15 s = mash (penalite)
    GOOD_MIN:   0.22,
    GOOD_MAX:   0.55,   // zone optimale = plein gain
    WEAK_MAX:   0.95,   // > 0.95 s = gain minime
  },

  // ── Saut ────────────────────────────────────────────────
  JUMP: {
    DURATION:     0.55,   // s d'animation du saut
    HEIGHT:       46,     // px de montée visuelle
    WINDOW:       0.30,   // s de fenetre avant contact pour valider
    HURDLE_AT:    0,      // worldX distance a laquelle la hurdle touche le cheval
  },

  // ── Obstacles (hurdles) ─────────────────────────────────
  OBST: {
    SPAWN_START_INTERVAL: 3.2,
    SPAWN_MIN_INTERVAL:   1.05,
    SPAWN_RAMP_SECONDS:   60,    // intervalle atteint le minimum apres X s
    SPAWN_AHEAD_X:        650,   // positionne a +650 px devant le cheval
    HURDLE_W:             12,
    HURDLE_H:             28,
  },

  // ── Orage ───────────────────────────────────────────────
  STORM: {
    START_SPEED:  140,    // px/s
    SPEED_RAMP:   3.0,    // px/s ajoutes par seconde de jeu
    MAX_SPEED:    510,
    VISIBLE_W:    120,    // largeur visible de la tempete a gauche
  },

  // ── Parallax ────────────────────────────────────────────
  PARALLAX: {
    HILLS_SPEED:  0.2,    // relatif au world speed
    GROUND_SPEED: 1.0,
  },

  // ── Couleurs ────────────────────────────────────────────
  COLOR: {
    // Pixel-art sunset
    SKY_TOP:      '#2E1A2D',
    SKY_MID:      '#7A2E4A',
    SKY_BOT:      '#F4A05A',
    HILL_FAR:     '#3B1033',
    HILL_NEAR:    '#2A0620',
    GROUND_DIRT:  '#5B3418',
    GROUND_GRASS: '#3B5818',
    FENCE:        '#8B5A2B',
    FENCE_DARK:   '#4A2F1A',

    // P1 (cheval brun) / P2 (cheval noir)
    P1_BODY:      '#8B4513',
    P1_MANE:      '#2A1008',
    P1_SADDLE:    '#FF6622',
    P1_RIDER:     '#FFDD66',
    P2_BODY:      '#1E1418',
    P2_MANE:      '#6E5E4C',
    P2_SADDLE:    '#22AAFF',
    P2_RIDER:     '#CCEEFF',

    HURDLE:       '#F4C430',
    HURDLE_DARK:  '#8B6914',

    STORM_DEEP:   '#1B0A1E',
    STORM_MID:    '#3B1050',
    STORM_FLASH:  '#EAD5FF',
    LIGHTNING:    '#FFFFFF',

    HUD_TEXT:     '#F4C430',
    HUD_BG:       'rgba(26,10,24,0.85)',
    STAM_OK:      '#44DD66',
    STAM_WEAK:    '#F4C430',
    STAM_BAD:     '#C14E28',
    RHYTHM_GOOD:  '#44DD66',
    RHYTHM_MASH:  '#C14E28',
    RHYTHM_WEAK:  '#888888',

    DANGER:       '#FF3322',
  },
});
