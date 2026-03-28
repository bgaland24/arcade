"""
test_pongpong_api.py — tests de l'API scores PongPong.
"""
from games.pongpong import calculate_pong_score


class TestPongScoreFormula:
    def test_perfect_win_scores_high(self):
        s = calculate_pong_score(7, 0, 30)
        assert s > 4000

    def test_closer_game_scores_less(self):
        s_dominant = calculate_pong_score(7, 0, 60)
        s_close    = calculate_pong_score(7, 6, 60)
        assert s_dominant > s_close

    def test_faster_win_scores_more(self):
        s_fast = calculate_pong_score(7, 3, 40)
        s_slow = calculate_pong_score(7, 3, 200)
        assert s_fast > s_slow

    def test_score_never_negative(self):
        assert calculate_pong_score(7, 6, 9999) >= 0


class TestPongPongAPI:
    def test_get_scores_empty(self, client):
        r = client.get('/api/pongpong/scores')
        assert r.status_code == 200
        assert isinstance(r.get_json(), list)

    def test_post_valid_score(self, client):
        r = client.post('/api/pongpong/scores', json={
            'winner_name': 'Alice', 'loser_name': 'Bob',
            'winner_score': 7, 'loser_score': 3, 'time_seconds': 95,
        })
        assert r.status_code == 200
        assert 'score' in r.get_json()

    def test_posted_score_appears_in_leaderboard(self, client):
        client.post('/api/pongpong/scores', json={
            'winner_name': 'Charlie', 'loser_name': 'Diana',
            'winner_score': 7, 'loser_score': 2, 'time_seconds': 70,
        })
        scores = client.get('/api/pongpong/scores').get_json()
        assert any(s['player_name'] == 'Charlie' for s in scores)

    def test_post_missing_winner_name_returns_400(self, client):
        r = client.post('/api/pongpong/scores', json={'loser_name': 'Bob'})
        assert r.status_code == 400

    def test_leaderboard_ordered_by_score_desc(self, client):
        scores = client.get('/api/pongpong/scores').get_json()
        if len(scores) >= 2:
            for i in range(len(scores) - 1):
                assert scores[i]['score'] >= scores[i + 1]['score']

    def test_page_returns_200(self, client):
        assert client.get('/pongpong').status_code == 200

    def test_page_contains_canvas(self, client):
        assert '<canvas' in client.get('/pongpong').data.decode()

    def test_page_loads_all_scripts(self, client):
        html = client.get('/pongpong').data.decode()
        for s in ['pp-config.js', 'pp-input.js', 'pp-ball.js', 'pp-paddle.js',
                  'pp-bonus.js', 'pp-hud.js', 'pp-ui.js', 'pp-game.js']:
            assert s in html, f'Script manquant : {s}'

    def test_player_names_prefilled_from_session(self, client):
        client.post('/', data={'p1_name': 'Alice', 'p1_age': '25',
                               'p2_name': 'Bob',   'p2_age': '30'})
        html = client.get('/pongpong').data.decode()
        assert 'value="Alice"' in html
        assert 'value="Bob"' in html
