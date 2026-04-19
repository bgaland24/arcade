"""
core/migrations.py — migrations de schéma numérotées.

Chaque migration est une fonction (conn) → None.
Elle est exécutée une seule fois, dans l'ordre, au démarrage de l'app.

Pour ajouter une migration :
  1. Définir une nouvelle fonction _mXXX_description(conn)
  2. L'ajouter à la liste MIGRATIONS avec le numéro suivant
"""


# ── Définitions ───────────────────────────────────────────

def _m001_baseline(conn):
    """
    Version initiale : tables players / games / scores créées par init_db().
    Marque le point de départ — aucune transformation nécessaire.
    """
    pass


def _m002_add_birth_month(conn):
    """
    Ajout du mois de naissance sur la table players.
    birth_month : 1-12, troisième facteur d'identification avec pseudo + âge.
    """
    cols = {r[1] for r in conn.execute("PRAGMA table_info(players)").fetchall()}
    if 'birth_month' not in cols:
        conn.execute('ALTER TABLE players ADD COLUMN birth_month INTEGER')


# ── Registre (ordre strict) ───────────────────────────────
MIGRATIONS = [
    (1, _m001_baseline),
    (2, _m002_add_birth_month),
]


# ── Moteur ────────────────────────────────────────────────

def run_pending(conn):
    """Applique toutes les migrations non encore exécutées sur cette DB."""
    conn.execute('''
        CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER NOT NULL
        )
    ''')
    row = conn.execute('SELECT version FROM schema_version').fetchone()
    current = row[0] if row else 0

    for version, fn in MIGRATIONS:
        if version > current:
            fn(conn)
            if current == 0:
                conn.execute('INSERT INTO schema_version (version) VALUES (?)', (version,))
            else:
                conn.execute('UPDATE schema_version SET version = ?', (version,))
            current = version
