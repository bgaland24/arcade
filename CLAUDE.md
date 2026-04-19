# CLAUDE.md — Instructions pour Claude Code

## Contexte du projet

Arcade multi-jeux déployé sur PythonAnywhere Free.
Pas de WebSocket (compte gratuit) → toute la logique de jeu est côté client (Canvas JS).
Le backend Flask sert uniquement l'HTML, l'identification des joueurs et les classements (SQLite).

## Architecture

```
app.py                      → routes globales : identify (/), lobby (/lobby), autocomplete (/api/players)
wsgi.py                     → Entrée PythonAnywhere (adapter le chemin utilisateur)
init_db.py                  → script CLI pour initialiser la DB manuellement
core/
  db.py                     → get_db(), init_db(), register_db_setup()
  scores.py                 → save_score(game_id, score, meta) / get_scores(game_id)
  migrations.py             → migrations numérotées (_m001_baseline, etc.)
games/
  registry.py               → liste des jeux pour le sélecteur (titre, url, SVG, couleurs)
  playtank/__init__.py       → Blueprint PlayTank : routes /playtank + /api/playtank/scores
  galaxy/__init__.py         → Blueprint Galaxy   : routes /galaxy   + /api/galaxy/scores
  pongpong/__init__.py       → Blueprint PongPong : routes /pongpong + /api/pongpong/scores
templates/
  identify.html             → écran de connexion 2 joueurs (pseudo + âge)
  index.html                → lobby / sélecteur dynamique (boucle Jinja sur registry.GAMES)
  playtank/game.html        → page PlayTank
  galaxy/game.html          → page Galaxy
  pongpong/game.html        → page PongPong
static/
  css/selector.css          → styles du sélecteur + identify (partagé, inclut les variantes de carte)
  playtank/css/style.css
  playtank/js/              → config, terrain, tank, projectile, input, ui, game (7 fichiers)
  galaxy/css/galaxy.css
  galaxy/js/                → gx-config … gx-game (12 fichiers)
  pongpong/css/pong.css
  pongpong/js/              → pp-config, pp-input, pp-ball, pp-paddle, pp-bonus, pp-hud, pp-ui, pp-game (8 fichiers)
tests/
  conftest.py               → fixtures pytest (DB temporaire, client Flask)
  test_routes.py            → routes identify/lobby/jeux
  test_playtank_api.py      → formule score + API PlayTank
  test_galaxy_api.py        → formule score + API Galaxy
  test_pongpong_api.py      → formule score + API PongPong
  test_static_files.py      → accessibilité fichiers statiques JS/CSS
```

## Flux utilisateur

```
GET /  → identify.html
  Formulaire 2 joueurs (pseudo + âge)
  Autocomplete JS → GET /api/players?q=...
  POST / → validation → INSERT OR UPDATE players → session['p1'], session['p2']
  Redirect → /lobby

GET /lobby → index.html
  Garde session obligatoire (sinon redirect /)
  Affiche 3 cartes jeux + TOP 10 scores normalisés par jeu
  Bouton CHANGER → GET /logout → clear session → redirect /

GET /playtank (ou /galaxy, /pongpong)
  Pas de garde session — les noms sont pré-remplis depuis session mais le jeu fonctionne sans
  Canvas 2D + boucle RAF → fin de partie → POST /api/{jeu}/scores → GET /api/{jeu}/scores
```

## Schéma base de données

```sql
players  (id, name, age, created_at, last_seen)
games    (id, name)                          -- registre jeux
scores   (id, game_id REFERENCES games, score, meta TEXT, created_at)
schema_version (version)                     -- suivi migrations
```

**Reconnexion :** même pseudo + même âge = mise à jour `last_seen`. Âge différent = erreur bloquante.

## Ajouter un nouveau jeu

1. Créer `games/nonjeu/__init__.py` → Blueprint Flask avec :
   - une route `GET /nonjeu`
   - une route `GET/POST /api/nonjeu/scores` utilisant `core.scores.save_score` / `get_scores`
   - **ne pas** appeler `register_db_setup` — la table `scores` est partagée
