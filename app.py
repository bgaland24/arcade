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


# ── Identification ───────────────────────────────────────
@app.route('/', methods=['GET', 'POST'])
def identify():
    error = None
    if request.method == 'POST':
        p1_name = request.form.get('p1_name', '').strip()[:20]
        p1_age  = request.form.get('p1_age',  '').strip()
        p2_name = request.form.get('p2_name', '').strip()[:20]
        p2_age  = request.form.get('p2_age',  '').strip()

        # Validation de base
        if not p1_name or not p2_name:
            error = 'Les deux joueurs doivent saisir un pseudo.'
        elif not p1_age.isdigit() or not p2_age.isdigit():
            error = 'Veuillez saisir un âge valide (nombre entier).'
        else:
            # Vérification âge si le joueur existe déjà
            with get_db() as conn:
                for name, age_str, label in [
                    (p1_name, p1_age, 'Joueur 1'),
                    (p2_name, p2_age, 'Joueur 2'),
                ]:
                    row = conn.execute(
                        'SELECT age FROM players WHERE name = ?', (name,)
                    ).fetchone()
                    if row and row['age'] != int(age_str):
                        error = f'{label} : âge incorrect pour le pseudo « {name} ».'
                        break

        if not error:
            now = datetime.now(timezone.utc).isoformat()
            with get_db() as conn:
                for name, age in [(p1_name, int(p1_age)), (p2_name, int(p2_age))]:
                    row = conn.execute(
                        'SELECT id FROM players WHERE name = ?', (name,)
                    ).fetchone()
                    if row:
                        conn.execute(
                            'UPDATE players SET last_seen = ? WHERE id = ?',
                            (now, row['id'])
                        )
                        pid = row['id']
                    else:
                        cur = conn.execute(
                            'INSERT INTO players (name, age, created_at, last_seen) VALUES (?,?,?,?)',
                            (name, age, now, now)
                        )
                        pid = cur.lastrowid
                    if name == p1_name:
                        session['p1'] = {'id': pid, 'name': p1_name, 'age': age}
                    else:
                        session['p2'] = {'id': pid, 'name': p2_name, 'age': age}

            return redirect(url_for('lobby'))

    return render_template('identify.html', error=error)


# ── Recherche joueurs (autocomplete) ────────────────────
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
