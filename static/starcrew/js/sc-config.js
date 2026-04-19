/**
 * sc-config.js — parametres regables de StarCrew.
 */
const SC = Object.freeze({

  // ── Canvas ──────────────────────────────────────────────
  W: 800, H: 450,
  PLAY_TOP:    48,
  PLAY_BOTTOM: 440,

  // ── Vaisseau (P1 pilote) ────────────────────────────────
  SHIP: {
    SPEED:         210,
    START_LIVES:    3,
    MAX_LIVES:      5,
    INVINCIBLE:     1.6,
    BODY_R:         20,   // rayon collision
    CANNON_RATE:    0.32, // secondes entre 2 tirs
    CANNON_SPD:     360,
    CANNON_DMG:     1,
  },

  // ── Tourelle (P2 artilleur) ─────────────────────────────
  TURRET: {
    ROT_SPEED:      3.0,           // rad/s (~172 deg/s)
    LASER_SPD:      520,
    LASER_DMG:      1,
    LASER_OFFSET:   7,             // demi-ecart entre les 2 rayons
    LASER_LEN:      14,
    HEAT_MAX:       100,
    HEAT_PER_SEC:   42,            // chauffe en tir continu
    COOL_PER_SEC:   22,            // refroidit hors tir
    HEAT_YELLOW:    40,            // seuil jaune
    HEAT_RED:       70,            // seuil rouge (pierce actif)
    OVERHEAT_LOCK:  3.0,           // secondes de blocage apres overheat
    OVERHEAT_COOL_RATIO: 0.35,     // chaleur residuelle apres overheat
  },

  // ── Grapin ──────────────────────────────────────────────
  GRAPPLE: {
    SPEED:          520,           // vitesse extension + retraction
    RANGE:          200,           // portee max base
    HEAD_R:         6,
    COOLDOWN:       0.35,          // apres retour au vaisseau
  },

  // ── Asteroides ──────────────────────────────────────────
  ASTEROID: {
    SPAWN_BASE:     1.4,           // secondes entre spawns (reduit avec temps)
    SPAWN_MIN:      0.55,
    SPEED_MIN:      60,
    SPEED_MAX:      150,
    R_SMALL_MIN:    10,
    R_SMALL_MAX:    18,            // <= 18 = grappable + ramenable
    R_BIG_MIN:      22,
    R_BIG_MAX:      34,            // > 18 = grappable -> bouclier orbital
    TYPES_WEIGHTS: { FER: 55, OR: 15, GLACE: 15, VOLATILE: 15 },
    VOLATILE_RADIUS: 80,           // rayon de l'explosion d'un volatile
    VOLATILE_DAMAGE: 3,
    METAL_FER: 1,
    METAL_OR: 5,
    METAL_VOLATILE: 2,
  },

  // ── Bouclier orbital ────────────────────────────────────
  SHIELD: {
    DURATION:       6.0,
    ORBIT_R:        42,
    ORBIT_SPD:      2.6,           // rad/s
    MAX_HITS:       3,
  },

  // ── Ennemis ─────────────────────────────────────────────
  ENEMY: {
    GRUNT:   { hp:1, pts:50,  size:14, fire:3.2, bulletSpd:150, color:'#44DD44' },
    TANK:    { hp:3, pts:200, size:20, fire:2.6, bulletSpd:140, color:'#FF4444' },
    SWARM:   { hp:1, pts:80,  size:12, fire:3.8, bulletSpd:150, color:'#CC44FF' },
    SHIELD:  { hp:2, pts:180, size:17, fire:3.0, bulletSpd:160, color:'#DDAA00' },
  },
  ENEMY_BULLET_SPD: 160,

  // ── Vagues ──────────────────────────────────────────────
  WAVE: {
    BASE_COUNT:     8,
    COUNT_STEP:     2,
    MAX_COUNT:      22,
    SPEED_MULT:     0.08,
    INTER_DELAY:    2.2,           // annonce avant une vague
    SHOP_DELAY:     6.0,           // duree du shop
  },

  // ── Evenements ──────────────────────────────────────────
  EVENTS: {
    COOLDOWN:       12.0,          // entre 2 evenements
    STORM_MIN_WAVE: 3,
    STORM_DURATION: 10,
    STORM_SPAWN_MULT: 3,
    BLACKOUT_MIN_WAVE: 5,
    BLACKOUT_DURATION: 10,
    BLACKOUT_LIGHT_R: 150,
    WELL_MIN_WAVE:  7,
    WELL_DURATION:  12,
    WELL_PULL:      140,            // px/s au centre
    WELL_RADIUS:    180,
    COMET_MIN_WAVE: 4,
    COMET_WARN:     1.6,
    COMET_SPD:      880,
  },

  // ── Shop ────────────────────────────────────────────────
  SHOP: {
    ITEMS: [
      { id:'COOL',    name:'REFROIDISSEUR+', desc:'+25% capacite chaleur', price:25, max:2 },
      { id:'GRAPPLE', name:'GRAPIN LONG',    desc:'+50% portee du grapin', price:35, max:1 },
      { id:'LIFE',    name:'+1 VIE',         desc:'Restaure 1 vie (max 5)', price:50, max:3 },
      { id:'CANNON',  name:'CANON DUR',      desc:'+1 degats canon P1',    price:45, max:1 },
    ],
  },

  // ── Couleurs ────────────────────────────────────────────
  COLOR: {
    BG:            '#021a14',
    STAR1:         '#ffffff',
    STAR2:         '#88ddcc',
    STAR3:         '#ffe0aa',
    P1:            '#FF6622',
    P1_DARK:       '#CC2200',
    P1_GLOW:       '#FFAA44',
    P2:            '#22AAFF',
    P2_DARK:       '#0055CC',
    P2_GLOW:       '#88CCFF',
    HUD_PRIMARY:   '#00DDAA',
    HUD_GOLD:      '#FFAA00',
    CANNON_BULLET: '#FFFFFF',
    LASER_COOL:    '#66EEFF',
    LASER_WARM:    '#FFDD44',
    LASER_HOT:     '#FF3322',
    HEAT_COOL:     '#66EEFF',
    HEAT_WARM:     '#FFDD44',
    HEAT_HOT:      '#FF3322',
    METAL:         '#DDDDDD',
    GOLD_ORE:      '#FFCC22',
    ICE_ORE:       '#88DDFF',
    VOLATILE_ORE:  '#FF4422',
    ENEMY_BULLET:  '#FF4422',
    SHIELD_RING:   '#00FFCC',
  },
});
