"""
test_playtank_api.py — tests de l'API scores PlayTank.
"""
import json
from games.playtank import calculate_score


class TestScoreFormula:
    def test_perfect_score(self):
        # Gagner en 3s avec 3 tirs = score max (~9900+)
        s = calculate_score(3, 3, 3)
        assert s > 9000

    def test_slow_win_scores_less(self):
        slow = calculate_score(170, 9, 3)
        fast = calculate_score(10, 4, 3)
        assert fast > slow

    def test_zero_hits_returns_zero(self):
        assert calculate_score(60, 5, 0) == 0

    def test_zero_shots_returns_zero(self):
        assert calculate_score(60, 0, 0) == 0

    def test_score_never_negative(self):
        assert calculate_score(9999, 100, 1) >= 0


class TestPlaytankAPI:
    def test_get_scores_empty(self, client):
        r = client.get('/api/playtank/scores')
        assert r.status_code == 200
        assert isinstance(r.get_json(), list)

    def test_post_valid_score(self, client):
        r = client.post('/api/playtank/scores', json={
            'player_name': 'Alice',
            'time_seconds': 45,
            'shots_fired': 4,
            'shots_hit': 3,
        })
        assert r.status_code == 200
        data = r.get_json()
        assert 'score' in data
        assert data['score'] > 0

    def test_posted_score_appears_in_leaderboard(self, client):
        client.post('/api/playtank/scores', json={
            'player_name': 'Bob',
            'time_seconds': 30,
            'shots_fired': 3,
            'shots_hit': 3,
        })
        scores = client.get('/api/playtank/scores').get_json()
        names = [s['player_name'] for s in scores]
        assert 'Bob' in names

    def test_post_missing_player_name_returns_400(self, client):
        r = client.post('/api/playtank/scores', json={'time_seconds': 60})
        assert r.status_code == 400

    def test_post_empty_body_returns_400(self, client):
        r = client.post('/api/playtank/scores',
                        data='not json',
                        content_type='application/json')
        assert r.status_code == 400

    def test_player_name_truncated_to_20_chars(self, client):
        r = client.post('/api/playtank/scores', json={
            'player_name': 'A' * 50,
            'time_seconds': 60,
            'shots_fired': 5,
            'shots_hit': 3,
        })
        assert r.status_code == 200
        scores = client.get('/api/playtank/scores').get_json()
        for s in scores:
            assert len(s['player_name']) <= 20

    def test_leaderboard_ordered_by_score_desc(self, client):
        scores = client.get('/api/playtank/scores').get_json()
        if len(scores) >= 2:
            for i in range(len(scores) - 1):
                assert scores[i]['score'] >= scores[i + 1]['score']

    def test_leaderboard_max_20_entries(self, client):
        scores = client.get('/api/playtank/scores').get_json()
        assert len(scores) <= 20
