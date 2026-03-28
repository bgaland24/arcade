"""
init_db.py — initialise la base de données pour un premier déploiement.

Usage :
    python init_db.py

Crée database.db avec toutes les tables et les entrées initiales.
Idempotent : peut être relancé sans perte de données.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from core.db import init_db, DB_PATH

if __name__ == '__main__':
    init_db()
    print(f'Base de données initialisée : {DB_PATH}')
