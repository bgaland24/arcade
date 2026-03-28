# Arcade — PlayTank & Galaxy Space Attack

Plateforme arcade multi-jeux, jouable sur ordinateur et mobile (paysage).

## Jeux disponibles

### PlayTank
Duel de tanks 2 joueurs en 2D vue de profil.
- Terrain valloné généré aléatoirement, **destructible**
- Physique réaliste des obus (gravité + vent)
- **But** : toucher 3 fois le tank adverse avant la fin du temps imparti

| Action | Joueur 1 | Joueur 2 |
|--------|----------|----------|
| Avancer / Reculer | `A` / `D` | `←` / `→` |
| Tourelle | `T` / `G` | `Num4` / `Num6` |
| Tirer | `Espace` | `Entrée` |

### Galaxy Space Attack Invader
Shoot'em up coopératif 2 joueurs.
- Vagues d'ennemis de plus en plus difficiles
- Boss tous les 5 vagues avec 3 phases
- 7 types de power-ups (bouclier, tir double/triple, bombe, rapidité, vie, slow)

| Action | Joueur 1 | Joueur 2 |
|--------|----------|----------|
| Se déplacer | `W` `A` `S` `D` | `↑` `←` `↓` `→` |
| Tir | automatique | automatique |
| Bombe | `Espace` | `Entrée` |

Sur mobile (paysage) : boutons tactiles affichés à l'écran.

---

## Stack technique

- **Backend** : Flask (Python) + SQLite (table `scores` partagée entre tous les jeux)
- **Frontend** : HTML5 Canvas + JavaScript vanilla (pixel art)
- **Déploiement** : PythonAnywhere Free

## Installation locale

```bash
pip install flask
python app.py
# Ouvrir http://127.0.0.1:5000
```

## Déploiement PythonAnywhere

1. Uploader le projet dans `~/playtank/`
2. Tableau de bord PythonAnywhere → **Web** → nouvelle app WSGI
3. Modifier `wsgi.py` : remplacer `<VOTRE_USERNAME>` par votre nom d'utilisateur
4. Pointer le fichier WSGI vers `~/playtank/wsgi.py`
5. Recharger l'application

---

## Ajouter un nouveau jeu

L'architecture est conçue pour accueillir de nouveaux jeux sans modifier le code existant.

**5 étapes :**

### 1. Ajouter le jeu dans la table `games`
Dans `core/db.py → init_db()`, ajouter :
```python
conn.execute("INSERT OR IGNORE INTO games (id, name) VALUES ('nonjeu', 'Mon Jeu')")
```
> Sans cette ligne, les inserts de scores échoueront (contrainte REFERENCES).

### 2. Créer le Blueprint Flask
`games/nonjeu/__init__.py` :
```python
from flask import Blueprint, render_template, jsonify, request
from core.scores import save_score, get_scores

blueprint = Blueprint('nonjeu', __name__)
GAME_ID = 'nonjeu'

@blueprint.route('/nonjeu')
def game():
    return render_template('nonjeu/game.html')

@blueprint.route('/api/nonjeu/scores', methods=['GET'])
def get_scores_route():
    return jsonify(get_scores(GAME_ID))

@blueprint.route('/api/nonjeu/scores', methods=['POST'])
def post_score():
    data = request.get_json(silent=True)
    score = ...  # calcul server-side
    save_score(GAME_ID, score, {'player_name': ..., ...})
    return jsonify({'score': score})
```

### 3. Enregistrer dans le sélecteur
`games/registry.py` → ajouter une entrée dans la liste `GAMES` :
```python
{
    'id':         'nonjeu',
    'name':       'Mon Jeu',
    'title_html': 'MON<span>JEU</span>',
    'desc':       'Description courte',
    'url':        '/nonjeu',
    'color':      '#FF0000',
    'accent':     '#FF8800',
    'card_class': 'nonjeu-card',
    'btn_class':  'nonjeu-btn',
    'title_class':'nonjeu-title',
    'svg':        '<svg>...</svg>',
},
```

### 4. Créer la page HTML
`templates/nonjeu/game.html` — inclure les scripts JS dans le bon ordre.

### 5. Ajouter les fichiers statiques
```
static/nonjeu/css/
static/nonjeu/js/
```

### 6. Enregistrer le blueprint dans `app.py`
```python
from games.nonjeu import blueprint as nonjeu_bp
app.register_blueprint(nonjeu_bp)
```

`app.py` et `core/db.py` sont les **seuls fichiers existants** à modifier.

---

## Structure du projet

```
playtank/
├── app.py                      # Minimal : crée l'app, enregistre les blueprints
├── wsgi.py                     # Entrée WSGI PythonAnywhere
├── requirements.txt
├── database.db                 # Généré automatiquement
├── core/
│   └── db.py                   # get_db(), init_db(), register_db_setup()
├── games/
│   ├── registry.py             # Liste des jeux pour le sélecteur
│   ├── playtank/__init__.py    # Blueprint PlayTank
│   └── galaxy/__init__.py      # Blueprint Galaxy
├── templates/
│   ├── index.html              # Sélecteur de jeux (dynamique)
│   ├── playtank/game.html
│   └── galaxy/game.html
└── static/
    ├── css/selector.css        # Styles du sélecteur (partagé)
    ├── playtank/
    │   ├── css/style.css
    │   └── js/                 # config, terrain, tank, projectile, input, ui, game
    └── galaxy/
        ├── css/galaxy.css
        └── js/                 # gx-config … gx-game (12 fichiers)
```

## Paramètres réglables

**PlayTank** : [`static/playtank/js/config.js`](static/playtank/js/config.js)

| Paramètre | Défaut | Description |
|-----------|--------|-------------|
| `FIRE_COOLDOWN_S` | `3.0` | Délai entre deux tirs (s) |
| `GAME_DURATION_S` | `180` | Durée maximale d'une partie (s) |
| `HITS_TO_WIN` | `3` | Touches pour gagner |
| `GRAVITY` | `260` | Gravité des obus (px/s²) |
| `WIND_MAX_FORCE` | `45` | Force max du vent (px/s²) |

**Galaxy** : [`static/galaxy/js/gx-config.js`](static/galaxy/js/gx-config.js)

| Paramètre | Défaut | Description |
|-----------|--------|-------------|
| `BASE_ENEMY_COUNT` | `14` | Ennemis à la vague 1 |
| `POWERUP_DROP_CHANCE` | `0.9` | Probabilité de drop |
| `POWERUP_WEIGHTS` | voir fichier | Poids de chaque type de power-up |
| `SLOW_FACTOR` | `0.35` | Multiplicateur vitesse ennemis sous SLOW |
