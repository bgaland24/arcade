/**
 * gx-config.js — tous les paramètres réglables de Galaxy Space Attack.
 */
const GX = Object.freeze({

  // ── Canvas ──────────────────────────────────────────────
  W: 800, H: 450,
  PLAY_TOP:    50,   // hauteur du HUD haut
  PLAY_BOTTOM: 400,  // limite basse des joueurs (laisse place aux boutons mobile)

  // ── Joueurs ─────────────────────────────────────────────
  PLAYER_SPEED:       180,   // px/s
  PLAYER_FIRE_RATE:   0.28,  // secondes entre deux tirs automatiques
  PLAYER_BULLET_SPD:  420,   // px/s
  START_LIVES:        5,
  INVINCIBLE_DURATION:2.2,   // secondes après une touche
  BOMB_DAMAGE:        30,    // dégâts de bombe sur chaque ennemi

  // ── Ennemis ─────────────────────────────────────────────
  ENEMY: {
    GRUNT:   { hp:1, pts:50,  speed:55,  fireInterval:4.0, bulletSpd:140, size:14 },
    SOLDIER: { hp:2, pts:100, speed:70,  fireInterval:3.1, bulletSpd:160, size:16 },
    HEAVY:   { hp:4, pts:200, speed:50,  fireInterval:2.6, bulletSpd:130, size:20 },
    ELITE:   { hp:3, pts:300, speed:85,  fireInterval:2.1, bulletSpd:190, size:18 },
  },

  // ── Boss ────────────────────────────────────────────────
  BOSS_BASE_HP: 200,   // HP du boss à la vague 5 (+80 par boss suivant)
  BOSS_PHASE_THRESHOLDS: [0.65, 0.30], // %HP déclenchant phase 2 puis phase 3

  // ── Vagues ──────────────────────────────────────────────
  BASE_ENEMY_COUNT: 14,    // ennemis vague 1
  ENEMY_COUNT_STEP: 2,     // +N ennemis par vague
  MAX_ENEMY_COUNT:  31,
  WAVE_SPEED_MULT:  0.09,  // bonus de vitesse cumulé par vague
  WAVE_FIRE_MULT:   0.08,  // bonus de fréquence de tir par vague
  INTER_WAVE_DELAY: 2.5,   // secondes entre deux vagues

  // ── Power-ups ────────────────────────────────────────────
  POWERUP_DROP_CHANCE: 0.09,  // probabilité de drop à chaque mort
  POWERUP_FALL_SPD:    55,    // px/s
  POWERUP_DURATION: {
    SHIELD: 15, DOUBLE: 10, TRIPLE: 10,
    RAPID: 7,  SLOW: 6,   LIFE: 0, BOMB: 0,
  },
  // Poids de drop par type (0 = désactivé, plus le nombre est élevé, plus c'est fréquent)
  POWERUP_WEIGHTS: {
    SHIELD: 3,
    DOUBLE: 2,
    TRIPLE: 2,
    BOMB:   1,
    RAPID:  2,
    LIFE:   3,
    SLOW:   2,
  },
  SLOW_FACTOR: 0.35,  // multiplicateur de vitesse ennemi quand SLOW actif

  // ── Physique ─────────────────────────────────────────────
  ENEMY_BULLET_SPD: 150,  // vitesse de base des balles ennemies
  SPLASH_BOMB_R:    80,   // rayon d'effet de la bombe (visuel)

  // ── Formation ────────────────────────────────────────────
  FORMATION_TOP:   75,   // Y du début de la formation
  FORMATION_GAP_X: 42,   // espacement horizontal
  FORMATION_GAP_Y: 36,   // espacement vertical

  // ── Couleurs ─────────────────────────────────────────────
  COLOR: {
    BG:       '#00000e',
    STAR1:    '#ffffff',
    STAR2:    '#8899ff',
    STAR3:    '#ffeeaa',
    P1:       '#FF6622',
    P1_DARK:  '#CC2200',
    P2:       '#22AAFF',
    P2_DARK:  '#0055CC',
    GRUNT:    '#44DD44',
    SOLDIER:  '#DDAA00',
    HEAVY:    '#FF4444',
    ELITE:    '#CC44FF',
    BOSS_P1:  '#FF8800',
    BOSS_P2:  '#FF2244',
    BOSS_P3:  '#FF00FF',
    BULLET_P: '#FFFF44',
    BULLET_E: '#FF4422',
    HUD_BG:   'rgba(0,0,10,0.88)',
    HUD_TEXT: '#00EEFF',
    POWERUP: {
      SHIELD: '#00FFFF',
      DOUBLE: '#FFFF00',
      TRIPLE: '#FF8800',
      BOMB:   '#FF2200',
      RAPID:  '#00FF88',
      LIFE:   '#FF44AA',
      SLOW:   '#8844FF',
    },
  },
});
