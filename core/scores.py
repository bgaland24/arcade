"""
core/scores.py — fonctions partagées pour la gestion des scores multi-jeux.

Chaque jeu appelle save_score() / get_scores() plutôt que d'insérer directement
dans la table. Les champs spécifiques au jeu sont stockés dans la colonne `meta` (JSON).
"""
import json
from datetime import datetime, timezone
from core.db import get_db


def save_score(game_id: str, score: int, meta: dict) -> None:
    """Insère un score dans la table partagée.

    Args:
        game_id: identifiant du jeu (doit exister dans la table games)
        score:   valeur numérique calculée server-side
        meta:    dict de champs spécifiques au jeu (player_name, accuracy…)
    """
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute(
            'INSERT INTO scores (game_id, score, meta, created_at) VALUES (?, ?, ?, ?)',
            (game_id, score, json.dumps(meta), now)
        )


def get_scores(game_id: str, limit: int = 20) -> list:
    """Retourne les meilleurs scores d'un jeu, du plus élevé au plus bas.

    Les champs de meta sont fusionnés avec score et created_at dans chaque entrée.
    """
    with get_db() as conn:
        rows = conn.execute(
            'SELECT score, meta, created_at FROM scores '
            'WHERE game_id = ? ORDER BY score DESC LIMIT ?',
            (game_id, limit)
        ).fetchall()
    result = []
    for r in rows:
        entry = {'score': r['score'], 'created_at': r['created_at']}
        entry.update(json.loads(r['meta']))
        result.append(entry)
    return result