2. Ajouter une entrée dans `games/registry.py → GAMES` (le champ `id` doit correspondre à l'id en base)
3. **Ajouter une ligne dans la table `games`** via `init_db()` dans `core/db.py` :
   ```python
   conn.execute("INSERT OR IGNORE INTO games (id, name) VALUES ('nonjeu', 'Mon Jeu')")
   ```
4. Créer `templates/nonjeu/game.html`
5. Créer `static/nonjeu/css/` et `static/nonjeu/js/`
6. Enregistrer le blueprint dans `app.py` :
   ```python
   from games.nonjeu import blueprint as nonjeu_bp
   app.register_blueprint(nonjeu_bp)
   ```
   → `app.py` et `core/db.py` sont les **seuls** fichiers existants à modifier.

## Conventions importantes

### Canvas interne (tous les jeux)
Résolution interne fixe **800×450**. Mise à l'échelle uniquement via CSS.
Ne jamais changer `canvas.width` / `canvas.height` au runtime.
Rendu pixel-art : `image-rendering: pixelated`.

### DB
`init_db()` crée : `players`, `games`, `scores`, `schema_version`, puis exécute les migrations.
`init_db()` est appelé une fois dans `app.py` (niveau module, compatible WSGI).
`wsgi.py` importe `init_db` depuis `app` (qui le ré-exporte depuis `core.db`).

### Migrations
Fichier `core/migrations.py`. Chaque migration = fonction `_mNNN_description(conn)`.
La table `schema_version` track la version courante. Les migrations s'exécutent au démarrage si version < current.

### Scores partagés
Tous les scores passent par `core.scores.save_score(game_id, score, meta)`.
`meta` est un dict JSON libre — les champs varient selon le jeu.
`core.scores.get_scores(game_id, limit=20)` retourne les scores d'un jeu fusionnés avec leur meta.
La formule de score est **server-side** uniquement — ne pas la dupliquer en JS.

**Format meta par jeu :**
```
playtank : { player_name, opponent_name, accuracy, shells_used, time_seconds }
galaxy   : { p1_name, p2_name, wave_reached, kills, accuracy }
pongpong : { player_name (vainqueur), opponent_name, points_won, points_lost, time_seconds }
```

**Formules score (server-side) :**
```
playtank : time_ratio*5000 + accuracy*3000 + shot_efficiency*2000
           shot_efficiency = 3 / max(3, shells_used)
galaxy   : kill_points + (shots_hit/shots_fired)*3000 + wave_reached*300
pongpong : winner_points*200 + (winner-loser)*500 + max(0, (300-time_seconds)*3)
```

### Ajouter un jeu → obligation d'entrée dans `games`
Chaque jeu référencé dans `registry.py` doit avoir une ligne dans la table `games`
(sinon les INSERT INTO scores échoueront à cause de la contrainte REFERENCES).
L'entrée est ajoutée dans `core/db.py → init_db()` avec `INSERT OR IGNORE`.

### Variables d'environnement
`.env` (non commité) → `python-dotenv` chargé en tête de `app.py`.
```
SECRET_KEY=remplacer_par_une_cle_aleatoire
```
`.env.example` est commité comme référence.

---

## PlayTank — spécificités

Paramètres réglables : `static/playtank/js/config.js` (Object.freeze)

**Paramètres clés :**
```
HITS_TO_WIN: 3         GAME_DURATION_S: 180   FIRE_COOLDOWN_S: 3.0
GRAVITY: 260 px/s²     SHELL_SPEED: 480       EXPLOSION_RADIUS: 34
TANK_SPEED: 80         TURRET_SPEED: 58°/s    WIND_MAX_FORCE: 45
```

### Angle tourelle (`localAngle`)
- Degrés dans l'espace local du tank (avant flip éventuel)
- `0°` horizontal, `90°` vertical, clamp 5°–175°
- P2 rendu avec `ctx.scale(-1,1)` — flip visuel uniquement

### Terrain
- `terrain.heights[x]` = Y de surface à la colonne x (Float32Array)
- `terrain.destroy(cx, cy, radius)` = cratère circulaire
- Gradient mis en cache dans `_gradCache` (reset après destroy)
- Génération : 3 sinusoïdes + seed aléatoire + 6 passes de lissage

### Physique obus
```
vx += wind * dt
vy += CONFIG.GRAVITY * dt
x  += vx * dt ; y += vy * dt
```
`Projectile.update()` retourne `null` (en vol), `'terrain'` (impact sol), `'oob'` (hors limites).

### Contrôles (configurés dans input.js → KEY_MAP)
| Action | P1 | P2 |
|--------|----|----|
| Avancer/Reculer | A/D | ←/→ |
| Tourelle haut/bas | T/G | Num4/Num6 |
| Tir | Espace | Entrée |

Support tactile : zones `TOUCH_BUTTONS` en px canvas, détectées via `IS_TOUCH`.

### Ordre de chargement scripts PlayTank
`config → terrain → tank → projectile → input → ui → game`

### Globals JS exposés (PlayTank)
`CONFIG` · `INPUT` · `KEY_MAP` · `TOUCH_BUTTONS` · `IS_TOUCH`
`canvas` · `ctx` · `terrain` · `tanks` · `projectiles` · `explosions`
`wind` · `timeLeft` · `gameState` · `p1name` · `p2name`

---

## Galaxy — spécificités

Paramètres réglables : `static/galaxy/js/gx-config.js` (Object.freeze)

**Paramètres clés :**
```
PLAYER_SPEED: 180      PLAYER_FIRE_RATE: 0.28s   PLAYER_BULLET_SPD: 420
START_LIVES: 5         INVINCIBLE_DURATION: 2.2s  BOMB_DAMAGE: 30
BOSS_BASE_HP: 200      BOSS_PHASE_THRESHOLDS: [0.65, 0.30]
```

### Types d'ennemis (Grunt / Soldier / Heavy / Elite)
Scaling par vague : `speed *= 1 + wave*0.09` · `fireInterval /= 1 + wave*0.08`

### Formations et boss
- Boss toutes les 5 vagues, HP = `200 + bossIndex*80`
- Boss 3 phases : balayage → plongées → erratique
- Formations grille : Elite (haut) → Heavy/Soldier → Grunt (bas), espacement 42px×36px
- Dérive collective horizontale avec inversion aux bords

### Power-ups
Poids de drop dans `GX.POWERUP_WEIGHTS` (0 = désactivé).
La pool pondérée `GX_POWERUP_POOL` est construite au chargement dans `gx-powerup.js`.
9% de chance de drop à la mort d'un ennemi.

| Power-up | Effet | Durée |
|----------|-------|-------|
| SHIELD | Absorbe 1 hit | 15s |
| DOUBLE | Tir double | 10s |
| TRIPLE | Tir triple | 10s |
| RAPID | Cadence ×2 (0.126s) | 7s |
| SLOW | Ennemis ralentis | 6s |
| LIFE | +1 vie (commun) | instant |
| BOMB | Dommages zone | instant |

### Slowdown
Seul `WaveManager.update()` reçoit `dt * slowFactor` quand SLOW est actif.
Ne pas ralentir les vaisseaux joueurs ni le HUD.

### BulletPool
120 balles joueur, 180 balles ennemies — réutilisation par pool pour éviter le GC.

### Ordre de chargement scripts Galaxy
`gx-config → gx-input → gx-particles → gx-bullet → gx-powerup →`
`gx-player → gx-enemy → gx-boss → gx-wave → gx-hud → gx-ui → gx-game`

### Globals JS exposés (Galaxy)
`GX` · `GX_INPUT` · `GX_KEY_MAP` · `GX_TOUCH_BUTTONS` · `GX_IS_TOUCH` · `GX_POWERUP_POOL`
`gxCanvas` · `gxCtx` · `gxState`
`gxPlayers` · `gxWaveMgr` · `gxBulletPool` · `gxPowerUpMgr` · `gxExplosions`
`gxGameData` → `{ lives, score, kills, waveReached, shotsFired, shotsHit }`

---

## PongPong — spécificités

Paramètres réglables : `static/pongpong/js/pp-config.js` (Object.freeze)

**Paramètres clés :**
```
PADDLE_W: 14  PADDLE_H: 80   PADDLE_SPEED: 380
BALL_R: 7     BALL_SPEED_INIT: 320  BALL_SPEED_INC: 14  BALL_SPEED_MAX: 680
WIN_SCORE: 7  SERVE_DELAY_MS: 2200
```

### Mécanique bonus
1. Une `PPBonusZone` (cercle pulsant) apparaît à une position aléatoire sur le terrain.
2. Quand la balle la touche, elle devient un `PPMovingBonus` qui dérive horizontalement vers le bord du camp où elle se trouvait (gauche si x < 400, droite si x > 400).
3. Le joueur attrape le bonus en positionnant sa raquette au niveau Y du bonus.
4. Chaque joueur ne peut avoir qu'un seul bonus actif à la fois.

### Bonus disponibles
| Bonus | Effet | Durée |
|-------|-------|-------|
| TURBO | Prochain renvoi à 2× vitesse (consommé au 1er hit) | instant |
| BIG | Raquette 1,9× plus haute | 8s |
| TINY | Raquette adverse réduite à 0,5× | 7s |
| SPLIT | Duplique la balle immédiatement (si 1 balle) | instant |
| CURVE | Chaque renvoi courbe la balle (curveFactor exponentiel) | 8s |
| GHOST | Prochain renvoi rend la balle invisible | 2s |
| FREEZE | Raquette adverse ralentie à 30% | 3s |
| BUMPER | 2 obstacles circulaires apparaissent au centre | 10s |

### Contrôles PongPong
| Action | P1 | P2 |
|--------|----|----|
| Haut/Bas | W/S | ↑/↓ |
| (mobile) | pp-p1-up / pp-p1-down | pp-p2-up / pp-p2-down |

Les boutons tactiles sont des éléments HTML (`<button>`) — pas des zones canvas.

### Ordre de chargement scripts PongPong
`pp-config → pp-input → pp-ball → pp-paddle → pp-bonus → pp-hud → pp-ui → pp-game`

### Globals JS exposés (PongPong)
`PP` · `PP_INPUT`
`ppCanvas` · `ppCtx` · `ppState`
`ppP1` · `ppP2` · `ppBalls` · `ppBonusZone` · `ppMovingBonus` · `ppBumpers`
`ppGameTime` · `ppServeTimer`

---

## Tests

```bash
pytest                    # tous les tests
pytest tests/test_routes.py          # routes identify/lobby/jeux
pytest tests/test_playtank_api.py    # formule score + API
```

**Fixtures (conftest.py) :** DB temporaire (`tempfile.mkstemp`), DB_PATH overridé avant tout import `app`.
Les tests d'API vérifient : calcul score, validation champs, troncature noms, ordre leaderboard, limite 20 entrées.

## Lancement local

```bash
pip install flask python-dotenv
python app.py
# → http://127.0.0.1:5000
```

## Déploiement PythonAnywhere

- Modifier `wsgi.py` : remplacer `<USERNAME>` par le vrai nom de compte
- Dépendances : `flask`, `python-dotenv`
- La DB est créée automatiquement au premier démarrage
- `SECRET_KEY` à définir dans la console PythonAnywhere ou via `.env`

## Ce qu'il ne faut pas faire

- Ne pas ajouter de WebSocket (incompatible Free)
- Ne pas modifier `canvas.width/height` dynamiquement
- Ne pas dupliquer les formules de score en JS
- Ne pas utiliser de framework JS — vanilla uniquement
- Ne pas mettre de logique de jeu dans `app.py` (uniquement dans le blueprint du jeu)
- Ne pas casser l'ordre de chargement des scripts
- Ne pas utiliser `git add -A` en aveugle (`.env` est gitignored mais pas `.env.example`)
