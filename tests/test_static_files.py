"""
test_static_files.py — vérifie que tous les fichiers statiques référencés existent sur disque.
Pas de navigateur nécessaire : on parse les balises <script> et <link> dans les templates.
"""
import os
import re
import pytest

BASE = os.path.join(os.path.dirname(__file__), '..')
STATIC_DIR = os.path.join(BASE, 'static')

TEMPLATES = {
    'playtank': os.path.join(BASE, 'templates', 'playtank', 'game.html'),
    'galaxy':   os.path.join(BASE, 'templates', 'galaxy',   'game.html'),
}

def _extract_static_refs(html_path):
    """Extrait les chemins filename='...' des url_for dans un template."""
    with open(html_path, encoding='utf-8') as f:
        content = f.read()
    return re.findall(r"url_for\('static',\s*filename='([^']+)'\)", content)


@pytest.mark.parametrize("game,template_path", TEMPLATES.items())
def test_all_static_files_exist(game, template_path):
    refs = _extract_static_refs(template_path)
    assert refs, f"Aucune référence statique trouvée dans {template_path}"
    missing = []
    for ref in refs:
        full = os.path.join(STATIC_DIR, ref.replace('/', os.sep))
        if not os.path.isfile(full):
            missing.append(ref)
    assert not missing, (
        f"Fichiers statiques manquants pour {game} :\n" +
        "\n".join(f"  static/{r}" for r in missing)
    )


def test_selector_css_exists():
    assert os.path.isfile(os.path.join(STATIC_DIR, 'css', 'selector.css'))
