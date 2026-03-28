# CLAUDE.md — Instructions pour Claude Code

## Contexte du projet

Arcade multi-jeux déployé sur PythonAnywhere Free.
Pas de WebSocket (compte gratuit) → toute la logique de jeu est côté client (Canvas JS).
Le backend Flask sert uniquement l'HTML et les classements (SQLite).

## Architecture

```
app.py                      → minimal : crée l'app Flask, enregistre les blueprints
wsgi.py                     → Entrée PythonAnywhere (adapter le chemin utilisateur)
core/
  db.py                     → get_db(), init_db(), register_db_setup()
  scores.py                 → save_score(game_id, score, meta) / get_scores(game_id)
games/
  registry.py               → liste des jeux pour le sélecteur (titre, url, SVG, couleurs)
  playtank/__init__.py       → Blueprint PlayTank : routes /playtank + /api/playtank/scores
  galaxy/__init__.py         → Blueprint Galaxy  : routes /galaxy  + /api/galaxy/scores
templates/
  index.html                → sélecteur dynamique (boucle Jinja sur registry.GAMES)
  playtank/game.html        → page PlayTank
  galaxy/game.html          → page Galaxy
static/
  css/selector.css          → styles du sélecteur (partagé)
  playtank/css/style.css
  playtank/js/              → config, terrain, tank, projectile, input, ui, game
  galaxy/css/galaxy.css
  galaxy/js/                → gx-config … gx-game (12 fichiers)
```

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
`init_db()` crée : `players`, `games`, `scores` (partagées), puis appelle les `register_db_setup` restants.
`init_db()` est appelé une fois dans `app.py` (niveau module, compatible WSGI).
`wsgi.py` importe `init_db` depuis `app` (qui le ré-exporte depuis `core.db`).

### Scores partagés
Tous les scores passent par `core.scores.save_score(game_id, score, meta)`.
`meta` est un dict JSON libre — les champs varient selon le jeu.
`core.scores.get_scores(game_id)` retourne les scores d'un jeu fusionnés avec leur meta.
La formule de score est **server-side** uniquement — ne pas la dupliquer en JS.

### Ajouter un jeu → obligation d'entrée dans `games`
Chaque jeu référencé dans `registry.py` doit avoir une ligne dans la table `games`
(sinon les INSERT INTO scores échoueront à cause de la contrainte REFERENCES).
L'entrée est ajoutée dans `core/db.py → init_db()` avec `INSERT OR IGNORE`.

## PlayTank — spécificités

Paramètres réglables : `static/playtank/js/config.js`

### Angle tourelle (`localAngle`)
- Degrés dans l'espace local du tank (avant flip éventuel)
- `0°` horizontal, `90°` vertical
- P2 rendu avec `ctx.scale(-1,1)` — flip visuel uniquement

### Terrain
- `terrain.heights[x]` = Y de surface à la colonne x
- `terrain.destroy(cx, cy, radius)` = cratère circulaire
- Gradient mis en cache dans `_gradCache` (reset après destroy)

### Physique obus
```
vx += wind * dt
vy += CONFIG.GRAVITY * dt
x  += vx * dt ; y += vy * dt
```

### Contrôles (configurés dans input.js → KEY_MAP)
| Action | P1 | P2 |
|--------|----|----|
| Avancer/Reculer | A/D | ←/→ |
| Tourelle | T/G | Num4/Num6 |
| Tir | Espace | Entrée |

### Ordre de chargement scripts PlayTank
config → terrain → tank → projectile → input → ui → game

## Galaxy — spécificités

Paramètres réglables : `static/galaxy/js/gx-config.js`

### Power-ups
Poids de drop dans `GX.POWERUP_WEIGHTS` (0 = désactivé).
La pool pondérée `GX_POWERUP_POOL` est construite au chargement dans `gx-powerup.js`.

### Slowdown
Seul `WaveManager.update()` reçoit `dt * slowFactor` quand SLOW est actif.
Ne pas ralentir les vaisseaux joueurs ni le HUD.

### Ordre de chargement scripts Galaxy
gx-config → gx-input → gx-particles → gx-bullet → gx-powerup →
gx-player → gx-enemy → gx-boss → gx-wave → gx-hud → gx-ui → gx-game

## Déploiement PythonAnywhere

- Modifier `wsgi.py` : remplacer `<VOTRE_USERNAME>`
- La DB est créée automatiquement au démarrage
- Dépendance uniquement : `flask`

## Ce qu'il ne faut pas faire

- Ne pas ajouter de WebSocket (incompatible Free)
- Ne pas modifier `canvas.width/height` dynamiquement
- Ne pas dupliquer les formules de score en JS
- Ne pas utiliser de framework JS — vanilla uniquement
- Ne pas mettre de logique de jeu dans `app.py` (uniquement dans le blueprint du jeu)
- Ne pas casser l'ordre de chargement des scripts
