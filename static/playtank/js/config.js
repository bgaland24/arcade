/**
 * CONFIG — tous les paramètres réglables du jeu.
 * Modifiez ces valeurs pour ajuster le gameplay.
 */
const CONFIG = Object.freeze({

  // ── Canvas interne ──────────────────────────────────────
  CANVAS_W: 800,
  CANVAS_H: 450,

  // ── Gameplay ────────────────────────────────────────────
  HITS_TO_WIN:       3,          // touches nécessaires pour gagner
  GAME_DURATION_S:   180,        // durée maximale d'une partie (secondes)
  FIRE_COOLDOWN_S:   3.0,        // délai entre deux tirs (secondes)

  // ── Physique obus ───────────────────────────────────────
  GRAVITY:           260,        // accélération gravitationnelle (px/s²)
  SHELL_SPEED:       480,        // vitesse initiale de l'obus (px/s)
  EXPLOSION_RADIUS:  34,         // rayon de destruction du terrain (px)
  SPLASH_RATIO:      0.75,       // fraction du rayon donnant un dégât splash

  // ── Tank ────────────────────────────────────────────────
  TANK_SPEED:        80,         // vitesse de déplacement (px/s)
  TURRET_SPEED:      58,         // vitesse de rotation tourelle (degrés/s)
  TURRET_MIN_ANGLE:  5,          // angle minimum (°) — quasi horizontal
  TURRET_MAX_ANGLE:  175,        // angle maximum (°) — quasi horizontal côté opposé

  // ── Vent ────────────────────────────────────────────────
  WIND_ENABLED:      true,
  WIND_MAX_FORCE:    45,         // force max du vent (px/s² appliqués sur vx de l'obus)
  WIND_CHANGE_INTERVAL: 10,      // secondes entre changements de vent

  // ── Terrain ─────────────────────────────────────────────
  TERRAIN_BASE_RATIO:  0.62,     // hauteur de base / hauteur canvas
  TERRAIN_AMP1:        50,       // amplitude onde principale (px)
  TERRAIN_AMP2:        25,       // amplitude onde secondaire (px)
  TERRAIN_AMP3:        10,       // amplitude onde fine (px)
  TERRAIN_SMOOTH_PASS: 6,        // passages de lissage après génération

  // ── Couleurs Desert Storm ───────────────────────────────
  COLOR: {
    SKY_TOP:    '#4A7BA8',
    SKY_BTM:    '#D4855A',
    TERRAIN_TOP:'#C2955D',
    TERRAIN_MID:'#A07840',
    TERRAIN_BOT:'#7A5C2A',
    TERRAIN_LINE:'#8B6914',
    P1_BODY:    '#CC4400',
    P1_DARK:    '#882200',
    P2_BODY:    '#1A5FA0',
    P2_DARK:    '#0D3A66',
    HUD_BG:     'rgba(20,10,2,0.88)',
    HUD_TEXT:   '#FFD700',
    BULLET:     '#FFD700',
    EXP1:       '#FFFFFF',
    EXP2:       '#FF9900',
    EXP3:       '#CC2200',
  },
});
