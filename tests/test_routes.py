"""
test_routes.py — vérifie que toutes les pages HTML se chargent correctement.
"""


def _identify(client):
    """Helper : identifie deux joueurs et retourne le client avec session active."""
    client.post('/', data={
        'p1_name': 'Alice', 'p1_age': '25',
        'p2_name': 'Bob',   'p2_age': '30',
    })
    return client


class TestIdentifyPage:
    def test_identify_returns_200(self, client):
        assert client.get('/').status_code == 200

    def test_identify_contains_form(self, client):
        html = client.get('/').data.decode()
        assert 'p1_name' in html
        assert 'p2_name' in html

    def test_valid_identification_redirects_to_lobby(self, client):
        r = client.post('/', data={
            'p1_name': 'Alice', 'p1_age': '25',
            'p2_name': 'Bob',   'p2_age': '30',
        })
        assert r.status_code == 302
        assert '/lobby' in r.headers['Location']

    def test_missing_name_shows_error(self, client):
        r = client.post('/', data={
            'p1_name': '', 'p1_age': '25',
            'p2_name': 'Bob', 'p2_age': '30',
        })
        assert r.status_code == 200
        assert 'pseudo' in r.data.decode().lower()

    def test_invalid_age_shows_error(self, client):
        r = client.post('/', data={
            'p1_name': 'Alice', 'p1_age': 'abc',
            'p2_name': 'Bob',   'p2_age': '30',
        })
        assert r.status_code == 200
        assert 'âge' in r.data.decode()


class TestLobby:
    def test_lobby_without_session_redirects(self, client):
        r = client.get('/lobby')
        assert r.status_code == 302
        assert '/' in r.headers['Location']

    def test_lobby_with_session_returns_200(self, client):
        _identify(client)
        assert client.get('/lobby').status_code == 200

    def test_lobby_shows_player_names(self, client):
        _identify(client)
        html = client.get('/lobby').data.decode()
        assert 'Alice' in html
        assert 'Bob' in html

    def test_lobby_contains_both_games(self, client):
        _identify(client)
        html = client.get('/lobby').data.decode()
        assert 'playtank' in html.lower()
        assert 'galaxy' in html.lower()

    def test_logout_clears_session(self, client):
        _identify(client)
        client.get('/logout')
        r = client.get('/lobby')
        assert r.status_code == 302


class TestPlaytankPage:
    def test_page_returns_200(self, client):
        assert client.get('/playtank').status_code == 200

    def test_page_contains_canvas(self, client):
        assert '<canvas' in client.get('/playtank').data.decode()

    def test_page_loads_all_scripts(self, client):
        html = client.get('/playtank').data.decode()
        for script in ['config.js', 'terrain.js', 'tank.js',
                       'projectile.js', 'input.js', 'ui.js', 'game.js']:
            assert script in html, f"Script manquant : {script}"


class TestGalaxyPage:
    def test_page_returns_200(self, client):
        assert client.get('/galaxy').status_code == 200

    def test_page_contains_canvas(self, client):
        assert '<canvas' in client.get('/galaxy').data.decode()

    def test_page_loads_all_scripts(self, client):
        html = client.get('/galaxy').data.decode()
        for script in ['gx-config.js', 'gx-input.js', 'gx-particles.js',
                       'gx-bullet.js', 'gx-powerup.js', 'gx-player.js',
                       'gx-enemy.js', 'gx-boss.js', 'gx-wave.js',
                       'gx-hud.js', 'gx-ui.js', 'gx-game.js']:
            assert script in html, f"Script manquant : {script}"
