import sys
import os

project_home = '/home/<VOTRE_USERNAME>/playtank'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

from app import app, init_db
init_db()

application = app
