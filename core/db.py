import sqlite3
import os
from core.migrations import run_pending

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database.db')

_db_setup_funcs = []

def register_db_setup(fn):
    """Each game calls this to register its table creation function."""
    _db_setup_funcs.append(fn)

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        # Table joueurs partagée (créée en premier, référencée par les scores)
        conn.execute('''
            CREATE TABLE IF NOT EXISTS players (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                name       TEXT    NOT NULL,
                age        INTEGER NOT NULL,
                created_at TEXT    NOT NULL,
                last_seen  TEXT    NOT NULL
            )
        ''')
        # Table catalogue des jeux
        conn.execute('''
            CREATE TABLE IF NOT EXISTS games (
                id   TEXT PRIMARY KEY,
                name TEXT NOT NULL
            )
        ''')
        # Migration : supprimer l'ancien schéma scores si game_id est absent
        _cols = {r[1] for r in conn.execute("PRAGMA table_info(scores)").fetchall()}
        if _cols and 'game_id' not in _cols:
            conn.execute('DROP TABLE scores')
        # Supprimer les tables per-jeu obsolètes
        conn.execute('DROP TABLE IF EXISTS galaxy_scores')

        # Table scores unifiée — meta contient les champs spécifiques au jeu (JSON)
        conn.execute('''
            CREATE TABLE IF NOT EXISTS scores (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id    TEXT    NOT NULL REFERENCES games(id),
                score      INTEGER NOT NULL,
                meta       TEXT    NOT NULL,
                created_at TEXT    NOT NULL
            )
        ''')
        # Jeux connus — INSERT OR IGNORE pour ne pas écraser lors des rechargements
        conn.execute("INSERT OR IGNORE INTO games (id, name) VALUES ('playtank', 'PlayTank')")
        conn.execute("INSERT OR IGNORE INTO games (id, name) VALUES ('galaxy', 'Galaxy Space Attack')")
        conn.execute("INSERT OR IGNORE INTO games (id, name) VALUES ('pongpong', 'PongPong')")
        conn.execute("INSERT OR IGNORE INTO games (id, name) VALUES ('galaxyracer', 'Galaxy Racer')")
        for fn in _db_setup_funcs:
            fn(conn)
        run_pending(conn)
