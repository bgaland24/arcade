import os
from dotenv import load_dotenv
load_dotenv()
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from core.db import init_db, get_db  # noqa: F401 — init_db ré-exporté pour wsgi.py
from games.playtank import blueprint as playtank_bp
from games.galaxy import blueprint as galaxy_bp
from games.pongpong import blueprint as pongpong_bp
from games.galaxyracer import blueprint as galaxyracer_bp
from games.starcrew import blueprint as starcrew_bp
from datetime import datetime, timezone

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'arcade-secret-key-change-in-prod')

app.register_blueprint(playtank_bp)
app.register_blueprint(galaxy_bp)
app.register_blueprint(pongpong_bp)
app.register_blueprint(galaxyracer_bp)
app.register_blueprint(starcrew_bp)


# ── Helpers ──────────────────────────────────────────────
def _resolve_player(form_prefix, label, conn):
    """
    Identifie ou crée un joueur via pseudo + âge + mois de naissance.
    - Pseudo existant : vérifie âge + mois (connexion).
    - Pseudo inconnu  : crée le compte.
    Retourne (player_dict, error_string).
    """
    name      = (form_prefix.get('name',        '') or '').strip()[:20]
    age_str   = (form_prefix.get('age',         '') or '').strip()
    month_str = (form_prefix.get('birth_month', '') or '').strip()

    if not name:
        return None, f'{label} : le pseudo est obligatoire.'
    if not age_str.isdigit() or not (1 <= int(age_str) <= 120):
        return None, f'{label} : âge invalide.'
    if not month_str.isdigit() or not (1 <= int(month_str) <= 12):
        return None, f'{label} : mois de naissance invalide.'

    age         = int(age_str)
    birth_month = int(month_str)

    row = conn.execute(
        'SELECT id, name, age, birth_month FROM players WHERE name = ?', (name,)
    ).fetchone()

    if row:
        if row['age'] != age or row['birth_month'] != birth_month:
            return None, f'{label} : âge ou mois de naissance incorrect pour « {name} ».'
        return {'id': row['id'], 'name': row['name'], 'age': row['age'], '_new': False}, None
    else:
        return {'name': name, 'age': age, 'birth_month': birth_month, '_new': True}, None


# ── Login / création (2 joueurs) ─────────────────────────
@app.route('/', methods=['GET', 'POST'])
def identify():
    errors = {}
    if request.method == 'POST':
        def pf(idx):
            return {k: request.form.get(f'p{idx}_{k}') for k in ('name', 'age', 'birth_month')}

        now = datetime.now(timezone.utc).isoformat()
        players = {}

        with get_db() as conn:
            for idx, label in ((1, 'Joueur 1'), (2, 'Joueur 2')):
                pdata, err = _resolve_player(pf(idx), label, conn)
                if err:
                    errors[f'p{idx}'] = err
                else:
                    players[idx] = pdata

            if not errors:
                for idx in (1, 2):
                    p = players[idx]
                    if p.pop('_new', False):
                        cur = conn.execute(
                            'INSERT INTO players (name, age, birth_month, created_at, last_seen)'
                            ' VALUES (?,?,?,?,?)',
                            (p['name'], p['age'], p['birth_month'], now, now)
                        )
                        p['id'] = cur.lastrowid
                    else:
                        conn.execute('UPDATE players SET last_seen = ? WHERE id = ?', (now, p['id']))
                    session[f'p{idx}'] = {'id': p['id'], 'name': p['name'], 'age': p['age']}
                return redirect(url_for('lobby'))

    return render_template('identify.html', errors=errors)


# ── Création de compte (page dédiée) ────────────────────
@app.route('/register', methods=['GET', 'POST'])
def register():
    error = None
    success = False
    if request.method == 'POST':
        name      = (request.form.get('name',        '') or '').strip()[:20]
        age_str   = (request.form.get('age',         '') or '').strip()
        month_str = (request.form.get('birth_month', '') or '').strip()

        if not name:
            error = 'Le pseudo est obligatoire.'
        elif not age_str.isdigit() or not (1 <= int(age_str) <= 120):
            error = 'Âge invalide.'
        elif not month_str.isdigit() or not (1 <= int(month_str) <= 12):
            error = 'Mois de naissance invalide.'
        else:
            age         = int(age_str)
            birth_month = int(month_str)
            now         = datetime.now(timezone.utc).isoformat()
            with get_db() as conn:
                if conn.execute('SELECT id FROM players WHERE name = ?', (name,)).fetchone():
                    error = 'Ce pseudo est déjà pris.'
                else:
                    conn.execute(
                        'INSERT INTO players (name, age, birth_month, created_at, last_seen)'
                        ' VALUES (?,?,?,?,?)',
                        (name, age, birth_month, now, now)
                    )
                    success = True

    return render_template('register.html', error=error, success=success)


# ── Autocomplete pseudo ──────────────────────────────────
@app.route('/api/players')
def search_players():
    q = request.args.get('q', '').strip()
    if len(q) < 1:
        return jsonify([])
    with get_db() as conn:
        rows = conn.execute(
            'SELECT name FROM players WHERE name LIKE ? ORDER BY last_seen DESC LIMIT 8',
            (q + '%',)
        ).fetchall()
    return jsonify([r['name'] for r in rows])


# ── Sélecteur de jeux ────────────────────────────────────
@app.route('/lobby')
def lobby():
    if 'p1' not in session or 'p2' not in session:
        return redirect(url_for('identify'))
    from games.registry import GAMES
    from core.scores import get_scores

    def _normalize(entry, game_id):
        if game_id == 'galaxy' or game_id == 'galaxyracer' or game_id == 'starcrew':
            players = f"{entry.get('p1_name', '?')} & {entry.get('p2_name', '?')}"
        elif game_id == 'pongpong':
            players = f"{entry.get('player_name', '?')} vs {entry.get('opponent_name', '?')}"
        else:  # playtank
            opponent = entry.get('opponent_name', '')
            players = f"{entry.get('player_name', '?')} vs {opponent}" if opponent else entry.get('player_name', '?')
        return {
            'score':   entry['score'],
            'players': players,
            'date':    entry.get('created_at', '')[:10],
        }

    scores_by_game = {
        g['id']: [_normalize(s, g['id']) for s in get_scores(g['id'], limit=10)]
        for g in GAMES
    }
    return render_template('index.html',
                           games=GAMES,
                           scores_by_game=scores_by_game,
                           p1=session['p1'],
                           p2=session['p2'])


# ── Déconnexion ──────────────────────────────────────────
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('identify'))


init_db()

if __name__ == '__main__':
    app.run(debug=True)
