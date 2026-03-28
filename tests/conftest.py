"""
conftest.py — fixtures partagées entre tous les tests.
Utilise une DB SQLite fichier temporaire pour éviter le problème
de connexions multiples avec :memory:.
"""
import pytest
import sys
import os
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Crée un fichier DB temporaire et override DB_PATH avant tout import de l'app
_db_fd, _db_path = tempfile.mkstemp(suffix='.db')
os.close(_db_fd)

import core.db as _db
_db.DB_PATH = _db_path

from app import app as flask_app, init_db


@pytest.fixture(scope='session')
def app():
    flask_app.config['TESTING'] = True
    init_db()
    yield flask_app
    # Nettoyage du fichier temporaire après la session
    try:
        os.unlink(_db_path)
    except OSError:
        pass


@pytest.fixture
def client(app):
    return app.test_client()
