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


# ── Template pour la prochaine migration ─────────────────
# def _m002_exemple(conn):
#     """Ajoute une colonne avatar à players."""
#     conn.execute('ALTER TABLE players ADD COLUMN avatar TEXT')


# ── Registre (ordre strict) ───────────────────────────────
MIGRATIONS = [
    (1, _m001_baseline),
    # (2, _m002_exemple),  # ← décommenter + implémenter
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
