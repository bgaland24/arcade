"""
test_galaxy_api.py — tests de l'API scores Galaxy.
"""
from games.galaxy import calculate_galaxy_score


class TestGalaxyScoreFormula:
    def test_base_score_includes_kills(self):
        s = calculate_galaxy_score(5000, 100, 100, 10)
        assert s >= 5000

    def test_perfect_precision_adds_3000(self):
        s = calculate_galaxy_score(0, 10, 10, 0)
        assert s == 3000

    def test_zero_precision_adds_zero(self):
        s = calculate_galaxy_score(1000, 10, 0, 0)
        assert s == 1000

    def test_wave_bonus_300_per_wave(self):
        s0 = calculate_galaxy_score(0, 0, 0, 0)
        s5 = calculate_galaxy_score(0, 0, 0, 5)
        assert s5 - s0 == 1500   # 5 × 300

    def test_score_never_negative(self):
        assert calculate_galaxy_score(0, 0, 0, 0) >= 0


class TestGalaxyAPI:
    def test_get_scores_empty(self, client):
        r = client.get('/api/galaxy/scores')
        assert r.status_code == 200
        assert isinstance(r.get_json(), list)

    def test_post_valid_score(self, client):
        r = client.post('/api/galaxy/scores', json={
            'p1_name': 'Alice',
            'p2_name': 'Bob',
            'kill_points': 3000,
            'shots_fired': 80,
            'shots_hit': 60,
            'wave_reached': 7,
            'kills': 35,
        })
        assert r.status_code == 200
        data = r.get_json()
        assert 'score' in data
        assert data['score'] > 0

    def test_posted_score_appears_in_leaderboard(self, client):
        client.post('/api/galaxy/scores', json={
            'p1_name': 'Charlie',
            'p2_name': 'Diana',
            'kill_points': 4000,
            'shots_fired': 50,
            'shots_hit': 50,
            'wave_reached': 10,
            'kills': 40,
        })
        scores = client.get('/api/galaxy/scores').get_json()
        names = [s['p1_name'] for s in scores]
        assert 'Charlie' in names

    def test_post_empty_body_returns_400(self, client):
        r = client.post('/api/galaxy/scores',
                        data='not json',
                        content_type='application/json')
        assert r.status_code == 400

    def test_names_truncated_to_20_chars(self, client):
        client.post('/api/galaxy/scores', json={
            'p1_name': 'X' * 50,
            'p2_name': 'Y' * 50,
            'kill_points': 100,
            'shots_fired': 10,
            'shots_hit': 5,
            'wave_reached': 1,
            'kills': 2,
        })
        scores = client.get('/api/galaxy/scores').get_json()
        for s in scores:
            if s['p1_name']:
                assert len(s['p1_name']) <= 20
            if s['p2_name']:
                assert len(s['p2_name']) <= 20

    def test_leaderboard_ordered_by_score_desc(self, client):
        scores = client.get('/api/galaxy/scores').get_json()
        if len(scores) >= 2:
            for i in range(len(scores) - 1):
                assert scores[i]['score'] >= scores[i + 1]['score']

    def test_leaderboard_max_20_entries(self, client):
        scores = client.get('/api/galaxy/scores').get_json()
        assert len(scores) <= 20
